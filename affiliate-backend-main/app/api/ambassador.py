from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app import crud, models, schemas
from app.api.auth import get_current_user

router = APIRouter(prefix="/ambassador", tags=["ambassador"])

@router.get("/stats", response_model=schemas.AmbassadorStats)
def get_stats(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_ambassador_dashboard_stats(db, user_id=current_user.id)


@router.post("/referrals", response_model=schemas.ReferralResponse, status_code=status.HTTP_201_CREATED)
def submit_referral(
    referral_in: schemas.ReferralCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # GDPR: an ambassador is sharing a third party's personal data — they must
    # confirm they have that person's permission before we accept the referral.
    if not referral_in.referrer_consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please confirm you have this person's permission to share their details.",
        )
    return crud.create_referral(db, referral=referral_in, referrer_id=current_user.id)


@router.get("/referrals", response_model=List[schemas.ReferralResponse])
def get_user_referrals(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_referrals_by_user(db, user_id=current_user.id)


@router.post("/payouts", response_model=schemas.PayoutResponse, status_code=status.HTTP_201_CREATED)
def request_payout(
    payout_in: schemas.PayoutCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from sqlalchemy.exc import IntegrityError
    try:
        return crud.create_payout_request(db, payout=payout_in, user_id=current_user.id)
    except IntegrityError:
        db.rollback()
        if payout_in.request_key:
            existing = db.query(models.Payout).filter(models.Payout.request_key == payout_in.request_key, models.Payout.user_id == current_user.id).first()
            if existing and existing.amount == payout_in.amount and existing.payment_method == payout_in.payment_method:
                return existing
        raise HTTPException(status_code=409, detail="Request could not be saved. Refresh before trying again.")


@router.get("/payouts", response_model=List[schemas.PayoutResponse])
def get_user_payouts(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_payouts_by_user(db, user_id=current_user.id)


@router.get("/transactions", response_model=List[schemas.TransactionResponse])
def get_user_transactions(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_transactions_by_user(db, user_id=current_user.id)


@router.get("/giftcard-brands")
def get_giftcard_brands(current_user: models.User = Depends(get_current_user)):
    """Live gift-card brand catalogue for the wallet picker (cached ~10 min).
    Returns [] if the gift-card provider isn't configured — the wallet then just
    shows the generic gift-card option."""
    from app.integrations.payout_provider import list_giftcard_brands
    return list_giftcard_brands()


@router.get("/payout-accounts")
def payout_accounts(current_user: models.User = Depends(get_current_user)):
    return (current_user.bank_details or {}).get("payout_accounts", [])


@router.post("/payout-accounts", status_code=201)
def save_payout_account(body: schemas.PayoutAccountCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    from uuid import uuid4
    if body.payment_method == models.PayoutMethod.gift_card:
        raise HTTPException(status_code=400, detail="Use bank, bKash or another manual method.")
    if len(body.details) > 12 or any(len(v) > 300 for v in body.details.values()):
        raise HTTPException(status_code=400, detail="Account details are too long.")
    fake = schemas.PayoutCreate(amount=1, payment_method=body.payment_method, bank_details=body.details)
    details = crud.validate_payout_destination(fake, current_user)
    saved = dict(current_user.bank_details or {})
    accounts = list(saved.get("payout_accounts", []))
    if len(accounts) >= 10:
        raise HTTPException(status_code=400, detail="You can save up to 10 payout accounts.")
    account = {"id": str(uuid4()), "payment_method": body.payment_method.value, "details": details}
    accounts.append(account)
    saved["payout_accounts"] = accounts
    current_user.bank_details = saved
    db.commit()
    return account


@router.delete("/payout-accounts/{account_id}", status_code=204)
def remove_payout_account(account_id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    saved = dict(current_user.bank_details or {})
    accounts = saved.get("payout_accounts", [])
    if not any(account["id"] == account_id for account in accounts):
        raise HTTPException(status_code=404, detail="Account not found")
    saved["payout_accounts"] = [a for a in accounts if a["id"] != account_id]
    current_user.bank_details = saved
    db.commit()


@router.post("/payouts/{payout_id}/cancel", response_model=schemas.PayoutResponse)
def cancel_payout(payout_id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    payout = db.query(models.Payout).filter(models.Payout.id == payout_id, models.Payout.user_id == current_user.id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Request not found")
    if payout.status != models.PayoutStatus.pending:
        raise HTTPException(status_code=400, detail="Only requested payouts can be cancelled.")
    return crud.update_payout_status(db, payout.id, models.PayoutStatus.cancelled, current_user.id, status_note="Cancelled by ambassador")


@router.get("/payouts/{payout_id}/receipt")
def payout_receipt(payout_id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    from fastapi.responses import Response
    from app.invoices import build_remittance_pdf, doc_filename
    payout = db.query(models.Payout).filter(models.Payout.id == payout_id, models.Payout.user_id == current_user.id).first()
    if not payout or payout.status != models.PayoutStatus.paid:
        raise HTTPException(status_code=404, detail="Paid payout not found")
    return Response(content=build_remittance_pdf(payout, current_user), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{doc_filename(payout, current_user)}"'})
