import json
import smtplib
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
from app.core.config import settings

# Hosted on BHE Uni's own domain (PNG, not SVG — Gmail blocks SVG in email, and
# a remote URL renders inline without the broken-box/attachment behaviour that
# Content-ID inline images cause in Gmail).
LOGO_URL = "https://bheuni.io/front/img/bhe-logo.png"

BRAND_ORANGE = "#F37124"
BRAND_NAVY = "#14296B"
# Counsellor notifications use a distinct teal accent (not the orange ambassador
# palette) so a counsellor can tell at a glance this is an internal routing alert,
# not a reward/marketing email meant for ambassadors.
COUNSELLOR_TEAL = "#0d9488"


def _send_via_mailersend(to_email: str, subject: str, plaintext: str, html: str, *, from_address: str = None) -> bool:
    """Send through the MailerSend transactional API (better deliverability than raw
    O365 SMTP). Returns True on 2xx. Never raises — caller falls back to SMTP."""
    # MailerSend requires the from-address on a MailerSend-verified domain, which
    # may differ from the SMTP mailbox. Use the dedicated override when set.
    from_addr = from_address or settings.MAILERSEND_FROM_ADDRESS or settings.MAIL_FROM_ADDRESS
    payload = {
        "from": {"email": from_addr, "name": settings.MAIL_FROM_NAME},
        "to": [{"email": to_email}],
        "reply_to": {"email": from_addr, "name": settings.MAIL_FROM_NAME},
        "subject": subject,
        "text": plaintext,
        "html": html,
    }
    req = urllib.request.Request(
        "https://api.mailersend.com/v1/email",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.MAILERSEND_API_TOKEN}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            # MailerSend's API is behind Cloudflare, which blocks urllib's default
            # "Python-urllib/x" agent (Cloudflare error 1010). A normal UA is required.
            "User-Agent": "BHE-Uni-Ambassador-Portal/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            ok = 200 <= resp.status < 300
            if ok:
                print(f"[MAIL OK] sent '{subject}' to {to_email} via MailerSend")
            return ok
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "ignore")[:400]
        print(f"[MAIL ERROR] MailerSend {e.code} for {to_email}: {body}")
        return False
    except Exception as e:
        print(f"[MAIL ERROR] MailerSend request failed for {to_email}: {e}")
        return False


def _send_email(to_email: str, subject: str, plaintext: str, html: str, *, from_address: str = None) -> bool:
    """Send one email. Prefers the MailerSend API when configured; otherwise (or on
    API failure) falls back to Office365 SMTP. Best-effort — never raises."""
    # Preferred path: MailerSend transactional API.
    sender = from_address or settings.MAIL_FROM_ADDRESS
    if settings.MAILERSEND_API_TOKEN:
        if _send_via_mailersend(to_email, subject, plaintext, html, from_address=from_address):
            return True
        print(f"[MAIL] MailerSend failed for {to_email} — falling back to SMTP.")

    try:
        msg = MIMEMultipart("alternative")
        from_domain = sender.split("@")[-1] or "bheuni.io"
        msg["From"] = f'"{settings.MAIL_FROM_NAME}" <{sender}>'
        msg["To"] = to_email
        msg["Reply-To"] = sender
        msg["Subject"] = subject
        # Date + Message-ID are expected by spam filters; absence hurts scoring.
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain=from_domain)
        # Gmail/Yahoo/Outlook now penalise automated mail that lacks an unsubscribe
        # affordance — its absence is a real spam signal. A mailto: unsubscribe is
        # valid and satisfies the requirement for these transactional notifications.
        msg["List-Unsubscribe"] = f"<mailto:{sender}?subject=unsubscribe>"
        # Mark as machine-generated (transactional) so filters score it predictably.
        msg["Auto-Submitted"] = "auto-generated"

        # Order matters: plain first, HTML last (clients pick the last they support).
        msg.attach(MIMEText(plaintext, "plain", "utf-8"))
        msg.attach(MIMEText(html, "html", "utf-8"))

        server = smtplib.SMTP(settings.MAIL_HOST, settings.MAIL_PORT, timeout=10)
        if settings.MAIL_ENCRYPTION.lower() == "tls":
            server.starttls()
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        server.sendmail(sender, to_email, msg.as_string())
        server.quit()
        print(f"[MAIL OK] sent '{subject}' to {to_email} via O365 SMTP")
        return True
    except Exception as e:
        print(f"[MAIL ERROR] Failed to send '{subject}' to {to_email}: {str(e)}")
        return False


