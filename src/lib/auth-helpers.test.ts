/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAuthUrl,
  validatePassword,
  validateSupabaseConfig,
  getFriendlyErrorMessage,
  getAndroidDeepLink,
} from './auth-helpers';

test('parseAuthUrl correctly parses Supabase PKCE query parameters', () => {
  const url = 'https://portal.bmlconnect.com/auth/callback?token_hash=pkce_abc123xyz&type=signup&next=/dashboard';
  const parsed = parseAuthUrl(url);

  assert.equal(parsed.tokenHash, 'pkce_abc123xyz');
  assert.equal(parsed.type, 'signup');
  assert.equal(parsed.next, '/dashboard');
  assert.equal(parsed.hasAuthParams, true);
  assert.equal(parsed.error, null);
});

test('parseAuthUrl handles recovery tokens and hash fragments', () => {
  const url = 'https://portal.bmlconnect.com/auth/callback?token_hash=recov_987654&type=recovery';
  const parsed = parseAuthUrl(url);

  assert.equal(parsed.tokenHash, 'recov_987654');
  assert.equal(parsed.type, 'recovery');
  assert.equal(parsed.hasAuthParams, true);
});

test('parseAuthUrl correctly captures Supabase errors in query or hash', () => {
  const url = 'https://portal.bmlconnect.com/auth/callback?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';
  const parsed = parseAuthUrl(url);

  assert.equal(parsed.error, 'access_denied');
  assert.equal(parsed.errorCode, 'otp_expired');
  assert.match(parsed.errorDescription || '', /invalid or has expired/);
  assert.equal(parsed.hasAuthParams, true);
});

test('validatePassword enforces minimum length and security strength', () => {
  const shortPass = validatePassword('12345');
  assert.equal(shortPass.isValid, false);
  assert.equal(shortPass.hasMinLength, false);

  const weakPass = validatePassword('abcdefgh');
  assert.equal(weakPass.hasMinLength, true);
  assert.equal(weakPass.score < 3, true);

  const strongPass = validatePassword('BmlConnect#2026!');
  assert.equal(strongPass.isValid, true);
  assert.equal(strongPass.hasMinLength, true);
  assert.equal(strongPass.hasUppercase, true);
  assert.equal(strongPass.hasLowercase, true);
  assert.equal(strongPass.hasNumber, true);
  assert.equal(strongPass.hasSpecial, true);
  assert.equal(strongPass.label, 'Strong');
});

test('validateSupabaseConfig rejects service_role secret keys', () => {
  const validCheck = validateSupabaseConfig('https://xyzcompany.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon_key_demo');
  assert.equal(validCheck.isValid, true);
  assert.equal(validCheck.isServiceRoleKey, false);

  const secretCheck = validateSupabaseConfig('https://xyzcompany.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role_secret');
  assert.equal(secretCheck.isValid, false);
  assert.equal(secretCheck.isServiceRoleKey, true);
  assert.match(secretCheck.errorMessage || '', /CRITICAL SECURITY ERROR/);
});

test('getFriendlyErrorMessage maps otp_expired to clear user advice', () => {
  const result = getFriendlyErrorMessage('otp_expired', 'Email link is invalid or has expired');
  assert.equal(result.isExpired, true);
  assert.match(result.title, /Expired/);
  assert.match(result.resolution, /BML CONNECT Android app/);
});

test('getAndroidDeepLink formats custom scheme links properly', () => {
  const link = getAndroidDeepLink('confirmed', 'bmlconnect', { email: 'user@example.com' });
  assert.equal(link, 'bmlconnect://auth/confirmed?email=user%40example.com');
});
