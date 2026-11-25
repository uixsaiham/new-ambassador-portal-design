from fastapi import APIRouter, Depends, status, Request, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.core.database import get_db
from app import crud, models, schemas, invoices
from app.api.auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"])

# All routes in this router require admin validation
@router.get("/referrals", response_model=List[schemas.ReferralResponse])
def read_referrals(
    skip: int = 0,
    limit: int = 100,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return crud.get_all_referrals(db, skip=skip, limit=limit)


@router.get("/consents/{user_id}", response_model=schemas.ConsentProof)
def get_consent_proof(
    user_id: str,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Legal proof for one ambassador: every Rewards T&C / Privacy Policy acceptance
    (version, timestamp, IP, user-agent, content hash) PLUS the exact archived
    document(s) they accepted, so the wording can be reproduced verbatim and the
    hash verified against it."""
    proof = crud.get_consent_proof(db, user_id)
    if not proof:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ambassador not found")
    user = proof["user"]
    return schemas.ConsentProof(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        consents=[schemas.ConsentRecord.model_validate(c) for c in proof["consents"]],
        documents=[schemas.PolicyDocumentResponse.model_validate(d) for d in proof["documents"]],
    )


@router.put("/referrals/{referral_id}/status", response_model=schemas.ReferralResponse)
def update_referral(
    referral_id: str,
    status_update: schemas.ReferralUpdateStatus,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return crud.update_referral_status(db, referral_id=referral_id, new_status=status_update.status, admin_id=current_admin.id)


@router.post("/referrals/{referral_id}/pay-lead-reward", response_model=schemas.ReferralResponse)
def pay_lead_reward(
    referral_id: str,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Manual approval: credit the ambassador for a qualified/validated lead
    (typically one that arrived from the CRM). Idempotent — 400 if already paid."""
    return crud.pay_lead_reward(db, referral_id=referral_id, admin_id=current_admin.id)


@router.post("/referrals/{referral_id}/deny-lead-reward", response_model=schemas.ReferralResponse)
def deny_lead_reward(
    referral_id: str,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Manual denial: reject a qualified lead so no reward is paid. 400 if already paid."""
    return crud.deny_lead_reward(db, referral_id=referral_id, admin_id=current_admin.id)


@router.post("/referrals/{referral_id}/pay-enrolment-installment/{installment}", response_model=schemas.ReferralResponse)
def pay_enrolment_installment(
    referral_id: str,
    installment: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approve ONE half (৳250) of the enrolment reward as the university pays BHE Uni
    in stages. installment = 1 or 2; installment 1 must be approved before 2.
    Idempotent per installment — 400 if that installment is already paid or the lead
    has not enrolled."""
    return crud.pay_enrolment_installment(db, referral_id=referral_id, installment=installment, admin_id=current_admin.id)


@router.post("/referrals/{referral_id}/pay-enrolment-reward", response_model=schemas.ReferralResponse)
def pay_enrolment_reward(
    referral_id: str,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Legacy full approval: pay BOTH ৳250 installments at once. Kept for backward
    compatibility; the admin UI uses the per-installment endpoint. Idempotent."""
    return crud.pay_enrolment_reward(db, referral_id=referral_id, admin_id=current_admin.id)


@router.post("/referrals/{referral_id}/deny-enrolment-reward", response_model=schemas.ReferralResponse)
def deny_enrolment_reward(
    referral_id: str,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Manual denial: decline the ৳500 enrolment reward. 400 if already paid."""
    return crud.deny_enrolment_reward(db, referral_id=referral_id, admin_id=current_admin.id)


@router.get("/payouts", response_model=List[schemas.PayoutResponse])
def read_payouts(
    skip: int = 0,
    limit: int = 100,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return crud.get_all_payouts(db, skip=skip, limit=limit)


@router.put("/payouts/{payout_id}/status", response_model=schemas.PayoutResponse)
def update_payout(
    payout_id: str,
    status_update: schemas.PayoutUpdateStatus,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return crud.update_payout_status(
        db,
        payout_id=payout_id,
        new_status=status_update.status,
        admin_id=current_admin.id,
        payment_reference=status_update.payment_reference,
        status_note=status_update.status_note,
    )


# --- Payout remittance-advice PDFs (accountant documents) ---
# NOTE: the static ".zip" route is declared BEFORE the "{payout_id}/invoice" route.
# The paths differ in segment count so they never actually collide, but keeping the
# specific one first is the safe FastAPI convention.
@router.get("/payouts/invoices.zip")
def download_all_payout_invoices(
    method: Optional[str] = None,
    since: Optional[str] = None,
    until: Optional[str] = None,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Zip of remittance-advice PDFs for every PAID payout (one PDF each, same fixed
    template as the per-row download). Optional filters: method=gift_card|bank_transfer
    and a since/until date range (YYYY-MM-DD) on the paid date, so an accountant can
    pull a single accounting period."""
    q = db.query(models.Payout).filter(models.Payout.status == models.PayoutStatus.paid)
    if method in ("gift_card", "bank_transfer"):
        q = q.filter(models.Payout.payment_method == models.PayoutMethod(method))
    payouts = q.all()

    def _paid_date(p):
        return p.processed_at or p.created_at

    def _in_range(p):
        d = _paid_date(p)
        if not d:
            return True
        ds = d.date() if hasattr(d, "date") else d
        for bound, op in ((since, "lo"), (until, "hi")):
            if not bound:
                continue
            try:
                b = datetime.strptime(bound, "%Y-%m-%d").date()
            except ValueError:
                continue
            if op == "lo" and ds < b:
                return False
            if op == "hi" and ds > b:
                return False
        return True

    payouts = [p for p in payouts if _in_range(p)]
    payouts.sort(key=lambda p: _paid_date(p) or datetime.min, reverse=True)

    ids = {p.user_id for p in payouts}
    users = {u.id: u for u in db.query(models.User).filter(models.User.id.in_(ids)).all()} if ids else {}
    items = [(p, users.get(p.user_id)) for p in payouts]

    data = invoices.build_zip(items)
    fname = f"bhe-remittances-{date.today().strftime('%Y%m%d')}.zip"
    return Response(
        content=data,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )


@router.get("/payouts/{payout_id}/invoice")
def download_payout_invoice(
    payout_id: str,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Remittance-advice PDF for one PAID payout."""
    payout = db.query(models.Payout).filter(models.Payout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payout not found")
    if payout.status != models.PayoutStatus.paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A remittance advice is only available for a paid payout.",
        )
    user = crud.get_user(db, payout.user_id)
    pdf = invoices.build_remittance_pdf(payout, user)
    fname = invoices.doc_filename(payout, user)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )


@router.get("/users", response_model=List[schemas.UserResponse])
def read_users(
    skip: int = 0,
    limit: int = 100,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return crud.get_users(db, skip=skip, limit=limit)


@router.get("/stats")
def read_admin_stats(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return crud.get_admin_dashboard_stats(db)


@router.get("/leads")
def read_admin_leads(
    skip: int = 0,
    limit: int = 2000,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Every lead enriched with the referring ambassador + their routed counsellor."""
    return crud.get_admin_leads(db, skip=skip, limit=limit)


@router.get("/ambassadors")
def read_admin_ambassadors(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """All ambassadors with live lead counts, earnings and payout readiness."""
    return crud.get_admin_ambassadors(db)


@router.get("/counsellors-breakdown")
def read_counsellor_breakdown(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Live breakdown of leads grouped by the counsellor each ambassador routes to."""
    return crud.get_counsellor_breakdown(db)


@router.post("/leads/cleanup")
def cleanup_leads(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Runs lead expiry rules per business spec:
    - Submitted > 7 days → auto-rejected
    - Contacted/Validated > 30 days → rejected
    - Application Started > 90 days → closed
    - Offer Issued > 60 days → expired
    """
    return crud.cleanup_expired_leads(db)


@router.post("/referrals/{referral_id}/clawback", response_model=schemas.ReferralResponse)
def apply_clawback(
    referral_id: str,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Reverses enrolment reward if referred student withdraws within 14-day cooling-off period.
    Lead reward (৳5) remains with the ambassador per business policy.
    """
    return crud.apply_enrolment_clawback(db, referral_id=referral_id, admin_id=current_admin.id)

@router.put("/users/{user_id}/tier", response_model=schemas.UserResponse)
def set_user_tier(
    user_id: str,
    tier_update: schemas.TierUpdate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Manually override an ambassador's tier. Bypasses the automatic lead-count
    calculation and persists the change immediately to the database.
    An audit transaction is recorded for traceability.
    """
    return crud.set_user_tier_manually(
        db,
        user_id=user_id,
        new_tier=tier_update.tier,
        admin_id=current_admin.id,
        note=tier_update.note
    )


@router.put("/ambassadors/{user_id}/counsellor", response_model=schemas.UserResponse)
def assign_ambassador_counsellor(
    user_id: str,
    body: schemas.CounsellorAssign,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Assign a routed counsellor to an ambassador (used from the admin Ambassadors
    table for those who signed up without one). Sets the default for their FUTURE
    referrals; existing CRM leads are unaffected."""
    return crud.assign_ambassador_counsellor(
        db,
        user_id=user_id,
        counsellor_id=body.counsellor_id,
        counsellor_name=body.counsellor_name,
    )


@router.get("/counsellors/reassign-candidates", response_model=List[schemas.CounsellorReassignCandidate])
def counsellor_reassign_candidates(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Counsellors who currently hold reassignable referral leads (+ counts): the
    'leaving counsellor' options for the bulk-reassign modal."""
    return crud.get_counsellor_reassign_candidates(db)


@router.get("/counsellors/{counsellor_id}/referral-leads", response_model=List[schemas.CounsellorLeadRow])
def counsellor_referral_leads(
    counsellor_id: str,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """A counsellor's reassignable referral leads (new, in progress and enrolled):
    the checklist shown when reassigning their leads to someone else."""
    leads = crud.get_counsellor_referral_leads(db, counsellor_id)
    return [
        schemas.CounsellorLeadRow(
            referral_id=r.id,
            lead_name=r.lead_name,
            status=(r.status.value if hasattr(r.status, "value") else str(r.status)),
            crm_lead_status=r.crm_lead_status,
            ambassador_name=(r.referrer.full_name if r.referrer else None),
            application_stage=r.application_stage,
            application_status=r.application_status,
            application_status_label=r.application_status_label,
        )
        for r in leads
    ]


@router.post("/counsellors/reassign-leads", response_model=schemas.CounsellorReassignResult)
def reassign_counsellor_leads(
    body: schemas.CounsellorReassignRequest,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Bulk-move a departing counsellor's active referral leads to a replacement
    (overwrites in the CRM, but only leads still held by the leaver). Optionally
    re-points ambassadors whose default counsellor was the leaver."""
    return crud.reassign_counsellor_leads(
        db,
        from_counsellor_id=body.from_counsellor_id,
        to_counsellor_id=body.to_counsellor_id,
        referral_ids=body.referral_ids,
        repoint_ambassadors=body.repoint_ambassadors,
        admin=current_admin,
    )


@router.get("/counsellor-changes", response_model=List[schemas.CounsellorChangeLogRow])
def counsellor_change_log(
    counsellor_id: str = None,
    limit: int = 200,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """The bulk-reassignment handoff history for the admin panel (most recent first).
    Optional ?counsellor_id= narrows to handoffs that touched that counsellor as
    either the leaver or the replacement."""
    return crud.get_counsellor_change_log(db, counsellor_id=counsellor_id, limit=limit)

# --- Tier Config Endpoints ---

@router.get("/tier-configs", response_model=list[schemas.TierConfigResponse])
def get_tier_configs(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Return all configurable tier parameters (leads required + bonus amounts)."""
    return crud.get_tier_configs(db)


@router.put("/tier-configs/{tier}", response_model=schemas.TierConfigResponse)
def update_tier_config(
    tier: models.AmbassadorTier,
    update: schemas.TierConfigUpdate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update the leads threshold and bonus amount for a specific tier.
    Ambassador tier status is recalculated automatically when leads are validated.
    """
    from decimal import Decimal
    return crud.update_tier_config(
        db,
        tier=tier,
        leads_required=update.leads_required,
        bonus_amount=Decimal(str(update.bonus_amount)),
        admin_id=current_admin.id
    )



@router.get("/ambassadors/{user_id}/bank-details")
def reveal_ambassador_bank_details(
    user_id: str,
    request: Request,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Reveal an ambassador's FULL bank details (masked by default in the list),
    recording an audit-log entry for every reveal. Admin-only."""
    xff = request.headers.get("x-forwarded-for")
    ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else None)
    return crud.reveal_bank_details(db, "user", user_id, current_admin, ip)
