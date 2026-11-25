import uuid
import enum
from sqlalchemy import Column, String, Integer, Numeric, Enum, ForeignKey, Boolean, DateTime, Text, JSON, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.crypto import EncryptedJSON

# Enums matching the database design
class UserRole(str, enum.Enum):
    student = "student"
    admin = "admin"

class AmbassadorTier(str, enum.Enum):
    standard = "standard"
    bronze = "bronze"
    silver = "silver"
    gold = "gold"
    platinum = "platinum"

class ReferralStatus(str, enum.Enum):
    submitted = "submitted"
    validated = "validated"
    application_submitted = "application_submitted"
    offer_made = "offer_made"
    enrolled_home = "enrolled_home"
    enrolled_international = "enrolled_international"
    rejected = "rejected"

class PayoutStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    failed = "failed"
    paid = "paid"
    cancelled = "cancelled"

class PayoutMethod(str, enum.Enum):
    bkash = "bkash"
    other = "other"
    bank_transfer = "bank_transfer"
    gift_card = "gift_card"

class TransactionType(str, enum.Enum):
    credit = "credit"
    debit = "debit"

class TransactionCategory(str, enum.Enum):
    lead_reward = "lead_reward"
    enrolment_reward = "enrolment_reward"
    payout_withdrawal = "payout_withdrawal"
    bonus_reward = "bonus_reward"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    university = Column(String(200), nullable=True)
    department_year = Column(String(200), nullable=True)
    # The CRM counsellor this ambassador chose to route their leads to. Null =
    # "None of the above" → leads land unassigned in the CRM Affiliate-Leads tab.
    # counsellor_id is the CRM's User id (a UUID string, occasionally numeric);
    # name cached for display.
    counsellor_id = Column(String(64), nullable=True)
    counsellor_name = Column(String(150), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.student, nullable=False)
    tier = Column(Enum(AmbassadorTier), default=AmbassadorTier.standard, nullable=False)
    referral_code = Column(String(50), unique=True, index=True, nullable=False)
    wallet_balance = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_earned = Column(Numeric(10, 2), default=0.00, nullable=False)
    bank_details = Column(EncryptedJSON, nullable=True)
    # GDPR: when the ambassador accepted the Ambassador & Privacy policies (at
    # signup) and which version, so consent is auditable.
    policy_accepted_at = Column(DateTime(timezone=True), nullable=True)
    policy_version = Column(String(20), nullable=True)
    # Session version. Every issued JWT embeds this as its "ver" claim; a request
    # is rejected if the token's ver != the user's current token_version. Bumped
    # whenever the password changes (or an admin session is force-reset), so
    # already-issued tokens stop working immediately.
    token_version = Column(Integer, default=0, nullable=False, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    referrals = relationship("Referral", foreign_keys="Referral.referrer_id", back_populates="referrer", cascade="all, delete-orphan")
    payouts = relationship("Payout", foreign_keys="Payout.user_id", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")


class PolicyConsent(Base):
    """Append-only audit trail of legal-document acceptances (Rewards T&C +
    Privacy Policy). One row per (user, document, version): the presence of a row
    for the CURRENT version means that user has accepted the current document.
    Never updated or deleted — bumping a version simply requires a new row, which
    preserves full history of who accepted which version and when."""
    __tablename__ = "policy_consents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    # "rewards_terms" | "privacy_policy"
    document = Column(String(40), nullable=False)
    version = Column(String(20), nullable=False)
    # SHA-256 of the exact document body (policy_documents.content_sha256) the user
    # accepted — cryptographically binds this acceptance to the verbatim text.
    content_sha256 = Column(String(64), nullable=True)
    accepted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    # Captured for legal auditability (best-effort; behind nginx so IP is X-Forwarded-For).
    ip = Column(String(64), nullable=True)
    user_agent = Column(String(400), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "document", "version", name="uq_policy_consent_user_doc_version"),
    )


class PolicyDocument(Base):
    """Immutable archive of the exact legal text for each (document, version). One
    row per published version; never edited or deleted, so any past acceptance can
    be reproduced verbatim. The standalone page AND the accept-terms modal both
    render this body_html, so what was shown == what is archived == what is hashed."""
    __tablename__ = "policy_documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document = Column(String(40), nullable=False)   # "rewards_terms" | "privacy_policy"
    version = Column(String(20), nullable=False)
    title = Column(String(300), nullable=True)
    effective_date = Column(String(60), nullable=True)
    body_html = Column(Text, nullable=False)
    content_sha256 = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("document", "version", name="uq_policy_document_doc_version"),
    )


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    referrer_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lead_name = Column(String(150), nullable=False)
    lead_email = Column(String(255), nullable=False)
    lead_phone = Column(String(50), nullable=True)
    education_interest = Column(String(255), nullable=True)
    status = Column(Enum(ReferralStatus), default=ReferralStatus.submitted, nullable=False)
    # Why the counsellor rejected the lead (shown to the ambassador). Set only
    # when a lead_rejected event arrives from the CRM.
    rejection_reason = Column(String(500), nullable=True)
    lead_reward_paid = Column(Boolean, default=False, nullable=False)
    # TRUE only when the enrolment reward is FULLY settled (both installments paid).
    # The ৳500 enrolment reward is paid in two admin-approved installments of ৳250 as
    # the partner university pays BHE Uni in stages (see the installment fields below).
    enrolment_reward_paid = Column(Boolean, default=False, nullable=False)
    # When this referral was first seen as enrolled. Anchors the estimated installment
    # windows shown to the ambassador (1st: 4-6 months, 2nd: 9-12 months after this).
    enrolled_at = Column(DateTime(timezone=True), nullable=True)
    # Two-installment enrolment reward: each half (৳250) is approved by an admin when
    # the corresponding university payment actually lands. Installment 1 before 2.
    enrolment_installment_1_paid = Column(Boolean, default=False, nullable=False)
    enrolment_installment_1_paid_at = Column(DateTime(timezone=True), nullable=True)
    enrolment_installment_2_paid = Column(Boolean, default=False, nullable=False)
    enrolment_installment_2_paid_at = Column(DateTime(timezone=True), nullable=True)
    # Admin explicitly declined the enrolment reward (e.g. duplicate/fraud).
    # Keeps a denied enrolment out of the "awaiting approval" queue.
    enrolment_reward_denied = Column(Boolean, default=False, nullable=False)
    # Idempotency latch for the enrolment notifications (admin alert + the
    # ambassador's milestone email). Flipped True the first time this referral is
    # seen as enrolled — via EITHER the `lead_enrolled` enum event OR the application
    # stage/status text sync — so re-sent/duplicate events never double-notify.
    enrolment_email_sent = Column(Boolean, default=False, nullable=False)
    verified_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # CRM integration: where this referral came from and the CRM lead id it maps
    # to (idempotency anchor for incoming reward events). Null for portal-native
    # referrals. See docs (crm-affiliate-contract).
    source = Column(String(20), default="affiliate", nullable=False)
    external_lead_id = Column(String, unique=True, index=True, nullable=True)
    # Application tracking — the RAW CRM application stage/status, synced verbatim
    # from the CRM (admin sees these as-is). Null until an application is started.
    application_stage = Column(String(60), nullable=True)
    application_status = Column(String(60), nullable=True)
    # Latest CRM lead/application note, mirrored verbatim so the admin sees the
    # same note the counsellor last wrote in L2E. Updated on app change + note edit.
    application_notes = Column(Text, nullable=True)
    # Application detail fields mirrored from the L2E application (InterestField),
    # shown verbatim on the admin Applications tab.
    application_university = Column(String(200), nullable=True)
    application_course = Column(String(200), nullable=True)
    application_intake = Column(String(60), nullable=True)
    application_campus = Column(String(150), nullable=True)
    application_branch = Column(String(150), nullable=True)
    # Counsellor assigned to THIS lead in the CRM (synced per-lead). Distinct from
    # the ambassador's own signup counsellor — the admin prefers this when set so it
    # shows the real routed counsellor even if the ambassador picked "none".
    crm_counsellor_id = Column(String(64), nullable=True)
    crm_counsellor_name = Column(String(191), nullable=True)
    # Refer & Earn: the EXACT CRM lead status (verbatim — "New", "In Progress",
    # "Incorrect Details", …) mirrored on every counsellor status change, plus the
    # reason they gave for it. Display-only for the ambassador/admin portals; the
    # reward pipeline still runs off the `status` enum above. Set by the CRM
    # `lead_status_changed` event; never touches rewards.
    crm_lead_status = Column(String(60), nullable=True)
    status_reason = Column(String(500), nullable=True)
    # GDPR consent captured at submission time. referrer_consent = the ambassador
    # confirmed they had the lead's permission to share their details;
    # lead_consent = the lead themselves consented via the public form. consent_at
    # + consent_policy_version make it auditable against the accepted policy.
    referrer_consent = Column(Boolean, default=False, nullable=False)
    lead_consent = Column(Boolean, default=False, nullable=False)
    consent_at = Column(DateTime(timezone=True), nullable=True)
    consent_policy_version = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    referrer = relationship("User", foreign_keys=[referrer_id], back_populates="referrals")
    verifier = relationship("User", foreign_keys=[verified_by])

    @property
    def application_status_label(self) -> str:
        """Simplified, ambassador-facing view of the CRM application progress. The
        admin sees the raw stage/status; the ambassador sees this friendly rollup."""
        return simplify_application_status(self.application_stage, self.application_status)


