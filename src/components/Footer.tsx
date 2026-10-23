/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Lock, ExternalLink, Smartphone } from 'lucide-react';

interface FooterProps {
  navigate: (to: string) => void;
  onOpenAndroidGuide: () => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate, onOpenAndroidGuide }) => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#070D1F] text-slate-400 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800/60">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-bold text-white text-base font-['Plus_Jakarta_Sans']">
                BML<span className="text-cyan-400">CONNECT</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Official public authentication and password recovery bridge for the BML CONNECT Android application.
              Built for high reliability, zero secret leakage, and seamless deep linking.
            </p>
          </div>

          {/* Security Standards */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              Security Architecture
            </h4>
            <ul className="text-xs space-y-1.5 text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>PKCE cryptographic token exchange</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Zero service_role keys in frontend code</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>One-time single-use link validation</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Netlify SSL / TLS 1.3 enforced</span>
              </li>
            </ul>
          </div>

          {/* Quick Links & Mobile instructions */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Portal Endpoints
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => navigate('/')}
                className="text-left text-slate-400 hover:text-cyan-300 transition-colors"
              >
                Portal Overview
              </button>
              <button
                onClick={() => navigate('/reset-password')}
                className="text-left text-slate-400 hover:text-cyan-300 transition-colors"
              >
                Password Reset
              </button>
              <button
                onClick={() => navigate('/auth/error')}
                className="text-left text-slate-400 hover:text-cyan-300 transition-colors"
              >
                Link Error Guide
              </button>
              <button
                onClick={onOpenAndroidGuide}
                className="text-left text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <span>Android Setup</span>
                <Smartphone className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} BML CONNECT. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Designed for BML CONNECT Android App · Powered by Supabase Auth
          </p>
        </div>
      </div>
    </footer>
  );
};
