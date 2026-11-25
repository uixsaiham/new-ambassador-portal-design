import random
import string
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime
from decimal import Decimal
from fastapi import HTTPException, status
from app.models import (
    User, Referral, Payout, Transaction, TierConfig,
    UserRole, AmbassadorTier, ReferralStatus,
    PayoutStatus, PayoutMethod, TransactionType, TransactionCategory,
    CounsellorReassignmentLog, PolicyConsent, PolicyDocument,
)
from app.schemas import UserCreate, ReferralCreate, PayoutCreate
from app.core.crypto import mask_bank
from app.core.security import get_password_hash
from app.core.config import settings

# Version of the Ambassador & Privacy policies recorded alongside each consent.
# Keep in sync with the frontend (src/lib/policy.ts) so stored consents are
# auditable against the exact policy version the user accepted.
POLICY_VERSION = "1.0"

# --- Accept-terms gate (Rewards T&C + Privacy Policy) ---------------------------
POLICY_DOCS = ("rewards_terms", "privacy_policy")

def current_policy_versions() -> dict:
    """The currently-required version of each legal document (config/env driven)."""
    return {
        "rewards_terms": settings.REWARDS_TERMS_VERSION,
        "privacy_policy": settings.PRIVACY_POLICY_VERSION,
    }

def get_policy_status(db: Session, user) -> dict:
    """Compute the accept-terms gate status. A document needs acceptance when there
    is NO PolicyConsent row for its CURRENT version — which naturally covers
    never-accepted users (incl. Google/OTP signups) and outdated versions."""
    versions = current_policy_versions()
    docs = {}
    overall = False
    for doc, required in versions.items():
        latest = (
            db.query(PolicyConsent)
            .filter(PolicyConsent.user_id == user.id, PolicyConsent.document == doc)
            .order_by(PolicyConsent.accepted_at.desc())
            .first()
        )
        has_current = (
            db.query(PolicyConsent)
            .filter(
                PolicyConsent.user_id == user.id,
                PolicyConsent.document == doc,
                PolicyConsent.version == required,
            )
            .first()
            is not None
        )
        needs = not has_current
        overall = overall or needs
        docs[doc] = {
            "required_version": required,
            "accepted_version": latest.version if latest else None,
            "accepted_at": latest.accepted_at if latest else None,
            "needs_acceptance": needs,
        }
    return {"needs_acceptance": overall, **docs}

def record_policy_acceptance(db: Session, user, ip: str = None, user_agent: str = None) -> dict:
    """Record acceptance of BOTH documents at their CURRENT server-side versions
    (idempotent per user+document+version). The SERVER sets the version, so a
    client can never backdate or forge it. Returns the refreshed policy status."""
    versions = current_policy_versions()
    ua = (user_agent or "")[:400] or None
    for doc, ver in versions.items():
        exists = (
            db.query(PolicyConsent)
            .filter(
                PolicyConsent.user_id == user.id,
                PolicyConsent.document == doc,
                PolicyConsent.version == ver,
            )
            .first()
        )
        if not exists:
            docrow = (
                db.query(PolicyDocument)
                .filter(PolicyDocument.document == doc, PolicyDocument.version == ver)
                .first()
            )
            db.add(PolicyConsent(
                user_id=user.id, document=doc, version=ver,
                content_sha256=(docrow.content_sha256 if docrow else None),
                ip=(ip or None), user_agent=ua,
            ))
    # Keep the legacy 'last accepted' timestamp fresh for quick display; the audit
    # table stays the source of truth for the gate.
    user.policy_accepted_at = datetime.utcnow()
    db.add(user)
    db.commit()
    return get_policy_status(db, user)

def get_policy_document(db: Session, document: str, version: str = None):
    """The archived legal document row for (document, version); version defaults to
    the current required version from config."""
    if version is None:
        version = current_policy_versions().get(document)
    if version is None:
        return None
    return (
        db.query(PolicyDocument)
        .filter(PolicyDocument.document == document, PolicyDocument.version == version)
        .first()
    )

def get_consent_proof(db: Session, user_id: str):
    """Legal proof package for one ambassador: the user, every acceptance event
    they made (with hash/IP/UA/timestamp), and the exact archived document(s) for
    the versions they accepted. Returns None if the user does not exist."""
    user = get_user(db, user_id)
    if not user:
        return None
    consents = (
        db.query(PolicyConsent)
        .filter(PolicyConsent.user_id == user_id)
        .order_by(PolicyConsent.accepted_at.desc())
        .all()
    )
    documents = []
    for doc, ver in {(c.document, c.version) for c in consents}:
        row = (
            db.query(PolicyDocument)
            .filter(PolicyDocument.document == doc, PolicyDocument.version == ver)
            .first()
        )
        if row:
            documents.append(row)
    return {"user": user, "consents": consents, "documents": documents}

# --- User CRUD ---

def get_user(db: Session, user_id: str):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_referral_code(db: Session, referral_code: str):
    return db.query(User).filter(User.referral_code == referral_code.upper()).first()

def generate_unique_referral_code(db: Session, full_name: str) -> str:
    # Use initials + random digits
    clean_name = "".join([c for c in full_name if c.isalpha()]).upper()
    prefix = clean_name[:4] if len(clean_name) >= 4 else clean_name.ljust(4, 'X')
    
    while True:
        suffix = "".join(random.choices(string.digits, k=3))
        code = f"{prefix}{suffix}"
        # Check uniqueness
        exists = db.query(User).filter(User.referral_code == code).first()
        if not exists:
            return code

def _welcome_ambassador(user):
    """Best-effort welcome email + MailerLite marketing-group add on ambassador
    signup (students only, never admins). Each step is independent and best-effort
    so neither can block signup or the other."""
    if not (user and user.role == UserRole.student):
        return
    try:
        from app.core.mail import send_welcome_email
        send_welcome_email(user.email, user.full_name, getattr(user, "referral_code", "") or "")
    except Exception as e:
        print(f"[mail] welcome email failed for {getattr(user, 'email', None)}: {e}")
    try:
        from app.integrations.mailerlite import add_ambassador
        add_ambassador(user.email, name=user.full_name, referral_code=getattr(user, "referral_code", None))
    except Exception as e:
        print(f"[mailerlite] add failed for {getattr(user, 'email', None)}: {e}")
    try:
        from app.integrations.clicksend import add_ambassador_contact
        add_ambassador_contact(
            getattr(user, "phone", None),
            full_name=user.full_name,
            email=user.email,
            referral_code=getattr(user, "referral_code", None),
            tier=getattr(user, "tier", None),
        )
    except Exception as e:
        print(f"[clicksend] add failed for {getattr(user, 'email', None)}: {e}")


def _email_referral_received(ambassador, lead_name):
    """Best-effort confirmation to the ambassador that we received their referral."""
    try:
        if ambassador:
            from app.core.mail import send_referral_received_email
            send_referral_received_email(ambassador.email, ambassador.full_name, lead_name)
    except Exception as e:
        print(f"[mail] referral-received email failed: {e}")


# Counsellor id → {name, email}, resolved LIVE from the CRM's /counsellors endpoint
# (which now returns email). Cached ~5 min; a miss forces one refresh so a
# newly-added counsellor is picked up immediately without any local snapshot.
_counsellor_dir_cache = {"map": {}, "at": 0.0}


def _counsellor_directory(force=False):
    import time
    now = time.monotonic()
    cache = _counsellor_dir_cache
    if not force and cache["map"] and (now - cache["at"] < 300):
        return cache["map"]
    try:
        from app.integrations.crm_client import fetch_counsellors
        rows = fetch_counsellors() or []
        m = {str(c.get("id")): {"name": c.get("name"), "email": c.get("email")}
             for c in rows if c.get("id")}
        if m:
            cache["map"], cache["at"] = m, now
    except Exception as e:
        print(f"[counsellor-dir] fetch failed: {e}")
    return cache["map"]


def _resolve_counsellor_email(counsellor_id):
    """Return (email, name) for a CRM counsellor id, or (None, None) if unknown.
    On a cache miss (e.g. a brand-new counsellor) it forces one refresh."""
    if not counsellor_id:
        return None, None
    cid = str(counsellor_id)
    hit = _counsellor_directory().get(cid)
    if not hit or not hit.get("email"):
        hit = _counsellor_directory(force=True).get(cid)
    if hit and hit.get("email"):
        return hit["email"], hit.get("name")
    return None, None


def _email_counsellor_new_lead(referral, ambassador):
    """Best-effort: notify the routed counsellor that a new affiliate lead was
    assigned to them. No-ops safely when the lead is unassigned, or the counsellor
    has no resolvable email yet (e.g. not returned by the CRM /counsellors list) —
    the lead still routes and admins are still notified regardless."""
    try:
        cid = getattr(referral, "crm_counsellor_id", None)
        if not cid:
            return  # unassigned lead — nobody to notify
        email, name = _resolve_counsellor_email(cid)
        if not email:
            print(f"[counsellor-mail] no email for counsellor_id={cid} "
                  f"(lead={getattr(referral, 'lead_name', None)}) — skipped")
            return
        from app.core.mail import send_counsellor_new_lead_email
        send_counsellor_new_lead_email(
            to_email=email,
            counsellor_name=name or getattr(referral, "crm_counsellor_name", None) or "there",
            lead_name=referral.lead_name,
            ambassador_name=(ambassador.full_name if ambassador else "an ambassador"),
            course_interest=getattr(referral, "education_interest", None),
            lead_phone=getattr(referral, "lead_phone", None),
            lead_email=getattr(referral, "lead_email", None),
        )
    except Exception as e:
        print(f"[counsellor-mail] new-lead email failed: {e}")


def _email_payout_paid(user, amount, method):
    """Best-effort notice to the ambassador that their payout was paid."""
    try:
        if user:
            from app.core.mail import send_payout_paid_email
            send_payout_paid_email(user.email, user.full_name, amount, method)
    except Exception as e:
        print(f"[mail] payout-paid email failed: {e}")


def _admin_emails():
    from app.core.config import settings
    return settings.admin_notify_list


def _notify_admins_lead_stage(db, referral, kind):
    """Alert admins when a referral hits qualified/enrolled (money-giving stage)."""
    try:
        emails = _admin_emails()
        if not emails:
            return
        from app.core.config import settings
        from app.core.mail import send_admin_lead_event_email
        amb = db.query(User).filter(User.id == referral.referrer_id).first()
        raw = settings.ENROLMENT_REWARD_AMOUNT if kind == "enrolled" else settings.LEAD_REWARD_AMOUNT
        amount = f"{float(raw):g}"
        counsellor = getattr(referral, "crm_counsellor_name", None) or (amb.counsellor_name if amb else None)
        send_admin_lead_event_email(emails, referral.lead_name, (amb.full_name if amb else "-"), kind, amount, counsellor)
    except Exception as e:
        print(f"[mail] admin lead-stage email failed: {e}")


def _maybe_notify_enrolled(db, referral):
    """Fire the enrolment notifications EXACTLY ONCE, the first time a referral is
    seen as enrolled — regardless of which channel delivered it (the `lead_enrolled`
    enum event OR the application stage/status text sync). Idempotent via the
    persistent `enrolment_email_sent` latch, so re-sent/duplicate events never
    double-notify. Sends (best-effort): the admin enrolled alert (৳500 to approve)
    to ADMIN_NOTIFY_EMAILS, and the ambassador's enrolment milestone email."""
    try:
        if getattr(referral, "enrolment_email_sent", False):
            return
        if not _application_shows_enrolled(referral):
            return
        # Latch FIRST (and commit) so a slow/failing send can never cause a
        # duplicate on a retried or re-sent event.
        referral.enrolment_email_sent = True
        # Anchor the enrolment date (first time only) for the installment-window
        # estimates shown on the ambassador dashboard.
        if getattr(referral, "enrolled_at", None) is None:
            referral.enrolled_at = datetime.utcnow()
        db.add(referral); db.commit(); db.refresh(referral)
    except Exception as e:
        print(f"[notify] enrolment latch update failed: {e}")
        return
    # Admin alert — same recipients + template the enum-event path already used.
    _notify_admins_lead_stage(db, referral, "enrolled")
    # Ambassador milestone email — real ambassadors only (skip placeholder CRM stubs).
    try:
        amb = db.query(User).filter(User.id == referral.referrer_id).first()
        if amb and amb.email and not amb.email.endswith("@pending.crm"):
            from app.core.mail import send_enrolment_email
            send_enrolment_email(
                amb.email, amb.full_name, referral.lead_name,
                getattr(referral, "application_university", None) or "",
            )
    except Exception as e:
        print(f"[mail] ambassador enrolment email failed: {e}")


