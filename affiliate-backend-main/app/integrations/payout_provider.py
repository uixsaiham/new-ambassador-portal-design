"""Provider-agnostic payout settlement layer.

Today every payout is settled MANUALLY: an admin sends the Faster Payment (bank
transfer) or issues the gift card by hand, then marks it paid in the admin panel.
This module is the seam where an automated provider slots in later WITHOUT
touching the payout flow:

    bank_transfer → Modulr / ClearBank / Wise (Faster Payments API)
    gift_card     → Tillo / Runa (gift-card issuance API)

To add a real provider: implement PayoutProvider, register it in
get_payout_provider() keyed on settings.PAYOUT_PROVIDER, and return a
PayoutResult with status "submitted" (then flip to "paid"/"failed" on webhook).
The calling code (crud.update_payout_status) already records whatever comes back,
so nothing downstream changes.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import re
import time
from dataclasses import dataclass
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class PayoutResult:
    provider: str                    # "manual" | "modulr" | "tillo" | ...
    status: str                      # "manual" | "submitted" | "paid" | "failed"
    provider_ref: Optional[str] = None   # external payment/order id (for reconciliation)
    detail: Optional[str] = None         # human-readable note for the audit trail


class PayoutProvider:
    """Interface every settlement backend implements."""

    name = "base"

    def send_bank_payment(
        self,
        *,
        amount,
        sort_code: str,
        account_number: str,
        holder_name: str,
        reference: str,
    ) -> PayoutResult:
        raise NotImplementedError

    def issue_gift_card(
        self,
        *,
        amount,
        recipient_email: str,
        reference: str,
        brand: Optional[str] = None,
    ) -> PayoutResult:
        raise NotImplementedError


class ManualProvider(PayoutProvider):
    """No-op backend: money is moved OUTSIDE the system by an admin, who then
    marks the payout paid. Returns status 'manual' so the audit trail is honest
    that settlement happened by hand."""

    name = "manual"

    def send_bank_payment(self, **kwargs) -> PayoutResult:
        return PayoutResult(
            provider="manual",
            status="manual",
            detail="Settled manually — admin sends the Faster Payment and marks it paid.",
        )

    def issue_gift_card(self, **kwargs) -> PayoutResult:
        return PayoutResult(
            provider="manual",
            status="manual",
            detail="Settled manually — admin issues the gift card and marks it paid.",
        )


class TremendousProvider(PayoutProvider):
    """Auto-issues gift cards via Tremendous, delivered as a BHE-Uni-branded email
    (branding comes from the configured campaign). Bank transfers stay MANUAL —
    Tremendous handles the card side only.

    Idempotent: the payout id is sent as `external_id`, so a retry returns the
    same order instead of issuing a second card.
    """

    name = "tremendous"

    def _order(self, *, amount, recipient_email: str, recipient_name: str, reference: str) -> PayoutResult:
        if not settings.TREMENDOUS_API_KEY:
            return PayoutResult(provider="tremendous", status="failed",
                                detail="TREMENDOUS_API_KEY is not set.")
        if not (settings.TREMENDOUS_CAMPAIGN_ID or settings.TREMENDOUS_PRODUCT_ID):
            return PayoutResult(provider="tremendous", status="failed",
                                detail="Set TREMENDOUS_CAMPAIGN_ID (branded) or TREMENDOUS_PRODUCT_ID.")

        reward: dict = {
            "value": {"denomination": float(amount), "currency_code": settings.PAYOUT_CURRENCY},
            "recipient": {"name": recipient_name or recipient_email, "email": recipient_email},
            "delivery": {"method": "EMAIL"},
        }
        # Campaign drives BHE Uni branding + the recipient's choice of card brands.
        if settings.TREMENDOUS_CAMPAIGN_ID:
            reward["campaign_id"] = settings.TREMENDOUS_CAMPAIGN_ID
        if settings.TREMENDOUS_PRODUCT_ID:
            reward["products"] = [settings.TREMENDOUS_PRODUCT_ID]

        body = {
            "external_id": reference,  # idempotency anchor
            "payment": {"funding_source_id": settings.TREMENDOUS_FUNDING_SOURCE_ID},
            "reward": reward,
        }
        try:
            resp = httpx.post(
                f"{settings.TREMENDOUS_BASE_URL}/orders",
                json=body,
                headers={
                    "Authorization": f"Bearer {settings.TREMENDOUS_API_KEY}",
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                timeout=20.0,
            )
        except Exception as exc:
            logger.warning("Tremendous request failed: %s", exc)
            return PayoutResult(provider="tremendous", status="failed", detail=f"Network error: {exc}")

        if resp.status_code not in (200, 201):
            detail = resp.text[:300]
            logger.warning("Tremendous order rejected (%s): %s", resp.status_code, detail)
            return PayoutResult(provider="tremendous", status="failed",
                                detail=f"Tremendous {resp.status_code}: {detail}")

        data = resp.json().get("order", {})
        order_id = data.get("id")
        return PayoutResult(
            provider="tremendous",
            status="submitted",
            provider_ref=order_id,
            detail=f"BHE Uni gift card issued (order {order_id}); emailed to {recipient_email}.",
        )

    def issue_gift_card(self, *, amount, recipient_email, reference, brand=None) -> PayoutResult:
        return self._order(amount=amount, recipient_email=recipient_email,
                           recipient_name="", reference=reference)

    def send_bank_payment(self, **kwargs) -> PayoutResult:
        # Gift-card automation doesn't cover bank transfers — leave those manual.
        return PayoutResult(provider="tremendous", status="manual",
                            detail="Bank transfer settled manually (Tremendous handles cards only).")


class Love2ShopProvider(PayoutProvider):
    """Auto-issues Love2shop UK e-gift cards. Bank transfers stay MANUAL.

    NOTE: Love2shop's exact API contract (endpoint path, auth header, request/
    response field names, product code) is supplied with the Business account's
    onboarding docs — it is NOT public. Everything provider-specific is isolated
    to `_build_request` / `_parse_response` below, so finalising it once the
    sandbox docs arrive is a small, contained change. Until BASE_URL + API_KEY +
    PRODUCT_CODE are set, get_payout_provider() falls back to manual.
    """

    name = "love2shop"

    def _headers(self) -> dict:
        scheme = settings.LOVE2SHOP_AUTH_SCHEME.strip()
        value = f"{scheme} {settings.LOVE2SHOP_API_KEY}".strip() if scheme else settings.LOVE2SHOP_API_KEY
        return {
            settings.LOVE2SHOP_AUTH_HEADER: value,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _build_request(self, *, amount, recipient_email, reference) -> dict:
        # CONFIRM field names against Love2shop onboarding docs.
        return {
            "productCode": settings.LOVE2SHOP_PRODUCT_CODE,
            "amount": float(amount),
            "currency": settings.PAYOUT_CURRENCY,
            "reference": reference,          # idempotency / your order ref
            "delivery": {"method": "EMAIL", "email": recipient_email},
        }

    def _parse_response(self, data: dict) -> str | None:
        # CONFIRM against Love2shop docs — pick the order/code identifier.
        for key in ("orderId", "order_id", "id", "code", "voucherCode", "reference"):
            if isinstance(data, dict) and data.get(key):
                return str(data[key])
        return None

    def issue_gift_card(self, *, amount, recipient_email, reference, brand=None) -> PayoutResult:
        if not (settings.LOVE2SHOP_BASE_URL and settings.LOVE2SHOP_API_KEY and settings.LOVE2SHOP_PRODUCT_CODE):
            return PayoutResult(provider="love2shop", status="failed",
                                detail="Set LOVE2SHOP_BASE_URL, LOVE2SHOP_API_KEY and LOVE2SHOP_PRODUCT_CODE.")
        try:
            resp = httpx.post(
                f"{settings.LOVE2SHOP_BASE_URL.rstrip('/')}/orders",  # CONFIRM path
                json=self._build_request(amount=amount, recipient_email=recipient_email, reference=reference),
                headers=self._headers(),
                timeout=20.0,
            )
        except Exception as exc:
            logger.warning("Love2shop request failed: %s", exc)
            return PayoutResult(provider="love2shop", status="failed", detail=f"Network error: {exc}")

        if resp.status_code not in (200, 201):
            detail = resp.text[:300]
            logger.warning("Love2shop order rejected (%s): %s", resp.status_code, detail)
            return PayoutResult(provider="love2shop", status="failed",
                                detail=f"Love2shop {resp.status_code}: {detail}")

        ref = self._parse_response(resp.json() if resp.content else {})
        return PayoutResult(
            provider="love2shop",
            status="submitted",
            provider_ref=ref,
            detail=f"Love2shop e-gift issued (ref {ref}); emailed to {recipient_email}.",
        )

    def send_bank_payment(self, **kwargs) -> PayoutResult:
        return PayoutResult(provider="love2shop", status="manual",
                            detail="Bank transfer settled manually (Love2shop issues gift cards only).")


class TilloProvider(PayoutProvider):
    """Auto-issues digital gift cards via Tillo (sandbox or production). Bank
    transfers stay MANUAL — Tillo handles the card side only.

    Tillo authenticates every request with an HMAC-SHA256 signature. For the
    digital-issue endpoint the signed string is, dash-joined and in THIS order:

        {api_key}-POST-digital-issue-{client_request_id}-{brand}-{timestamp_ms}

    The Signature header is the lowercase hex HMAC-SHA256 of that string keyed by
    the API Secret. The SAME millisecond timestamp goes in both the signature
    string and the Timestamp header — if they differ, Tillo rejects the request.

    Idempotent: client_request_id is derived from the payout id, so a retry
    returns the same order instead of issuing a second card. Until API_KEY +
    API_SECRET are set, get_payout_provider() falls back to manual.
    """

    name = "tillo"

    # Tillo requires client_request_id to be 5–50 chars, alnum + hyphen/underscore.
    _DISALLOWED = re.compile(r"[^A-Za-z0-9_-]")

    def _client_request_id(self, reference: str) -> str:
        cid = self._DISALLOWED.sub("-", reference or "").strip("-")[:50]
        if len(cid) < 5:
            cid = (f"payout-{cid}" if cid else "payout-0000")[:50]
        return cid

    def issue_gift_card(self, *, amount, recipient_email, reference, brand=None) -> PayoutResult:
        if not (settings.TILLO_API_KEY and settings.TILLO_API_SECRET):
            return PayoutResult(provider="tillo", status="failed",
                                detail="Set TILLO_API_KEY and TILLO_API_SECRET.")
        brand_slug = (brand or settings.TILLO_BRAND or "").strip()
        if not brand_slug:
            return PayoutResult(provider="tillo", status="failed",
                                detail="No Tillo brand configured (set TILLO_BRAND).")

        client_request_id = self._client_request_id(reference)
        timestamp = str(int(time.time() * 1000))  # UTC milliseconds
        signature_string = (
            f"{settings.TILLO_API_KEY}-POST-digital-issue-"
            f"{client_request_id}-{brand_slug}-{timestamp}"
        )
        signature = hmac.new(
            settings.TILLO_API_SECRET.encode("utf-8"),
            signature_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        body = {
            "client_request_id": client_request_id,
            "brand": brand_slug,
            "face_value": {"amount": float(amount), "currency": settings.PAYOUT_CURRENCY},
            "delivery_method": settings.TILLO_DELIVERY_METHOD,
            "fulfilment_by": settings.TILLO_FULFILMENT_BY,
        }
        if settings.TILLO_SECTOR:
            body["sector"] = settings.TILLO_SECTOR

        try:
            resp = httpx.post(
                f"{settings.TILLO_BASE_URL.rstrip('/')}/api/v2/digital/issue",
                json=body,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "API-Key": settings.TILLO_API_KEY,
                    "Signature": signature,
                    "Timestamp": timestamp,
                },
                timeout=25.0,
            )
        except Exception as exc:
            logger.warning("Tillo request failed: %s", exc)
            return PayoutResult(provider="tillo", status="failed", detail=f"Network error: {exc}")

        if resp.status_code not in (200, 201):
            detail = resp.text[:400]
            logger.warning("Tillo issue rejected (%s): %s", resp.status_code, detail)
            return PayoutResult(provider="tillo", status="failed",
                                detail=f"Tillo {resp.status_code}: {detail}")

        data = resp.json() if resp.content else {}
        # v2 wraps the payload under "data"; stay defensive about the exact shape.
        payload = data.get("data", data) if isinstance(data, dict) else {}
        code = payload.get("code") or payload.get("pin")
        url = payload.get("url") or payload.get("redemption_url")
        order_ref = payload.get("client_request_id") or code or url
        return PayoutResult(
            provider="tillo",
            status="submitted",
            provider_ref=str(order_ref) if order_ref else None,
            detail=(f"Tillo {brand_slug} gift card issued"
                    + (f" — redeem: {url}" if url else "")
                    + (f" (code {code})" if code else "")
                    + f"; for {recipient_email}."),
        )

    def send_bank_payment(self, **kwargs) -> PayoutResult:
        return PayoutResult(provider="tillo", status="manual",
                            detail="Bank transfer settled manually (Tillo issues gift cards only).")


# --- Tillo brand catalogue (for the ambassador gift-card picker) -------------
_brands_cache = {"at": 0.0, "data": None}


def _coerce_float(v, default=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def list_giftcard_brands(force: bool = False) -> list[dict]:
    """Live Tillo brand catalogue, normalised + cached ~10 min, for the wallet
    gift-card picker. Returns [] if Tillo isn't configured. Filtered to active
    brands in PAYOUT_CURRENCY; optional curation via settings.TILLO_BRANDS_ALLOWLIST.

    Each brand: {slug, name, currency, discount, denominations[], min, max,
    async_only}. `discount` is Tillo's per-brand commercial discount — the lever
    for the Phase-2 bonus; not shown to ambassadors in Phase 1.
    """
    if not (settings.TILLO_API_KEY and settings.TILLO_API_SECRET):
        return []
    now = time.time()
    if not force and _brands_cache["data"] is not None and now - _brands_cache["at"] < 600:
        return _brands_cache["data"]

    ts = str(int(now * 1000))
    sig = hmac.new(
        settings.TILLO_API_SECRET.encode("utf-8"),
        f"{settings.TILLO_API_KEY}-GET-brands-{ts}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    try:
        resp = httpx.get(
            f"{settings.TILLO_BASE_URL.rstrip('/')}/api/v2/brands",
            params={"detail": "true"},
            headers={"Accept": "application/json", "API-Key": settings.TILLO_API_KEY,
                     "Signature": sig, "Timestamp": ts},
            timeout=20.0,
        )
    except Exception as exc:
        logger.warning("Tillo brands fetch failed: %s", exc)
        return _brands_cache["data"] or []
    if resp.status_code != 200:
        logger.warning("Tillo brands HTTP %s: %s", resp.status_code, resp.text[:200])
        return _brands_cache["data"] or []

    body = resp.json() if resp.content else {}
    # Brands may sit at the top level or under "data" depending on the response —
    # fall back to the body itself (matches the working probe).
    payload = body.get("data", body) if isinstance(body, dict) else {}
    raw = payload.get("brands", {}) if isinstance(payload, dict) else {}
    allow = {s.strip() for s in (settings.TILLO_BRANDS_ALLOWLIST or "").split(",") if s.strip()}
    currency = (settings.PAYOUT_CURRENCY or "BDT").upper()

    items = raw.items() if isinstance(raw, dict) else [((b or {}).get("slug"), b) for b in raw]
    out: list[dict] = []
    for slug, meta in items:
        if not slug or not isinstance(meta, dict):
            continue
        if allow and slug not in allow:
            continue
        if str(meta.get("currency", "")).upper() != currency:
            continue
        # status is an object like {"code": "ENABLED"}; treat ENABLED/ACTIVE/LIVE as live.
        status = meta.get("status")
        status_code = status.get("code") if isinstance(status, dict) else status
        if str(status_code or "ENABLED").upper() not in ("ENABLED", "ACTIVE", "LIVE"):
            continue
        denoms = [_coerce_float(d) for d in (meta.get("denominations") or []) if _coerce_float(d)]
        limits = meta.get("digital_face_value_limits") or {}
        lo = _coerce_float(limits.get("lower") or limits.get("min")) or (min(denoms) if denoms else 0.0)
        hi = _coerce_float(limits.get("upper") or limits.get("max")) or (max(denoms) if denoms else 0.0)
        out.append({
            "slug": slug,
            "name": meta.get("name") or slug,
            "currency": meta.get("currency"),
            "discount": _coerce_float(meta.get("discount")),
            "denominations": denoms,
            "min": lo,
            "max": hi,
            "async_only": bool(meta.get("async_only")),
        })
    out.sort(key=lambda b: (b["name"] or "").lower())
    _brands_cache.update(at=now, data=out)
    return out


# Registry — add ModulrProvider / RunaProvider here later.
_PROVIDERS = {
    "manual": ManualProvider,
    "tremendous": TremendousProvider,
    "love2shop": Love2ShopProvider,
    "tillo": TilloProvider,
}


def get_payout_provider() -> PayoutProvider:
    """Return the configured settlement backend (defaults to manual). If an
    automated provider is selected but not usable (e.g. Tremendous with no API
    key), fall back to manual so the flow never breaks."""
    key = (settings.PAYOUT_PROVIDER or "manual").lower()
    if key == "tremendous" and not settings.TREMENDOUS_API_KEY:
        logger.warning("PAYOUT_PROVIDER=tremendous but TREMENDOUS_API_KEY is unset — falling back to manual.")
        return ManualProvider()
    if key == "love2shop" and not (settings.LOVE2SHOP_BASE_URL and settings.LOVE2SHOP_API_KEY):
        logger.warning("PAYOUT_PROVIDER=love2shop but credentials are unset — falling back to manual.")
        return ManualProvider()
    if key == "tillo" and not (settings.TILLO_API_KEY and settings.TILLO_API_SECRET):
        logger.warning("PAYOUT_PROVIDER=tillo but TILLO_API_KEY/SECRET unset — falling back to manual.")
        return ManualProvider()
    provider_cls = _PROVIDERS.get(key, ManualProvider)
    return provider_cls()