def _shell(inner_html: str) -> str:
    """Wrap body content in the branded, dark-mode-aware card + logo header/footer."""
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
</head>
<body style="margin:0;padding:0;background:#f4f6fa;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;">
        <tr>
          <td align="center" style="padding:0 0 22px;">
            <img src="{LOGO_URL}" alt="BHE Uni" width="132" style="display:block;height:auto;width:132px;max-width:60%;border:0;">
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border-radius:14px;border:1px solid #e6e9f0;padding:32px 34px;">
            {inner_html}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 20px 0;">
            <p style="font-size:12px;line-height:1.6;margin:0;color:#9aa0ad;">
              BHE Uni Ambassador &amp; Rewards Programme &middot; automated message, please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


# ── OTP (signup / password reset) ──────────────────────────────────────────────

def send_otp_email(to_email: str, full_name: str, otp_code: str, *, purpose: str = "registration") -> bool:
    from html import escape
    action = "reset your password" if purpose == "password_reset" else "verify your email and create your account"
    subject = "Reset your BHE Uni password" if purpose == "password_reset" else "Verify your BHE Uni email address"
    safe_name = escape(full_name)
    inner = f"""
      <p style="font-size:16px;margin:0 0 14px;color:{BRAND_NAVY};font-weight:700;">Hi {safe_name},</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#4b5563;">
        Use this one-time code to {action} with the BHE&nbsp;Uni Ambassador &amp; Rewards Programme.
      </p>
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:1.5px;color:#9aa0ad;font-weight:700;text-align:center;">VERIFICATION CODE</p>
      <p style="margin:0 auto 22px;text-align:center;font-size:40px;font-weight:800;letter-spacing:10px;color:{BRAND_NAVY};white-space:nowrap;">{otp_code}</p>
      <p style="font-size:13px;line-height:1.6;margin:0;color:#6b7280;text-align:center;">
        This code expires in <strong>10 minutes</strong>. If you didn&#39;t request it, you can ignore this email.
      </p>"""
    text = (
        f"Hi {full_name},\n\n"
        f"Use this one-time code to {action} with the "
        "BHE Uni Ambassador & Rewards Programme:\n\n"
        f"    {otp_code}\n\n"
        "This code expires in 10 minutes. If you didn't request it, you can "
        "ignore this email.\n"
    )
    return _send_email(to_email, subject, text, _shell(inner), from_address=settings.AUTH_MAIL_FROM_ADDRESS)


# ── Referral notifications ─────────────────────────────────────────────────────

def send_lead_qualified_email(to_email: str, ambassador_name: str, lead_name: str) -> bool:
    """Heads-up: a lead the ambassador referred has been marked Qualified."""
    inner = f"""
      <p style="font-size:16px;margin:0 0 14px;color:{BRAND_NAVY};font-weight:700;">Great news, {ambassador_name}! 🎉</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 6px;color:#4b5563;">
        Your referral <strong>{lead_name}</strong> has just been <strong style="color:{BRAND_ORANGE};">qualified</strong> by a BHE&nbsp;Uni counsellor.
      </p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 4px;color:#4b5563;">
        Your reward is being processed and will land in your wallet once approved. Log in to follow its progress.
      </p>
      {_cta_path("Track my referral", "dashboard/referrals")}"""
    text = (
        f"Great news, {ambassador_name}!\n\n"
        f"Your referral {lead_name} has just been qualified by a BHE Uni counsellor. "
        "Your reward is being processed and will land in your wallet once approved.\n\n"
        f"Track it here: {settings.PORTAL_URL.rstrip('/')}/dashboard/referrals\n"
    )
    return _send_email(to_email, f"Your referral {lead_name} just qualified 🎉", text, _shell(inner))