def simplify_application_status(stage: str | None, status: str | None) -> str:
    """Roll the CRM's granular application stage/status up to the states the
    ambassador sees: Not started (no application) → Application Started (CRM status
    'New') → Application Submitted (every other in-flight CRM status) → Enrolled.
    Cancelled/Rejected/Withdrawn become 'Not proceeding'. Keyword-based so it's
    resilient to the CRM's exact label wording."""
    combined = f"{(stage or '').strip().lower()} {(status or '').strip().lower()}".strip()
    if not combined:
        return "Not started"
    if any(k in combined for k in ("cancel", "reject", "withdraw")):
        return "Not proceeding"
    if "enrol" in combined:
        return "Enrolled"
    if combined == "new" or (status or "").strip().lower() == "new":
        return "Application Started"
    return "Application Submitted"


class Payout(Base):
    __tablename__ = "payouts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(Enum(PayoutMethod), nullable=False)
    status = Column(Enum(PayoutStatus), default=PayoutStatus.pending, nullable=False)
    bank_details = Column(EncryptedJSON, nullable=True)
    gift_card_email = Column(String(255), nullable=True)
    # Settlement backend reference (Modulr payment id / Tillo order id) once an
    # automated provider actually moves the money. Null while settled manually.
    status_note = Column(String(500), nullable=True)
    processing_at = Column(DateTime(timezone=True), nullable=True)
    request_key = Column(String(100), nullable=True, unique=True)
    provider_ref = Column(String(120), nullable=True)
    processed_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="payouts")
    processor = relationship("User", foreign_keys=[processed_by])


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    category = Column(Enum(TransactionCategory), nullable=False)
    reference_id = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="transactions")

