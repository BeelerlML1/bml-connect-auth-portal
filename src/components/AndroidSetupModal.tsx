/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Server,
  Sparkles,
  ChevronRight,
  Globe,
  Key,
  CheckCircle2,
} from 'lucide-react';

interface AndroidSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidSetupModal: React.FC<AndroidSetupModalProps> = ({ isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  const steps = [
    { id: 1, title: 'Supabase Keys', icon: Key },
    { id: 2, title: 'Deploy on Netlify', icon: Globe },
    { id: 3, title: 'Netlify Env Vars', icon: Server },
    { id: 4, title: 'Redirect URLs', icon: CheckCircle2 },
    { id: 5, title: 'Android App Link', icon: Smartphone },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0D1836] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0B132B]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                Android Beginner Deployment Guide
              </h3>
              <p className="text-xs text-slate-400">
                How to launch your BML CONNECT Auth Portal from your Android phone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            aria-label="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Tabs (Mobile scrollable) */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 overflow-x-auto flex items-center gap-2 no-scrollbar">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCurrent = activeStep === s.id;
            const isCompleted = activeStep > s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : isCompleted
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>Step {s.id}: {s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-300 flex-1">
          {/* Step 1: Supabase Keys */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  1. Find Your Supabase Project URL & Anon Key
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Open Chrome or Firefox on your Android phone and sign in at{' '}
                  <span className="font-semibold text-white">supabase.com/dashboard</span>.
                </p>
                <ol className="text-xs space-y-1.5 list-decimal list-inside text-slate-300 pt-1">
                  <li>Select your BML CONNECT project.</li>
                  <li>Tap the bottom-left <strong>Project Settings (gear icon)</strong>.</li>
                  <li>Tap <strong>API</strong> in the settings menu.</li>
                  <li>Under <strong>Project URL</strong>, copy the URL (e.g. <code className="text-cyan-300">https://xyzcompany.supabase.co</code>).</li>
                  <li>Under <strong>Project API keys</strong>, copy the <strong className="text-emerald-400">anon public</strong> key.</li>
                </ol>
              </div>

              {/* Security Alert */}
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 space-y-1.5">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4" />
                  Crucial Security Rule
                </div>
                <p className="text-xs text-red-200 leading-relaxed">
                  <strong>NEVER</strong> copy or use the <strong>service_role secret key</strong>. The portal only requires the <strong>anon public</strong> key. The service_role key grants root database access and should never touch a public website or app!
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Deploy to Netlify */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  2. Free Public Hosting on Netlify (from your Android Phone)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Netlify gives you a stable public HTTPS URL that is accessible by all email providers without requiring any Google AI Studio login cookies.
                </p>
                <ol className="text-xs space-y-2 list-decimal list-inside text-slate-300 pt-1">
                  <li>Visit <strong>netlify.com</strong> on your Android phone and tap <strong>Sign Up / Log In</strong> (with GitHub or email).</li>
                  <li>Tap <strong>Add new site</strong> &rarr; <strong>Import an existing project</strong>.</li>
                  <li>Connect to GitHub and select this repository.</li>
                  <li>Netlify automatically uses the provided <code>netlify.toml</code> build settings (<code className="text-cyan-300">npm run build</code> into <code className="text-cyan-300">dist</code> with automatic SPA route redirects).</li>
                </ol>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300">Already included for Netlify:</span>
                <p>✅ <code>public/_redirects</code> configured for client-side routing fallback</p>
                <p>✅ <code>netlify.toml</code> configured for automated builds & security headers</p>
              </div>
            </div>
          )}

          {/* Step 3: Netlify Environment Variables */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  3. Add These 2 Environment Variables in Netlify
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In Netlify Dashboard &rarr; <strong>Site configuration</strong> &rarr; <strong>Environment variables</strong> &rarr; <strong>Add a variable</strong>:
                </p>
              </div>

              {/* Variable 1 */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">VITE_SUPABASE_URL</span>
                  <button
                    onClick={() => handleCopy('VITE_SUPABASE_URL', 'v1')}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedKey === 'v1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'v1' ? 'Copied' : 'Copy Name'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Value: Your Supabase project URL (e.g., <code>https://xyzcompany.supabase.co</code>)
                </p>
              </div>

              {/* Variable 2 */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">VITE_SUPABASE_ANON_KEY</span>
                  <button
                    onClick={() => handleCopy('VITE_SUPABASE_ANON_KEY', 'v2')}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedKey === 'v2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'v2' ? 'Copied' : 'Copy Name'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Value: Your public <strong className="text-emerald-400">anon</strong> key from Supabase API settings.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Supabase Redirect URLs */}
          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  4. Configure Supabase Redirect URLs
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In Supabase &rarr; <strong>Authentication</strong> &rarr; <strong>URL Configuration</strong>:
                </p>
                <div className="space-y-1.5 text-xs">
                  <p><strong>1. Site URL:</strong> Set to your Netlify public URL (e.g. <code>https://bmlconnect-auth.netlify.app</code>)</p>
                  <p><strong>2. Redirect URLs:</strong> Add the callback endpoints below:</p>
                </div>
              </div>

              {/* Copyable Redirect URLs */}
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <code className="text-xs text-slate-200">https://your-site.netlify.app/auth/callback</code>
                  <button
                    onClick={() => handleCopy('https://your-site.netlify.app/auth/callback', 'r1')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedKey === 'r1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'r1' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <code className="text-xs text-slate-200">https://your-site.netlify.app/reset-password</code>
                  <button
                    onClick={() => handleCopy('https://your-site.netlify.app/reset-password', 'r2')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedKey === 'r2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'r2' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <code className="text-xs text-slate-200">bmlconnect://auth/callback</code>
                  <button
                    onClick={() => handleCopy('bmlconnect://auth/callback', 'r3')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedKey === 'r3' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'r3' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Android App Link */}
          {activeStep === 5 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  5. Android App Manifest Integration
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In your Android project (<code>AndroidManifest.xml</code>), ensure your Auth Activity responds to the custom URI scheme so tapping "Open App" will launch BML CONNECT:
                </p>
              </div>

              <div className="relative p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                <pre>{`<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="bmlconnect"
        android:host="auth" />
</intent-filter>`}</pre>
                <button
                  onClick={() => handleCopy(`<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="bmlconnect"
        android:host="auth" />
</intent-filter>`, 'xml')}
                  className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-cyan-300 hover:text-white text-[10px]"
                >
                  {copiedKey === 'xml' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'xml' ? 'Copied' : 'Copy XML'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-[#0B132B]/90">
          <button
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeStep === 1
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            Previous
          </button>

          <span className="text-xs text-slate-400 font-medium">
            Step {activeStep} of 5
          </span>

          {activeStep < 5 ? (
            <button
              onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white"
            >
              <span>Next Step</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Done / Got It!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
