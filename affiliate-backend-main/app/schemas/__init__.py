from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import datetime
from app.models import UserRole, AmbassadorTier, ReferralStatus, PayoutStatus, PayoutMethod, TransactionType, TransactionCategory

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str
    verification_token: Optional[str] = None

class UserLogin(BaseModel):
    email: str = Field(min_length=1)
    password: str

class UserGoogleLogin(BaseModel):
    credential: str

# Profile creation after email verification.
class UserRegisterSimple(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str
    university: Optional[str] = Field(default=None, max_length=200)
    department_year: Optional[str] = Field(default=None, max_length=200)
    email: EmailStr
    phone: str = Field(min_length=1)
    password: str = Field(min_length=8)
    verification_token: Optional[str] = None
    # Optional CRM counsellor to route this ambassador's leads to. None = "None
    # of the above" → leads land unassigned in the CRM.
    counsellor_id: Optional[str] = None
    counsellor_name: Optional[str] = None
    # GDPR: the ambassador accepted the Ambassador & Privacy policies at signup.
    policy_accepted: bool = False


    @field_validator("first_name", "phone")
    @classmethod
    def require_nonblank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("This field is required")
        return value.strip()


# A CRM counsellor option for the ambassador's dropdown.
class CounsellorOption(BaseModel):
    id: str
    name: str

# Password reset (email OTP)
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(pattern=r"^[0-9]{6}$")
    password: str = Field(min_length=8)

class UserRegisterInitiate(BaseModel):
    email: EmailStr
    full_name: str

class UserRegisterVerify(BaseModel):
    email: EmailStr
    otp: str = Field(pattern=r"^[0-9]{6}$")

class UserRegisterComplete(BaseModel):
    email: EmailStr
    verification_token: str
    password: str = Field(min_length=8)

# --- Accept-terms gate (Rewards T&C + Privacy Policy) ---
class PolicyDocStatus(BaseModel):
    required_version: str
    accepted_version: Optional[str] = None
    accepted_at: Optional[datetime] = None
    needs_acceptance: bool

class PolicyStatus(BaseModel):
    # True when EITHER document needs (re-)acceptance at its current version.
    needs_acceptance: bool
    rewards_terms: PolicyDocStatus
    privacy_policy: PolicyDocStatus

# The archived, verbatim document (single source rendered by page + modal).
class PolicyDocumentResponse(BaseModel):
    document: str
    version: str
    title: Optional[str] = None
    effective_date: Optional[str] = None
    body_html: str
    content_sha256: str

    class Config:
        from_attributes = True

# One acceptance event (for the legal proof export).
class ConsentRecord(BaseModel):
    document: str
    version: str
    content_sha256: Optional[str] = None
    accepted_at: datetime
    ip: Optional[str] = None
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True

# The full "did they accept + what exactly did they accept" package for legal.
class ConsentProof(BaseModel):
    user_id: str
    email: Optional[str] = None
    full_name: str
    consents: List[ConsentRecord]
    documents: List[PolicyDocumentResponse]

class UserResponse(UserBase):
    email: Optional[EmailStr] = None
    id: str
    university: Optional[str] = None
    department_year: Optional[str] = None
    phone: Optional[str] = None
    counsellor_id: Optional[str] = None
    counsellor_name: Optional[str] = None
    role: UserRole
    tier: AmbassadorTier
    referral_code: str
    wallet_balance: Decimal
    total_earned: Decimal
    bank_details: Optional[Dict[str, Any]] = None
    # Computed accept-terms gate status (populated by /auth/me and /auth/accept-policy).
    policy: Optional[PolicyStatus] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    counsellor_id: Optional[str] = None
    counsellor_name: Optional[str] = None
    bank_details: Optional[Dict[str, Any]] = None
    password: Optional[str] = None


class TierUpdate(BaseModel):
    tier: AmbassadorTier
    note: Optional[str] = None  # Optional admin note for audit trail


class CounsellorAssign(BaseModel):
    # Admin assigns a routed counsellor to an (otherwise unassigned) ambassador.
    # Name is resolved server-side from the CRM when possible; the client value is
    # just a fallback label.
    counsellor_id: str
    counsellor_name: Optional[str] = None


class CounsellorReassignCandidate(BaseModel):
    # A counsellor that currently holds reassignable referral leads. Populates the
    # "leaving counsellor" dropdown in the bulk-reassign modal, with a count.
    counsellor_id: str
    counsellor_name: Optional[str] = None
    active_lead_count: int


class CounsellorLeadRow(BaseModel):
    # One of a counsellor's reassignable referral leads, shown in the reassign
    # checklist. Application fields are populated once an application is in flight,
    # so the UI can flag "this isn't just a lead, it has a live application".
    referral_id: str
    lead_name: str
    status: str
    crm_lead_status: Optional[str] = None
    ambassador_name: Optional[str] = None
    application_stage: Optional[str] = None
    application_status: Optional[str] = None
    application_status_label: Optional[str] = None


class CounsellorReassignRequest(BaseModel):
    # Move a departing counsellor's active referral leads to a replacement.
    from_counsellor_id: str
    to_counsellor_id: str
    # Specific referral ids to move; omit/empty = ALL of the leaver's active leads.
    referral_ids: Optional[list[str]] = None
    # Also re-point ambassadors whose DEFAULT counsellor is the leaver, so their
    # future referrals (and still-unassigned leads) follow to the replacement.
    repoint_ambassadors: bool = True


class CounsellorReassignResult(BaseModel):
    reassigned: int
    skipped: int
    missing: int
    ambassadors_repointed: int
    to_counsellor_name: Optional[str] = None
    # Groups this handoff in the change log; lets the UI deep-link to "this batch".
    batch_id: Optional[str] = None


class CounsellorChangeLogRow(BaseModel):
    # One line in the admin Counsellor Changes / handoff log: a single lead that was
    # moved, with a frozen snapshot of its status at the moment of handoff.
    id: str
    batch_id: str
    lead_name: Optional[str] = None
    ambassador_name: Optional[str] = None
    from_counsellor_id: Optional[str] = None
    from_counsellor_name: Optional[str] = None
    to_counsellor_id: Optional[str] = None
    to_counsellor_name: Optional[str] = None
    status_at_handoff: Optional[str] = None
    crm_status_at_handoff: Optional[str] = None
    application_stage_at_handoff: Optional[str] = None
    application_status_at_handoff: Optional[str] = None
    admin_email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Referral Schemas
class ReferralBase(BaseModel):
    lead_name: str
    lead_email: EmailStr
    lead_phone: Optional[str] = None
    education_interest: Optional[str] = None

class ReferralCreate(ReferralBase):
    # GDPR: the ambassador confirmed they have the lead's permission to share
    # their details. Required (enforced in the API) before a referral is created.
    referrer_consent: bool = False
    # Counsellor to route this lead to (defaults on the form to the ambassador's own
    # profile counsellor; editable). None → falls back to the ambassador's counsellor.
    counsellor_id: Optional[str] = None
    counsellor_name: Optional[str] = None

class ReferralResponse(ReferralBase):
    id: str
    referrer_id: str
    status: ReferralStatus
    rejection_reason: Optional[str] = None
    # Refer & Earn: exact CRM lead status + the counsellor's reason for the last
    # change (display-only mirror; independent of the reward `status` enum above).
    crm_lead_status: Optional[str] = None
    status_reason: Optional[str] = None
    lead_reward_paid: bool
    enrolment_reward_paid: bool
    enrolment_reward_denied: bool = False
    # Two-installment enrolment reward (each ৳250): the dashboard shows each
    # installment's paid/awaiting state + estimated window off enrolled_at.
    enrolled_at: Optional[datetime] = None
    enrolment_installment_1_paid: bool = False
    enrolment_installment_2_paid: bool = False
    enrolment_installment_1_paid_at: Optional[datetime] = None
    enrolment_installment_2_paid_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    source: Optional[str] = None
    external_lead_id: Optional[str] = None
    application_stage: Optional[str] = None
    application_status: Optional[str] = None
    application_notes: Optional[str] = None
    application_university: Optional[str] = None
    application_course: Optional[str] = None
    application_intake: Optional[str] = None
    application_campus: Optional[str] = None
    application_branch: Optional[str] = None
    application_status_label: str = "Not started"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReferralUpdateStatus(BaseModel):
    status: ReferralStatus


# --- CRM integration (receiver) ---
class CrmLeadEvent(BaseModel):
    """Payload the CRM emits per docs/integration/crm-affiliate-contract.md."""
    event: str                        # "lead_qualified" | "lead_enrolled"
    external_lead_id: str             # CRM leads.id — the idempotency anchor
    occurred_at: Optional[datetime] = None
    referral_code: str                # identifies the ambassador
    lead_email: Optional[EmailStr] = None
    lead_name: str
    referrer_name: Optional[str] = None    # ambassador details (to create on the fly)
    referrer_email: Optional[EmailStr] = None
    counsellor_id: Optional[str] = None    # counsellor assigned to THIS lead in the CRM
    counsellor_name: Optional[str] = None
    enrolment_type: Optional[str] = None   # "home" | "international" for enrolled
    reason: Optional[str] = None           # counsellor's reason on lead_rejected
    stage: Optional[str] = None            # CRM application stage (application_updated)
    status: Optional[str] = None           # CRM application status (application_updated)
    notes: Optional[str] = None            # latest CRM lead/application note (application_updated)
    university: Optional[str] = None       # L2E application detail fields (application_updated)
    course: Optional[str] = None
    intake: Optional[str] = None
    campus: Optional[str] = None
    branch: Optional[str] = None
    source: Optional[str] = "crm"
    meta: Optional[Dict[str, Any]] = None

class CrmLeadEventResponse(BaseModel):
    status: str = "ok"
    outcome: str                      # credited | pending_approval | duplicate_ignored | flagged_no_credit
    referral_id: Optional[str] = None
    ambassador_id: Optional[str] = None


# --- Public referral capture (standalone affiliate website) ---
class PublicReferrerInfo(BaseModel):
    """Returned to the public landing page so it can greet the visitor."""
    referral_code: str
    referrer_name: str
    # The referring ambassador's profile counsellor — pre-selects the capture form's
    # (editable) counsellor dropdown. None → the dropdown shows no selection.
    counsellor_id: Optional[str] = None
    counsellor_name: Optional[str] = None
    valid: bool = True

class PublicReferralCapture(BaseModel):
    lead_name: str
    lead_email: EmailStr
    lead_phone: str
    course_interested: Optional[str] = None
    english_confidence: Optional[str] = None
    student_finance: Optional[str] = None
    preferred_campus: Optional[str] = None
    residential_status: Optional[str] = None
    last_qualification: Optional[str] = None
    # Counsellor to route this lead to (defaults to the ambassador's profile counsellor
    # on the form; editable). None → falls back to the ambassador's counsellor.
    counsellor_id: Optional[str] = None
    counsellor_name: Optional[str] = None
    # GDPR: the referred person consented to BHE Uni contacting them and
    # processing their data. Required (enforced in the API).
    lead_consent: bool = False

# Payout Schemas
class PayoutBase(BaseModel):
    amount: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)
    payment_method: PayoutMethod
    bank_details: Optional[Dict[str, Any]] = None
    gift_card_email: Optional[EmailStr] = None