class TierConfig(Base):
    """Stores configurable thresholds and bonus amounts for each ambassador tier level."""
    __tablename__ = "tier_configs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tier = Column(Enum(AmbassadorTier), unique=True, nullable=False)
    leads_required = Column(String, nullable=False)  # stored as string to support int in SQLite
    bonus_amount = Column(Numeric(10, 2), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    otp_code = Column(String(10), nullable=False)
    purpose = Column(String(20), nullable=False, default="legacy")
    attempts = Column(Integer, nullable=False, default=0)
    verification_token = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)




class AuditLog(Base):
    """Security audit trail - records sensitive admin actions (e.g. revealing an
    ambassador's full bank details)."""
    __tablename__ = "audit_log"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = Column(String, nullable=True)
    admin_email = Column(String, nullable=True)
    action = Column(String, nullable=False)
    target_type = Column(String, nullable=True)
    target_id = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CounsellorReassignmentLog(Base):
    """Handoff trail for bulk counsellor reassignments: ONE row per lead actually
    moved. Captures who moved it, the from/to counsellor, and a verbatim snapshot of
    the lead's status AT the moment of handoff, so the admin panel can show a durable
    history when a counsellor (e.g. one who's leaving) hands their book over. The
    snapshot is frozen; later status changes never rewrite it. Isolated to
    referral/affiliate leads (the only thing the reassign flow ever touches)."""
    __tablename__ = "counsellor_reassignment_log"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # Groups every lead moved in one bulk action into a single logical handoff event.
    batch_id = Column(String, index=True, nullable=False)
    referral_id = Column(String, index=True, nullable=True)   # affiliate referral id (not FK: survive deletes)
    external_lead_id = Column(String, nullable=True)          # the CRM lead id
    lead_name = Column(String(150), nullable=True)
    ambassador_id = Column(String, nullable=True)
    ambassador_name = Column(String(150), nullable=True)
    from_counsellor_id = Column(String(64), index=True, nullable=True)
    from_counsellor_name = Column(String(191), nullable=True)
    to_counsellor_id = Column(String(64), index=True, nullable=True)
    to_counsellor_name = Column(String(191), nullable=True)
    # Frozen status snapshot at handoff (affiliate reward-enum value + verbatim CRM
    # status + the application stage/status if an application was in flight).
    status_at_handoff = Column(String(60), nullable=True)
    crm_status_at_handoff = Column(String(60), nullable=True)
    application_stage_at_handoff = Column(String(60), nullable=True)
    application_status_at_handoff = Column(String(60), nullable=True)
    # Who performed the reassignment.
    admin_id = Column(String, nullable=True)
    admin_email = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
