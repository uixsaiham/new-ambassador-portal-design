# Email destinations

Set production `PORTAL_URL=https://ambassador.bheuni.uk` (the development default
remains localhost). HTML and plain-text email variants use the same destination:

- Welcome: `/dashboard`
- Referral received/qualified/enrolled: `/dashboard/referrals`
- Reward credited and payout paid: `/dashboard/wallet`

These HTTPS links also act as Android App Links / iOS Universal Links once the
frontend association files are deployed and the updated mobile apps released.
The backend does not need to detect the recipient's device or add auth tokens
to notification links. The app or website handles login normally.

Admin emails keep `/admin/payouts`, counsellor emails keep the CRM URL, and
registration/password-reset emails keep the OTP flow. If email-provider click
tracking is enabled, verify the delivered links still point directly to the
associated portal domain, or exempt these links from rewriting.

Run `python -m pytest tests/test_email_links.py -q` to test destinations without
sending mail. The tests capture the outgoing HTML and plain text in memory.