def send_reward_credited_email(
    to_email: str, ambassador_name: str, lead_name: str, amount: str, reason: str = "qualified referral"
) -> bool:
    """The ambassador's single reward notification: their referral qualified AND the
    reward has now been approved by an admin and credited to their wallet. (No email
    is sent at qualification alone — see the note in crud.ingest_crm_lead_event.)"""
    inner = f"""
      <p style="font-size:16px;margin:0 0 14px;color:{BRAND_NAVY};font-weight:700;">You&#39;ve earned ৳{amount}, {ambassador_name}! 🎉</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 18px;color:#4b5563;">
        Great news — your referral <strong>{lead_name}</strong> qualified, your reward has been
        <strong style="color:{BRAND_ORANGE};">approved</strong>, and <strong>৳{amount}</strong> is now sitting in your wallet.
      </p>
      <p style="margin:0 auto 6px;text-align:center;font-size:12px;letter-spacing:1px;color:#9aa0ad;font-weight:700;">REWARD CREDITED</p>
      <p style="margin:0 auto 4px;text-align:center;font-size:40px;font-weight:800;color:#10b981;">৳{amount}</p>
      {_cta_path("View my wallet", "dashboard/wallet")}"""
    text = (
        f"You've earned ৳{amount}, {ambassador_name}!\n\n"
        f"Great news — your referral {lead_name} qualified, your reward has been approved, "
        f"and ৳{amount} is now in your wallet.\n\n"
        f"View it here: {settings.PORTAL_URL.rstrip('/')}/dashboard/wallet\n"
    )
    return _send_email(to_email, f"You've earned ৳{amount} — {lead_name} qualified! 🎉", text, _shell(inner))


def send_enrolment_email(to_email: str, ambassador_name: str, student_name: str, university_name: str = "") -> bool:
    """The ambassador's ENROLMENT milestone email — their referred student has enrolled,
    putting them in line for the ৳500 reward. Deliberately distinct from the lead-qualified
    email: it explains the two-installment payout and the conditions per the Enrolment
    Rewards policy, so expectations are honest (money follows the university paying BHE Uni).
    Sent exactly once, when the referral first flips to enrolled (crud._maybe_notify_enrolled)."""
    at_uni = f" at <strong>{university_name}</strong>" if university_name else ""
    inner = f"""
      <p style="font-size:16px;margin:0 0 14px;color:{BRAND_NAVY};font-weight:700;">Hi {ambassador_name},</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 18px;color:#4b5563;">Brilliant news. <strong>{student_name}</strong>, the student you referred, has officially enrolled{at_uni}. 🎓 This is the biggest milestone in the journey, and it puts you in line for the enrolment reward.</p>
      <p style="margin:0 auto 6px;text-align:center;font-size:11px;letter-spacing:1.5px;color:#9aa0ad;font-weight:700;">ENROLMENT REWARD</p>
      <div style="text-align:center;margin:0 0 22px;"><span style="display:inline-block;background:#fdeee3;color:{BRAND_ORANGE};font-size:40px;font-weight:800;padding:12px 32px;border-radius:16px;">৳500</span></div>
      <p style="font-size:14px;font-weight:700;margin:0 0 10px;color:{BRAND_NAVY};">How the ৳500 is paid</p>
      <p style="font-size:14px;line-height:1.6;margin:0 0 12px;color:#4b5563;">It is paid in two installments, because the university partner pays BHE Uni in stages:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr><td style="padding:11px 14px;background:#f7f8fb;border-radius:10px;border:1px solid #eceff5;font-size:13px;line-height:1.55;color:#4b5563;"><strong style="color:{BRAND_ORANGE};">1st installment:</strong> typically 4 to 6 months after enrolment, once BHE Uni receives the first payment from the university.</td></tr>
        <tr><td style="height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:11px 14px;background:#f7f8fb;border-radius:10px;border:1px solid #eceff5;font-size:13px;line-height:1.55;color:#4b5563;"><strong style="color:{BRAND_ORANGE};">2nd installment:</strong> typically 9 to 12 months after enrolment, once the final payment comes through.</td></tr>
      </table>
      <p style="font-size:14px;font-weight:700;margin:0 0 8px;color:{BRAND_NAVY};">What needs to be confirmed first</p>
      <p style="font-size:13px;line-height:1.9;margin:0 0 18px;color:#4b5563;">We handle all the tracking, nothing for you to do.<br>
      <span style="color:#10b981;font-weight:700;">&#10003;</span> Enrolment verified by the university<br>
      <span style="color:#10b981;font-weight:700;">&#10003;</span> Student Finance England (SFE) funding approved and received by the university<br>
      <span style="color:#10b981;font-weight:700;">&#10003;</span> The university partner has paid BHE Uni for the referral<br>
      <span style="color:#10b981;font-weight:700;">&#10003;</span> {student_name} remains actively enrolled, not withdrawn, cancelled, deferred, or rejected<br>
      <span style="color:#10b981;font-weight:700;">&#10003;</span> No refund or chargeback applies</p>
      <p style="font-size:13px;line-height:1.6;margin:0 0 10px;color:#6b7280;"><strong style="color:{BRAND_NAVY};">A note on timing.</strong> These timeframes are indicative and can shift depending on SFE approval dates and when the university pays BHE Uni. We will keep your dashboard updated at each step.</p>
      <p style="font-size:13px;line-height:1.6;margin:0 0 4px;color:#6b7280;"><strong style="color:{BRAND_NAVY};">What happens next.</strong> Nothing on your end. The moment each installment is confirmed, we credit it to your wallet and email you.</p>
      {_cta_path("Track my referral", "dashboard/referrals")}
      <p style="font-size:13px;line-height:1.6;margin:18px 0 0;color:#9aa0ad;text-align:center;">Thank you for guiding {student_name} this far. Know someone else who would be a great fit? Refer them from your dashboard.</p>"""
    text = (
        f"Hi {ambassador_name},\n\n"
        f"Brilliant news. {student_name}, the student you referred, has officially enrolled. "
        f"This puts you in line for the ৳500 enrolment reward, paid in two installments as the "
        f"university pays BHE Uni (typically 4 to 6 months, then 9 to 12 months after enrolment). "
        f"We handle all the tracking; the moment each installment is confirmed we credit your wallet and email you.\n"
        f"Track your referrals: {settings.PORTAL_URL.rstrip('/')}/dashboard/referrals\n"
    )
    return _send_email(to_email, f"Your referral {student_name} has enrolled", text, _shell(inner))


