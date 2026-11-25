-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- Ambassador Tiers
CREATE TYPE ambassador_tier AS ENUM ('standard', 'bronze', 'silver', 'gold', 'platinum');

-- Referral/Payout Statuses
CREATE TYPE referral_status AS ENUM ('submitted', 'validated', 'application_submitted', 'offer_made', 'enrolled_home', 'enrolled_international', 'rejected');
CREATE TYPE payout_status AS ENUM ('pending', 'paid', 'cancelled');
CREATE TYPE payout_method AS ENUM ('bank_transfer', 'gift_card');
CREATE TYPE transaction_type AS ENUM ('credit', 'debit');
CREATE TYPE transaction_category AS ENUM ('lead_reward', 'enrolment_reward', 'payout_withdrawal', 'bonus_reward');

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    counsellor_id VARCHAR(64),        -- CRM counsellor this ambassador routes leads to (NULL = unassigned)
    counsellor_name VARCHAR(150),
    role user_role NOT NULL DEFAULT 'student',
    tier ambassador_tier NOT NULL DEFAULT 'standard',
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_earned NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Referrals Table (Lead Referral + Enrolment Reward £500 / £750)
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lead_name VARCHAR(150) NOT NULL,
    lead_email VARCHAR(255) NOT NULL,
    lead_phone VARCHAR(50),
    education_interest VARCHAR(255),
    status referral_status NOT NULL DEFAULT 'submitted',
    rejection_reason VARCHAR(500),        -- counsellor's reason when status = rejected
    lead_reward_paid BOOLEAN NOT NULL DEFAULT FALSE,
    enrolment_reward_paid BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    -- CRM integration: origin + the CRM lead id this referral maps to (idempotency).
    source VARCHAR(20) NOT NULL DEFAULT 'affiliate',
    external_lead_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Payout Requests Table
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method payout_method NOT NULL,
    status payout_status NOT NULL DEFAULT 'pending',
    bank_details JSONB, -- For bank transfers (account name, sort code, account number)
    gift_card_email VARCHAR(255), -- For gift cards
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Wallet Transactions (Audit Log & History)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category transaction_category NOT NULL,
    reference_id UUID, -- References referrals.id or payouts.id
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Query Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
