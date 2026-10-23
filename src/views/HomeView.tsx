/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Smartphone,
  Lock,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Zap,
  Globe,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { getSupabaseConfig } from '../lib/supabase-client';
import { parseAuthUrl } from '../lib/auth-helpers';

interface HomeViewProps {
  navigate: (to: string, searchParams?: Record<string, string>) => void;
  onOpenAndroidGuide: () => void;
  onOpenConfigModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  navigate,
  onOpenAndroidGuide,
  onOpenConfigModal,
}) => {
  const config = getSupabaseConfig();
  const [testUrlInput, setTestUrlInput] = useState('');
  const [diagnosticResult, setDiagnosticResult] = useState<ReturnType<typeof parseAuthUrl> | null>(null);

  const handleRunDiagnostic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrlInput.trim()) return;
    const parsed = parseAuthUrl(testUrlInput.trim());
    setDiagnosticResult(parsed);
  };

  const handleNavigateWithTest = () => {
    if (!diagnosticResult) return;
    if (diagnosticResult.error || diagnosticResult.errorCode) {
      navigate('/auth/error', {
        error: diagnosticResult.error || 'error',
        error_code: diagnosticResult.errorCode || 'unknown',
        error_description: diagnosticResult.errorDescription || 'Diagnostic test link error',
      });
    } else if (diagnosticResult.type === 'recovery') {
      navigate('/reset-password', diagnosticResult.rawParams);
    } else {
      navigate('/auth/callback', diagnosticResult.rawParams);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 sm:pt-12">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-950/40">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-xs font-semibold text-cyan-300 font-['Plus_Jakarta_Sans']">
              Official Identity Gateway
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">BML CONNECT Mobile App</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-none font-['Plus_Jakarta_Sans']">
            BML <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-300">CONNECT</span>
            <br />
            Authentication Portal
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            The dedicated, secure public authentication bridge for the{' '}
            <strong className="text-white">BML CONNECT Android app</strong>. Safely verifies email confirmations
            and cryptographically authorizes password recovery sessions via Supabase Auth.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenAndroidGuide}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
            >
              <Smartphone className="w-4 h-4" />
              <span>Android Deployment Guide</span>
            </button>

            <button
              onClick={() => navigate('/reset-password')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md active:scale-95 transition-all"
            >
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span>Password Recovery</span>
            </button>

            <button
              onClick={onOpenConfigModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-medium text-xs text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/80 transition-all"
            >
              <span>{config.isConfigured ? 'Supabase: Active' : 'Supabase: Setup'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Portal Operational Status Grid */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg shadow-black/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Portal Status</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Operational
              </span>
            </div>
            <p className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
              Live & Secure
            </p>
            <p className="text-xs text-slate-400">
              High-availability web endpoint ready to receive authentication redirects.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg shadow-black/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Supabase Auth</span>
              <span
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  config.isConfigured ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    config.isConfigured ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                {config.isConfigured ? 'Connected' : 'Pending Keys'}
              </span>
            </div>
            <p className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
              PKCE Cryptographic
            </p>
            <p className="text-xs text-slate-400">
              Validates <code>token_hash</code> via official Supabase <code>verifyOtp</code> flow.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg shadow-black/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Android App Link</span>
              <span className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
                <Radio className="w-3 h-3 text-cyan-400" />
                Active
              </span>
            </div>
            <p className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
              <code>{config.deepLinkScheme}://</code>
            </p>
            <p className="text-xs text-slate-400">
              One-tap return directly to BML CONNECT on Android devices.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg shadow-black/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Netlify Hosting</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <Globe className="w-3 h-3 text-emerald-400" />
                Pre-configured
              </span>
            </div>
            <p className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
              Zero Cookie Lock
            </p>
            <p className="text-xs text-slate-400">
              Free public domain with automated SPA redirects (<code>/* /index.html 200</code>).
            </p>
          </div>
        </div>
      </section>

      {/* How it Works / 3-Step Journey */}
      <section className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Plus_Jakarta_Sans']">
            How BML CONNECT Authentication Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            A seamless, tamper-proof bridge built specifically for Android users:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="relative p-5 rounded-2xl bg-[#0D1836]/70 border border-slate-800/90 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-cyan-400 text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-white">Email Generated</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When a user signs up or requests a password reset inside the BML CONNECT Android app, Supabase sends a secure email containing a one-time link pointing to this portal.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative p-5 rounded-2xl bg-[#0D1836]/70 border border-slate-800/90 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-white">Cryptographic Verification</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tapping the email link opens this portal. The portal takes the one-time <code>token_hash</code> and validates it directly against Supabase using official PKCE recovery/verification APIs.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative p-5 rounded-2xl bg-[#0D1836]/70 border border-slate-800/90 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-white">Direct App Return</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Upon successful verification or password reset, the user is presented with a direct button that launches the BML CONNECT Android app, resuming their session instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Diagnostic URL Tester (Safe Link Inspector) */}
      <section className="max-w-3xl mx-auto px-4">
        <div className="p-6 rounded-2xl bg-[#0F1E3D]/80 border border-cyan-500/25 shadow-xl shadow-cyan-950/30 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Search className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Email Link Diagnostic Inspector</h3>
                <p className="text-xs text-slate-400">
                  Paste any Supabase email confirmation or recovery URL to safely inspect parameters
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
              Safe Sandbox
            </span>
          </div>

          <form onSubmit={handleRunDiagnostic} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="https://.../auth/callback?token_hash=...&type=signup or recovery"
                value={testUrlInput}
                onChange={(e) => setTestUrlInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 font-mono"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Inspect URL</span>
              </button>
            </div>
          </form>

          {/* Diagnostic Result */}
          {diagnosticResult && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-slate-300">Parameter Analysis:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    diagnosticResult.hasAuthParams
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {diagnosticResult.hasAuthParams ? 'Auth Tokens Detected' : 'No Valid Tokens'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-500">Flow Type: </span>
                  <span className="text-cyan-300">{diagnosticResult.type || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Token Hash: </span>
                  <span className="text-slate-300">
                    {diagnosticResult.tokenHash
                      ? `${diagnosticResult.tokenHash.slice(0, 10)}... (${diagnosticResult.tokenHash.length} chars)`
                      : 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Error Code: </span>
                  <span className={diagnosticResult.errorCode ? 'text-red-400' : 'text-slate-300'}>
                    {diagnosticResult.errorCode || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Error Desc: </span>
                  <span className={diagnosticResult.errorDescription ? 'text-red-300' : 'text-slate-300'}>
                    {diagnosticResult.errorDescription || 'None'}
                  </span>
                </div>
              </div>

              {diagnosticResult.hasAuthParams && (
                <button
                  onClick={handleNavigateWithTest}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors mt-2"
                >
                  <span>Simulate Real Route with These Parameters</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