def _cta_path(label: str, path: str, color: str = BRAND_ORANGE) -> str:
    """Branded button linking to an arbitrary portal path (not just /dashboard)."""
    url = f"{settings.PORTAL_URL.rstrip('/')}/{path.lstrip('/')}"
    return (
        f'<div style="text-align:center;margin:24px 0 4px;">'
        f'<a href="{url}" style="display:inline-block;background:{color};color:#ffffff;'
        f'text-decoration:none;font-weight:700;font-size:15px;padding:13px 30px;border-radius:100px;">{label}</a>'
        f'</div>'
    )


# ── Welcome (on signup) ─────────────────────────────────────────────────────────

def send_welcome_email(to_email: str, full_name: str, referral_code: str = "") -> bool:
    """Warm welcome the moment an ambassador's account is created."""
    code_block = ""
    code_text = ""
    if referral_code:
        code_block = (
            f'<p style="margin:18px auto 6px;text-align:center;font-size:11px;letter-spacing:1.5px;color:#9aa0ad;font-weight:700;">YOUR REFERRAL CODE</p>'
            f'<p style="margin:0 auto 4px;text-align:center;font-size:30px;font-weight:800;letter-spacing:4px;color:{BRAND_NAVY};">{referral_code}</p>'
        )
        code_text = f"Your referral code: {referral_code}\n"
    inner = f"""
      <p style="font-size:16px;margin:0 0 14px;color:{BRAND_NAVY};font-weight:700;">Welcome aboard, {full_name}! 🎓</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 14px;color:#4b5563;">
        You&#39;re now part of the BHE&nbsp;Uni Ambassador &amp; Rewards Programme. Share your referral link with friends and prospective students, and earn as they progress.
      </p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 4px;color:#4b5563;">
        You get <strong style="color:{BRAND_ORANGE};">৳10</strong> the moment a referral qualifies, and <strong style="color:{BRAND_ORANGE};">৳500</strong> when they enrol. No limit — refer as many as you like.
      </p>
      {code_block}
      {_cta_path("Go to my dashboard", "dashboard")}"""
    text = (
        f"Welcome aboard, {full_name}!\n\n"
        "You're now part of the BHE Uni Ambassador & Rewards Programme. Share your "
        "referral link and earn ৳10 when a referral qualifies and ৳500 when they enrol.\n"
        f"{code_text}\n"
        f"Go to your dashboard: {settings.PORTAL_URL.rstrip('/')}/dashboard\n"
    )
    return _send_email(to_email, "Welcome to the BHE Uni Ambassador Programme 🎓", text, _shell(inner))


