/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Mail,
  Home,
  ShieldAlert,
} from 'lucide-react';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getSupabaseClient, getSupabaseConfig } from '../lib/supabase-client';
import {
  parseAuthUrl,
  getFriendlyErrorMessage,
  FriendlyError,
  isRecoveryFlow,
  isTokenConsumed,
  markTokenConsumed,
  getInFlightExchange,
  setInFlightExchange,
  clearInFlightExchange,
} from '../lib/auth-helpers';
import { DeepLinkButton } from '../components/DeepLinkButton';

interface AuthCallbackViewProps {
  navigate: (to: string, searchParams?: Record<string, string>) => void;
  onOpenAndroidGuide: () => void;
}

type CallbackStatus =
  | 'analyzing'
  | 'verifying'
  | 'success'
  | 'redirecting_recovery'
  | 'unconfigured'
  | 'error'
  | 'no_params';

export const AuthCallbackView: React.FC<AuthCallbackViewProps> = ({
  navigate,
  onOpenAndroidGuide,
}) => {
  const [status, setStatus] = useState<CallbackStatus>('analyzing');
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [friendlyError, setFriendlyError] = useState<FriendlyError | null>(null);

  useEffect(() => {
    const fullUrl = window.location.href;
    const parsed = parseAuthUrl(fullUrl);

    // 1. Check if error is present in query or hash
    if (parsed.error || parsed.errorCode) {
      const errorDetails = getFriendlyErrorMessage(parsed.errorCode || parsed.error, parsed.errorDescription);
      setFriendlyError(errorDetails);
      setStatus('error');
      return;
    }

    // 2. Check if authentication parameters exist
    if (!parsed.tokenHash && !parsed.code && !parsed.accessToken) {
      // Check if user already has an active authenticated session
      const client = getSupabaseClient();
      if (client) {
        client.auth.getSession().then(({ data }) => {
          if (data.session) {
            if (isRecoveryFlow(parsed, data.session)) {
              navigate('/reset-password');
              return;
            }
          }
          setStatus('no_params');
        }).catch(() => {
          setStatus('no_params');
        });
      } else {
        setStatus('no_params');
      }
      return;
    }

    // 3. Check if Supabase client is configured via fixed build-time environment variables
    const client = getSupabaseClient();
    const config = getSupabaseConfig();
    if (!client || !config.isConfigured) {
      setStatus('unconfigured');
      return;
    }

    // 4. Token deduplication key
    const tokenKey = parsed.code
      ? `code:${parsed.code}`
      : parsed.tokenHash
      ? `token:${parsed.tokenHash}:${parsed.type || 'unknown'}`
      : `access_token:${(parsed.accessToken || '').slice(0, 20)}`;

    // If this token was already exchanged in the current session, don't re-send to Supabase
    if (isTokenConsumed(tokenKey)) {
      client.auth.getSession().then(({ data }) => {
        if (isRecoveryFlow(parsed, data.session)) {
          navigate('/reset-password');
        } else {
          setVerifiedEmail(data.session?.user?.email || null);
          setStatus('success');
        }
      });
      return;
    }

    // 5. Perform official Supabase token exchange (with in-flight deduplication)
    const performExchange = async () => {
      setStatus('verifying');

      // If already in flight, reuse existing promise to prevent duplicate single-use consumption
      const existingPromise = getInFlightExchange<any>(tokenKey);
      if (existingPromise) {
        try {
          const res = await existingPromise;
          if (res?.isRecovery) {
            setStatus('redirecting_recovery');
            navigate('/reset-password');
          } else if (res?.success) {
            setVerifiedEmail(res.email || null);
            setStatus('success');
          } else if (res?.error) {
            setFriendlyError(res.error);
            setStatus('error');
          }
        } catch (err: any) {
          setFriendlyError(getFriendlyErrorMessage('exchange_error', err.message));
          setStatus('error');
        }
        return;
      }

      const exchangePromise = (async () => {
        try {
          // Case A: PKCE Token Hash (Email verification or recovery)
          if (parsed.tokenHash && parsed.type) {
            const otpType = parsed.type as EmailOtpType;
            const { data, error } = await client.auth.verifyOtp({
              token_hash: parsed.tokenHash,
              type: otpType,
            });

            if (error) {
              const errInfo = getFriendlyErrorMessage(error.name, error.message);
              return { success: false, isRecovery: false, error: errInfo };
            }

            markTokenConsumed(tokenKey);
            const isRecovery = otpType === 'recovery' || isRecoveryFlow(parsed, data.session);
            const email = data.user?.email || data.session?.user?.email || null;
            return { success: true, isRecovery, email };
          }

          // Case B: PKCE Auth Code flow
          if (parsed.code) {
            const { data, error } = await client.auth.exchangeCodeForSession(parsed.code);

            if (error) {
              // Before failing, check if session was established concurrently or previously
              const { data: sessionData } = await client.auth.getSession();
              if (sessionData?.session) {
                markTokenConsumed(tokenKey);
                const isRecovery = isRecoveryFlow(parsed, sessionData.session);
                const email = sessionData.session.user?.email || null;
                return { success: true, isRecovery, email };
              }
              const errInfo = getFriendlyErrorMessage(error.name, error.message);
              return { success: false, isRecovery: false, error: errInfo };
            }

            markTokenConsumed(tokenKey);
            const isRecovery = isRecoveryFlow(parsed, data.session);
            const email = data.user?.email || data.session?.user?.email || null;
            return { success: true, isRecovery, email };
          }

          // Case C: Hash token (Implicit flow)
          if (parsed.accessToken) {
            const { data, error } = await client.auth.setSession({
              access_token: parsed.accessToken,
              refresh_token: parsed.refreshToken || '',
            });

            if (error || !data.session) {
              const errInfo = getFriendlyErrorMessage('invalid_token', 'Could not establish session from link');
              return { success: false, isRecovery: false, error: errInfo };
            }

            markTokenConsumed(tokenKey);
            const isRecovery = isRecoveryFlow(parsed, data.session);
            const email = data.session.user?.email || null;
            return { success: true, isRecovery, email };
          }

          return { success: false, isRecovery: false, error: null };
        } finally {
          clearInFlightExchange(tokenKey);
        }
      })();

      setInFlightExchange(tokenKey, exchangePromise);

      try {
        const result = await exchangePromise;
        if (result.isRecovery) {
          setStatus('redirecting_recovery');
          // Clean sensitive token from history bar before navigation
          if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
            window.history.replaceState({}, '', '/auth/callback');
          }
          setTimeout(() => {
            navigate('/reset-password');
          }, 350);
        } else if (result.success) {
          setVerifiedEmail(result.email || null);
          setStatus('success');
        } else if (result.error) {
          setFriendlyError(result.error);
          setStatus('error');
        } else {
          setStatus('no_params');
        }
      } catch (err: any) {
        setFriendlyError(getFriendlyErrorMessage('unexpected_error', err.message || 'Network communication error'));
        setStatus('error');
      }
    };

    performExchange();
  }, [navigate]);

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-16">
      <div className="relative p-6 sm:p-8 rounded-3xl bg-[#0D1836]/90 border border-cyan-500/30 backdrop-blur-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

        {/* State 1: Verifying */}
        {(status === 'analyzing' || status === 'verifying') && (
          <div className="text-center space-y-6 py-6">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 animate-ping opacity-30" />
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-cyan-500/40 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans']">
                Verifying Security Token...
              </h2>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Communicating with the Supabase authentication server to validate your one-time cryptographic token.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>PKCE Official Verification Flow</span>
            </div>
          </div>
        )}

        {/* State 2: Redirecting to Recovery */}
        {status === 'redirecting_recovery' && (
          <div className="text-center space-y-6 py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans']">
                Recovery Token Verified!
              </h2>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Opening the secure password reset screen for your BML CONNECT account...
              </p>
            </div>

            <button
              onClick={() => navigate('/reset-password')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 inline-flex items-center gap-2"
            >
              <span>Continue to Password Reset</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* State 3: Email Confirmed Success */}
        {status === 'success' && (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/15">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Verified Successfully
              </span>
              <h2 className="text-2xl font-extrabold text-white font-['Plus_Jakarta_Sans'] pt-1">
                Email Address Confirmed!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Your BML CONNECT email address has been verified. You can now return to the Android mobile app to sign in.
              </p>
            </div>

            {verifiedEmail && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center gap-2 text-xs font-mono text-cyan-300">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{verifiedEmail}</span>
              </div>
            )}

            {/* Launch App Button */}
            <div className="pt-2">
              <DeepLinkButton
                action="confirmed"
                params={verifiedEmail ? { email: verifiedEmail } : undefined}
                label="Open BML CONNECT App"
                sublabel="Tap to return to your mobile app"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => navigate('/')}
                className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Portal Overview</span>
              </button>
            </div>
          </div>
        )}

        {/* State 4: Supabase Unconfigured (Professional message, NO customer input fields) */}
        {status === 'unconfigured' && (
          <div className="text-center space-y-5 py-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-amber-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans']">
                Authentication Service Unavailable
              </h2>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                The authentication service is temporarily unavailable or undergoing scheduled configuration. Please try again shortly or contact BML CONNECT support from the mobile application.
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

        {/* State 5: Token Error / Expired */}
        {status === 'error' && (
          <div className="text-center space-y-5 py-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans']">
                {friendlyError?.title || 'Authentication Failed'}
              </h2>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                {friendlyError?.description}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2">
              <span className="font-semibold text-slate-300 block">Recommended Action:</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {friendlyError?.resolution}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => navigate('/auth/error')}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2"
              >
                <span>Read Troubleshooting Guide</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Return Home
              </button>
            </div>
          </div>
        )}

        {/* State 6: No Parameters */}
        {status === 'no_params' && (
          <div className="text-center space-y-5 py-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Mail className="w-7 h-7 text-slate-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans']">
                No Verification Token Found
              </h2>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                This URL does not contain any authentication parameters or token hash. Please click the full link directly from your confirmation or password recovery email.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500"
              >
                Go to Portal Overview
              </button>
              <button
                onClick={() => navigate('/auth/error')}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                View Error Explanations
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
