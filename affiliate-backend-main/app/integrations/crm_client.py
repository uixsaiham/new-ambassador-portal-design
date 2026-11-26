"""Outbound client — push a captured lead to the CRM.

A lead submitted on this affiliate site is created in the CRM's Affiliate-Leads
tab (unassigned) via a server-to-server call. Best-effort: on failure the local
referral still exists and can be re-pushed later. See
docs/integration/crm-affiliate-contract.md.
"""
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


def push_lead_to_crm(referral, ambassador, extra: dict | None = None) -> str | None:
    """POST the lead to the CRM. Returns the CRM lead_id on success, else None."""
    base_url = (settings.CRM_BASE_URL or "").rstrip("/")
    service_key = settings.CRM_SERVICE_KEY
    if not base_url or not service_key:
        logger.info("[crm] push skipped — CRM_BASE_URL/CRM_SERVICE_KEY not configured")
        return None

    extra = extra or {}
    payload = {
        "referral_code": ambassador.referral_code,
        "referrer_name": ambassador.full_name,
        # Counsellor to route this lead to. Prefer one explicitly chosen on the form
        # (extra["counsellor_id"], defaulted from the ambassador's profile); else fall
        # back to the ambassador's own counsellor. null/absent → lead stays unassigned.
        "counsellor_id": extra.get("counsellor_id") or getattr(ambassador, "counsellor_id", None),
        "lead_name": referral.lead_name,
        "email": referral.lead_email,
        "phone": referral.lead_phone,
        "course_interested": referral.education_interest,
        "external_referral_id": referral.id,
        # Optional questionnaire fields, if the capture form collected them.
        "english_confidence": extra.get("english_confidence"),
        "student_finance": extra.get("student_finance"),
        "preferred_campus": extra.get("preferred_campus"),
        "residential_status": extra.get("residential_status"),
        "last_qualification": extra.get("last_qualification"),
    }

    try:
        resp = httpx.post(
            f"{base_url}/api/integrations/affiliate/lead",
            json=payload,
            headers={
                "X-Affiliate-Service-Key": service_key,
                "Accept": "application/json",
            },
            timeout=10.0,
        )
    except Exception as e:  # network/timeout — non-fatal
        logger.warning("[crm] lead push transport error: %s", e)
        return None

    if resp.status_code in (200, 201):
        lead_id = resp.json().get("lead_id")
        logger.info("[crm] lead pushed, crm lead_id=%s", lead_id)
        return lead_id

    logger.warning("[crm] lead push failed HTTP %s: %s", resp.status_code, resp.text)
    return None


def fetch_counsellors() -> list[dict]:
    """Read the CRM's list of active counsellors [{id, name}, ...].

    Best-effort: returns [] if the CRM is unreachable or not configured, so the
    affiliate app can still render the dropdown (with just "None of the above").
    """
    base_url = (settings.CRM_BASE_URL or "").rstrip("/")
    service_key = settings.CRM_SERVICE_KEY
    if not base_url or not service_key:
        logger.info("[crm] counsellor fetch skipped — CRM not configured")
        return []

    try:
        params = {}
        if settings.CRM_COUNSELLOR_COUNTRY:
            params["country"] = settings.CRM_COUNSELLOR_COUNTRY
        resp = httpx.get(
            f"{base_url}/api/integrations/affiliate/counsellors",
            params=params,
            headers={
                "X-Affiliate-Service-Key": service_key,
                "Accept": "application/json",
            },
            timeout=10.0,
        )
    except Exception as e:  # network/timeout — non-fatal
        logger.warning("[crm] counsellor fetch transport error: %s", e)
        return []

    if resp.status_code == 200:
        data = resp.json()
        return data.get("counsellors", []) or []

    logger.warning("[crm] counsellor fetch failed HTTP %s: %s", resp.status_code, resp.text)
    return []


def assign_counsellor_to_crm_leads(counsellor_id: str, lead_ids: list) -> dict | None:
    """Retroactively route already-captured CRM leads to a counsellor.

    Used when a counsellor is attached to an ambassador AFTER some of their leads
    were already pushed (those sit UNASSIGNED in the CRM). We send the exact CRM
    lead ids (referral.external_lead_id) + the counsellor id; the CRM assigns only
    the ones still unassigned and never overwrites a human's assignment.

    Best-effort: returns the CRM response dict on success, else None. Never raises.
    """
    base_url = (settings.CRM_BASE_URL or "").rstrip("/")
    service_key = settings.CRM_SERVICE_KEY
    if not base_url or not service_key:
        logger.info("[crm] counsellor assign skipped — CRM not configured")
        return None
    if not counsellor_id or not lead_ids:
        return None

    try:
        resp = httpx.post(
            f"{base_url}/api/integrations/affiliate/assign-counsellor",
            json={"counsellor_id": str(counsellor_id), "lead_ids": [str(x) for x in lead_ids]},
            headers={
                "X-Affiliate-Service-Key": service_key,
                "Accept": "application/json",
            },
            timeout=15.0,
        )
    except Exception as e:  # network/timeout — non-fatal
        logger.warning("[crm] counsellor assign transport error: %s", e)
        return None

    if resp.status_code == 200:
        data = resp.json()
        logger.info(
            "[crm] counsellor assign ok: assigned=%s skipped=%s missing=%s",
            len(data.get("assigned", [])), len(data.get("skipped", [])), len(data.get("missing", [])),
        )
        return data

    logger.warning("[crm] counsellor assign failed HTTP %s: %s", resp.status_code, resp.text)
    return None


def reassign_counsellor_crm_leads(from_counsellor_id: str, to_counsellor_id: str, lead_ids: list) -> dict | None:
    """Bulk-reassign already-captured CRM leads FROM a departing counsellor TO a
    replacement (used when a counsellor leaves). We send the exact CRM lead ids
    (referral.external_lead_id) + both counsellor ids; the CRM overwrites ONLY the
    leads still held by `from_counsellor_id` and reports what actually moved.

    Best-effort: returns the CRM response dict on success, else None. Never raises.
    """
    base_url = (settings.CRM_BASE_URL or "").rstrip("/")
    service_key = settings.CRM_SERVICE_KEY
    if not base_url or not service_key:
        logger.info("[crm] counsellor reassign skipped — CRM not configured")
        return None
    if not from_counsellor_id or not to_counsellor_id or not lead_ids:
        return None

    try:
        resp = httpx.post(
            f"{base_url}/api/integrations/affiliate/reassign-counsellor",
            json={
                "from_counsellor_id": str(from_counsellor_id),
                "to_counsellor_id": str(to_counsellor_id),
                "lead_ids": [str(x) for x in lead_ids],
            },
            headers={
                "X-Affiliate-Service-Key": service_key,
                "Accept": "application/json",
            },
            timeout=20.0,
        )
    except Exception as e:  # network/timeout — non-fatal
        logger.warning("[crm] counsellor reassign transport error: %s", e)
        return None

    if resp.status_code == 200:
        data = resp.json()
        logger.info(
            "[crm] counsellor reassign ok: reassigned=%s skipped=%s missing=%s",
            len(data.get("reassigned", [])), len(data.get("skipped", [])), len(data.get("missing", [])),
        )
        return data

    logger.warning("[crm] counsellor reassign failed HTTP %s: %s", resp.status_code, resp.text)
    return None