class PayoutCreate(PayoutBase):
    request_key: Optional[str] = Field(None, min_length=8, max_length=100)

class PayoutResponse(PayoutBase):
    status_note: Optional[str] = None
    processing_at: Optional[datetime] = None
    id: str
    user_id: str
    status: PayoutStatus
    provider_ref: Optional[str] = None
    processed_by: Optional[str] = None
    processed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PayoutUpdateStatus(BaseModel):
    status_note: Optional[str] = Field(None, max_length=500)
    status: PayoutStatus
    # Optional manual settlement reference (bank transfer ref / gift-card order no.)
    # captured when an admin marks a payout PAID by hand; shown on the invoice.
    payment_reference: Optional[str] = None

# Transaction Schemas
class TransactionResponse(BaseModel):
    id: str
    user_id: str
    type: TransactionType
    amount: Decimal
    category: TransactionCategory
    reference_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Tier Config Schemas
class TierConfigResponse(BaseModel):
    tier: AmbassadorTier
    leads_required: int
    bonus_amount: Decimal
    updated_at: datetime

    class Config:
        from_attributes = True

class TierConfigUpdate(BaseModel):
    leads_required: int = Field(..., gt=0, description="Number of valid leads required to reach this tier")
    bonus_amount: Decimal = Field(..., ge=0, description="Bonus amount credited when tier is achieved")

# Dashboard Stats Schemas
class AmbassadorStats(BaseModel):
    total_earned: Decimal
    wallet_balance: Decimal
    total_leads: int
    total_enrolments: int
    tier: AmbassadorTier
    leads_to_next_tier: int
    referral_code: str
    recent_activity: List[Dict[str, Any]]
    tier_configs: List[TierConfigResponse]



class PayoutAccountCreate(BaseModel):
    payment_method: PayoutMethod
    details: Dict[str, str]


class GooglePhoneSend(BaseModel):
    verification_token: str = Field(min_length=1)
    phone: str = Field(min_length=1, max_length=50)


class GooglePhoneComplete(BaseModel):
    verification_token: str = Field(min_length=1)
    otp: str = Field(pattern=r"^[0-9]{6}$")
    policy_accepted: bool = False


class GoogleDemoRequest(BaseModel):
    demo_id: Optional[str] = Field(default=None, pattern=r"^[a-f0-9]{32}$")
