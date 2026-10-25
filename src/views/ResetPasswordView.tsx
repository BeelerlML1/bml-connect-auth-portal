/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { getSupabaseClient, getSupabaseConfig } from '../lib/supabase-client';
import {
  validatePassword,
  parseAuthUrl,
  getFriendlyErrorMessage,
  isTokenConsumed,
  markTokenConsumed,
  isRecoveryFlow,
} from '../lib/auth-helpers';
import { DeepLinkButton } from '../components/DeepLinkButton';

interface ResetPasswordViewProps {
  navigate: (to: string) => void;
  onOpenAndroidGuide: () => void;
}

type SessionVerificationState = 'checking' | 'verified' | 'unauthorized' | 'unconfigured';

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  navigate,
  onOpenAndroidGuide,
}) => {
  const [sessionState, setSessionState] = useState<SessionVerificationState>('checking');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordStrength = validatePassword(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = passwordStrength.isValid && passwordsMatch && !isSubmitting;

  useEffect(() => {
    const client = getSupabaseClient();
    const config = getSupabaseConfig();

    if (!client || !config.isConfigured) {
      setSessionState('unconfigured');
      return;
    }

    let isMounted = true;

    const checkGenuineSession = async () => {
      const parsed = parseAuthUrl(window.location.href);

      // 1. Check if URL contains auth error parameters
      if (parsed.error || parsed.errorCode) {
        const errorInfo = getFriendlyErrorMessage(parsed.errorCode || parsed.error, parsed.errorDescription);
        if (isMounted) {
          setErrorMessage(errorInfo.description);
          setSessionState('unauthorized');
        }
        return;
      }

      // 2. Token deduplication key
      const tokenKey = parsed.code
        ? `code:${parsed.code}`
        : parsed.tokenHash
        ? `token:${parsed.tokenHash}:${parsed.type || 'recovery'}`
        : parsed.accessToken
        ? `access_token:${parsed.accessToken.slice(0, 20)}`
        : null;

      if (tokenKey && isTokenConsumed(tokenKey)) {
        const { data: activeSession } = await client.auth.getSession();
        if (activeSession?.session && isMounted) {
          setUserEmail(activeSession.session.user?.email || null);
          setSessionState('verified');
          return;
        }
      }

      // Case A: Token Hash in URL (verifyOtp)
      if (parsed.tokenHash) {
        const otpType = (parsed.type || 'recovery') as any;
        const { data, error } = await client.auth.verifyOtp({
          token_hash: parsed.tokenHash,
          type: otpType,
        });

        if (error) {
          const errInfo = getFriendlyErrorMessage(error.name, error.message);
          if (isMounted) {
            setErrorMessage(errInfo.description);
            setSessionState('unauthorized');
          }
          return;
        }

        if (tokenKey) markTokenConsumed(tokenKey);
        if (isMounted) {
          setUserEmail(data.session?.user?.email || data.user?.email || null);
          setSessionState('verified');
        }
        if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
          window.history.replaceState({}, '', '/reset-password');
        }
        return;
      }

      // Case B: PKCE Auth Code in URL (exchangeCodeForSession)
      if (parsed.code) {
        const { data, error } = await client.auth.exchangeCodeForSession(parsed.code);
        if (error) {
          const { data: existing } = await client.auth.getSession();
          if (existing?.session && isMounted) {
            if (tokenKey) markTokenConsumed(tokenKey);
            setUserEmail(existing.session.user?.email || null);
            setSessionState('verified');
            if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
              window.history.replaceState({}, '', '/reset-password');
            }
            return;
          }

          const errInfo = getFriendlyErrorMessage(error.name, error.message);
          if (isMounted) {
            setErrorMessage(errInfo.description);
            setSessionState('unauthorized');
          }
          return;
        }

        if (tokenKey) markTokenConsumed(tokenKey);
        if (isMounted) {
          setUserEmail(data.session?.user?.email || data.user?.email || null);
          setSessionState('verified');
        }
        if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
          window.history.replaceState({}, '', '/reset-password');
        }
        return;
      }

      // Case C: Access token in URL hash fragment
      if (parsed.accessToken) {
        const { data, error } = await client.auth.setSession({
          access_token: parsed.accessToken,
          refresh_token: parsed.refreshToken || '',
        });

        if (error || !data.session) {
          const errInfo = getFriendlyErrorMessage('invalid_token', 'Could not establish session from link');
          if (isMounted) {
            setErrorMessage(errInfo.description);
            setSessionState('unauthorized');
          }
          return;
        }

        if (tokenKey) markTokenConsumed(tokenKey);
        if (isMounted) {
          setUserEmail(data.session.user?.email || null);
          setSessionState('verified');
        }
        if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
          window.history.replaceState({}, '', '/reset-password');
        }
        return;
      }

      // Case D: Active session check (navigated from /auth/callback or restored from storage)
      const { data: sessionData, error: sessionErr } = await client.auth.getSession();
      if (sessionErr || !sessionData?.session) {
        // Wait a short grace window in case async session storage is in progress
        await new Promise((res) => setTimeout(res, 350));
        const { data: retryData } = await client.auth.getSession();
        if (retryData?.session && isMounted) {
          setUserEmail(retryData.session.user?.email || null);
          setSessionState('verified');
          return;
        }

        if (isMounted) {
          setSessionState('unauthorized');
        }
        return;
      }

      if (isMounted) {
        setUserEmail(sessionData.session.user?.email || null);
        setSessionState('verified');
      }
    };

    checkGenuineSession();

    // Listen to Supabase auth state transitions
    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        if (isMounted) {
          setUserEmail(session?.user?.email || null);
          setSessionState('verified');
        }
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);

    // Validate password match
    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    // Validate password strength rules
    if (!passwordStrength.isValid) {
      setErrorMessage(passwordStrength.message || 'Password does not meet the minimum security requirements.');
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setErrorMessage('Authentication service connection is unavailable.');
      return;
    }

    // Validate that a genuine recovery session is active
    const { data: sessionCheck } = await client.auth.getSession();
    if (!sessionCheck?.session) {
      setErrorMessage('Your recovery session has expired or is no longer active. Please request a new recovery link from the BML CONNECT Android app.');
      setSessionState('unauthorized');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await client.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setIsSubmitting(false);
        setErrorMessage(error.message || 'Failed to update password.');
        return;
      }

      // Successful password change confirmed by Supabase
      setIsSuccess(true);
      setIsSubmitting(false);

      // Clean up browser session for security
      try {
        await client.auth.signOut();
      } catch {
        // Ignore signOut cleanup errors
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'An unexpected error occurred while updating your password.');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-14">
      <div className="relative p-6 sm:p-8 rounded-3xl bg-[#0D1836]/90 border border-cyan-500/30 backdrop-blur-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

        {/* State 1: Checking genuine session */}
        {sessionState === 'checking' && (
          <div className="text-center space-y-5 py-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/20 border border-cyan-500/40 flex items-center justify-center">
              <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
                Verifying Recovery Credentials...
              </h2>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Confirming cryptographic authorization with Supabase Auth.
              </p>
            </div>
          </div>
        )}

        {/* State 2: Unconfigured (Professional message, no customer inputs) */}
        {sessionState === 'unconfigured' && (
          <div className="text-center space-y-5 py-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-amber-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans']">
                Authentication Service Unavailable
              </h2>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                The password recovery service is temporarily unavailable or undergoing scheduled configuration. Please try again shortly or request assistance via the BML CONNECT Android app.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <DeepLinkButton
                action="error"
                label="Open BML CONNECT App"
                sublabel="Return to your Android device"
              />
              <button
                onClick={() => navigate('/')}
                className="py-3 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Return to Overview
              </button>
            </div>
          </div>
        )}

        {/* State 3: Unauthorized / No genuine session */}
        {sessionState === 'unauthorized' && (
          <div className="text-center space-y-5 py-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-red-400" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30">
                Security Verification
              </span>
              <h2 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans'] pt-1">
                No Active Recovery Session Found
              </h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Password reset links are time-limited, single-use, and cryptographically verified.
                You cannot access this form without an active, authentic recovery token from your email.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                {errorMessage}
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2 text-slate-300">
              <h4 className="font-semibold text-cyan-300">How to reset your password:</h4>
              <ol className="space-y-1.5 list-decimal list-inside text-slate-400 text-[11px]">
                <li>Open the <strong>BML CONNECT Android app</strong> on your phone.</li>
                <li>Tap <strong>Forgot Password?</strong> on the login screen.</li>
                <li>Enter your registered email address and tap <strong>Send Reset Link</strong>.</li>
                <li>Open the fresh email on your phone and tap the recovery link.</li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => navigate('/auth/error')}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                Common Link Issues
              </button>
              <button
                onClick={() => navigate('/')}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Return to Overview
              </button>
            </div>
          </div>
        )}

        {/* State 4: Genuine session verified - show secure reset form */}
        {sessionState === 'verified' && !isSuccess && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Genuine Recovery Session Verified</span>
              </div>
              <h2 className="text-2xl font-bold text-white font-['Plus_Jakarta_Sans']">
                Set New BML CONNECT Password
              </h2>
              <p className="text-xs text-slate-300">
                {userEmail ? (
                  <>
                    Updating credentials for <strong className="text-cyan-300">{userEmail}</strong>
                  </>
                ) : (
                  'Choose a strong new password for your mobile account.'
                )}
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Strength:</span>
                    <span
                      className={`font-bold ${
                        passwordStrength.score >= 3
                          ? 'text-cyan-400'
                          : passwordStrength.score === 2
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>

                  {/* Visual meter */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 rounded-full transition-all ${
                          step <= passwordStrength.score
                            ? passwordStrength.score >= 3
                              ? 'bg-cyan-400'
                              : passwordStrength.score === 2
                              ? 'bg-amber-400'
                              : 'bg-red-500'
                            : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400">{passwordStrength.message}</p>
                </div>
              )}

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p
                    className={`text-[11px] font-medium pt-0.5 ${
                      passwordsMatch ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match yet'}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isFormValid && !isSubmitting
                    ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-cyan-500/20 active:scale-[0.99] cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Updating Security Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-cyan-300" />
                    <span>Save New Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* State 5: Success state */}
        {isSuccess && (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Updated Successfully
              </span>
              <h2 className="text-2xl font-extrabold text-white font-['Plus_Jakarta_Sans'] pt-1">
                Password Successfully Reset!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Your BML CONNECT password has been changed. You can now open the Android app and log in with your new password.
              </p>
            </div>

            {/* Launch App Button & Manual Fallback */}
            <div className="pt-2 space-y-3">
              <DeepLinkButton
                action="login"
                label="Open BML CONNECT to Log In"
                sublabel="Tap to return to your mobile app login screen"
              />

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left text-xs space-y-1.5 text-slate-300">
                <span className="font-semibold text-cyan-300 block">Manual App Launch Fallback:</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  If your browser does not open the app automatically, simply switch back to the <strong>BML CONNECT Android app</strong> from your recent apps or phone home screen and sign in with your new password.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => navigate('/')}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Return to Portal Overview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
