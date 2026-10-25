/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParsedAuthParams {
  tokenHash: string | null;
  type: string | null;
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  next: string | null;
  hasAuthParams: boolean;
  rawParams: Record<string, string>;
}

/**
 * Extracts authentication parameters from both search parameters and hash fragment.
 * Supports standard Supabase PKCE (?token_hash=...&type=...), OAuth code (?code=...),
 * and implicit hash fragment (#access_token=... or #error=...).
 */
export function parseAuthUrl(urlInput: string): ParsedAuthParams {
  let searchStr = '';
  let hashStr = '';

  try {
    // Handle both full URLs and relative paths
    const url = new URL(urlInput, 'https://portal.bmlconnect.internal');
    searchStr = url.search;
    hashStr = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  } catch {
    // Fallback manual parser for partial or malformed input
    const [pathAndSearch, ...hashParts] = urlInput.split('#');
    hashStr = hashParts.join('#');
    const searchIdx = pathAndSearch.indexOf('?');
    if (searchIdx !== -1) {
      searchStr = pathAndSearch.slice(searchIdx);
    }
  }

  const searchParams = new URLSearchParams(searchStr);
  const hashParams = new URLSearchParams(hashStr);

  const rawParams: Record<string, string> = {};
  searchParams.forEach((v, k) => { rawParams[k] = v; });
  hashParams.forEach((v, k) => { rawParams[k] = v; });

  const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash') || null;
  const type = searchParams.get('type') || hashParams.get('type') || null;
  const code = searchParams.get('code') || hashParams.get('code') || null;
  const accessToken = hashParams.get('access_token') || searchParams.get('access_token') || null;
  const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token') || null;

  const error = searchParams.get('error') || hashParams.get('error') || null;
  const errorCode = searchParams.get('error_code') || hashParams.get('error_code') || null;
  const errorDescription = searchParams.get('error_description') || hashParams.get('error_description') || null;
  const next = searchParams.get('next') || hashParams.get('next') || null;

  const hasAuthParams = Boolean(tokenHash || code || accessToken || error || errorCode);

  return {
    tokenHash,
    type,
    code,
    accessToken,
    refreshToken,
    error,
    errorCode,
    errorDescription,
    next,
    hasAuthParams,
    rawParams,
  };
}

/**
 * Determines whether the parsed authentication parameters or established session
 * represent a password recovery operation versus a normal sign-in or email confirmation.
 */
export function isRecoveryFlow(parsed: ParsedAuthParams, session?: any): boolean {
  if (parsed.type === 'recovery') return true;
  if (parsed.next === '/reset-password' || parsed.next === 'reset-password') return true;
  if (parsed.rawParams['type'] === 'recovery') return true;

  // Supabase GoTrue sets AMR (Authentication Method Reference) to recovery
  if (session?.amr && Array.isArray(session.amr)) {
    if (session.amr.some((m: any) => m && m.method === 'recovery')) return true;
  }

  // Check if session user has recent recovery timestamp
  if (session?.user?.recovery_sent_at) {
    const sentTime = new Date(session.user.recovery_sent_at).getTime();
    if (!isNaN(sentTime) && Date.now() - sentTime < 24 * 60 * 60 * 1000) {
      return true;
    }
  }

  return false;
}

// Global in-memory cache to prevent duplicate token/code exchanges across React StrictMode & re-renders
const inFlightExchanges = new Map<string, Promise<any>>();
const consumedTokens = new Set<string>();

export function isTokenConsumed(token: string): boolean {
  return consumedTokens.has(token);
}

export function markTokenConsumed(token: string): void {
  consumedTokens.add(token);
}

export function getInFlightExchange<T = any>(token: string): Promise<T> | undefined {
  return inFlightExchanges.get(token);
}

export function setInFlightExchange<T = any>(token: string, promise: Promise<T>): void {
  inFlightExchanges.set(token, promise);
}

export function clearInFlightExchange(token: string): void {
  inFlightExchanges.delete(token);
}

export function resetTokenExchangeStateForTests(): void {
  consumedTokens.clear();
  inFlightExchanges.clear();
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isValid: boolean;
  message: string;
}

/**
 * Validates a new password against security rules.
 * Requires at least 8 characters, with recommended complexity.
 */
export function validatePassword(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasUppercase && hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  let label: PasswordStrength['label'] = 'Weak';
  if (score === 2) label = 'Fair';
  else if (score === 3) label = 'Good';
  else if (score >= 4) label = 'Strong';

  const isValid = hasMinLength && (hasUppercase || hasLowercase) && (hasNumber || hasSpecial);

  let message = 'Password must be at least 8 characters long.';
  if (!hasMinLength) {
    message = 'Password is too short (minimum 8 characters).';
  } else if (!isValid) {
    message = 'Combine letters and numbers or symbols for better security.';
  } else if (score >= 3) {
    message = 'Strong password ready for BML CONNECT.';
  }

  return {
    score,
    label,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    isValid,
    message,
  };
}

export interface SupabaseConfigValidation {
  isValid: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  isServiceRoleKey: boolean;
  errorMessage?: string;
  sanitizedUrl?: string;
}

/**
 * Validates public Supabase credentials.
 * Ensures the URL is a valid HTTPS endpoint and checks that a service_role key is NEVER used.
 */
