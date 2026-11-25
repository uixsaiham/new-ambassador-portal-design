from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app import crud, schemas, models

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/payout-policy")
def payout_policy():
    """Withdrawal limits so the wallet UI reflects the live config, not hardcoded values."""
    return {
        "min_withdrawal": float(settings.MIN_WITHDRAWAL_AMOUNT),               # bank transfer
        "gift_card_min_withdrawal": float(settings.GIFT_CARD_MIN_WITHDRAWAL_AMOUNT),
        "max_withdrawal": float(settings.MAX_WITHDRAWAL_AMOUNT),
        "enrolment_reward": float(settings.ENROLMENT_REWARD_AMOUNT),
    }


@router.get("/referral/{code}", response_model=schemas.PublicReferrerInfo)
def resolve_referrer(code: str, db: Session = Depends(get_db)):
    """Resolve a referral code → ambassador, so the public landing page can greet
    the visitor (and 404 an invalid link)."""
    amb = crud.get_user_by_referral_code(db, code)
    if not amb or amb.role != models.UserRole.student:
        raise HTTPException(status_code=404, detail="Referral link not found")
    return schemas.PublicReferrerInfo(
        referral_code=amb.referral_code,
        referrer_name=amb.full_name,
        counsellor_id=getattr(amb, "counsellor_id", None),
        counsellor_name=getattr(amb, "counsellor_name", None),
    )


@router.post("/referral/{code}/capture", response_model=schemas.ReferralResponse, status_code=201)
def capture_referral(code: str, body: schemas.PublicReferralCapture, db: Session = Depends(get_db)):
    """Capture a lead from the public landing form → local referral + push to CRM."""
    # GDPR: the person must consent to being contacted before we store their data.
    if not body.lead_consent:
        raise HTTPException(
            status_code=400,
            detail="Please tick the consent box so we can contact you about your application.",
        )
    return crud.capture_public_referral(db, code, body)
