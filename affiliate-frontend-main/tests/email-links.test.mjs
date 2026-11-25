import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { emailLinkDestination } from '../src/lib/email-link-destination.ts';

test('preserves supported destinations and rejects external or admin redirects', () => {
  for (const path of ['/dashboard', '/dashboard/referrals', '/dashboard/wallet', '/dashboard/settings']) {
    assert.equal(emailLinkDestination(`?next=${encodeURIComponent(path)}`), path);
  }
  for (const path of ['https://evil.example', '//evil.example', '/admin/payouts', '/dashboard/../admin', '/dashboard/unknown']) {
    assert.equal(emailLinkDestination(`?next=${encodeURIComponent(path)}`), '/dashboard');
  }
  assert.equal(emailLinkDestination(''), '/dashboard');
});

test('association files use the production identities and supported paths', () => {
  const android = JSON.parse(readFileSync('public/.well-known/assetlinks.json', 'utf8'));
  assert.equal(android[0].target.package_name, 'com.bheuni.ambassadorapp');
  assert.match(android[0].target.sha256_cert_fingerprints[0], /^([A-F0-9]{2}:){31}[A-F0-9]{2}$/);
  const apple = JSON.parse(readFileSync('public/.well-known/apple-app-site-association', 'utf8'));
  assert.equal(apple.applinks.details[0].appID, 'TU96D45469.com.bheuni.ambassadorapp');
  assert.deepEqual(apple.applinks.details[0].paths, ['/dashboard', '/dashboard/referrals', '/dashboard/wallet']);
});
