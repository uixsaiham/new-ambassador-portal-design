"""Repeatable local preview data; enabled only by LOCAL_SIGNUP_TEST_MODE."""
from datetime import datetime, timedelta
from decimal import Decimal
from app import models
from app.core.config import settings


def seed_demo_for_user(db, user):
    if not settings.LOCAL_SIGNUP_TEST_MODE or user.role != models.UserRole.student:
        return
    marker = f"local-demo-v1:{user.id}"
    if db.query(models.Transaction).filter_by(user_id=user.id, reference_id=marker).first():
        return
    now = datetime.utcnow()
    names = ["Raful Islam", "Tasnia Rahman", "Mehedi Hasan", "Sadia Akter", "Farhan Kabir", "Jannatul Ferdous", "Arif Hossain", "Nabila Ahmed", "Rafi Hasan", "Samiha Islam", "Tanvir Rahman", "Fahim Ahmed"]
    courses = ["BBA · University of Dhaka", "MSc Finance · North South University", "BSc Computer Science · BRAC University", "MBA · Jahangirnagar University"]
    stages = [models.ReferralStatus.application_submitted, models.ReferralStatus.offer_made, models.ReferralStatus.validated, models.ReferralStatus.enrolled_home, models.ReferralStatus.submitted, models.ReferralStatus.rejected]
    had_referrals = db.query(models.Referral).filter_by(referrer_id=user.id).first() is not None
    for index, name in enumerate(names):
        status = stages[index % len(stages)]
        enrolled = status == models.ReferralStatus.enrolled_home
        db.add(models.Referral(referrer_id=user.id, lead_name=name, lead_email=f"preview.student{index+1}@example.com", lead_phone=f"0170000{index+1:04d}", education_interest=courses[index % 4], status=status, lead_reward_paid=status not in (models.ReferralStatus.submitted, models.ReferralStatus.rejected), enrolment_reward_paid=enrolled, application_university=courses[index % 4].split(" · ")[1], enrolled_at=now-timedelta(days=120) if enrolled else None, rejection_reason="Test example: entry requirements not met." if status == models.ReferralStatus.rejected else None, created_at=now-timedelta(days=index*2), updated_at=now-timedelta(hours=index*3)))
    # Six months of earnings: 300, 600, 600, 900, 900, 300.
    for offset, amount in enumerate([300, 600, 600, 900, 900, 300]):
        absolute_month = now.year * 12 + now.month - 1 - (5-offset)
        year, month = divmod(absolute_month, 12)
        date = datetime(year, month+1, min(now.day, 15), 0, 0)
        db.add(models.Transaction(user_id=user.id, type=models.TransactionType.credit, amount=Decimal(amount), category=models.TransactionCategory.bonus_reward, reference_id=marker if offset == 0 else f"{marker}:{offset}", description="Demo ambassador reward", created_at=date))
    details = {"holder_name":user.full_name, "account_number":"01700000000", "account_type":"personal"}
    for amount, status, days in [(500, models.PayoutStatus.pending, 1), (1000, models.PayoutStatus.paid, 10)]:
        payout = models.Payout(user_id=user.id, amount=Decimal(amount), payment_method=models.PayoutMethod.bkash, status=status, bank_details=details, status_note="Local demo payout", created_at=now-timedelta(days=days), processed_at=now-timedelta(days=days-1) if status == models.PayoutStatus.paid else None)
        db.add(payout)
        db.add(models.Transaction(user_id=user.id, type=models.TransactionType.debit, amount=Decimal(amount), category=models.TransactionCategory.payout_withdrawal, description="Demo payout request", created_at=now-timedelta(days=days)))
    saved = dict(user.bank_details or {})
    if not saved.get("payout_accounts"):
        saved["payout_accounts"] = [{"id":f"demo-bkash-{user.id}","payment_method":"bkash","details":details}]
        user.bank_details = saved
    if not had_referrals:
        user.wallet_balance = Decimal("2100")
        user.total_earned = Decimal("3600")
    user.university = user.university or "University of Dhaka"
    user.department_year = user.department_year or "BBA, 3rd year"
    db.commit()
