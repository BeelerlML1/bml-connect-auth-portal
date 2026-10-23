/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Smartphone, Copy, Check, ExternalLink } from 'lucide-react';
import { getAndroidDeepLink } from '../lib/auth-helpers';
import { getSupabaseConfig } from '../lib/supabase-client';

interface DeepLinkButtonProps {
  action: 'confirmed' | 'recovery' | 'login' | 'error';
  params?: Record<string, string>;
  label?: string;
  sublabel?: string;
}

export const DeepLinkButton: React.FC<DeepLinkButtonProps> = ({
  action,
  params,
  label = 'Open BML CONNECT App',
  sublabel = 'Return to your Android device application',
}) => {
  const [copied, setCopied] = useState(false);
  const config = getSupabaseConfig();
  const deepLink = getAndroidDeepLink(action, config.deepLinkScheme, params);

  const handleLaunch = () => {
    // Attempt standard intent / custom scheme navigation
    window.location.href = deepLink;
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(deepLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="w-full space-y-2">
      <button
        onClick={handleLaunch}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:scale-[0.99] transition-all shadow-lg shadow-cyan-500/20 group"
      >
        <Smartphone className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
        <span>{label}</span>
      </button>

      <div className="flex items-center justify-between px-2 text-xs text-slate-400">
        <span>{sublabel}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
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
    </div>
  );
};
