/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Smartphone, Copy, Check, ExternalLink } from 'lucide-react';
import { getAndroidDeepLink } from '../lib/auth-helpers';
import { getSupabaseConfig } from '../lib/supabase-client';

interface DeepLinkButtonProps {
  action?: 'confirmed' | 'recovery' | 'login' | 'error';
  params?: Record<string, string>;
  targetUrl?: string;
  label?: string;
  sublabel?: string;
}

export const DeepLinkButton: React.FC<DeepLinkButtonProps> = ({
  action = 'login',
  params,
  targetUrl,
  label = 'Open BML CONNECT App',
  sublabel = 'Return to your Android device application',
}) => {
  const [copied, setCopied] = useState(false);
  const [launchAttempted, setLaunchAttempted] = useState(false);
  const config = getSupabaseConfig();
  const deepLink = targetUrl || getAndroidDeepLink(action, config.deepLinkScheme, params);

  const handleLaunch = () => {
    // Record that a launch attempt has occurred to display the fallback helper if needed
    setLaunchAttempted(true);

    // Direct navigation attempt inside the user click/tap event handler
    try {
      window.location.href = deepLink;
    } catch {
      // In case the browser protocol handler encounters an issue
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(deepLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="w-full space-y-3">
      {/* Primary Tap Action: Rendered as a direct anchor with href AND onClick handler */}
      <a
        href={deepLink}
        onClick={handleLaunch}
        role="button"
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:scale-[0.99] transition-all shadow-lg shadow-cyan-500/20 group text-center no-underline cursor-pointer select-none"
      >
        <Smartphone className="w-5 h-5 text-white transition-transform group-hover:scale-110 shrink-0" />
        <span>{label}</span>
      </a>

      {/* Sublabel & Copy App Link */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <span>{sublabel}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
          title="Copy deep link URL"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy App Link</span>
            </>
          )}
        </button>
      </div>

      {/* Direct Clickable Link Fallback & Diagnostics (Requirements 4 & 5) */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-left text-xs space-y-2 text-slate-300">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Direct App Deep-Link:</span>
          </span>
          {launchAttempted && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Launch Attempted
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          If tapping the button above did not automatically switch to the Android app, tap the direct link below or switch to the <strong>BML CONNECT</strong> app already open on your device:
        </p>

        {/* Normal clickable fallback link to the same deep link (no fabricated HTTPS or Play Store URLs) */}
        <div className="pt-1">
          <a
            href={deepLink}
            onClick={() => setLaunchAttempted(true)}
            className="inline-block text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline break-all bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 w-full"
          >
            {deepLink}
          </a>
        </div>

        {launchAttempted && (
          <div className="pt-1 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <p className="text-slate-300 font-medium">Still having trouble opening?</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[11px]">
              <li>You can tap <strong>"{label}"</strong> again above.</li>
              <li>Or switch to <strong>BML CONNECT</strong> from your phone's recent apps.</li>
              <li>Your email is verified, so you can sign in directly with your credentials.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