export function validateSupabaseConfig(url?: string | null, anonKey?: string | null): SupabaseConfigValidation {
  const cleanUrl = (url || '').trim();
  const cleanKey = (anonKey || '').trim();

  const hasUrl = cleanUrl.length > 0;
  const hasAnonKey = cleanKey.length > 0;

  if (!hasUrl && !hasAnonKey) {
    return {
      isValid: false,
      hasUrl: false,
      hasAnonKey: false,
      isServiceRoleKey: false,
      errorMessage: 'Supabase URL and Anon Key are missing.',
    };
  }

  if (!hasUrl) {
    return {
      isValid: false,
      hasUrl: false,
      hasAnonKey,
      isServiceRoleKey: false,
      errorMessage: 'Supabase Project URL is required.',
    };
  }

  if (!hasAnonKey) {
    return {
      isValid: false,
      hasUrl,
      hasAnonKey: false,
      isServiceRoleKey: false,
      errorMessage: 'Supabase Anon Public Key is required.',
    };
  }

  // Validate URL format
  let validUrl: URL;
  try {
    validUrl = new URL(cleanUrl);
    if (validUrl.protocol !== 'https:' && validUrl.protocol !== 'http:') {
      return {
        isValid: false,
        hasUrl: true,
        hasAnonKey: true,
        isServiceRoleKey: false,
        errorMessage: 'Supabase URL must start with https://',
      };
    }
  } catch {
    return {
      isValid: false,
      hasUrl: true,
      hasAnonKey: true,
      isServiceRoleKey: false,
      errorMessage: 'Invalid Supabase URL format.',
    };
  }

  // Security check: Never accept service_role key
  const lowerKey = cleanKey.toLowerCase();
  const isServiceRoleKey = lowerKey.includes('service_role') || lowerKey.startsWith('sbp_') || lowerKey.includes('service-role');

  if (isServiceRoleKey) {
    return {
      isValid: false,
      hasUrl: true,
      hasAnonKey: true,
      isServiceRoleKey: true,
      errorMessage: 'CRITICAL SECURITY ERROR: You entered a service_role or secret key! Frontend apps must ONLY use the public "anon" publishable key.',
    };
  }

  return {
    isValid: true,
    hasUrl: true,
    hasAnonKey: true,
    isServiceRoleKey: false,
    sanitizedUrl: validUrl.origin,
  };
}

export interface FriendlyError {
  title: string;
  description: string;
  resolution: string;
  isExpired: boolean;
  isRateLimit: boolean;
}

/**
 * Returns user-friendly diagnostics for Supabase Auth errors.
 */
export function getFriendlyErrorMessage(errorCode?: string | null, errorDescription?: string | null): FriendlyError {
  const code = (errorCode || '').toLowerCase();
  const desc = (errorDescription || '').toLowerCase();

  if (code === 'otp_expired' || desc.includes('expired') || desc.includes('token has expired')) {
    return {
      title: 'Authentication Link Expired',
      description: 'This email verification or password reset link has expired. For your security, one-time security links are time-limited (typically valid for 1 hour).',
      resolution: 'Open the BML CONNECT Android app and request a fresh link, then click the new link in your latest email.',
      isExpired: true,
      isRateLimit: false,
    };
  }

  if (desc.includes('already used') || desc.includes('single-use') || desc.includes('already confirmed')) {
    return {
      title: 'Link Already Used',
      description: 'This one-time verification token has already been consumed. Supabase links can only be used once to protect your account.',
      resolution: 'If you already verified your account, open the BML CONNECT app to log in. If you need to reset your password, request a new link.',
      isExpired: true,
      isRateLimit: false,
    };
  }

  if (code === 'access_denied' || desc.includes('access denied')) {
    return {
      title: 'Access Denied',
      description: 'Access was denied by the authentication server. The link may have been revoked or invalidated by a newer request.',
      resolution: 'Please trigger a new verification or password reset request directly in the BML CONNECT Android app.',
      isExpired: false,
      isRateLimit: false,
    };
  }

  if (code.includes('rate_limit') || desc.includes('rate limit') || desc.includes('too many')) {
    return {
      title: 'Security Rate Limit Exceeded',
      description: 'Too many authentication attempts were made in a short period of time.',
      resolution: 'Please wait 5 to 15 minutes before requesting a new email in the BML CONNECT app.',
      isExpired: false,
      isRateLimit: true,
    };
  }

  return {
    title: 'Authentication Link Invalid',
    description: errorDescription || 'The authentication parameters received were incomplete, malformed, or rejected by Supabase.',
    resolution: 'Make sure you tapped the entire link in your email. If the problem persists, request a new link in the BML CONNECT Android app.',
    isExpired: false,
    isRateLimit: false,
  };
}

/**
 * Constructs an Android Deep Link URL to return to the BML CONNECT app.
 */
export function getAndroidDeepLink(
  action: 'confirmed' | 'recovery' | 'login' | 'error',
  scheme = 'bmlconnect',
  params?: Record<string, string>
): string {
  const search = new URLSearchParams(params || {}).toString();
  const query = search ? `?${search}` : '';
  return `${scheme}://auth/${action}${query}`;
}