# ── Referral received (on lead submit) ──────────────────────────────────────────

def send_referral_received_email(to_email: str, ambassador_name: str, lead_name: str) -> bool:
    """Confirmation to the ambassador that we received the lead they just referred."""
    inner = f"""
      <p style="font-size:16px;margin:0 0 14px;color:{BRAND_NAVY};font-weight:700;">Got it, {ambassador_name}! ✅</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 6px;color:#4b5563;">
        We&#39;ve received your referral <strong>{lead_name}</strong>. Our team will reach out to them shortly.
      </p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 4px;color:#4b5563;">
        You&#39;ll be notified as they progress — and your reward lands in your wallet once they qualify.
      </p>
      {_cta_path("Track my referrals", "dashboard/referrals")}"""
    text = (
        f"Got it, {ambassador_name}!\n\n"
        f"We've received your referral {lead_name}. Our team will reach out to them shortly, "
        "and you'll be notified as they progress.\n\n"
        f"Track your referrals: {settings.PORTAL_URL.rstrip('/')}/dashboard/referrals\n"
    )
    return _send_email(to_email, f"We've got your referral, {lead_name} ✅", text, _shell(inner))


# ── Payout paid (on admin marking a withdrawal paid) ────────────────────────────

def send_payout_paid_email(to_email: str, ambassador_name: str, amount: str, method: str = "bank transfer") -> bool:
    """The ambassador's withdrawal has been settled by an admin."""
    inner = f"""
      <p style="font-size:16px;margin:0 0 14px;color:{BRAND_NAVY};font-weight:700;">Your payout is on its way, {ambassador_name}! 💸</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 18px;color:#4b5563;">
        Your withdrawal of <strong>৳{amount}</strong> via <strong>{method}</strong> has been <strong style="color:{BRAND_ORANGE};">approved and paid</strong>.
      </p>
      <p style="margin:0 auto 6px;text-align:center;font-size:12px;letter-spacing:1px;color:#9aa0ad;font-weight:700;">PAYOUT PAID</p>
      <p style="margin:0 auto 4px;text-align:center;font-size:40px;font-weight:800;color:#10b981;">৳{amount}</p>
      {_cta_path("View my wallet", "dashboard/wallet")}"""
    text = (
        f"Your payout is on its way, {ambassador_name}!\n\n"
        f"Your withdrawal of ৳{amount} via {method} has been approved and paid.\n\n"
        f"View your wallet: {settings.PORTAL_URL.rstrip('/')}/dashboard/wallet\n"
    )
    return _send_email(to_email, f"Your ৳{amount} payout has been paid 💸", text, _shell(inner))


# ── Admin alerts (to ADMIN_NOTIFY_EMAILS) ───────────────────────────────────────

def _admin_shell_send(admin_emails: list, subject: str, text: str, inner: str) -> bool:
    """Send one admin-alert email to every configured admin recipient. Best-effort."""
    ok = False
    for addr in (admin_emails or []):
        ok = _send_email(addr, subject, text, _shell(inner)) or ok
    return ok


def send_admin_lead_event_email(admin_emails: list, lead_name: str, ambassador_name: str, event_kind: str, amount: str, counsellor: str = None) -> bool:
    """Alert admins when a lead hits a money-giving stage (qualified ৳10 / enrolled ৳500)."""
    verb = "enrolled" if event_kind == "enrolled" else "qualified"
    counsellor_row = ""
    if counsellor:
        counsellor_row = (
            f'<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;border-top:1px solid #eef0f4;">Counsellor</td>'
            f'<td style="padding:6px 0;color:{BRAND_NAVY};font-size:14px;font-weight:700;text-align:right;border-top:1px solid #eef0f4;">{counsellor}</td></tr>'
        )
    inner = f"""
      <p style="font-size:16px;margin:0 0 14px;color:{BRAND_NAVY};font-weight:700;">A lead has just {verb} 💷</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
        <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Lead</td><td style="padding:6px 0;color:{BRAND_NAVY};font-size:14px;font-weight:700;text-align:right;">{lead_name}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;border-top:1px solid #eef0f4;">Ambassador</td><td style="padding:6px 0;color:{BRAND_NAVY};font-size:14px;font-weight:700;text-align:right;border-top:1px solid #eef0f4;">{ambassador_name}</td></tr>
        {counsellor_row}
        <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;border-top:1px solid #eef0f4;">Stage</td><td style="padding:6px 0;color:{BRAND_ORANGE};font-size:14px;font-weight:700;text-align:right;border-top:1px solid #eef0f4;text-transform:capitalize;">{verb} (৳{amount})</td></tr>
      </table>
      <p style="font-size:14px;line-height:1.6;margin:0 0 4px;color:#4b5563;">This is a reward stage. Review and approve the payout in the admin panel.</p>
      {_cta_path("Review in admin", "admin/payouts", BRAND_NAVY)}"""
    counsellor_line = f"Counsellor: {counsellor}\n" if counsellor else ""
    text = (
        f"A lead has just {verb}.\n\n"
        f"Lead: {lead_name}\nAmbassador: {ambassador_name}\n{counsellor_line}Stage: {verb} (৳{amount})\n\n"
        f"Review: {settings.PORTAL_URL.rstrip('/')}/admin/payouts\n"
    )
    return _admin_shell_send(admin_emails, f"[BHE Uni] Lead {verb}: {lead_name} (৳{amount})", text, inner)


