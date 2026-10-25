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
import {
  getSupabaseConfig,
  BML_DEEP_LINK_SCHEME,
} from './supabase-client';

// 1. Missing environment variables & configuration validation
test('validateSupabaseConfig handles missing environment variables correctly', () => {
  const missingBoth = validateSupabaseConfig('', '');
  assert.equal(missingBoth.isValid, false);
  assert.equal(missingBoth.hasUrl, false);
  assert.equal(missingBoth.hasAnonKey, false);

  const missingKey = validateSupabaseConfig('https://myproject.supabase.co', '');
  assert.equal(missingKey.isValid, false);
  assert.equal(missingKey.hasUrl, true);
  assert.equal(missingKey.hasAnonKey, false);

  const missingUrl = validateSupabaseConfig('', 'anon-publishable-key');
  assert.equal(missingUrl.isValid, false);
  assert.equal(missingUrl.hasUrl, false);
  assert.equal(missingUrl.hasAnonKey, true);
});

// 2. Valid and invalid configuration
test('validateSupabaseConfig rejects non-HTTPS or malformed URLs', () => {
  const malformed = validateSupabaseConfig('not-a-valid-url', 'anon-key');
  assert.equal(malformed.isValid, false);
  assert.match(malformed.errorMessage || '', /Invalid Supabase URL/i);

  const nonHttp = validateSupabaseConfig('ftp://myproject.supabase.co', 'anon-key');
  assert.equal(nonHttp.isValid, false);
});

test('validateSupabaseConfig accepts valid Supabase HTTPS URL and anon key', () => {
  const valid = validateSupabaseConfig('https://abcdefghijklm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon_key_public');
  assert.equal(valid.isValid, true);
  assert.equal(valid.isServiceRoleKey, false);
  assert.equal(valid.sanitizedUrl, 'https://abcdefghijklm.supabase.co');
});

test('validateSupabaseConfig actively rejects service_role and secret keys', () => {
  const secretKey = validateSupabaseConfig('https://myproject.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role_secret');
  assert.equal(secretKey.isValid, false);
  assert.equal(secretKey.isServiceRoleKey, true);
  assert.match(secretKey.errorMessage || '', /CRITICAL SECURITY ERROR/);

  const secretPrefix = validateSupabaseConfig('https://myproject.supabase.co', 'sbp_1234567890abcdef');
  assert.equal(secretPrefix.isValid, false);
  assert.equal(secretPrefix.isServiceRoleKey, true);
});

// 3. Absence of customer-facing configuration form & fixed scheme
test('Supabase client module uses fixed deep-link scheme and build-time env', () => {
  assert.equal(BML_DEEP_LINK_SCHEME, 'bmlconnect');

  const config = getSupabaseConfig();
  // Fixed scheme should always be bmlconnect
  assert.equal(config.deepLinkScheme, 'bmlconnect');
  // Should have an isConfigured boolean property
  assert.equal(typeof config.isConfigured, 'boolean');
});

// 4. Recovery callback routing vs. normal sign-in callback
test('parseAuthUrl distinguishes password recovery callbacks from signup callbacks', () => {
  const recoveryUrl = 'https://auth.bmlconnect.com/auth/callback?token_hash=pkce_recovery_token_123&type=recovery';
  const parsedRecovery = parseAuthUrl(recoveryUrl);

  assert.equal(parsedRecovery.type, 'recovery');
  assert.equal(parsedRecovery.tokenHash, 'pkce_recovery_token_123');
  assert.equal(parsedRecovery.hasAuthParams, true);

  const signupUrl = 'https://auth.bmlconnect.com/auth/callback?token_hash=pkce_signup_token_456&type=signup';
  const parsedSignup = parseAuthUrl(signupUrl);

  assert.equal(parsedSignup.type, 'signup');
  assert.equal(parsedSignup.tokenHash, 'pkce_signup_token_456');
  assert.notEqual(parsedSignup.type, parsedRecovery.type);
});

test('parseAuthUrl handles PKCE authorization code exchange parameter', () => {
  const codeUrl = 'https://auth.bmlconnect.com/auth/callback?code=supabase_auth_code_789&next=/reset-password';
  const parsed = parseAuthUrl(codeUrl);

  assert.equal(parsed.code, 'supabase_auth_code_789');
  assert.equal(parsed.next, '/reset-password');
  assert.equal(parsed.hasAuthParams, true);
});

// 5. Password-reset validation
test('validatePassword enforces length and complexity rules', () => {
  const tooShort = validatePassword('Short1!');
  assert.equal(tooShort.isValid, false);
  assert.equal(tooShort.hasMinLength, false);

  const noNumbersOrSymbols = validatePassword('AllLettersOnly');
  assert.equal(noNumbersOrSymbols.isValid, false);

  const validPassword = validatePassword('BMLconnect#2026');
  assert.equal(validPassword.isValid, true);
  assert.equal(validPassword.hasMinLength, true);
  assert.equal(validPassword.hasUppercase, true);
  assert.equal(validPassword.hasLowercase, true);
  assert.equal(validPassword.hasNumber, true);
  assert.equal(validPassword.score >= 3, true);
  assert.equal(validPassword.label === 'Good' || validPassword.label === 'Strong', true);
});

// 6. Invalid and expired recovery sessions
test('getFriendlyErrorMessage diagnoses expired and single-use links', () => {
  const expired = getFriendlyErrorMessage('otp_expired', 'Token has expired');
  assert.equal(expired.isExpired, true);
  assert.match(expired.title, /Expired/i);
  assert.match(expired.resolution, /BML CONNECT Android app/i);

  const alreadyUsed = getFriendlyErrorMessage('access_denied', 'Link already used or consumed');
  assert.equal(alreadyUsed.isExpired, true);
  assert.match(alreadyUsed.title, /Already Used/i);

  const rateLimited = getFriendlyErrorMessage('over_email_send_rate_limit', 'Too many requests');
  assert.equal(rateLimited.isRateLimit, true);
});

// 7. Login, logout, and deep link behavior
test('getAndroidDeepLink generates correct intent destinations without credential leaks', () => {
  const loginLink = getAndroidDeepLink('login', 'bmlconnect');
  assert.equal(loginLink, 'bmlconnect://auth/login');

  const recoveryLink = getAndroidDeepLink('recovery', 'bmlconnect');
  assert.equal(recoveryLink, 'bmlconnect://auth/recovery');

  const confirmedLink = getAndroidDeepLink('confirmed', 'bmlconnect', { email: 'test@bmlconnect.com' });
  assert.equal(confirmedLink, 'bmlconnect://auth/confirmed?email=test%40bmlconnect.com');

  const errorLink = getAndroidDeepLink('error', 'bmlconnect');
  assert.equal(errorLink, 'bmlconnect://auth/error');

  // Verify that tokens and passwords are NEVER embedded in deep link URLs
  assert.equal(loginLink.includes('password'), false);
  assert.equal(loginLink.includes('token'), false);
});
