import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    LOCAL_SIGNUP_TEST_MODE: bool = False

    PROJECT_NAME: str = "BHE Uni Ambassador Portal Backend"
    
    # Database configuration
    # Defaulting to an SQLite database for ease of local development if PostgreSQL URL is not set
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/affiliate"
    )
    
    # Security configuration
    # JWT signing key — MUST be provided via .env in every real environment.
    # No hardcoded fallback on purpose: a blank key means "not configured"
    # (never ship a known/committed signing key). See .env.example.
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Field-level encryption key for bank details at rest (Fernet). Loaded from .env.
    # If unset, bank details fall back to plaintext (dev only). KEEP THIS KEY BACKED UP.
    BANK_ENC_KEY: str = os.getenv("BANK_ENC_KEY", "")

    # CORS: browser origins allowed to call this API (comma-separated env override).
    # Defaults to the production ambassador portal + local dev. Server-to-server
    # callers (the CRM bridge) are NOT affected — CORS only gates browsers.
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "https://ambassador.bheuni.uk,http://localhost:3000,http://127.0.0.1:3000",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

    # Interactive API docs (/docs, /redoc, /openapi.json). OFF by default (prod);
    # set ENABLE_DOCS=true on the test env so the mobile team gets Swagger.
    ENABLE_DOCS: bool = os.getenv("ENABLE_DOCS", "false").lower() in ("1", "true", "yes")

    # Legal-document versions for the accept-terms gate. Each is independent: bump
    # either value and every ambassador is forced to re-accept THAT document.
    # Integers as strings. To publish a new version you must (1) add the frozen HTML
    # at app/policy_seed/<doc>.v<N>.html, (2) add it to the policy_seed manifest,
    # then (3) bump this value; startup seeds the new archive row automatically.
    REWARDS_TERMS_VERSION: str = os.getenv("REWARDS_TERMS_VERSION", "2")
    PRIVACY_POLICY_VERSION: str = os.getenv("PRIVACY_POLICY_VERSION", "1")

    # Issuer block printed on payout remittance-advice PDFs (admin invoice download).
    # All env-overridable so legal/finance details can change without a code deploy.
    # COMPANY_NO / VAT_NO default blank and are simply omitted from the document
    # until set (so we never print a placeholder on a document sent to an accountant).
    INVOICE_ISSUER_NAME: str = os.getenv("INVOICE_ISSUER_NAME", "Boost Education Service Ltd")
    INVOICE_ISSUER_TRADING_AS: str = os.getenv("INVOICE_ISSUER_TRADING_AS", "BHE Uni")
    INVOICE_ISSUER_ADDRESS: str = os.getenv(
        "INVOICE_ISSUER_ADDRESS",
        "11 Beaufort Court, Admirals Way, Canary Wharf, London, E14 9XL",
    )
    INVOICE_ISSUER_EMAIL: str = os.getenv("INVOICE_ISSUER_EMAIL", "ask@bheuni.io")
    INVOICE_COMPANY_NO: str = os.getenv("INVOICE_COMPANY_NO", "08186502")
    INVOICE_VAT_NO: str = os.getenv("INVOICE_VAT_NO", "GB369983716")

    # CRM integration (receiver). Shared secret the CRM sends as X-CRM-Service-Key.
    # Must match the CRM's AFFILIATE_SERVICE_KEY. Empty by default so the endpoint
    # rejects everything until a key is configured on both sides.
    CRM_SERVICE_KEY: str = os.getenv("CRM_SERVICE_KEY", "")

    # CRM integration (outbound lead push). Base URL of the CRM API; leads captured
    # on this site are pushed to {CRM_BASE_URL}/api/integrations/affiliate/lead
    # authed with CRM_SERVICE_KEY. Empty disables the push (lead stays local-only).
    CRM_BASE_URL: str = os.getenv("CRM_BASE_URL", "")

    # --- MailerLite (marketing) ambassador sync ---
    # On signup, ambassadors are added to a MailerLite group so the marketing team
    # can run campaigns. JWT API token (connect.mailerlite.com) + target group id.
    # Empty token disables the sync (best-effort, never blocks signup).
    MAILERLITE_API_TOKEN: str = os.getenv("MAILERLITE_API_TOKEN", "")
    MAILERLITE_AMBASSADOR_GROUP_ID: str = os.getenv("MAILERLITE_AMBASSADOR_GROUP_ID", "")

    # --- ClickSend (SMS marketing) ambassador phone sync ---
    # On signup / phone-change an ambassador's number is synced to a ClickSend contact
    # list so the marketing team can run SMS campaigns from the ClickSend dashboard.
    # Basic auth (username + API key). Empty creds disable the sync (best-effort,
    # never blocks signup). CLICKSEND_AMBASSADOR_LIST_ID is optional - if blank, the
    # list is created on first use and its id is remembered in app_settings.
    CLICKSEND_USERNAME: str = os.getenv("CLICKSEND_USERNAME", "")
    CLICKSEND_API_KEY: str = os.getenv("CLICKSEND_API_KEY", "")
    CLICKSEND_AMBASSADOR_LIST_ID: str = os.getenv("CLICKSEND_AMBASSADOR_LIST_ID", "")
    # Name used only when auto-creating the list (if no list id is set). Lets the test
    # env create a separate "... - TEST" list so test contacts never land in the live
    # list. Prod leaves this blank and gets the default name.
    CLICKSEND_LIST_NAME: str = os.getenv("CLICKSEND_LIST_NAME", "")
    # One-time backfill of existing ambassadors into the list, run once on startup in
    # a background thread (guarded by an app_settings marker so it never repeats). Set
    # to "1"/"true" on the deploy that should seed the list; harmless to leave on.
    CLICKSEND_BACKFILL_ON_BOOT: str = os.getenv("CLICKSEND_BACKFILL_ON_BOOT", "")

    # Reward amount (BDT) credited to the ambassador when an admin approves a
    # qualified/validated lead. Authoritative here — the CRM never sends amounts.
    LEAD_REWARD_AMOUNT: str = os.getenv("LEAD_REWARD_AMOUNT", "10.00")

    # Reward amount (BDT) credited when an admin approves an ENROLLED referral.
    # Also authoritative here — never auto-paid; an admin approves each one.
    ENROLMENT_REWARD_AMOUNT: str = os.getenv("ENROLMENT_REWARD_AMOUNT", "500.00")

    # --- Payout / cash-out policy (BDT) ---
    # Minimum withdrawal per method: bank transfer ৳50, gift card ৳10.
    MIN_WITHDRAWAL_AMOUNT: str = os.getenv("MIN_WITHDRAWAL_AMOUNT", "50.00")            # bank transfer
    GIFT_CARD_MIN_WITHDRAWAL_AMOUNT: str = os.getenv("GIFT_CARD_MIN_WITHDRAWAL_AMOUNT", "10.00")
    MAX_WITHDRAWAL_AMOUNT: str = os.getenv("MAX_WITHDRAWAL_AMOUNT", "5000.00")
    # Requests strictly under this amount are auto-approved to PAID with no human
    # review. Default "0.00" = disabled → EVERY withdrawal is created as PENDING
    # and an admin settles it manually (Faster Payment / gift card) then marks it
    # paid. Raise this only once an automated provider actually sends the money.
    PAYOUT_AUTO_APPROVE_UNDER: str = os.getenv("PAYOUT_AUTO_APPROVE_UNDER", "0.00")
    # Which settlement backend actually moves the money. "manual" = admin pays by
    # hand. "tremendous" = auto-issue gift cards (bank stays manual). Future:
    # "modulr" / "clearbank" (bank) · "tillo" / "runa" (gift card).
    PAYOUT_PROVIDER: str = os.getenv("PAYOUT_PROVIDER", "manual")
    # Currency gift cards / payouts are denominated in.
    PAYOUT_CURRENCY: str = os.getenv("PAYOUT_CURRENCY", "BDT")

    # --- Tremendous (gift-card issuance) ---
    # Sandbox base by default; production is https://api.tremendous.com/api/v2
    TREMENDOUS_BASE_URL: str = os.getenv("TREMENDOUS_BASE_URL", "https://testflight.tremendous.com/api/v2")
    TREMENDOUS_API_KEY: str = os.getenv("TREMENDOUS_API_KEY", "")
    # Sandbox funding source is the literal "balance" ($5,000 fake money).
    TREMENDOUS_FUNDING_SOURCE_ID: str = os.getenv("TREMENDOUS_FUNDING_SOURCE_ID", "balance")
    # The BHE-Uni-branded campaign (logo/colours/message + which card brands the
    # recipient can pick). Create it in the Tremendous dashboard, paste the id here.
    TREMENDOUS_CAMPAIGN_ID: str = os.getenv("TREMENDOUS_CAMPAIGN_ID", "")
    # Optional: force a single product (brand) instead of a campaign's choice set.
    TREMENDOUS_PRODUCT_ID: str = os.getenv("TREMENDOUS_PRODUCT_ID", "")

    # --- Love2shop (UK gift-card issuance) ---
    # Base URL + credentials come from the Love2shop Business self-serve account
    # (sandbox first). Exact auth/field names are confirmed against their
    # onboarding API docs — see app/integrations/payout_provider.py.
    LOVE2SHOP_BASE_URL: str = os.getenv("LOVE2SHOP_BASE_URL", "")
    LOVE2SHOP_API_KEY: str = os.getenv("LOVE2SHOP_API_KEY", "")
    # Header the API key is sent in (Love2shop may use a subscription-key header
    # rather than Bearer — set once confirmed).
    LOVE2SHOP_AUTH_HEADER: str = os.getenv("LOVE2SHOP_AUTH_HEADER", "Authorization")
    LOVE2SHOP_AUTH_SCHEME: str = os.getenv("LOVE2SHOP_AUTH_SCHEME", "Bearer")  # "Bearer" or "" (raw key)
    # The e-gift product to issue (Love2shop e-Gift Card product code).
    LOVE2SHOP_PRODUCT_CODE: str = os.getenv("LOVE2SHOP_PRODUCT_CODE", "")

    # --- Tillo (digital gift-card issuance) ---
    # Sandbox by default; production is https://api.tillo.io . Auth is HMAC-SHA256
    # request signing (see TilloProvider in app/integrations/payout_provider.py).
    # Until API_KEY + API_SECRET are set, get_payout_provider() falls back to manual.
    TILLO_BASE_URL: str = os.getenv("TILLO_BASE_URL", "https://sandbox.tillo.dev")
    TILLO_API_KEY: str = os.getenv("TILLO_API_KEY", "")
    TILLO_API_SECRET: str = os.getenv("TILLO_API_SECRET", "")
    # Brand slug to issue (e.g. "amazon", "costa"). Set to a brand your account is
    # cleared for; can be overridden per call via issue_gift_card(brand=...).
    TILLO_BRAND: str = os.getenv("TILLO_BRAND", "")
    # Your Tillo-assigned sector (supplied at onboarding).
    TILLO_SECTOR: str = os.getenv("TILLO_SECTOR", "")
    # "url" = Tillo returns a redemption URL and WE deliver it (fulfilment_by
    # "partner"). Change only if your account uses a different fulfilment model.
    TILLO_DELIVERY_METHOD: str = os.getenv("TILLO_DELIVERY_METHOD", "url")
    TILLO_FULFILMENT_BY: str = os.getenv("TILLO_FULFILMENT_BY", "partner")
    # Optional curated allowlist of brand slugs to show ambassadors (comma-separated).
    # Empty = show every active brand in PAYOUT_CURRENCY.
    TILLO_BRANDS_ALLOWLIST: str = os.getenv("TILLO_BRANDS_ALLOWLIST", "")

    # --- Bank withdrawal fee (steers ambassadors toward gift cards) ---
    # Applied to bank_transfer payouts only. Gift cards have no fee.
    BANK_WITHDRAWAL_FEE_PERCENT: str = os.getenv("BANK_WITHDRAWAL_FEE_PERCENT", "5")   # % of amount
    BANK_WITHDRAWAL_FEE_MIN: str = os.getenv("BANK_WITHDRAWAL_FEE_MIN", "1.00")        # floor in PAYOUT_CURRENCY

    # SMTP Configuration
    MAIL_MAILER: str = os.getenv("MAIL_MAILER", "smtp")
    MAIL_HOST: str = os.getenv("MAIL_HOST", "smtp.office365.com")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "no-reply@bheuni.io")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")  # set via .env — never hardcode a real password
    MAIL_ENCRYPTION: str = os.getenv("MAIL_ENCRYPTION", "tls")
    MAIL_FROM_ADDRESS: str = os.getenv("MAIL_FROM_ADDRESS", "no-reply@bheuni.io")
    AUTH_MAIL_FROM_ADDRESS: str = "no-reply@bheuni.io"
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "BHE Uni Ambassador Portal")

    # MailerSend (transactional ESP). When a token is set, mail is sent via the
    # MailerSend API instead of Office365 SMTP — far better deliverability. SMTP
    # stays as an automatic fallback if the API call fails.
    MAILERSEND_API_TOKEN: str = os.getenv("MAILERSEND_API_TOKEN", "")
    # MailerSend's from-address MUST be on a MailerSend-verified domain, which can
    # differ from the SMTP login domain. Kept separate so SMTP keeps using
    # MAIL_FROM_ADDRESS (must match MAIL_USERNAME's mailbox, or O365 SendAs-denies).
    # Falls back to MAIL_FROM_ADDRESS when unset.
    MAILERSEND_FROM_ADDRESS: str = os.getenv("MAILERSEND_FROM_ADDRESS", "")

    # Public URL of the ambassador portal — used for the "log in and track" button
    # in notification emails.
    PORTAL_URL: str = os.getenv("PORTAL_URL", "http://127.0.0.1:3000")

    # Who receives ADMIN alerts (lead qualified/enrolled, reward approved, payout
    # requested). Comma-separated so more recipients can be added without a code change.
    ADMIN_NOTIFY_EMAILS: str = os.getenv("ADMIN_NOTIFY_EMAILS", "sohail@bheuni.io")

    @property
    def admin_notify_list(self) -> list[str]:
        return [e.strip() for e in (self.ADMIN_NOTIFY_EMAILS or "").split(",") if e.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
