from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app import crud, models, schemas

router = APIRouter(prefix="/integrations", tags=["integrations"])


def verify_service_key(x_crm_service_key: str = Header(default="")):
    """Server-to-server auth for the CRM emitter. A single shared secret; the CRM
    sends it as the X-CRM-Service-Key header. Rejects everything until configured."""
    expected = settings.CRM_SERVICE_KEY
    if not expected or x_crm_service_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing CRM service key",
        )


@router.post(
    "/crm/lead-event",
    response_model=schemas.CrmLeadEventResponse,
    dependencies=[Depends(verify_service_key)],
)
def receive_crm_lead_event(event: schemas.CrmLeadEvent, db: Session = Depends(get_db)):
    """Receive a reward event from the CRM.

    Records the referred lead WITHOUT crediting — the reward is approved manually
    by an admin from the dashboard (pay_lead_reward). Idempotent on external_lead_id.
    See docs/integration/crm-affiliate-contract.md.
    """
    result = crud.ingest_crm_lead_event(db, event)
    referral = result["referral"]
    ambassador = result["ambassador"]
    return schemas.CrmLeadEventResponse(
        status="ok",
        outcome=result["outcome"],
        referral_id=referral.id if referral else None,
        ambassador_id=ambassador.id if ambassador else None,
    )


# Fields safe to expose to the CRM 'View Ambassadors' tab. Deliberately EXCLUDES
# bank_details/has_bank_details — counsellors must never see banking info.
_CRM_AMBASSADOR_FIELDS = (
    "id", "full_name", "email", "phone", "tier",
    "counsellor_id", "counsellor_name", "referral_code",
    "wallet_balance", "total_earned", "total_leads",
    "qualified_leads", "not_qualified_leads", "enrolled_leads", "created_at",
)


@router.get(
    "/crm/ambassadors",
    dependencies=[Depends(verify_service_key)],
)
def crm_list_ambassadors(counsellor_id: str = None, db: Session = Depends(get_db)):
    """Read-only ambassador list for the CRM 'View Ambassadors' tab.

    counsellor_id given → only that counsellor's ambassadors (counsellor view).
    counsellor_id omitted → all ambassadors (admin view, CRM filters client-side).
    Bank details are never included. See docs/integration/crm-affiliate-contract.md.
    """
    rows = crud.get_admin_ambassadors(db, counsellor_id=counsellor_id)
    ambassadors = [{k: r[k] for k in _CRM_AMBASSADOR_FIELDS} for r in rows]
    return {"ok": True, "ambassadors": ambassadors}


@router.get(
    "/crm/ambassadors/{ambassador_id}/leads",
    dependencies=[Depends(verify_service_key)],
)
def crm_ambassador_leads(ambassador_id: str, db: Session = Depends(get_db)):
    """Read-only list of every lead one ambassador has submitted.

    Backs the CRM's "My Ambassadors" lead modal. The CRM calls this because leads
    from the affiliate app are stored there with referral_leads.referrer_id = NULL
    by design, so only this app knows which ambassador a lead belongs to. The CRM
    then joins each external_lead_id to its own leads + lead_assignment_histories
    to show the counsellor handover trail.

    Rewards, balances and bank details are never included; see
    get_crm_ambassador_leads and _CRM_AMBASSADOR_FIELDS for the rationale.
    Returns 404 for an unknown ambassador so the CRM can show a clear message
    rather than an empty modal that looks like "no leads".
    """
    ambassador = crud.get_user(db, ambassador_id)
    if not ambassador or ambassador.role != models.UserRole.student:
        raise HTTPException(status_code=404, detail="Ambassador not found")

    leads = crud.get_crm_ambassador_leads(db, ambassador_id)
    return {
        "ok": True,
        "ambassador": {
            "id": ambassador.id,
            "full_name": ambassador.full_name,
            "referral_code": ambassador.referral_code,
            "counsellor_id": ambassador.counsellor_id,
            "counsellor_name": ambassador.counsellor_name,
        },
        "count": len(leads),
        "leads": leads,
    }
