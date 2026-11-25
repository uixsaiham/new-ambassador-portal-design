"""Payout remittance-advice PDF generation (admin "download invoice").

One fixed template for every payout, gift-card or bank. The document is generated
on demand from the stored payout + ambassador record, so it works for historical
payouts too and needs nothing captured at payout time. Pure-Python (fpdf2), no
system libraries, so it carries zero deployment risk on the droplet.

Design decisions (agreed with the business):
- Titled "Payment Invoice" (matches the "Invoice" buttons in the admin UI; documents
  a payment BHE made to the ambassador).
- Address is best-effort: bank-payout users have a validated billing address; gift
  card recipients usually do not, so the address block is simply omitted for them.
- Bank details are masked (holder name + last 4 of the account) so the document is
  safe to share with an accountant.
- Only PAID payouts produce a document (money actually moved).
"""
import io
import os
import re
import zipfile
from decimal import Decimal

from fpdf import FPDF

from app.core.config import settings
from app.core.crypto import mask_bank

_ASSET_DIR = os.path.join(os.path.dirname(__file__), "assets")
_LOGO = os.path.join(_ASSET_DIR, "logo.png")
_FONT_REG = os.path.join(_ASSET_DIR, "DejaVuSans.ttf")
_FONT_BOLD = os.path.join(_ASSET_DIR, "DejaVuSans-Bold.ttf")

# Unicode font so real ambassador names/addresses (accents, non-latin scripts) and
# symbols (BDT , bullet mask) render faithfully rather than crashing the core latin-1
# font. Bundled TTFs, no system dependency.
FONT = "DejaVu"


def _register_fonts(pdf):
    pdf.add_font(FONT, "", _FONT_REG)
    pdf.add_font(FONT, "B", _FONT_BOLD)

# Palette (RGB) — mirrors the portal's slate/orange brand.
_INK = (15, 23, 42)
_MUTED = (100, 116, 139)
_LINE = (203, 213, 225)
_ACCENT = (234, 88, 12)
_PANEL = (248, 250, 252)

_METHOD_LABELS = {"gift_card": "Gift card", "bank_transfer": "Bank transfer", "bkash": "bKash", "other": "Other manual method"}


def _enum_val(v):
    return getattr(v, "value", v)


def _method_label(payout) -> str:
    m = str(_enum_val(payout.payment_method))
    return _METHOD_LABELS.get(m, m.replace("_", " ").title())


def _money(amount) -> str:
    try:
        return f"BDT {Decimal(str(amount)):,.2f}"
    except Exception:
        return f"BDT {amount}"


def _paid_dt(payout):
    return getattr(payout, "processed_at", None) or getattr(payout, "created_at", None)


def _fmt_date(dt) -> str:
    return dt.strftime("%d %b %Y") if dt else "-"


def doc_number(payout) -> str:
    """Stable, human-readable invoice number derived from the payout, so
    regenerating the document for an existing payout always yields the same number.
    Form: BHE-INV-<YYYYMMDD paid>-<first 6 of payout id>."""
    dt = _paid_dt(payout)
    stamp = dt.strftime("%Y%m%d") if dt else "00000000"
    short = (payout.id or "").replace("-", "")[:6].upper()
    return f"BHE-INV-{stamp}-{short}"


