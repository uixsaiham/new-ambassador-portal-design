import pytest
from app.core import mail


@pytest.mark.parametrize('send,args,path', [
    (mail.send_referral_received_email, ('a@example.com', 'Ambassador', 'Lead'), '/dashboard/referrals'),
    (mail.send_lead_qualified_email, ('a@example.com', 'Ambassador', 'Lead'), '/dashboard/referrals'),
    (mail.send_enrolment_email, ('a@example.com', 'Ambassador', 'Lead'), '/dashboard/referrals'),
    (mail.send_reward_credited_email, ('a@example.com', 'Ambassador', 'Lead', '10'), '/dashboard/wallet'),
    (mail.send_payout_paid_email, ('a@example.com', 'Ambassador', '50'), '/dashboard/wallet'),
    (mail.send_welcome_email, ('a@example.com', 'Ambassador'), '/dashboard'),
])
@pytest.mark.parametrize('base', ['https://ambassador.bheuni.uk', 'https://ambassador.bheuni.uk/'])
def test_email_destination_in_html_and_text(monkeypatch, send, args, path, base):
    sent = []
    monkeypatch.setattr(mail.settings, 'PORTAL_URL', base)
    monkeypatch.setattr(mail, '_send_email', lambda *args, **kwargs: sent.append(args) or True)
    assert send(*args)
    url = 'https://ambassador.bheuni.uk' + path
    assert f'href="{url}"' in sent[0][3]
    assert url + '\n' in sent[0][2]


def test_admin_and_counsellor_destinations_unchanged(monkeypatch):
    sent = []
    monkeypatch.setattr(mail.settings, 'PORTAL_URL', 'https://ambassador.bheuni.uk')
    monkeypatch.setattr(mail.settings, 'CRM_BASE_URL', 'https://crm.example.com')
    monkeypatch.setattr(mail, '_send_email', lambda *args, **kwargs: sent.append(args) or True)
    mail.send_admin_payout_requested_email(['admin@example.com'], 'Ambassador', '50')
    mail.send_counsellor_new_lead_email('c@example.com', 'Counsellor', 'Lead', 'Ambassador')
    assert 'href="https://ambassador.bheuni.uk/admin/payouts"' in sent[0][3]
    assert 'href="https://crm.example.com"' in sent[1][3]


def test_otp_has_no_navigation_link(monkeypatch):
    sent = []
    monkeypatch.setattr(mail, '_send_email', lambda *args, **kwargs: sent.append(args) or True)
    mail.send_otp_email('a@example.com', 'Ambassador', '123456')
    assert '123456' in sent[0][2]
    assert '<a ' not in sent[0][3]
