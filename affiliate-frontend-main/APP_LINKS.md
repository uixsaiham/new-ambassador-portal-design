# Ambassador email app links

Serve this project at `https://ambassador.bheuni.uk`. It supplies:

- `/.well-known/assetlinks.json`: production Android package and the SHA-256
  fingerprint copied from Play Console's Digital Asset Links JSON on 2026-11-08.
  Debug/upload certificates are intentionally not included.
- `/.well-known/apple-app-site-association`: Apple team `TU96D45469`, bundle
  `com.bheuni.ambassadorapp`, and only the three supported ambassador paths.

Both files must return HTTP 200, `Content-Type: application/json`, no login gate
and no redirect. Ensure the reverse proxy serves `.well-known` paths through to
Next.js rather than blocking dot-prefixed paths. Admin and CRM links stay on web.

The mobile release must register the same domain and map `/dashboard`,
`/dashboard/referrals`, `/dashboard/wallet` to Home, Referrals, Wallet. On iOS,
Associated Domains must be enabled in the provisioning profile. The backend's
`PORTAL_URL` must be `https://ambassador.bheuni.uk`. Check that the mail provider
has not rewritten delivered CTA URLs for click tracking.

Without an installed/associated mobile app, these are ordinary working web
pages. Password and Google login preserve the allowlisted `next` destination;
external URLs and admin paths cannot be selected through this parameter.

Deploy this frontend before distributing the new mobile app. Test real emails
on a Play-signed Android build and a signed iPhone build, signed in and out.
This code alone does not deploy the site or release either app.

Checks:

```sh
node --experimental-strip-types --test tests/email-links.test.mjs
npx tsc --noEmit
npm run build
curl -i https://ambassador.bheuni.uk/.well-known/assetlinks.json
curl -i https://ambassador.bheuni.uk/.well-known/apple-app-site-association
```
