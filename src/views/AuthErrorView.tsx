/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  Smartphone,
  RotateCcw,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Home,
} from 'lucide-react';
import { parseAuthUrl, getFriendlyErrorMessage } from '../lib/auth-helpers';

interface AuthErrorViewProps {
  navigate: (to: string) => void;
  onOpenAndroidGuide: () => void;
}

export const AuthErrorView: React.FC<AuthErrorViewProps> = ({
  navigate,
  onOpenAndroidGuide,
}) => {
  const [activeError, setActiveError] = useState<{
    code: string;
    description: string;
    title: string;
    resolution: string;
  }>({
    code: 'otp_expired',
    description: 'Email link is invalid or has expired',
    title: 'Authentication Link Expired',
    resolution: 'Open the BML CONNECT Android app and request a fresh link.',
  });

  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [testLink, setTestLink] = useState('');
  const [analyzed, setAnalyzed] = useState<{ title: string; resolution: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get('error_code') || params.get('error') || 'otp_expired';
    const errorDesc = params.get('error_description') || 'Email link is invalid or has expired';

    const friendly = getFriendlyErrorMessage(errorCode, errorDesc);
    setActiveError({
      code: errorCode,
      description: errorDesc,
      title: friendly.title,
      resolution: friendly.resolution,
    });
  }, []);

  const handleInspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testLink.trim()) return;
    const parsed = parseAuthUrl(testLink);
    const result = getFriendlyErrorMessage(parsed.errorCode || parsed.error, parsed.errorDescription);
    setAnalyzed(result);
  };

  const errorCategories = [
    {
      code: 'otp_expired',
      title: 'Link Expired (otp_expired)',
      reason: 'Supabase email confirmation and password reset tokens expire after a set time (typically 60 minutes).',
      action: 'Open the BML CONNECT Android app, go to Login > Forgot Password (or Resend Confirmation), and generate a new email.',
    },
    {
      code: 'already_used',
      title: 'Link Already Used',
      reason: 'For security, every email link contains a single-use cryptographic token. Once tapped or verified, it cannot be reused.',
      action: 'If you already confirmed your email or reset your password, open the BML CONNECT app and log in directly.',
    },
    {
      code: 'access_denied',
      title: 'Access Denied',
      reason: 'The token hash was revoked or superseded by a newer request generated after this email was sent.',
      action: 'Always make sure to click the link from the most recent email in your inbox.',
    },
    {
      code: 'over_email_send_rate_limit',
      title: 'Rate Limit Exceeded',
      reason: 'Multiple verification or reset requests were triggered in a very short window.',
      action: 'Wait 10 minutes, then request one single link from the BML CONNECT Android app.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-14 space-y-10">
      {/* Active Error Banner */}
      <section className="relative p-6 sm:p-8 rounded-3xl bg-[#0D1836]/90 border border-red-500/30 backdrop-blur-2xl shadow-2xl shadow-red-950/40 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                Code: {activeError.code}
              </span>
              <span className="text-xs text-slate-400">Identity Security Guard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-['Plus_Jakarta_Sans']">
              {activeError.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {activeError.description}
            </p>
          </div>
        </div>

        {/* Action Callout */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            Recommended Next Step:
          </h3>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {activeError.resolution}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onOpenAndroidGuide}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open Android Guide</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Return to Overview</span>
          </button>
        </div>
      </section>

      {/* Common Link Issues Directory */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            Common Authentication Link Issues & Solutions
          </h2>
          <p className="text-xs text-slate-400">
            Learn why an email link failed and how to resolve it from your Android device:
          </p>
        </div>

        <div className="space-y-3">
          {errorCategories.map((cat, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={cat.code}
                className="rounded-2xl bg-[#0D1836]/60 border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-cyan-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-white">{cat.title}</span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="p-4 pt-1 border-t border-slate-800/80 bg-slate-950/40 text-xs space-y-3">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Why this happens:</span>
                      <p className="text-slate-300 leading-relaxed">{cat.reason}</p>
                    </div>
                    <div>
                      <span className="text-cyan-400 font-semibold block mb-0.5">What to do:</span>
                      <p className="text-slate-200 leading-relaxed">{cat.action}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Link Diagnostic */}
      <section className="p-6 rounded-2xl bg-[#0F1E3D]/70 border border-cyan-500/20 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            Check a Problematic Link
          </h3>
          <p className="text-xs text-slate-400">
            Paste the full URL from your email to check its expiration and error status:
          </p>
        </div>

        <form onSubmit={handleInspect} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Paste your link here..."
            value={testLink}
            onChange={(e) => setTestLink(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Analyze Link</span>
          </button>
        </form>

        {analyzed && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-white">{analyzed.title}</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">{analyzed.resolution}</p>
          </div>
        )}
      </section>
    </div>
  );
};
