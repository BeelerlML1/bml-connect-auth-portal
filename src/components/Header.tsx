/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Smartphone, Menu, X, KeyRound, AlertTriangle } from 'lucide-react';
import { AppRoute } from '../lib/router';
import { getSupabaseConfig } from '../lib/supabase-client';

interface HeaderProps {
  currentPath: AppRoute;
  navigate: (to: string) => void;
  onOpenAndroidGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  navigate,
  onOpenAndroidGuide,
}) => {
  const config = getSupabaseConfig();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/10 bg-[#0B132B]/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div
            onClick={() => handleNav('/')}
            className="flex items-center gap-3 cursor-pointer group select-none"
            role="button"
            tabIndex={0}
            aria-label="BML CONNECT Home"
          >
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-400 p-[1.5px] shadow-lg shadow-cyan-500/15 group-hover:shadow-cyan-400/30 transition-all duration-300">
              <div className="w-full h-full bg-[#0B132B] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 transition-transform group-hover:scale-110 duration-300" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  BML<span className="text-cyan-400">CONNECT</span>
                </span>
                <span className="hidden xs:inline-block px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-cyan-500/10 text-cyan-300 rounded border border-cyan-500/20">
                  Portal
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                Official Authentication & Recovery
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => handleNav('/')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentPath === '/'
                  ? 'bg-blue-600/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => handleNav('/reset-password')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentPath === '/reset-password'
                  ? 'bg-blue-600/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <KeyRound className="w-4 h-4 text-cyan-400" />
              Password Reset
            </button>

            <button
              onClick={() => handleNav('/auth/error')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentPath === '/auth/error'
                  ? 'bg-blue-600/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Help & Link Errors
            </button>
          </nav>

          {/* Right Action status & Guide */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Read-Only Status Indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border select-none ${
                config.isConfigured
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  config.isConfigured ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
              <span>{config.isConfigured ? 'Auth Service Online' : 'Auth Service Standby'}</span>
            </div>

            {/* Deployment & Setup Guide */}
            <button
              onClick={onOpenAndroidGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-blue-900/30 transition-all active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Deployment Guide</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0B132B]/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
            </span>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                config.isConfigured
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  config.isConfigured ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
              <span>{config.isConfigured ? 'Online' : 'Standby'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={() => handleNav('/')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentPath === '/' ? 'bg-blue-600/20 text-cyan-300' : 'text-slate-300'
              }`}
            >
              Overview & Status
            </button>

            <button
              onClick={() => handleNav('/reset-password')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                currentPath === '/reset-password' ? 'bg-blue-600/20 text-cyan-300' : 'text-slate-300'
              }`}
            >
              <span>Reset Password</span>
              <KeyRound className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => handleNav('/auth/error')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                currentPath === '/auth/error' ? 'bg-blue-600/20 text-cyan-300' : 'text-slate-300'
              }`}
            >
              <span>Error & Expired Link Help</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