def send_admin_reward_approved_email(admin_emails: list, ambassador_name: str, lead_name: str, amount: str, reward_kind: str = "lead", counsellor: str = None) -> bool:
    """Confirm to admins that a reward was approved and credited to an ambassador."""
    label = "enrolment" if reward_kind == "enrolment" else "lead"
    counsellor_row = ""
    if counsellor:
        counsellor_row = (
            f'<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;border-top:1px solid #eef0f4;">Counsellor</td>'
            f'<td style="padding:6px 0;color:{BRAND_NAVY};font-size:14px;font-weight:700;text-align:right;border-top:1px solid #eef0f4;">{counsellor}</td></tr>'
        )
    inner = f"""
      <p style="font-size:16px;margin:0 0 14px;color:{BRAND_NAVY};font-weight:700;">Reward approved ✅</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
        <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Ambassador</td><td style="padding:6px 0;color:{BRAND_NAVY};font-size:14px;font-weight:700;text-align:right;">{ambassador_name}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;border-top:1px solid #eef0f4;">Referral</td><td style="padding:6px 0;color:{BRAND_NAVY};font-size:14px;font-weight:700;text-align:right;border-top:1px solid #eef0f4;">{lead_name}</td></tr>
        {counsellor_row}
        <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;border-top:1px solid #eef0f4;">Amount</td><td style="padding:6px 0;color:#10b981;font-size:14px;font-weight:700;text-align:right;border-top:1px solid #eef0f4;">৳{amount} ({label} reward)</td></tr>
      </table>
      <p style="font-size:14px;line-height:1.6;margin:0 0 4px;color:#4b5563;">৳{amount} has been credited to {ambassador_name}&#39;s wallet.</p>
      {_cta_path("View payouts", "admin/payouts", BRAND_NAVY)}"""
    counsellor_line = f"Counsellor: {counsellor}\n" if counsellor else ""
    text = (
        f"Reward approved.\n\nAmbassador: {ambassador_name}\nReferral: {lead_name}\n{counsellor_line}"
        f"Amount: ৳{amount} ({label} reward)\n\n"
        f"View: {settings.PORTAL_URL.rstrip('/')}/admin/payouts\n"
    )
    return _admin_shell_send(admin_emails, f"[BHE Uni] Reward approved: ৳{amount} to {ambassador_name}", text, inner)


def send_admin_payout_requested_email(admin_emails: list, ambassador_name: str, amount: str, method: str = "bank transfer") -> bool:
    """Alert admins that an ambassador requested a payout (bank or gift card)."""
    inner = f"""
      <p style="font-size:16px;margin:0 0 14px;color:{BRAND_NAVY};font-weight:700;">New payout request 💷</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
        <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Ambassador</td><td style="padding:6px 0;color:{BRAND_NAVY};font-size:14px;font-weight:700;text-align:right;">{ambassador_name}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;border-top:1px solid #eef0f4;">Amount</td><td style="padding:6px 0;color:{BRAND_NAVY};font-size:14px;font-weight:700;text-align:right;border-top:1px solid #eef0f4;">৳{amount}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;border-top:1px solid #eef0f4;">Method</td><td style="padding:6px 0;color:{BRAND_ORANGE};font-size:14px;font-weight:700;text-align:right;border-top:1px solid #eef0f4;text-transform:capitalize;">{method}</td></tr>
      </table>
      <p style="font-size:14px;line-height:1.6;margin:0 0 4px;color:#4b5563;">Review and approve this withdrawal in the admin panel.</p>
      {_cta_path("Review payouts", "admin/payouts", BRAND_NAVY)}"""
    text = (
        f"New payout request.\n\nAmbassador: {ambassador_name}\nAmount: ৳{amount}\nMethod: {method}\n\n"
        f"Review: {settings.PORTAL_URL.rstrip('/')}/admin/payouts\n"
    )
    return _admin_shell_send(admin_emails, f"[BHE Uni] Payout requested: ৳{amount} by {ambassador_name} ({method})", text, inner)


