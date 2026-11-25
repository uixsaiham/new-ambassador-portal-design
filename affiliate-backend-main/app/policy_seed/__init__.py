"""Immutable seed content for the legal-document archive (policy_documents).

Each version's exact rendered HTML lives beside this file as `<doc>.v<N>.html` and
is NEVER edited once published. To publish a new version: add the new HTML file,
add its entry under `versions`, and bump the version in core/config.py (or via the
matching env var). Old files stay forever so any past acceptance is reproducible.
"""
import os
import hashlib

_DIR = os.path.dirname(__file__)

SEED = {
    "rewards_terms": {
        "title": "BHE Uni Ambassador, Referral & Rewards Terms and Conditions",
        "effective_date": "01 July 2026",
        "versions": {"1": "rewards_terms.v1.html", "2": "rewards_terms.v2.html"},
        "effective_dates": {"2": "24 November 2026"},
    },
    "privacy_policy": {
        "title": "Privacy Policy",
        "effective_date": "01 July 2026",
        "versions": {"1": "privacy_policy.v1.html"},
    },
}


def load_seed(document: str, version: str):
    """Return {title, effective_date, body_html, sha256} for a (document, version),
    or None if there is no seed file for it."""
    meta = SEED.get(document)
    if not meta:
        return None
    fname = meta["versions"].get(str(version))
    if not fname:
        return None
    path = os.path.join(_DIR, fname)
    if not os.path.exists(path):
        return None
    with open(path, "rb") as fh:
        raw = fh.read()
    return {
        "title": meta["title"],
        "effective_date": meta.get("effective_dates", {}).get(str(version), meta["effective_date"]),
        "body_html": raw.decode("utf-8"),
        "sha256": hashlib.sha256(raw).hexdigest(),
    }