def _safe(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", str(s)).strip("_") or "remittance"


def doc_filename(payout, user=None) -> str:
    who = user.full_name if (user and getattr(user, "full_name", None)) else payout.user_id
    return f"{doc_number(payout)}_{_safe(who)}.pdf"


def _address_lines(user) -> list:
    """Best-effort billing address from the ambassador's saved bank profile.
    Returns [] when none is on file (typical for gift-card-only recipients)."""
    bd = getattr(user, "bank_details", None) or {}
    addr = bd.get("address") if isinstance(bd, dict) else None
    if not isinstance(addr, dict):
        return []
    order = ("line1", "line2", "city", "postcode", "country")
    return [str(addr[k]).strip() for k in order if addr.get(k) and str(addr[k]).strip()]


def _masked_bank_line(payout, user) -> str:
    """Holder name + masked sort/account for a bank payout (falls back to the
    ambassador profile if the payout snapshot is empty). '-' if nothing usable."""
    bd = getattr(payout, "bank_details", None)
    if not isinstance(bd, dict) or not bd:
        ubd = getattr(user, "bank_details", None) or {}
        bd = {k: ubd.get(k) for k in ("holder_name", "sort_code", "account_number")} if isinstance(ubd, dict) else {}
    masked = mask_bank(bd) if isinstance(bd, dict) else {}
    bits = []
    if masked.get("holder_name"):
        bits.append(str(masked["holder_name"]))
    for key in ("bank_name", "branch", "provider_name"):
        if bd.get(key):
            bits.append(str(bd[key]))
    if masked.get("sort_code"):
        bits.append(f"sort {masked['sort_code']}")
    if masked.get("account_number"):
        bits.append(f"acct {masked['account_number']}")
    return "   ·   ".join(bits) if bits else "-"


def _issuer_lines() -> list:
    lines = []
    name = settings.INVOICE_ISSUER_NAME
    if settings.INVOICE_ISSUER_TRADING_AS:
        name = f"{name} (trading as {settings.INVOICE_ISSUER_TRADING_AS})"
    lines.append(name)
    if settings.INVOICE_ISSUER_ADDRESS:
        lines.append(settings.INVOICE_ISSUER_ADDRESS)
    if settings.INVOICE_ISSUER_EMAIL:
        lines.append(settings.INVOICE_ISSUER_EMAIL)
    reg = []
    if settings.INVOICE_COMPANY_NO:
        reg.append(f"Company No: {settings.INVOICE_COMPANY_NO}")
    if settings.INVOICE_VAT_NO:
        reg.append(f"VAT No: {settings.INVOICE_VAT_NO}")
    if reg:
        lines.append("   ".join(reg))
    return lines


def _label(pdf, x, y, text):
    pdf.set_xy(x, y)
    pdf.set_font(FONT, "B", 8)
    pdf.set_text_color(*_MUTED)
    pdf.cell(0, 4, text.upper(), ln=1)


def build_remittance_pdf(payout, user) -> bytes:
    """Render the remittance-advice PDF for one paid payout. `user` may be None
    (then only the payout's own data is shown)."""
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    _register_fonts(pdf)
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_margins(15, 14, 15)
    pdf.add_page()
    right_x = 120

    # Logo (top-left). Width fixed; height auto-scales.
    if os.path.exists(_LOGO):
        try:
            pdf.image(_LOGO, x=15, y=13, w=34)
        except Exception:
            pass

    # Title block (top-right).
    pdf.set_xy(right_x, 14)
    pdf.set_font(FONT, "B", 20)
    pdf.set_text_color(*_INK)
    pdf.cell(75, 9, "PAYMENT", align="R", ln=2)
    pdf.set_x(right_x)
    pdf.cell(75, 7, "INVOICE", align="R", ln=2)
    pdf.ln(2)
    pdf.set_x(right_x)
    pdf.set_font(FONT, "", 9)
    pdf.set_text_color(*_MUTED)
    pdf.cell(75, 5, f"No.  {doc_number(payout)}", align="R", ln=2)
    pdf.set_x(right_x)
    pdf.cell(75, 5, f"Date paid  {_fmt_date(_paid_dt(payout))}", align="R", ln=2)

    # Divider under the header.
    pdf.set_draw_color(*_LINE)
    pdf.set_line_width(0.3)
    pdf.line(15, 42, 195, 42)

    # From (issuer) and Paid to (payee), two columns.
    top = 48
    _label(pdf, 15, top, "From")
    pdf.set_font(FONT, "", 9)
    pdf.set_text_color(*_INK)
    y = top + 5
    for i, line in enumerate(_issuer_lines()):
        pdf.set_xy(15, y)
        pdf.set_font(FONT, "B" if i == 0 else "", 9)
        pdf.multi_cell(90, 4.6, line)
        y = pdf.get_y() + 0.5

    _label(pdf, right_x, top, "Paid to")
    py = top + 5
    payee_lines = []
    if user is not None:
        payee_lines.append((getattr(user, "full_name", None) or payout.user_id, True))
        if getattr(user, "email", None):
            payee_lines.append((user.email, False))
        if getattr(user, "phone", None):
            payee_lines.append((user.phone, False))
        for a in _address_lines(user):
            payee_lines.append((a, False))
    else:
        payee_lines.append((payout.user_id, True))
    for text, bold in payee_lines:
        pdf.set_xy(right_x, py)
        pdf.set_font(FONT, "B" if bold else "", 9)
        pdf.set_text_color(*_INK)
        pdf.multi_cell(75, 4.6, str(text))
        py = pdf.get_y() + 0.5

    # Line-item table.
    table_y = max(y, py) + 8
    pdf.set_xy(15, table_y)
    pdf.set_fill_color(*_INK)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(FONT, "B", 9)
    pdf.cell(150, 8, "  Description", border=0, fill=True, ln=0)
    pdf.cell(30, 8, "Amount  ", border=0, fill=True, align="R", ln=1)

    pdf.set_text_color(*_INK)
    pdf.set_font(FONT, "", 9)
    desc = "Ambassador Referral & Rewards Programme payout"
    pdf.set_x(15)
    pdf.cell(150, 9, f"  {desc}", border=0, ln=0)
    pdf.set_font(FONT, "B", 10)
    pdf.cell(30, 9, f"{_money(payout.amount)}  ", border=0, align="R", ln=1)
    # sub-line: method reference under the description
    pdf.set_x(15)
    pdf.set_font(FONT, "", 8)
    pdf.set_text_color(*_MUTED)
    pdf.cell(150, 5, f"  {_method_label(payout)}  ·  Payout ID {payout.id}", ln=1)

    ty = pdf.get_y() + 1
    pdf.set_draw_color(*_LINE)
    pdf.line(15, ty, 195, ty)

    # Total row.
    pdf.set_xy(15, ty + 2)
    pdf.set_font(FONT, "B", 11)
    pdf.set_text_color(*_INK)
    pdf.cell(150, 9, "", ln=0)
    pdf.set_text_color(*_ACCENT)
    pdf.cell(30, 9, f"{_money(payout.amount)}  ", align="R", ln=1)
    pdf.set_x(15)
    pdf.set_font(FONT, "B", 8)
    pdf.set_text_color(*_MUTED)
    pdf.cell(150, 4, "", ln=0)
    pdf.cell(30, 4, "TOTAL PAID (BDT)  ", align="R", ln=1)

    # Payment details panel.
    panel_y = pdf.get_y() + 8
    method = _enum_val(payout.payment_method)
    rows = [("Payment method", _method_label(payout))]
    if str(method) == "gift_card":
        rows.append(("Delivered to", getattr(payout, "gift_card_email", None) or "-"))
    else:
        rows.append(("Recipient account", _masked_bank_line(payout, user)))
    rows.append(("Payment reference", getattr(payout, "provider_ref", None) or "-"))
    rows.append(("Status", str(_enum_val(payout.status)).title()))

    pdf.set_fill_color(*_PANEL)
    pdf.rect(15, panel_y, 180, 8 + len(rows) * 6, style="F")
    _label(pdf, 19, panel_y + 3, "Payment details")
    ry = panel_y + 9
    for k, v in rows:
        pdf.set_xy(19, ry)
        pdf.set_font(FONT, "", 8.5)
        pdf.set_text_color(*_MUTED)
        pdf.cell(45, 5, k, ln=0)
        pdf.set_font(FONT, "B", 8.5)
        pdf.set_text_color(*_INK)
        pdf.multi_cell(127, 5, str(v))
        ry = pdf.get_y() + 1

    # Footer note. Disable auto page-break so the wrapped note can never spill a
    # trailing line onto a second page.
    pdf.set_auto_page_break(False)
    pdf.set_y(-24)
    pdf.set_draw_color(*_LINE)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(2)
    pdf.set_font(FONT, "", 7.5)
    pdf.set_text_color(*_MUTED)
    pdf.multi_cell(
        180, 4,
        "This document confirms a payment made by "
        f"{settings.INVOICE_ISSUER_NAME} to the ambassador named above under the BHE "
        "Uni Ambassador, Referral & Rewards Programme. Generated automatically from "
        "the payout record.",
    )

    return bytes(pdf.output())


def build_zip(items) -> bytes:
    """Zip of remittance PDFs. `items` is an iterable of (payout, user) pairs; a
    payout that fails to render is skipped rather than failing the whole archive."""
    buf = io.BytesIO()
    used = set()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for payout, user in items:
            try:
                pdf = build_remittance_pdf(payout, user)
            except Exception:
                continue
            name = doc_filename(payout, user)
            base, i = name, 2
            while name in used:
                name = f"{base[:-4]}_{i}.pdf"
                i += 1
            used.add(name)
            zf.writestr(name, pdf)
    return buf.getvalue()