# ── Counsellor alert (on a new affiliate lead routed to them) ───────────────────

def send_counsellor_new_lead_email(
    to_email: str,
    counsellor_name: str,
    lead_name: str,
    ambassador_name: str,
    course_interest: str = None,
    lead_phone: str = None,
    lead_email: str = None,
) -> bool:
    """Notify a BHE Uni counsellor that a new affiliate (ambassador-referred) lead has
    just been routed to them. Deliberately teal-branded (not the orange ambassador
    palette) so counsellors can tell this internal routing alert apart from the
    reward/marketing emails ambassadors receive. Best-effort; caller ignores failures."""
    def _row(label, value, first=False):
        border = "" if first else "border-top:1px solid #eef0f4;"
        return (
            f'<tr><td style="padding:7px 0;color:#6b7280;font-size:14px;{border}">{label}</td>'
            f'<td style="padding:7px 0;color:{BRAND_NAVY};font-size:14px;font-weight:700;text-align:right;{border}">{value}</td></tr>'
        )
    detail_rows = [("Lead", lead_name), ("Referred by", ambassador_name)]
    if course_interest:
        detail_rows.append(("Course interest", course_interest))
    if lead_phone:
        detail_rows.append(("Phone", lead_phone))
    if lead_email:
        detail_rows.append(("Email", lead_email))
    rows = "".join(_row(lbl, val, first=(i == 0)) for i, (lbl, val) in enumerate(detail_rows))

    # Counsellors work in the CRM, not the ambassador portal — link there if configured.
    crm_url = (getattr(settings, "CRM_BASE_URL", "") or "").rstrip("/")
    cta = ""
    if crm_url:
        cta = (
            f'<div style="text-align:center;margin:24px 0 4px;">'
            f'<a href="{crm_url}" style="display:inline-block;background:{COUNSELLOR_TEAL};color:#ffffff;'
            f'text-decoration:none;font-weight:700;font-size:15px;padding:13px 30px;border-radius:100px;">Open the CRM</a>'
            f'</div>'
        )

    inner = f"""
      <div style="height:4px;background:{COUNSELLOR_TEAL};border-radius:4px;margin:0 0 20px;"></div>
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:1.5px;color:{COUNSELLOR_TEAL};font-weight:800;">NEW AFFILIATE LEAD</p>
      <p style="font-size:16px;margin:0 0 14px;color:{BRAND_NAVY};font-weight:700;">Hi {counsellor_name}, a new lead has been routed to you 📩</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 18px;color:#4b5563;">
        <strong>{ambassador_name}</strong> referred a new prospective student through the BHE&nbsp;Uni
        Ambassador Programme, and it has been assigned to you. Their details are below and the lead is
        now in your <strong>Affiliate&#8209;Leads</strong> tab in the CRM.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px;">
        {rows}
      </table>
      {cta}"""
    course_line = f"Course interest: {course_interest}\n" if course_interest else ""
    phone_line = f"Phone: {lead_phone}\n" if lead_phone else ""
    email_line = f"Email: {lead_email}\n" if lead_email else ""
    crm_line = f"\nOpen the CRM: {crm_url}\n" if crm_url else ""
    text = (
        f"Hi {counsellor_name},\n\n"
        f"A new affiliate lead has been routed to you.\n\n"
        f"Lead: {lead_name}\nReferred by: {ambassador_name}\n{course_line}{phone_line}{email_line}"
        f"\nThe lead is now in your Affiliate-Leads tab in the CRM.{crm_line}"
    )
    return _send_email(to_email, f"New affiliate lead assigned to you: {lead_name}", text, _shell(inner))