def _notify_admins_reward_approved(ambassador, referral, amount, kind):
    """Confirm to admins that a reward was approved/credited to an ambassador."""
    try:
        emails = _admin_emails()
        if not emails:
            return
        from app.core.mail import send_admin_reward_approved_email
        lead_name = getattr(referral, "lead_name", "-")
        counsellor = getattr(referral, "crm_counsellor_name", None) or (ambassador.counsellor_name if ambassador else None)
        send_admin_reward_approved_email(emails, (ambassador.full_name if ambassador else "-"), lead_name, amount, kind, counsellor)
    except Exception as e:
        print(f"[mail] admin reward-approved email failed: {e}")


def _notify_admins_payout_requested(ambassador, amount, method):
    """Alert admins that an ambassador requested a payout (bank / gift card)."""
    try:
        emails = _admin_emails()
        if not emails:
            return
        from app.core.mail import send_admin_payout_requested_email
        send_admin_payout_requested_email(emails, (ambassador.full_name if ambassador else "-"), amount, method)
    except Exception as e:
        print(f"[mail] admin payout-requested email failed: {e}")


def create_user(db: Session, user: UserCreate, is_first_admin: bool = False):
    hashed_pwd = get_password_hash(user.password)
    ref_code = generate_unique_referral_code(db, user.full_name)
    
    # Assign admin role to first user or if specified (in dev scenario)
    role = UserRole.student
    if is_first_admin:
        role = UserRole.admin
        
    db_user = User(
        email=user.email,
        password_hash=hashed_pwd,
        full_name=user.full_name,
        role=role,
        referral_code=ref_code
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    if settings.LOCAL_SIGNUP_TEST_MODE:
        from app.demo_data import seed_demo_for_user
        seed_demo_for_user(db, db_user)
    else:
        _welcome_ambassador(db_user)
    return db_user


def create_simple_ambassador(db: Session, data, ip: str = None, user_agent: str = None, force_student: bool = False):
    """Create a verified ambassador profile. full_name is First Last."""
    full_name = f"{data.first_name} {data.last_name}".strip()
    role = UserRole.student
    if db.query(User).count() == 0 and not settings.LOCAL_SIGNUP_TEST_MODE and not force_student:
        role = UserRole.admin  # very first user bootstraps an admin
    db_user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        full_name=full_name,
        university=getattr(data, "university", None),
        department_year=getattr(data, "department_year", None),
        phone=data.phone,
        counsellor_id=getattr(data, "counsellor_id", None),
        counsellor_name=getattr(data, "counsellor_name", None),
        role=role,
        referral_code=generate_unique_referral_code(db, full_name),
        # GDPR: record acceptance of the Ambassador & Privacy policies at signup.
        policy_accepted_at=datetime.utcnow() if getattr(data, "policy_accepted", False) else None,
        policy_version=POLICY_VERSION if getattr(data, "policy_accepted", False) else None,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    # Record the signup acceptance into the audit table at current versions, so a
    # freshly-signed-up ambassador is NOT immediately shown the accept-terms gate.
    if getattr(data, "policy_accepted", False):
        try:
            # Pass ip/user_agent so a signup-checkbox acceptance carries the SAME
            # evidence as one made through the in-app gate. Without these the row
            # stored only user+document+version+hash+timestamp, which is a weaker
            # record for exactly the cohort that accepts via the checkbox.
            record_policy_acceptance(db, db_user, ip=ip, user_agent=user_agent)
        except Exception:
            db.rollback()
    if settings.LOCAL_SIGNUP_TEST_MODE:
        from app.demo_data import seed_demo_for_user
        seed_demo_for_user(db, db_user)
    else:
        _welcome_ambassador(db_user)
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

# --- TierConfig CRUD ---

DEFAULT_TIER_CONFIGS = [
    (AmbassadorTier.bronze,   10,  Decimal("25.00")),
    (AmbassadorTier.silver,   25,  Decimal("100.00")),
    (AmbassadorTier.gold,     50,  Decimal("250.00")),
    (AmbassadorTier.platinum, 100, Decimal("500.00")),
]

def get_tier_configs(db: Session):
    """Return all tier configs ordered by leads_required. Seeds defaults if none exist."""
    configs = db.query(TierConfig).all()
    if not configs:
        # Auto-seed defaults on first access
        for tier, leads, bonus in DEFAULT_TIER_CONFIGS:
            tc = TierConfig(tier=tier, leads_required=str(leads), bonus_amount=bonus)
            db.add(tc)
        db.commit()
        configs = db.query(TierConfig).all()
    return sorted(configs, key=lambda c: int(c.leads_required))

def recalculate_all_users_tiers(db: Session):
    """Recalculate tiers for all student users based on new configuration thresholds."""
    users = db.query(User).filter(User.role == UserRole.student).all()
    for user in users:
        update_user_tier(db, user)

def update_tier_config(db: Session, tier: AmbassadorTier, leads_required: int, bonus_amount: Decimal, admin_id: str):
    """Update the leads threshold and bonus amount for a given tier."""
    tc = db.query(TierConfig).filter(TierConfig.tier == tier).first()
    if not tc:
        tc = TierConfig(tier=tier, leads_required=str(leads_required), bonus_amount=bonus_amount)
        db.add(tc)
    else:
        tc.leads_required = str(leads_required)
        tc.bonus_amount = bonus_amount
        db.add(tc)
    db.commit()
    db.refresh(tc)
    
    # Trigger recalculation for all student users under the new tier parameters
    recalculate_all_users_tiers(db)
    
    return tc

def _get_tier_thresholds(db: Session):
    """Return a dict of tier -> (leads_required, bonus_amount) from DB config."""
    configs = get_tier_configs(db)
    return {c.tier: (int(c.leads_required), Decimal(str(c.bonus_amount))) for c in configs}

# Dynamic tier update helper
def update_user_tier(db: Session, user: User):
    # Count the number of valid leads
    valid_leads_count = db.query(Referral).filter(
        Referral.referrer_id == user.id,
        Referral.status.in_([
            ReferralStatus.validated,
            ReferralStatus.application_submitted,
            ReferralStatus.offer_made,
            ReferralStatus.enrolled_home,
            ReferralStatus.enrolled_international
        ])
    ).count()

    # Load configurable thresholds from DB
    thresholds = _get_tier_thresholds(db)

    bronze_leads,   bronze_bonus   = thresholds.get(AmbassadorTier.bronze,   (10,  Decimal("25.00")))
    silver_leads,   silver_bonus   = thresholds.get(AmbassadorTier.silver,   (25,  Decimal("100.00")))
    gold_leads,     gold_bonus     = thresholds.get(AmbassadorTier.gold,     (50,  Decimal("250.00")))
    platinum_leads, platinum_bonus = thresholds.get(AmbassadorTier.platinum, (100, Decimal("500.00")))

    # Determine new tier based on configurable thresholds
    new_tier = AmbassadorTier.standard
    if valid_leads_count >= platinum_leads:
        new_tier = AmbassadorTier.platinum
    elif valid_leads_count >= gold_leads:
        new_tier = AmbassadorTier.gold
    elif valid_leads_count >= silver_leads:
        new_tier = AmbassadorTier.silver
    elif valid_leads_count >= bronze_leads:
        new_tier = AmbassadorTier.bronze

    # Build qualifying tier map using DB values
    tier_bonuses = {
        AmbassadorTier.bronze:   (bronze_bonus,   "BRONZE"),
        AmbassadorTier.silver:   (silver_bonus,   "SILVER"),
        AmbassadorTier.gold:     (gold_bonus,     "GOLD"),
        AmbassadorTier.platinum: (platinum_bonus, "PLATINUM"),
    }

    qualifying_tiers = []
    if valid_leads_count >= bronze_leads:
        qualifying_tiers.append(AmbassadorTier.bronze)
    if valid_leads_count >= silver_leads:
        qualifying_tiers.append(AmbassadorTier.silver)
    if valid_leads_count >= gold_leads:
        qualifying_tiers.append(AmbassadorTier.gold)
    if valid_leads_count >= platinum_leads:
        qualifying_tiers.append(AmbassadorTier.platinum)

    for tier_enum in qualifying_tiers:
        bonus_amount, tier_name = tier_bonuses[tier_enum]
        already_awarded = db.query(Transaction).filter(
            Transaction.user_id == user.id,
            Transaction.category == TransactionCategory.bonus_reward,
            Transaction.description.like(f"%{tier_name}%")
        ).first()
        if not already_awarded:
            user.wallet_balance += bonus_amount
            user.total_earned += bonus_amount
            tx = Transaction(
                user_id=user.id,
                type=TransactionType.credit,
                amount=bonus_amount,
                category=TransactionCategory.bonus_reward,
                description=f"Bonus reward for reaching {tier_name} tier!"
            )
            db.add(tx)

    if user.tier != new_tier:
        user.tier = new_tier

    db.add(user)
    db.commit()
    db.refresh(user)


# --- Referral CRUD ---

def get_referrals_by_user(db: Session, user_id: str):
    return db.query(Referral).filter(Referral.referrer_id == user_id).all()

def get_all_referrals(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Referral).offset(skip).limit(limit).all()

def create_referral(db: Session, referral: ReferralCreate, referrer_id: str):
    """Ambassador manually submits a lead from their dashboard. Creates the referral
    AND pushes it to the CRM's Affiliate-Leads tab (unassigned), same as the public
    landing form — so both submission paths land in the CRM."""
    # Resolve the counsellor this lead is routed to — the EXACT value we push to
    # the CRM — and STORE it on our own record, so the portal shows the real
    # per-lead counsellor (the one selected on the form) instead of falling back
    # to the ambassador's. Mirrors push_lead_to_crm's rule: form choice, else the
    # ambassador's routing counsellor.
    ambassador = get_user(db, referrer_id)
    if getattr(referral, "counsellor_id", None):
        _crm_cid, _crm_cname = referral.counsellor_id, getattr(referral, "counsellor_name", None)
    else:
        _crm_cid = ambassador.counsellor_id if ambassador else None
        _crm_cname = ambassador.counsellor_name if ambassador else None

    db_referral = Referral(
        referrer_id=referrer_id,
        lead_name=referral.lead_name,
        lead_email=referral.lead_email,
        lead_phone=referral.lead_phone,
        education_interest=referral.education_interest,
        source="ambassador",
        crm_counsellor_id=_crm_cid,
        crm_counsellor_name=_crm_cname,
        # GDPR: ambassador confirmed they have the lead's permission to share
        # their details (enforced required in the API).
        referrer_consent=getattr(referral, "referrer_consent", False),
        consent_at=datetime.utcnow() if getattr(referral, "referrer_consent", False) else None,
        consent_policy_version=POLICY_VERSION if getattr(referral, "referrer_consent", False) else None,
    )
    db.add(db_referral)
    db.commit()
    db.refresh(db_referral)

    # Best-effort push to the CRM (stores the CRM lead_id for the reward loop).
    if ambassador:
        from app.integrations.crm_client import push_lead_to_crm
        crm_lead_id = push_lead_to_crm(db_referral, ambassador, {
            "counsellor_id": getattr(referral, "counsellor_id", None),
        })
        if crm_lead_id:
            db_referral.external_lead_id = crm_lead_id
            db.add(db_referral)
            db.commit()
            db.refresh(db_referral)

    _email_referral_received(ambassador, db_referral.lead_name)
    # New affiliate lead routed to a counsellor → notify that counsellor (best-effort).
    _email_counsellor_new_lead(db_referral, ambassador)
    return db_referral

def update_referral_status(db: Session, referral_id: str, new_status: ReferralStatus, admin_id: str):
    db_referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not db_referral:
        raise HTTPException(status_code=404, detail="Referral not found")
        
    db_referral.status = new_status
    db_referral.verified_by = admin_id
    
    user = db.query(User).filter(User.id == db_referral.referrer_id).first()
    if not user:
         raise HTTPException(status_code=404, detail="Referrer student not found")

    # Level 2 Lead Validation Reward (৳5)
    # Status transitions to validated, app submitted, offer made, or enrolled
    is_valid_lead = new_status in [
        ReferralStatus.validated,
        ReferralStatus.application_submitted,
        ReferralStatus.offer_made,
        ReferralStatus.enrolled_home,
        ReferralStatus.enrolled_international
    ]
    
    if is_valid_lead and not db_referral.lead_reward_paid:
        db_referral.lead_reward_paid = True
        reward = Decimal("5.00")
        user.wallet_balance += reward
        user.total_earned += reward
        
        tx = Transaction(
            user_id=user.id,
            type=TransactionType.credit,
            amount=reward,
            category=TransactionCategory.lead_reward,
            reference_id=db_referral.id,
            description=f"Reward for validated lead referral: {db_referral.lead_name}."
        )
        db.add(tx)
        
    # Level 3 enrolment reward is NO LONGER auto-credited on the status change. The
    # ৳500 is paid manually in two ৳250 installments (pay_enrolment_installment) as
    # the partner university pays BHE Uni in stages. Here we only anchor the enrolment
    # date so the dashboard can estimate the installment windows; the installments
    # then surface in the admin "awaiting approval" queue.
    if new_status in _ENROLLED_STATES and db_referral.enrolled_at is None:
        db_referral.enrolled_at = datetime.utcnow()

    db.add(db_referral)
    db.add(user)
    db.commit()
    db.refresh(db_referral)

    # Recalculate user tier dynamically
    update_user_tier(db, user)

    return db_referral


# --- Public referral capture (standalone affiliate website) ---

def capture_public_referral(db: Session, code: str, capture):
    """A lead submitted on this site's public landing page. Creates the referral
    locally (so the ambassador sees it), then pushes it to the CRM's Affiliate-Leads
    tab (unassigned). Stores the CRM lead_id so the later reward event maps back."""
    ambassador = get_user_by_referral_code(db, code)
    if not ambassador or ambassador.role != UserRole.student:
        raise HTTPException(status_code=404, detail="This referral link is not valid")

    # Store the counsellor we route this lead to (the exact value pushed to the
    # CRM) so the portal reflects the real per-lead counsellor, not a fallback.
    if getattr(capture, "counsellor_id", None):
        _crm_cid, _crm_cname = capture.counsellor_id, getattr(capture, "counsellor_name", None)
    else:
        _crm_cid, _crm_cname = ambassador.counsellor_id, ambassador.counsellor_name

    db_referral = Referral(
        referrer_id=ambassador.id,
        lead_name=capture.lead_name,
        lead_email=capture.lead_email,
        lead_phone=capture.lead_phone,
        education_interest=capture.course_interested,
        status=ReferralStatus.submitted,
        source="affiliate_site",
        crm_counsellor_id=_crm_cid,
        crm_counsellor_name=_crm_cname,
        # GDPR: the referred person consented to being contacted (enforced in API).
        lead_consent=getattr(capture, "lead_consent", False),
        consent_at=datetime.utcnow() if getattr(capture, "lead_consent", False) else None,
        consent_policy_version=POLICY_VERSION if getattr(capture, "lead_consent", False) else None,
    )
    db.add(db_referral)
    db.commit()
    db.refresh(db_referral)

    # Best-effort push to the CRM. On failure the local referral still exists.
    from app.integrations.crm_client import push_lead_to_crm
    extra = {
        "english_confidence": capture.english_confidence,
        "student_finance": capture.student_finance,
        "preferred_campus": capture.preferred_campus,
        "residential_status": capture.residential_status,
        "last_qualification": capture.last_qualification,
        "counsellor_id": getattr(capture, "counsellor_id", None),
    }
    crm_lead_id = push_lead_to_crm(db_referral, ambassador, extra)
    if crm_lead_id:
        db_referral.external_lead_id = crm_lead_id
        db.add(db_referral)
        db.commit()
        db.refresh(db_referral)

    _email_referral_received(ambassador, db_referral.lead_name)
    # New affiliate lead routed to a counsellor → notify that counsellor (best-effort).
    _email_counsellor_new_lead(db_referral, ambassador)
    return db_referral


# --- CRM integration (receiver) ---

def get_referral_by_external_lead_id(db: Session, external_lead_id: str):
    return db.query(Referral).filter(Referral.external_lead_id == external_lead_id).first()


def _create_placeholder_ambassador(db: Session, event):
    """Create an ambassador from CRM referrer details when they haven't onboarded
    in the affiliate app yet. Password is unusable until they register/reset."""
    import uuid as _uuid
    email = event.referrer_email or f"{event.referral_code.lower()}@pending.crm"

    # Reuse an existing user with this email if present (attach the code).
    existing = get_user_by_email(db, email)
    if existing:
        if not existing.referral_code:
            existing.referral_code = event.referral_code
            db.add(existing)
            db.commit()
            db.refresh(existing)
        return existing

    user = User(
        email=email,
        password_hash=get_password_hash(str(_uuid.uuid4())),
        full_name=event.referrer_name or f"Ambassador {event.referral_code}",
        role=UserRole.student,
        tier=AmbassadorTier.standard,
        referral_code=event.referral_code,
        wallet_balance=Decimal("0.00"),
        total_earned=Decimal("0.00"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# Funnel order — an event may only advance a referral forwards, never regress.
_STATUS_RANK = {
    ReferralStatus.submitted: 1,
    ReferralStatus.validated: 2,
    ReferralStatus.application_submitted: 3,
    ReferralStatus.offer_made: 4,
    ReferralStatus.enrolled_home: 5,
    ReferralStatus.enrolled_international: 5,
    ReferralStatus.rejected: 9,   # terminal (denied) — never re-opened by an event
}

# The counsellor's decision about a lead — these two flip freely (last wins).
_DECISION_STATES = (ReferralStatus.validated, ReferralStatus.rejected)
_ENROLLED_STATES = (ReferralStatus.enrolled_home, ReferralStatus.enrolled_international)


def _map_crm_event_to_status(event):
    if event.event == "lead_submitted":
        return ReferralStatus.submitted
    if event.event == "lead_rejected":
        return ReferralStatus.rejected
    if event.event == "lead_enrolled":
        return (
            ReferralStatus.enrolled_international
            if (event.enrolment_type or "").lower() == "international"
            else ReferralStatus.enrolled_home
        )
    return ReferralStatus.validated  # lead_qualified (default)


# NOTE: We intentionally do NOT email the ambassador when a lead is merely
# *qualified*. Qualification is the counsellor's decision and does not guarantee
# payment — the reward is only real once an admin APPROVES it. The ambassador is
# therefore notified a single time, at approval, via pay_lead_reward →
# send_reward_credited_email. This keeps the promise ("you've earned ৳X") honest.


def _apply_crm_counsellor(referral, event):
    """Copy the lead's CRM-assigned counsellor (if the event carries one) onto the
    referral. Only overwrites when a value is present so a later event without the
    field doesn't wipe a known counsellor."""
    cid = getattr(event, "counsellor_id", None)
    cname = getattr(event, "counsellor_name", None)
    if cid:
        referral.crm_counsellor_id = cid
    if cname:
        referral.crm_counsellor_name = cname


def _ingest_application_update(db: Session, event):
    """Sync the CRM application stage/status onto the referral (visibility only —
    no reward or lead-status change here). The admin surfaces the raw values; the
    ambassador sees the simplified rollup via Referral.application_status_label."""
    referral = get_referral_by_external_lead_id(db, event.external_lead_id)
    if not referral:
        return {"outcome": "no_referral", "referral": None, "ambassador": None}
    referral.application_stage = getattr(event, "stage", None)
    referral.application_status = getattr(event, "status", None)
    referral.application_notes = getattr(event, "notes", None)
    referral.application_university = getattr(event, "university", None)
    referral.application_course = getattr(event, "course", None)
    referral.application_intake = getattr(event, "intake", None)
    referral.application_campus = getattr(event, "campus", None)
    referral.application_branch = getattr(event, "branch", None)
    _apply_crm_counsellor(referral, event)
    db.add(referral)
    db.commit()
    db.refresh(referral)
    # If this sync is what tips the lead into "enrolled", fire the enrolment
    # notifications once (admin alert + ambassador milestone email). Most real
    # enrolments arrive on THIS text-sync channel, not the `lead_enrolled` enum
    # event, so this is the primary trigger. Idempotent + best-effort.
    _maybe_notify_enrolled(db, referral)
    return {"outcome": "application_synced", "referral": referral, "ambassador": None}


def _ingest_lead_status_changed(db: Session, event):
    """Mirror the EXACT CRM lead status + the counsellor's reason onto the referral
    for display in the ambassador/admin portals. Visibility only — never changes the
    reward `status` enum or triggers a reward. Creates the referral if the CRM lead
    hasn't been seen yet, so a status change is never lost."""
    referral = get_referral_by_external_lead_id(db, event.external_lead_id)
    if not referral:
        ambassador = get_user_by_referral_code(db, event.referral_code)
        if ambassador and ambassador.role != UserRole.student:
            return {"outcome": "flagged_no_credit", "referral": None, "ambassador": None}
        if not ambassador:
            ambassador = _create_placeholder_ambassador(db, event)
        referral = Referral(
            referrer_id=ambassador.id,
            lead_name=event.lead_name,
            lead_email=event.lead_email or f"{event.external_lead_id}@crm.lead",
            status=ReferralStatus.submitted,
            source="crm",
            external_lead_id=event.external_lead_id,
        )
    referral.crm_lead_status = getattr(event, "status", None)
    referral.status_reason = getattr(event, "reason", None)
    _apply_crm_counsellor(referral, event)
    db.add(referral)
    db.commit()
    db.refresh(referral)
    return {"outcome": "status_synced", "referral": referral, "ambassador": None}


def _ingest_counsellor_changed(db: Session, event):
    """Mirror ONLY the lead's CRM-assigned counsellor onto the referral. Fired when a
    counsellor is changed directly in L2E (outside the affiliate reassign button), so
    the admin mirror stays in sync instantly. Visibility only: never touches the
    status, application fields or rewards. No-ops if the referral isn't known yet (a
    bare counsellor change never creates one)."""
    referral = get_referral_by_external_lead_id(db, event.external_lead_id)
    if not referral:
        return {"outcome": "unknown_lead", "referral": None, "ambassador": None}
    _apply_crm_counsellor(referral, event)
    db.add(referral)
    db.commit()
    db.refresh(referral)
    return {"outcome": "counsellor_synced", "referral": referral, "ambassador": None}


def ingest_crm_lead_event(db: Session, event):
    """Record an incoming CRM lead event WITHOUT crediting.

    Models the funnel: a `lead_submitted` creates the referral (no reward); a later
    `lead_qualified` on the same CRM lead advances it to `validated` so it becomes
    actionable in the admin feed. Rewards are only ever paid by an admin via
    pay_lead_reward. Idempotent + forward-only on external_lead_id. Returns a dict
    {outcome, referral, ambassador}. See docs/integration/crm-affiliate-contract.md.
    """
    # Application stage/status sync is a separate, visibility-only channel.
    if event.event == "application_updated":
        return _ingest_application_update(db, event)

    # Refer & Earn: exact CRM lead status + reason mirror — visibility only, never
    # touches the reward `status` enum or triggers a reward.
    if event.event == "lead_status_changed":
        return _ingest_lead_status_changed(db, event)

    # Refer & Earn: a bare counsellor change in L2E. Mirror the new counsellor only,
    # so the admin stays in sync even without a status/application change.
    if event.event == "lead_counsellor_changed":
        return _ingest_counsellor_changed(db, event)

    target_status = _map_crm_event_to_status(event)

    existing = get_referral_by_external_lead_id(db, event.external_lead_id)
    if existing:
        # Keep the lead's CRM-assigned counsellor current regardless of which
        # decision branch runs below (it persists even on a "duplicate_ignored").
        _apply_crm_counsellor(existing, event)
        db.add(existing); db.commit(); db.refresh(existing)
        # Qualified and Not-qualified (rejected) are the counsellor's DECISION about
        # the lead — the two real triggers. They can flip freely (last decision wins),
        # so a lead can go qualified -> not-qualified -> qualified and the dashboard
        # tracks it. Everything else (submitted/enrolled) stays forward-only.
        if target_status in _DECISION_STATES:
            # Enrolled is a stronger milestone — never regress it via a decision flip.
            if existing.status in _ENROLLED_STATES:
                return {"outcome": "duplicate_ignored", "referral": existing, "ambassador": None}
            if existing.status == target_status:
                # Same decision re-sent — refresh the reason, don't re-notify.
                if target_status == ReferralStatus.rejected:
                    existing.rejection_reason = getattr(event, "reason", None)
                    db.add(existing); db.commit(); db.refresh(existing)
                return {"outcome": "duplicate_ignored", "referral": existing, "ambassador": None}
            existing.status = target_status
            existing.rejection_reason = (
                getattr(event, "reason", None) if target_status == ReferralStatus.rejected else None
            )
            db.add(existing); db.commit(); db.refresh(existing)
            if target_status == ReferralStatus.validated:
                _notify_admins_lead_stage(db, existing, "qualified")
            return {"outcome": "updated", "referral": existing, "ambassador": None}

        # Non-decision events: a rejected lead is only re-opened by a new decision
        # (handled above), and everything else advances forward-only by rank.
        if existing.status == ReferralStatus.rejected:
            return {"outcome": "duplicate_ignored", "referral": existing, "ambassador": None}
        if _STATUS_RANK[target_status] > _STATUS_RANK[existing.status]:
            existing.status = target_status
            db.add(existing)
            db.commit()
            db.refresh(existing)
            if target_status in _ENROLLED_STATES:
                _maybe_notify_enrolled(db, existing)
            return {"outcome": "updated", "referral": existing, "ambassador": None}
        return {"outcome": "duplicate_ignored", "referral": existing, "ambassador": None}

    # New lead. Match the ambassador by referral code, or create a placeholder from
    # the referrer details the CRM sent (so nothing is lost before they onboard).
    ambassador = get_user_by_referral_code(db, event.referral_code)
    if ambassador and ambassador.role != UserRole.student:
        return {"outcome": "flagged_no_credit", "referral": None, "ambassador": None}
    if not ambassador:
        ambassador = _create_placeholder_ambassador(db, event)

    db_referral = Referral(
        referrer_id=ambassador.id,
        lead_name=event.lead_name,
        lead_email=event.lead_email or f"{event.external_lead_id}@crm.lead",
        status=target_status,
        rejection_reason=getattr(event, "reason", None) if target_status == ReferralStatus.rejected else None,
        source="crm",
        external_lead_id=event.external_lead_id,
        lead_reward_paid=False,       # pending manual approval
        enrolment_reward_paid=False,
        crm_counsellor_id=getattr(event, "counsellor_id", None),
        crm_counsellor_name=getattr(event, "counsellor_name", None),
    )
    db.add(db_referral)
    db.commit()
    db.refresh(db_referral)
    if target_status == ReferralStatus.validated:
        _notify_admins_lead_stage(db, db_referral, "qualified")
    elif target_status in _ENROLLED_STATES:
        _maybe_notify_enrolled(db, db_referral)
    outcome = "recorded" if target_status == ReferralStatus.submitted else "pending_approval"
    return {"outcome": outcome, "referral": db_referral, "ambassador": ambassador}


def pay_lead_reward(db: Session, referral_id: str, admin_id: str):
    """The manual 'Pay reward' action — credits the ambassador for a qualified lead.

    Credits wallet + total_earned, writes the ledger transaction, and marks the
    lead reward paid. Guarded against double payment.
    """
    db_referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not db_referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    if db_referral.lead_reward_paid:
        raise HTTPException(status_code=400, detail="Lead reward already paid for this referral")
    # Only qualified (or further) leads are reward-worthy — a raw submitted lead or a
    # denied one cannot be paid.
    if db_referral.status not in (
        ReferralStatus.validated,
        ReferralStatus.application_submitted,
        ReferralStatus.offer_made,
        ReferralStatus.enrolled_home,
        ReferralStatus.enrolled_international,
    ):
        raise HTTPException(status_code=400, detail="Lead is not yet qualified for a reward")

    user = db.query(User).filter(User.id == db_referral.referrer_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Referrer (ambassador) not found")

    reward = Decimal(str(settings.LEAD_REWARD_AMOUNT))
    db_referral.lead_reward_paid = True
    db_referral.verified_by = admin_id
    user.wallet_balance += reward
    user.total_earned += reward

    tx = Transaction(
        user_id=user.id,
        type=TransactionType.credit,
        amount=reward,
        category=TransactionCategory.lead_reward,
        reference_id=db_referral.id,
        description=f"Lead reward (admin approved) for referral: {db_referral.lead_name}.",
    )
    db.add_all([db_referral, user, tx])
    db.commit()
    db.refresh(db_referral)

    update_user_tier(db, user)

    # Confirmation email — best-effort, real ambassadors only.
    if user.email and not user.email.endswith("@pending.crm"):
        try:
            from app.core.mail import send_reward_credited_email
            send_reward_credited_email(
                user.email, user.full_name, db_referral.lead_name, str(reward), "qualified referral"
            )
        except Exception as e:
            print(f"[notify] reward-credited email failed: {e}")

    _notify_admins_reward_approved(user, db_referral, str(reward), "lead")
    return db_referral


def deny_lead_reward(db: Session, referral_id: str, admin_id: str):
    """The manual 'Deny' action — reject a qualified lead so no reward is paid.

    Marks the referral rejected (removing it from the actionable feed). Cannot deny
    a reward that was already paid.
    """
    db_referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not db_referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    if db_referral.lead_reward_paid:
        raise HTTPException(status_code=400, detail="Reward already paid — cannot deny")

    db_referral.status = ReferralStatus.rejected
    db_referral.verified_by = admin_id
    db.add(db_referral)
    db.commit()
    db.refresh(db_referral)
    return db_referral


def _application_shows_enrolled(referral) -> bool:
    """True when the CRM application indicates the student has ENROLLED — the trigger
    that makes the ৳500 reward available for admin approval. Reads the synced raw
    application fields (or the referral's own enrolled status if set directly)."""
    combined = f"{(referral.application_stage or '')} {(referral.application_status or '')}".lower()
    return "enrol" in combined or referral.status in _ENROLLED_STATES


def _enrolment_installment_amount() -> Decimal:
    """Each installment is half the total enrolment reward (৳250 of ৳500), to 2dp."""
    total = Decimal(str(settings.ENROLMENT_REWARD_AMOUNT))
    return (total / 2).quantize(Decimal("0.01"))


def pay_enrolment_installment(db: Session, referral_id: str, installment: int, admin_id: str):
    """Approve ONE half (৳250) of the enrolment reward, as the partner university pays
    BHE Uni in stages. Installment 1 must be approved before installment 2. Admin
    approved, idempotent per installment, never auto-paid. The referral is marked
    fully settled (enrolment_reward_paid) once both halves are paid.
    """
    if installment not in (1, 2):
        raise HTTPException(status_code=400, detail="Installment must be 1 or 2")

    db_referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not db_referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    if not _application_shows_enrolled(db_referral):
        raise HTTPException(status_code=400, detail="Lead has not enrolled yet")

    if installment == 1 and db_referral.enrolment_installment_1_paid:
        raise HTTPException(status_code=400, detail="Installment 1 already paid for this referral")
    if installment == 2 and db_referral.enrolment_installment_2_paid:
        raise HTTPException(status_code=400, detail="Installment 2 already paid for this referral")
    if installment == 2 and not db_referral.enrolment_installment_1_paid:
        raise HTTPException(status_code=400, detail="Approve installment 1 before installment 2")

    user = db.query(User).filter(User.id == db_referral.referrer_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Referrer (ambassador) not found")

    amount = _enrolment_installment_amount()
    now = datetime.utcnow()
    if installment == 1:
        db_referral.enrolment_installment_1_paid = True
        db_referral.enrolment_installment_1_paid_at = now
    else:
        db_referral.enrolment_installment_2_paid = True
        db_referral.enrolment_installment_2_paid_at = now
    db_referral.enrolment_reward_denied = False
    db_referral.verified_by = admin_id
    # Fully settled once both halves are paid (preserves the existing "paid" meaning
    # used by the awaiting-approval queue, guards and dashboard).
    if db_referral.enrolment_installment_1_paid and db_referral.enrolment_installment_2_paid:
        db_referral.enrolment_reward_paid = True

    user.wallet_balance += amount
    user.total_earned += amount

    tx = Transaction(
        user_id=user.id,
        type=TransactionType.credit,
        amount=amount,
        category=TransactionCategory.enrolment_reward,
        reference_id=db_referral.id,
        description=f"Enrolment reward installment {installment} of 2 (admin approved) for referral: {db_referral.lead_name}.",
    )
    db.add_all([db_referral, user, tx])
    db.commit()
    db.refresh(db_referral)

    update_user_tier(db, user)

    # Confirmation email — best-effort, real ambassadors only.
    if user.email and not user.email.endswith("@pending.crm"):
        try:
            from app.core.mail import send_reward_credited_email
            send_reward_credited_email(
                user.email, user.full_name, db_referral.lead_name, str(amount), "enrolment"
            )
        except Exception as e:
            print(f"[notify] enrolment installment reward-credited email failed: {e}")

    _notify_admins_reward_approved(user, db_referral, str(amount), "enrolment")
    return db_referral


def pay_enrolment_reward(db: Session, referral_id: str, admin_id: str):
    """Legacy 'Pay the full enrolment reward' — now equivalent to approving BOTH
    installments at once (kept for backward compatibility / any legacy caller). The
    admin UI uses the per-installment endpoint instead. Safe: each installment is
    guarded, so this never double-credits."""
    db_referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not db_referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    if db_referral.enrolment_reward_paid:
        raise HTTPException(status_code=400, detail="Enrolment reward already paid for this referral")
    if not db_referral.enrolment_installment_1_paid:
        db_referral = pay_enrolment_installment(db, referral_id, 1, admin_id)
    if not db_referral.enrolment_installment_2_paid:
        db_referral = pay_enrolment_installment(db, referral_id, 2, admin_id)
    return db_referral


def deny_enrolment_reward(db: Session, referral_id: str, admin_id: str):
    """Manual 'Deny ৳500' — decline the enrolment reward (e.g. duplicate/fraud).
    Cannot deny one already paid. Does NOT change the lead's status (they ARE
    enrolled); it just removes it from the awaiting-approval queue.
    """
    db_referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not db_referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    if db_referral.enrolment_reward_paid:
        raise HTTPException(status_code=400, detail="Enrolment reward already paid — cannot deny")
    db_referral.enrolment_reward_denied = True
    db_referral.verified_by = admin_id
    db.add(db_referral)
    db.commit()
    db.refresh(db_referral)
    return db_referral


# --- Payout CRUD ---

def get_payouts_by_user(db: Session, user_id: str):
    return db.query(Payout).filter(Payout.user_id == user_id).all()

def get_all_payouts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Payout).offset(skip).limit(limit).all()

def validate_payout_destination(payout, user):
    bank = dict(payout.bank_details or {})
    if payout.payment_method == PayoutMethod.gift_card:
        if not payout.gift_card_email:
            raise HTTPException(status_code=400, detail="A delivery email is required for gift card payouts.")
    elif payout.payment_method == PayoutMethod.bkash:
        import re
        phone = re.sub(r"[\s-]", "", str(bank.get("account_number", "")))
        if phone.startswith("+88"):
            phone = phone[3:]
        if not re.fullmatch(r"01[3-9]\d{8}", phone) or not str(bank.get("holder_name", "")).strip():
            raise HTTPException(status_code=400, detail="Enter the bKash account holder and a valid Bangladesh mobile number.")
        if bank.get("account_type") not in ("personal", "agent"):
            raise HTTPException(status_code=400, detail="Choose personal or agent bKash account.")
        bank["account_number"] = phone
    elif payout.payment_method == PayoutMethod.other:
        if not all(str(bank.get(k, "")).strip() for k in ("holder_name", "provider_name", "account_number")):
            raise HTTPException(status_code=400, detail="Enter the payment service, recipient name and account details.")
    else:
        # Bangladesh accounts use bank/branch/routing; legacy UK profiles remain valid.
        local_bank = all(str(bank.get(k, "")).strip() for k in ("holder_name", "bank_name", "branch", "account_number", "routing_number"))
        if local_bank:
            import re
            if not re.fullmatch(r"\d{9}", str(bank["routing_number"])) or not re.fullmatch(r"\d{5,20}", str(bank["account_number"])):
                raise HTTPException(status_code=400, detail="Enter a 9-digit routing number and a valid bank account number.")
        elif bank.get("sort_code") and bank.get("account_number"):
            addr = (user.bank_details or {}).get("address") or {}
            if not all(addr.get(k) for k in ("line1", "city", "postcode")):
                raise HTTPException(status_code=400, detail="Please add your billing address in your Profile before requesting a bank transfer.")
        else:
            raise HTTPException(status_code=400, detail="Enter the account holder, bank, branch, account number and routing number.")

    return bank


def create_payout_request(db: Session, payout: PayoutCreate, user_id: str):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if payout.request_key:
        existing = db.query(Payout).filter(Payout.request_key == payout.request_key).first()
        if existing:
            if existing.user_id != user_id:
                raise HTTPException(status_code=409, detail="Request key already used")
            if existing.amount != payout.amount or existing.payment_method != payout.payment_method:
                raise HTTPException(status_code=409, detail="Request key belongs to a different payout.")
            return existing

    payout_amt = Decimal(str(payout.amount))

    # Minimum depends on the method — gift cards ৳10, bank transfers ৳50.
    if payout.payment_method == PayoutMethod.gift_card:
        min_amt = Decimal(str(settings.GIFT_CARD_MIN_WITHDRAWAL_AMOUNT))
    else:
        min_amt = Decimal(str(settings.MIN_WITHDRAWAL_AMOUNT))
    max_amt = Decimal(str(settings.MAX_WITHDRAWAL_AMOUNT))

    # Enforce configured minimum/maximum limits
    if payout_amt < min_amt or payout_amt > max_amt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Withdrawal amount must be between ৳{min_amt:.2f} and ৳{max_amt:,.2f}."
        )

    bank = validate_payout_destination(payout, user)

    # Atomic, race-safe debit - a single conditional UPDATE that only succeeds while the
    # balance is still sufficient, preventing concurrent payout requests from over-drawing
    # the wallet (double-spend). WAL mode + busy timeout serialise concurrent writers.
    debited = (
        db.query(User)
        .filter(User.id == user_id, User.wallet_balance >= payout_amt)
        .update({User.wallet_balance: User.wallet_balance - payout_amt}, synchronize_session=False)
    )
    if debited != 1:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient wallet balance for withdrawal."
        )
    db.refresh(user)

    # A request only reserves funds. Finance records settlement separately.
    payout_status = PayoutStatus.pending
    processed_at = None
    
    db_payout = Payout(
        user_id=user_id,
        amount=payout_amt,
        payment_method=payout.payment_method,
        bank_details=bank,
        request_key=payout.request_key,
        gift_card_email=payout.gift_card_email,
        status=payout_status,
        processed_at=processed_at
    )
    db.add(db_payout)
    db.flush()

    # Add audit log
    tx = Transaction(
        user_id=user_id,
        type=TransactionType.debit,
        amount=payout_amt,
        category=TransactionCategory.payout_withdrawal,
        reference_id=db_payout.id,
        description=f"Payout withdrawal request ({payout.payment_method.value}) created."
    )
    db.add(tx)
    db.commit()

    db.refresh(db_payout)
    _method = payout.payment_method.value.replace("_", " ")
    _notify_admins_payout_requested(user, f"{payout_amt:.2f}", _method)
    return db_payout

def update_payout_status(db: Session, payout_id: str, new_status: PayoutStatus, admin_id: str, payment_reference: str = None, status_note: str = None):
    from datetime import datetime, timezone
    payout = db.query(Payout).filter(Payout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")
    allowed = {
        PayoutStatus.pending: {PayoutStatus.processing, PayoutStatus.paid, PayoutStatus.cancelled, PayoutStatus.failed},
        PayoutStatus.processing: {PayoutStatus.paid, PayoutStatus.cancelled, PayoutStatus.failed},
    }
    previous = payout.status
    if new_status not in allowed.get(previous, set()):
        raise HTTPException(status_code=400, detail="This payout cannot move to the requested status.")
    if new_status == PayoutStatus.failed and not (status_note or "").strip():
        raise HTTPException(status_code=400, detail="A failure reason is required.")
    if new_status == PayoutStatus.paid and payout.payment_method in (PayoutMethod.bkash, PayoutMethod.other) and not (payment_reference or "").strip():
        raise HTTPException(status_code=400, detail="Record the manual payment reference before marking this request paid.")
    stamp = datetime.now(timezone.utc)
    changes = {Payout.status: new_status, Payout.processed_by: admin_id, Payout.status_note: (status_note or "").strip() or None}
    if new_status == PayoutStatus.processing:
        changes[Payout.processing_at] = stamp
    else:
        changes[Payout.processed_at] = stamp
    if new_status == PayoutStatus.paid:
        changes[Payout.provider_ref] = (payment_reference or "").strip()[:120] or None
    # Claim this exact transition atomically, so concurrent admins cannot refund twice.
    changed = db.query(Payout).filter(Payout.id == payout_id, Payout.status == previous).update(changes, synchronize_session=False)
    if changed != 1:
        db.rollback()
        raise HTTPException(status_code=409, detail="Another admin updated this request. Refresh and try again.")
    if new_status in (PayoutStatus.cancelled, PayoutStatus.failed):
        db.query(User).filter(User.id == payout.user_id).update({User.wallet_balance: User.wallet_balance + payout.amount}, synchronize_session=False)
        db.add(Transaction(user_id=payout.user_id, type=TransactionType.credit, amount=payout.amount,
            category=TransactionCategory.bonus_reward, reference_id=payout.id,
            description=f"Wallet refunded after {new_status.value} payout request."))
    from app.models import AuditLog
    actor = db.query(User).filter(User.id == admin_id).first()
    db.add(AuditLog(admin_id=admin_id, admin_email=actor.email if actor else None,
        action=f"payout_{new_status.value}", target_type="payout", target_id=payout.id))
    db.commit()
    db.refresh(payout)
    if new_status == PayoutStatus.paid:
        user = db.query(User).filter(User.id == payout.user_id).first()
        _email_payout_paid(user, f"{Decimal(str(payout.amount)):.2f}", payout.payment_method.value.replace("_", " "))
    return payout


# --- Transactions CRUD ---

def get_transactions_by_user(db: Session, user_id: str):
    return db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.created_at.desc()).all()


# --- Dashboard Stats Assembly ---

def get_ambassador_dashboard_stats(db: Session, user_id: str):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Count total leads and enrolments
    leads_count = db.query(Referral).filter(
        Referral.referrer_id == user_id
    ).count()
    
    # Enrolment is tracked on the synced CRM application fields, not the referral
    # status enum (which stays validated/Qualified). Use the same helper as the
    # ৳500 reward flow so this matches what the ambassador sees.
    enrolments_count = sum(
        1 for r in db.query(Referral).filter(Referral.referrer_id == user_id).all()
        if _application_shows_enrolled(r)
    )
    
    valid_leads_count = db.query(Referral).filter(
        Referral.referrer_id == user_id,
        Referral.status.in_([
            ReferralStatus.validated,
            ReferralStatus.application_submitted,
            ReferralStatus.offer_made,
            ReferralStatus.enrolled_home,
            ReferralStatus.enrolled_international
        ])
    ).count()
    
    # Load configurable thresholds from DB
    configs = get_tier_configs(db)
    thresholds = {c.tier: int(c.leads_required) for c in configs}

    bronze_leads = thresholds.get(AmbassadorTier.bronze, 10)
    silver_leads = thresholds.get(AmbassadorTier.silver, 25)
    gold_leads = thresholds.get(AmbassadorTier.gold, 50)
    platinum_leads = thresholds.get(AmbassadorTier.platinum, 100)

    # Calculate leads to next tier dynamically
    leads_to_next = 0
    if valid_leads_count < bronze_leads:
        leads_to_next = bronze_leads - valid_leads_count
    elif valid_leads_count < silver_leads:
        leads_to_next = silver_leads - valid_leads_count
    elif valid_leads_count < gold_leads:
        leads_to_next = gold_leads - valid_leads_count
    elif valid_leads_count < platinum_leads:
        leads_to_next = platinum_leads - valid_leads_count
        
    # Build activities list
    txs = get_transactions_by_user(db, user_id)
    recent_activity = []
    for tx in txs[:10]: # Limit to last 10
        recent_activity.append({
            "id": tx.id,
            "type": tx.type.value,
            "category": tx.category.value,
            "amount": float(tx.amount),
            "description": tx.description,
            "created_at": tx.created_at.isoformat() if tx.created_at else None
        })
        
    return {
        "total_earned": user.total_earned,
        "wallet_balance": user.wallet_balance,
        "total_leads": leads_count,
        "total_enrolments": enrolments_count,
        "tier": user.tier,
        "leads_to_next_tier": leads_to_next,
        "referral_code": user.referral_code,
        "recent_activity": recent_activity,
        "tier_configs": configs
    }

def update_user_profile(db: Session, user_id: str, user_update):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if getattr(user_update, "phone", None) is not None:
        user.phone = user_update.phone
    # Counsellor: only touch it when the field was explicitly sent, so a plain
    # phone/name update doesn't wipe it. Sending counsellor_id=None is the valid
    # "None of the above" choice, so we honour an explicit null too.
    fields_set = getattr(user_update, "model_fields_set", set())
    counsellor_changed = "counsellor_id" in fields_set
    if counsellor_changed:
        user.counsellor_id = user_update.counsellor_id
        user.counsellor_name = getattr(user_update, "counsellor_name", None)
    if user_update.bank_details is not None:
        details = dict(user_update.bank_details)
        details["payout_accounts"] = (user.bank_details or {}).get("payout_accounts", [])
        user.bank_details = details
    if user_update.password is not None:
        user.password_hash = get_password_hash(user_update.password)
        # Changing the password invalidates every existing session for this user
        # (all their other devices are logged out). This endpoint returns no new
        # token, so the caller's current session is logged out too — they re-login.
        user.token_version = int(getattr(user, "token_version", 0) or 0) + 1

    db.add(user)
    db.commit()
    db.refresh(user)
    # If the ambassador just attached/changed their counsellor, retroactively route
    # their existing UNASSIGNED CRM leads to it (best-effort, never overwrites).
    if counsellor_changed and user.counsellor_id:
        _propagate_counsellor_to_crm_leads(db, user)
    # Keep the ClickSend marketing list current if the phone changed (best-effort,
    # never blocks the profile update; students only).
    if getattr(user_update, "phone", None) is not None and getattr(user, "role", None) == UserRole.student:
        try:
            from app.integrations.clicksend import add_ambassador_contact
            add_ambassador_contact(
                user.phone, full_name=user.full_name, email=user.email,
                referral_code=getattr(user, "referral_code", None), tier=getattr(user, "tier", None),
            )
        except Exception as e:
            print(f"[clicksend] profile phone sync failed for {getattr(user, 'email', None)}: {e}")
    return user

def set_user_tier_manually(db: Session, user_id: str, new_tier: AmbassadorTier, admin_id: str, note: str = None):
    """Admin override: manually set an ambassador's tier, bypassing auto lead-count logic."""
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot change tier of an admin user")

    old_tier = user.tier.value if user.tier else "standard"
    user.tier = new_tier

    audit_note = note or f"Admin manually set tier from {old_tier} to {new_tier.value}."
    tx = Transaction(
        user_id=user.id,
        type=TransactionType.credit,
        amount=Decimal("0.00"),
        category=TransactionCategory.bonus_reward,
        reference_id=admin_id,
        description=f"[ADMIN OVERRIDE] {audit_note}"
    )
    db.add(tx)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def _propagate_counsellor_to_crm_leads(db: Session, user):
    """Best-effort: retroactively route the ambassador's already-captured CRM leads
    to their current counsellor. Only leads we actually pushed (have an
    external_lead_id) are eligible; the CRM assigns just the ones still UNASSIGNED
    and never overwrites a human's assignment. Silent on failure — a counsellor
    change must never fail because the CRM is briefly unreachable."""
    try:
        if not user or not getattr(user, "counsellor_id", None):
            return None
        lead_ids = [
            r.external_lead_id
            for r in db.query(Referral)
            .filter(Referral.referrer_id == user.id, Referral.external_lead_id.isnot(None))
            .all()
            if r.external_lead_id
        ]
        if not lead_ids:
            return None
        from app.integrations.crm_client import assign_counsellor_to_crm_leads
        return assign_counsellor_to_crm_leads(user.counsellor_id, lead_ids)
    except Exception as e:
        print(f"[crm] counsellor propagation failed for user {getattr(user, 'id', None)}: {e}")
        return None


def backfill_counsellor_crm_leads(db: Session) -> dict:
    """One-off remediation: for every ambassador that already has a counsellor,
    retroactively route their existing UNASSIGNED CRM leads to it. Idempotent — the
    CRM skips any lead already assigned — so it's safe to run repeatedly."""
    users = db.query(User).filter(User.counsellor_id.isnot(None)).all()
    ambassadors_processed = 0
    total_assigned = 0
    total_skipped = 0
    for u in users:
        res = _propagate_counsellor_to_crm_leads(db, u)
        ambassadors_processed += 1
        if isinstance(res, dict):
            total_assigned += len(res.get("assigned", []))
            total_skipped += len(res.get("skipped", []))
    summary = {
        "ambassadors_processed": ambassadors_processed,
        "leads_assigned": total_assigned,
        "leads_already_assigned_skipped": total_skipped,
    }
    print(f"[crm] backfill_counsellor_crm_leads: {summary}")
    return summary


def assign_ambassador_counsellor(db: Session, user_id: str, counsellor_id: str, counsellor_name: str = None):
    """Admin assigns a routed counsellor to an ambassador. Stamps the ambassador's
    default counsellor for FUTURE referrals AND retroactively routes their existing
    UNASSIGNED CRM leads to that counsellor (best-effort, never overwrites a lead a
    human already assigned). Name is resolved from the CRM counsellor list when
    possible so the stored label stays trustworthy; the client value is a fallback."""
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != UserRole.student:
        raise HTTPException(status_code=400, detail="Only ambassadors can be assigned a counsellor")
    if not counsellor_id or not counsellor_id.strip():
        raise HTTPException(status_code=400, detail="A counsellor must be selected")

    # Prefer the authoritative CRM name; fall back to the label the client sent.
    resolved_name = counsellor_name
    try:
        from app.integrations.crm_client import fetch_counsellors
        for c in fetch_counsellors():
            if str(c.get("id")) == str(counsellor_id):
                resolved_name = c.get("name") or resolved_name
                break
    except Exception:
        pass  # CRM unreachable → keep the client-supplied name

    user.counsellor_id = counsellor_id.strip()
    user.counsellor_name = (resolved_name or "").strip() or None
    db.add(user)
    db.commit()
    db.refresh(user)
    # Retroactively route this ambassador's already-captured, still-unassigned CRM
    # leads to the newly attached counsellor (best-effort, never overwrites).
    _propagate_counsellor_to_crm_leads(db, user)
    return user


def get_counsellor_reassign_candidates(db: Session) -> list[dict]:
    """Counsellors that currently hold reassignable referral leads (anything not
    rejected/dead, with a CRM lead id to move) + a per-counsellor count. Drives the
    'leaving counsellor' dropdown in the bulk-reassign modal."""
    rows = (
        db.query(Referral.crm_counsellor_id, func.count(Referral.id))
        .filter(
            Referral.crm_counsellor_id.isnot(None),
            Referral.external_lead_id.isnot(None),
            # Scope: a departing counsellor hands over their WHOLE book except dead
            # leads ("active + enrolled"). Only rejected/dead is left behind.
            Referral.status != ReferralStatus.rejected,
        )
        .group_by(Referral.crm_counsellor_id)
        .all()
    )
    # Best-effort display names from the cached per-lead names we already hold.
    name_by_id = {}
    for cid, cname in (
        db.query(Referral.crm_counsellor_id, Referral.crm_counsellor_name)
        .filter(Referral.crm_counsellor_id.isnot(None), Referral.crm_counsellor_name.isnot(None))
        .all()
    ):
        name_by_id.setdefault(cid, cname)
    out = [
        {"counsellor_id": cid, "counsellor_name": name_by_id.get(cid), "active_lead_count": int(count)}
        for cid, count in rows
    ]
    out.sort(key=lambda x: (x["counsellor_name"] or "").lower())
    return out


def get_counsellor_referral_leads(db: Session, counsellor_id: str) -> list:
    """A counsellor's reassignable referral leads (new + in progress + enrolled;
    everything except rejected/dead, with a CRM lead id), for the reassign checklist."""
    return (
        db.query(Referral)
        .filter(
            Referral.crm_counsellor_id == counsellor_id,
            Referral.external_lead_id.isnot(None),
            # Scope: a departing counsellor hands over their WHOLE book except dead
            # leads ("active + enrolled"). Only rejected/dead is left behind.
            Referral.status != ReferralStatus.rejected,
        )
        .order_by(Referral.created_at.desc())
        .all()
    )


def reassign_counsellor_leads(db: Session, from_counsellor_id: str, to_counsellor_id: str,
                              referral_ids: list = None, repoint_ambassadors: bool = True,
                              admin=None) -> dict:
    """Move a departing counsellor's active referral leads to a replacement.

    The CRM is the source of truth: we send candidate CRM lead ids and it overwrites
    ONLY the leads still held by `from_counsellor_id`, reporting what actually moved.
    We mirror the confirmed moves locally, and (optionally) re-point ambassadors whose
    DEFAULT counsellor was the leaver so their future + still-unassigned leads follow."""
    from_counsellor_id = (from_counsellor_id or "").strip()
    to_counsellor_id = (to_counsellor_id or "").strip()
    if not from_counsellor_id or not to_counsellor_id:
        raise HTTPException(status_code=400, detail="Both counsellors are required")
    if from_counsellor_id == to_counsellor_id:
        raise HTTPException(status_code=400, detail="Pick a different counsellor to move leads to")

    # Authoritative destination name from the CRM (fallback: a cached per-lead name).
    to_name = None
    try:
        from app.integrations.crm_client import fetch_counsellors
        for c in fetch_counsellors():
            if str(c.get("id")) == str(to_counsellor_id):
                to_name = c.get("name")
                break
    except Exception:
        pass
    if not to_name:
        row = (db.query(Referral.crm_counsellor_name)
               .filter(Referral.crm_counsellor_id == to_counsellor_id,
                       Referral.crm_counsellor_name.isnot(None)).first())
        to_name = row[0] if row else None

    # Candidate leads = the leaver's active referral leads (optionally narrowed to a
    # specific selection from the UI checklist).
    candidates = get_counsellor_referral_leads(db, from_counsellor_id)
    if referral_ids:
        wanted = set(referral_ids)
        candidates = [r for r in candidates if r.id in wanted]
    by_external = {r.external_lead_id: r for r in candidates if r.external_lead_id}

    result = {"reassigned": 0, "skipped": 0, "missing": 0,
              "ambassadors_repointed": 0, "to_counsellor_name": to_name}

    batch_id = str(uuid.uuid4())
    admin_id = getattr(admin, "id", None)
    admin_email = getattr(admin, "email", None)
    result["batch_id"] = batch_id

    if by_external:
        from app.integrations.crm_client import reassign_counsellor_crm_leads
        crm = reassign_counsellor_crm_leads(from_counsellor_id, to_counsellor_id, list(by_external.keys()))
        if crm is None:
            raise HTTPException(status_code=502,
                                detail="Could not reach the CRM to reassign leads; nothing was changed.")
        moved = set(str(x) for x in (crm.get("reassigned") or []))
        result["reassigned"] = len(moved)
        result["skipped"] = len(crm.get("skipped") or [])
        result["missing"] = len(crm.get("missing") or [])
        for ext_id, ref in by_external.items():
            if str(ext_id) in moved:
                # Freeze a handoff-log row BEFORE mutating the counsellor, so the
                # snapshot captures the leaver's name (still on the lead) and the
                # lead's exact status at the moment of handoff.
                db.add(CounsellorReassignmentLog(
                    batch_id=batch_id,
                    referral_id=ref.id,
                    external_lead_id=ref.external_lead_id,
                    lead_name=ref.lead_name,
                    ambassador_id=ref.referrer_id,
                    ambassador_name=(ref.referrer.full_name if ref.referrer else None),
                    from_counsellor_id=from_counsellor_id,
                    from_counsellor_name=ref.crm_counsellor_name,
                    to_counsellor_id=to_counsellor_id,
                    to_counsellor_name=to_name,
                    status_at_handoff=(ref.status.value if hasattr(ref.status, "value") else str(ref.status)),
                    crm_status_at_handoff=ref.crm_lead_status,
                    application_stage_at_handoff=ref.application_stage,
                    application_status_at_handoff=ref.application_status,
                    admin_id=admin_id,
                    admin_email=admin_email,
                ))
                ref.crm_counsellor_id = to_counsellor_id
                ref.crm_counsellor_name = to_name or ref.crm_counsellor_name
                db.add(ref)

    amb = []
    if repoint_ambassadors:
        amb = db.query(User).filter(User.counsellor_id == from_counsellor_id).all()
        for u in amb:
            u.counsellor_id = to_counsellor_id
            u.counsellor_name = to_name or u.counsellor_name
            db.add(u)
        result["ambassadors_repointed"] = len(amb)

    db.commit()

    # After commit, route each re-pointed ambassador's still-UNASSIGNED leads to the
    # new counsellor (best-effort; the CRM only fills unassigned ones).
    for u in amb:
        _propagate_counsellor_to_crm_leads(db, u)

    return result


def get_counsellor_change_log(db: Session, counsellor_id: str = None, limit: int = 200) -> list:
    """The bulk-reassignment handoff history for the admin panel, most recent first.
    Pass counsellor_id to see every handoff that TOUCHED that counsellor (as either the
    leaver or the replacement); omit it for the full log."""
    q = db.query(CounsellorReassignmentLog)
    if counsellor_id:
        cid = str(counsellor_id).strip()
        q = q.filter(or_(
            CounsellorReassignmentLog.from_counsellor_id == cid,
            CounsellorReassignmentLog.to_counsellor_id == cid,
        ))
    return q.order_by(CounsellorReassignmentLog.created_at.desc()).limit(limit).all()


def get_admin_dashboard_stats(db: Session):
    total_referrals = db.query(Referral).count()
    
    import datetime
    one_week_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    referrals_this_week = db.query(Referral).filter(Referral.created_at >= one_week_ago).count()

    # Payouts processed this month
    first_day_of_month = datetime.datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    payouts_this_month = db.query(func.sum(Payout.amount)).filter(
        Payout.status == PayoutStatus.paid,
        Payout.processed_at >= first_day_of_month
    ).scalar() or 0.00
    
    new_ambassadors = db.query(User).filter(
        User.role == UserRole.student,
        User.created_at >= one_week_ago
    ).count()

    # --- Monitoring KPIs (all live, computed from real records) ---
    QUALIFIED_STATUSES = [
        ReferralStatus.validated,
        ReferralStatus.application_submitted,
        ReferralStatus.offer_made,
        ReferralStatus.enrolled_home,
        ReferralStatus.enrolled_international,
    ]
    ENROLLED_STATUSES = [ReferralStatus.enrolled_home, ReferralStatus.enrolled_international]

    total_ambassadors = db.query(User).filter(User.role == UserRole.student).count()
    total_qualified = db.query(Referral).filter(Referral.status.in_(QUALIFIED_STATUSES)).count()
    # "Not qualified" is the counsellor's rejection decision (single terminal status),
    # the mirror of Qualified. Kept separate from "still pending" leads.
    total_not_qualified = db.query(Referral).filter(Referral.status == ReferralStatus.rejected).count()
    # Enrolment lives on the synced CRM application fields, not the referral status
    # enum (which stays validated/Qualified). Use the shared helper so this matches
    # the ambassador dashboard + Applications tab.
    total_enrolled = sum(1 for r in db.query(Referral).all() if _application_shows_enrolled(r))
    # Applications = leads that have synced CRM application data (stage or status set).
    # Mirrors the Applications tab filter exactly (application_stage || application_status).
    total_applications = sum(1 for r in db.query(Referral).all() if (r.application_stage or r.application_status))

    lead_reward_amount = float(Decimal(str(settings.LEAD_REWARD_AMOUNT)))
    pending_rewards_count = db.query(Referral).filter(
        Referral.status.in_(QUALIFIED_STATUSES),
        Referral.lead_reward_paid == False,  # noqa: E712
    ).count()
    pending_rewards_amount = round(pending_rewards_count * lead_reward_amount, 2)

    # Enrolment rewards awaiting admin approval — the CRM shows the student enrolled
    # and the reward is not fully paid or denied yet. Enrolment is Python-side (a text
    # match on the synced application fields), so iterate rather than SQL-filter.
    # The reward is paid in two ৳250 installments, so the OUTSTANDING amount counts
    # only the unpaid installments (৳250 each): a referral with its 1st installment
    # already paid contributes ৳250, not the full ৳500.
    _installment_amt = float(_enrolment_installment_amount())
    _pending_enrol = [
        r for r in db.query(Referral).all()
        if _application_shows_enrolled(r) and not r.enrolment_reward_paid and not r.enrolment_reward_denied
    ]
    pending_enrolment_rewards_count = len(_pending_enrol)
    _unpaid_installments = sum(
        (0 if r.enrolment_installment_1_paid else 1) + (0 if r.enrolment_installment_2_paid else 1)
        for r in _pending_enrol
    )
    pending_enrolment_rewards_amount = round(_unpaid_installments * _installment_amt, 2)

    pending_payouts_count = db.query(Payout).filter(Payout.status.in_([PayoutStatus.pending, PayoutStatus.processing])).count()
    pending_payouts_amount = float(
        db.query(func.sum(Payout.amount)).filter(Payout.status.in_([PayoutStatus.pending, PayoutStatus.processing])).scalar() or 0
    )
    # Money currently owed to ambassadors (sum of spendable wallet balances).
    wallet_liability = float(
        db.query(func.sum(User.wallet_balance)).filter(User.role == UserRole.student).scalar() or 0
    )

    # Recent activities (last 5 referrals, 5 paid payouts)
    recent_referrals = db.query(Referral).order_by(Referral.created_at.desc()).limit(5).all()
    recent_payouts = db.query(Payout).filter(Payout.status == PayoutStatus.paid).order_by(Payout.processed_at.desc()).limit(5).all()

    # Resolve ambassador names once so the feed reads "by <name>", never "user ID: <uuid>".
    _actor_ids = {r.referrer_id for r in recent_referrals} | {p.user_id for p in recent_payouts}
    _names = (
        {u.id: u.full_name for u in db.query(User).filter(User.id.in_(_actor_ids)).all()}
        if _actor_ids else {}
    )

    # Plain-language headline per status — the person + what happened, no status codes.
    def _headline(status, lead_name):
        name = lead_name or "A lead"
        return {
            ReferralStatus.submitted: f"{name} was referred",
            ReferralStatus.validated: f"{name} qualified",
            ReferralStatus.application_submitted: f"{name}'s application submitted",
            ReferralStatus.offer_made: f"{name} received an offer",
            ReferralStatus.enrolled_home: f"{name} enrolled",
            ReferralStatus.enrolled_international: f"{name} enrolled",
            ReferralStatus.rejected: f"{name} was not qualified",
        }.get(status, f"{name} was updated")

    lead_reward_amount = float(Decimal(str(settings.LEAD_REWARD_AMOUNT)))
    enrolment_reward_amount = float(Decimal(str(settings.ENROLMENT_REWARD_AMOUNT)))
    activities = []
    for r in recent_referrals:
        # A qualified/validated lead whose reward hasn't been paid is actionable:
        # the admin can approve payment right from the activity feed.
        awaiting_reward = (
            r.status in (
                ReferralStatus.validated,
                ReferralStatus.application_submitted,
                ReferralStatus.offer_made,
            )
            and not r.lead_reward_paid
        )
        # ৳500 enrolment reward — the CRM shows the student enrolled and it hasn't
        # been paid/denied. Takes priority in the feed over the ৳10 lead reward.
        is_enrolled = _application_shows_enrolled(r)
        enrolment_awaiting_reward = is_enrolled and not r.enrolment_reward_paid and not r.enrolment_reward_denied
        referrer = _names.get(r.referrer_id, "an ambassador")
        title = f"{r.lead_name or 'A lead'} enrolled" if is_enrolled else _headline(r.status, r.lead_name)
        if r.enrolment_reward_paid:
            description = f"Referred by {referrer} · ৳{enrolment_reward_amount:.0f} enrolment paid"
        elif enrolment_awaiting_reward:
            description = f"Referred by {referrer} · ৳{enrolment_reward_amount:.0f} enrolment reward pending"
        elif r.status == ReferralStatus.rejected:
            description = f"Referred by {referrer} · no reward"
        elif r.lead_reward_paid:
            description = f"Referred by {referrer} · ৳{lead_reward_amount:.0f} paid"
        elif awaiting_reward:
            description = f"Referred by {referrer} · ৳{lead_reward_amount:.0f} reward pending"
        else:
            description = f"Referred by {referrer}"
        activities.append({
            "type": "referral",
            "title": title,
            "description": description,
            "time": r.created_at.isoformat() if r.created_at else None,
            "timestamp": r.created_at,
            "referral_id": r.id,
            "source": r.source,
            "status": r.status.value,
            "lead_reward_paid": r.lead_reward_paid,
            "awaiting_reward": awaiting_reward,
            "reward_amount": lead_reward_amount,
            "enrolment_reward_paid": r.enrolment_reward_paid,
            "enrolment_awaiting_reward": enrolment_awaiting_reward,
            "enrolment_reward_amount": enrolment_reward_amount,
            "enrolment_installment_1_paid": r.enrolment_installment_1_paid,
            "enrolment_installment_2_paid": r.enrolment_installment_2_paid,
            "enrolment_installment_amount": float(_enrolment_installment_amount()),
        })

    for p in recent_payouts:
        payee = _names.get(p.user_id, "an ambassador")
        activities.append({
            "type": "payout",
            "title": f"৳{float(p.amount):.2f} paid out",
            "description": f"Withdrawn by {payee}",
            "time": p.processed_at.isoformat() if p.processed_at else None,
            "timestamp": p.processed_at
        })
        
    activities.sort(key=lambda x: x["timestamp"] if x["timestamp"] else datetime.datetime.min, reverse=True)
    
    # Only rank ambassadors who have actually earned — keeps the board clean until
    # rewards start flowing (placeholder/newly-created ambassadors sit at ৳0).
    top_ambassadors = db.query(User).filter(
        User.role == UserRole.student,
        User.total_earned > 0,
    ).order_by(User.total_earned.desc()).limit(5).all()
    top_ambassadors_list = []
    for amb in top_ambassadors:
        top_ambassadors_list.append({
            "full_name": amb.full_name,
            "email": amb.email,
            "total_earned": float(amb.total_earned),
            "tier": amb.tier.value,
            "wallet_balance": float(amb.wallet_balance)
        })
        
    return {
        "total_referrals": total_referrals,
        "referrals_this_week": referrals_this_week,
        "payouts_this_month": float(payouts_this_month),
        "new_ambassadors": new_ambassadors,
        "total_ambassadors": total_ambassadors,
        "total_qualified": total_qualified,
        "total_not_qualified": total_not_qualified,
        "total_enrolled": total_enrolled,
        "total_applications": total_applications,
        "pending_rewards_count": pending_rewards_count,
        "pending_rewards_amount": pending_rewards_amount,
        "pending_enrolment_rewards_count": pending_enrolment_rewards_count,
        "pending_enrolment_rewards_amount": pending_enrolment_rewards_amount,
        "pending_payouts_count": pending_payouts_count,
        "pending_payouts_amount": pending_payouts_amount,
        "wallet_liability": wallet_liability,
        "recent_activity": activities[:10],
        "top_ambassadors": top_ambassadors_list
    }


# --- Admin monitoring aggregations (live, no caching) ---

_QUALIFIED_STATUSES = [
    ReferralStatus.validated,
    ReferralStatus.application_submitted,
    ReferralStatus.offer_made,
    ReferralStatus.enrolled_home,
    ReferralStatus.enrolled_international,
]
_ENROLLED_STATUSES = [ReferralStatus.enrolled_home, ReferralStatus.enrolled_international]


def get_admin_leads(db: Session, skip: int = 0, limit: int = 2000):
    """Every referral lead enriched with who referred it and that ambassador's
    routed CRM counsellor. Powers the admin Leads table."""
    rows = (
        db.query(Referral)
        .order_by(Referral.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    lead_reward_amount = float(Decimal(str(settings.LEAD_REWARD_AMOUNT)))
    enrolment_reward_amount = float(Decimal(str(settings.ENROLMENT_REWARD_AMOUNT)))
    out = []
    for r in rows:
        amb = r.referrer
        is_qualified = r.status in _QUALIFIED_STATUSES
        is_enrolled = _application_shows_enrolled(r)
        out.append({
            "id": r.id,
            "lead_name": r.lead_name,
            "lead_email": r.lead_email,
            "lead_phone": r.lead_phone,
            "education_interest": r.education_interest,
            "status": r.status.value,
            "rejection_reason": r.rejection_reason,
            # Refer & Earn: exact CRM lead status + last change reason (display mirror).
            "crm_lead_status": r.crm_lead_status,
            "status_reason": r.status_reason,
            "lead_reward_paid": r.lead_reward_paid,
            "enrolment_reward_paid": r.enrolment_reward_paid,
            "enrolment_reward_denied": r.enrolment_reward_denied,
            # ৳500 enrolment reward: awaiting admin approval when the CRM shows the
            # student enrolled and it hasn't been paid or denied yet.
            "enrolment_awaiting_reward": is_enrolled and not r.enrolment_reward_paid and not r.enrolment_reward_denied,
            "enrolment_reward_amount": enrolment_reward_amount,
            # Two-installment enrolment reward (each ৳250): the admin approves them one
            # at a time as the university pays BHE Uni.
            "enrolment_installment_1_paid": r.enrolment_installment_1_paid,
            "enrolment_installment_2_paid": r.enrolment_installment_2_paid,
            "enrolment_installment_1_paid_at": r.enrolment_installment_1_paid_at.isoformat() if r.enrolment_installment_1_paid_at else None,
            "enrolment_installment_2_paid_at": r.enrolment_installment_2_paid_at.isoformat() if r.enrolment_installment_2_paid_at else None,
            "enrolment_installment_amount": float(_enrolment_installment_amount()),
            "enrolled_at": r.enrolled_at.isoformat() if r.enrolled_at else None,
            "source": r.source,
            "external_lead_id": r.external_lead_id,
            # Application tracking — raw CRM stage/status verbatim (admin sees the
            # real thing) plus the simplified rollup the ambassador sees.
            "application_stage": r.application_stage,
            "application_status": r.application_status,
            "application_notes": r.application_notes,
            "application_university": r.application_university,
            "application_course": r.application_course,
            "application_intake": r.application_intake,
            "application_campus": r.application_campus,
            "application_branch": r.application_branch,
            "application_status_label": r.application_status_label,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            # Bumped automatically on ANY change to the referral (status, notes,
            # rewards) via the model's onupdate — powers the "Updated on" column.
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            "referrer_id": r.referrer_id,
            "referrer_name": amb.full_name if amb else None,
            "referrer_email": amb.email if amb else None,
            # Prefer the counsellor actually assigned to THIS lead in the CRM; fall
            # back to the ambassador's own signup counsellor only when the lead has
            # none. Fixes leads showing "Unassigned" when the ambassador picked no
            # counsellor but the CRM routed one to the individual lead.
            "counsellor_id": r.crm_counsellor_id or (amb.counsellor_id if amb else None),
            "counsellor_name": r.crm_counsellor_name or (amb.counsellor_name if amb and amb.counsellor_name else None),
            "awaiting_reward": is_qualified and not r.lead_reward_paid,
            "reward_amount": lead_reward_amount,
        })
    return out


def get_admin_ambassadors(db: Session, counsellor_id: str = None):
    """All ambassadors with live per-ambassador lead counts, earnings and payout readiness.

    When counsellor_id is given, restrict to ambassadors routed to that counsellor
    (used by the CRM 'View Ambassadors' tab so a counsellor sees only their own).
    Default None = every ambassador, unchanged (admin dashboard behaviour)."""
    q = db.query(User).filter(User.role == UserRole.student)
    if counsellor_id:
        q = q.filter(User.counsellor_id == counsellor_id)
    users = q.order_by(User.total_earned.desc(), User.created_at.desc()).all()
    out = []
    for u in users:
        refs = db.query(Referral).filter(Referral.referrer_id == u.id).all()
        total_leads = len(refs)
        qualified = sum(1 for r in refs if r.status in _QUALIFIED_STATUSES)
        not_qualified = sum(1 for r in refs if r.status == ReferralStatus.rejected)
        # Enrolment is tracked on the synced CRM application fields, NOT the referral
        # status enum (which stays "validated"/Qualified). Use the same helper the
        # ৳500 reward flow uses so the count matches what the ambassador sees.
        enrolled = sum(1 for r in refs if _application_shows_enrolled(r))
        bank = u.bank_details or {}
        out.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "tier": u.tier.value,
            "counsellor_id": u.counsellor_id,
            "counsellor_name": u.counsellor_name,
            "referral_code": u.referral_code,
            "wallet_balance": float(u.wallet_balance),
            "total_earned": float(u.total_earned),
            "total_leads": total_leads,
            "qualified_leads": qualified,
            "not_qualified_leads": not_qualified,
            "enrolled_leads": enrolled,
            "has_bank_details": bool(bank.get("account_number") or bank.get("iban")),
            # Full bank details so the admin can actually pay the ambassador
            # (reveal-on-click in the UI). Admin-only endpoint. None when unset.
            "bank_details": mask_bank(u.bank_details),
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })
    return out


def get_counsellor_breakdown(db: Session):
    """Which CRM counsellor each ambassador's leads route to, with live lead totals.
    Seeded from every assigned ambassador so counsellors with 0 leads still show,
    plus an 'Unassigned' bucket."""
    UNASSIGNED = "__unassigned__"
    buckets = {}

    def bucket(cid, cname):
        key = cid or UNASSIGNED
        if key not in buckets:
            buckets[key] = {
                "counsellor_id": cid,
                "counsellor_name": cname if cid else "Unassigned",
                "ambassadors": set(),
                "total_leads": 0,
                "qualified_leads": 0,
                "not_qualified_leads": 0,
                "enrolled_leads": 0,
            }
        # keep a real name if we learn one later
        if cid and cname and buckets[key]["counsellor_name"] in (None, cid):
            buckets[key]["counsellor_name"] = cname
        return buckets[key]

    # Seed from all ambassadors so assignment is visible even before any leads.
    for u in db.query(User).filter(User.role == UserRole.student).all():
        b = bucket(u.counsellor_id, u.counsellor_name)
        b["ambassadors"].add(u.id)

    # Fold in live lead counts, attributed to each lead's EFFECTIVE counsellor:
    # the CRM-assigned counsellor when the lead has one, else the ambassador's
    # chosen routing counsellor. Mirrors the per-lead counsellor shown on the
    # Leads tab (get_admin_leads) so the two views stay consistent — a lead a
    # CRM counsellor picked up no longer hides under "Unassigned".
    for r in db.query(Referral).all():
        amb = r.referrer
        cid = r.crm_counsellor_id or (amb.counsellor_id if amb else None)
        cname = r.crm_counsellor_name or (amb.counsellor_name if amb else None)
        b = bucket(cid, cname)
        if amb:
            b["ambassadors"].add(amb.id)
        b["total_leads"] += 1
        if r.status in _QUALIFIED_STATUSES:
            b["qualified_leads"] += 1
        if r.status == ReferralStatus.rejected:
            b["not_qualified_leads"] += 1
        if _application_shows_enrolled(r):
            b["enrolled_leads"] += 1

    out = []
    for b in buckets.values():
        out.append({
            "counsellor_id": b["counsellor_id"],
            "counsellor_name": b["counsellor_name"] or (b["counsellor_id"] or "Unassigned"),
            "ambassador_count": len(b["ambassadors"]),
            "total_leads": b["total_leads"],
            "qualified_leads": b["qualified_leads"],
            "not_qualified_leads": b["not_qualified_leads"],
            "enrolled_leads": b["enrolled_leads"],
        })
    out.sort(key=lambda x: (x["total_leads"], x["ambassador_count"]), reverse=True)
    return out


def cleanup_expired_leads(db: Session):
    import datetime
    now = datetime.datetime.utcnow()
    
    # 1. Submitted > 7 days -> Auto-reject
    submitted_expiry = now - datetime.timedelta(days=7)
    expired_submitted = db.query(Referral).filter(
        Referral.status == ReferralStatus.submitted,
        Referral.created_at <= submitted_expiry
    ).all()
    for ref in expired_submitted:
        ref.status = ReferralStatus.rejected
        # We can store notes if needed, let's append to a notes string or just set the status.
        # Since Referral doesn't have a notes field, wait...
        # Let's check Referral fields in models.py: it does NOT have a notes field.
        # So we just update status to rejected.
        db.add(ref)
        
    # 2. Contacted (validated) > 30 days -> Move to Dormant/Rejected
    validated_expiry = now - datetime.timedelta(days=30)
    expired_validated = db.query(Referral).filter(
        Referral.status == ReferralStatus.validated,
        Referral.updated_at <= validated_expiry
    ).all()
    for ref in expired_validated:
        ref.status = ReferralStatus.rejected
        db.add(ref)
        
    # 3. Application Started (application_submitted) > 90 days -> Close
    app_expiry = now - datetime.timedelta(days=90)
    expired_apps = db.query(Referral).filter(
        Referral.status == ReferralStatus.application_submitted,
        Referral.updated_at <= app_expiry
    ).all()
    for ref in expired_apps:
        ref.status = ReferralStatus.rejected
        db.add(ref)
        
    # 4. Offer Issued (offer_made) > 60 days -> Expire
    offer_expiry = now - datetime.timedelta(days=60)
    expired_offers = db.query(Referral).filter(
        Referral.status == ReferralStatus.offer_made,
        Referral.updated_at <= offer_expiry
    ).all()
    for ref in expired_offers:
        ref.status = ReferralStatus.rejected
        db.add(ref)
        
    db.commit()
    return {
        "expired_submitted": len(expired_submitted),
        "expired_validated": len(expired_validated),
        "expired_applications": len(expired_apps),
        "expired_offers": len(expired_offers)
    }


def apply_enrolment_clawback(db: Session, referral_id: str, admin_id: str):
    db_referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not db_referral:
        raise HTTPException(status_code=404, detail="Referral not found")
        
    # Reversible only if at least one installment was actually disbursed.
    if not (db_referral.enrolment_installment_1_paid or db_referral.enrolment_installment_2_paid):
        raise HTTPException(status_code=400, detail="Enrolment reward has not been paid for this referral")

    # Verify if it was enrolled within the 14 days statutory cooling-off period
    import datetime
    now = datetime.datetime.utcnow()
    # We use updated_at as the enrolment date since it was updated when status was set to enrolled
    enrolment_date = db_referral.updated_at
    if enrolment_date and (now - enrolment_date).days > 14:
        raise HTTPException(status_code=400, detail="Cannot apply clawback after 14 days of enrolment")
        
    user = db.query(User).filter(User.id == db_referral.referrer_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Referrer student not found")
        
    # Reverse exactly what was disbursed: the enrolment installments actually paid.
    per = _enrolment_installment_amount()
    reward_to_reverse = Decimal("0.00")
    if db_referral.enrolment_installment_1_paid:
        reward_to_reverse += per
    if db_referral.enrolment_installment_2_paid:
        reward_to_reverse += per

    # Debit the user wallet and total_earned
    user.wallet_balance -= reward_to_reverse
    user.total_earned -= reward_to_reverse
    db_referral.enrolment_reward_paid = False
    db_referral.enrolment_installment_1_paid = False
    db_referral.enrolment_installment_2_paid = False
    db_referral.enrolment_installment_1_paid_at = None
    db_referral.enrolment_installment_2_paid_at = None
    db_referral.status = ReferralStatus.rejected  # Reverse status to rejected/clawed back
    db_referral.verified_by = admin_id
    
    tx = Transaction(
        user_id=user.id,
        type=TransactionType.debit,
        amount=reward_to_reverse,
        category=TransactionCategory.enrolment_reward,
        reference_id=db_referral.id,
        description=f"Clawback: Enrolment reward reversed for {db_referral.lead_name} (withdrew within 14 days)."
    )
    db.add(tx)
    db.add(user)
    db.add(db_referral)
    db.commit()
    db.refresh(db_referral)
    
    # Recalculate tier
    update_user_tier(db, user)
    
    return db_referral




def reveal_bank_details(db: Session, target_type: str, target_id: str, admin, ip=None):
    """Return the FULL bank details for a user or payout and write an audit-log entry.
    Admin-only (enforced at the route)."""
    from app.models import AuditLog
    import uuid as _uuid
    if target_type == "user":
        obj = db.query(User).filter(User.id == target_id).first()
    elif target_type == "payout":
        obj = db.query(Payout).filter(Payout.id == target_id).first()
    else:
        obj = None
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    log = AuditLog(
        id=str(_uuid.uuid4()),
        admin_id=getattr(admin, "id", None),
        admin_email=getattr(admin, "email", None),
        action="reveal_bank_details",
        target_type=target_type,
        target_id=str(target_id),
        ip=ip,
    )
    db.add(log)
    db.commit()
    return {"bank_details": obj.bank_details or None}


def get_crm_ambassador_leads(db: Session, ambassador_id: str):
    """Every lead an ambassador has ever submitted, for the CRM's read-only
    "My Ambassadors" lead modal.

    WHY THIS EXISTS: the CRM cannot answer this question from its own data. Leads
    arriving from the affiliate app are written with referral_leads.referrer_id =
    NULL (AffiliateLeadReceiverController.php), deliberately, because the affiliate
    app owns the ambassador-to-lead attribution. So the CRM asks us who the leads
    are, then enriches each one with its own assignment history.

    Returns EVERY referral including rejected ones: a counsellor needs the true
    picture of an ambassador's output, not a filtered one.

    Deliberately EXCLUDES every reward and money field (lead_reward_paid,
    enrolment_* , amounts). Counsellors see lead progress, never ambassador
    earnings. This mirrors _CRM_AMBASSADOR_FIELDS, which excludes bank details for
    the same reason.
    """
    rows = (
        db.query(Referral)
        .filter(Referral.referrer_id == ambassador_id)
        .order_by(Referral.created_at.desc())
        .all()
    )

    def iso(dt):
        return dt.isoformat() if dt else None

    return [
        {
            "id": r.id,
            # The CRM lead id. The CRM joins on this to add assign_date and the
            # lead_assignment_histories trail. Null when the lead never reached
            # the CRM (e.g. still queued), and the CRM must tolerate that.
            "external_lead_id": r.external_lead_id,
            "lead_name": r.lead_name,
            "lead_email": r.lead_email,
            "lead_phone": r.lead_phone,
            "education_interest": r.education_interest,
            # crm_lead_status is the counsellor's own verbatim status (New, In
            # Progress, International, Qualified, ...). `status` is our internal
            # funnel value and is only a fallback for leads the CRM has not yet
            # reported a status for, matching how the ambassador portal renders it.
            "crm_lead_status": r.crm_lead_status,
            "status": r.status.value if r.status else None,
            "status_reason": r.status_reason,
            "rejection_reason": r.rejection_reason,
            # Who WE think owns it. The CRM's own leads.counselor_id is the source
            # of truth; this is here so a mismatch is visible rather than hidden.
            "crm_counsellor_id": r.crm_counsellor_id,
            "crm_counsellor_name": r.crm_counsellor_name,
            "created_at": iso(r.created_at),
            "updated_at": iso(r.updated_at),
        }
        for r in rows
    ]
