/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Trash2,
  Save,
  Key,
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveCustomConfig,
  clearCustomConfig,
  SupabaseConfigState,
  getSupabaseClient,
} from '../lib/supabase-client';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<SupabaseConfigState>(getSupabaseConfig);
  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [inputScheme, setInputScheme] = useState('bmlconnect');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getSupabaseConfig();
      setConfig(current);
      setInputUrl(current.url);
      setInputKey(current.anonKey);
      setInputScheme(current.deepLinkScheme || 'bmlconnect');
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const result = saveCustomConfig(inputUrl, inputKey, inputScheme);
    if (!result.success) {
      setFeedback({ type: 'error', message: result.error || 'Failed to save configuration.' });
      return;
    }

    const updated = getSupabaseConfig();
    setConfig(updated);
    setFeedback({ type: 'success', message: 'Supabase configuration saved for this session.' });
  };

  const handleClear = () => {
    clearCustomConfig();
    const updated = getSupabaseConfig();
    setConfig(updated);
    setInputUrl('');
    setInputKey('');
    setFeedback({ type: 'success', message: 'Custom configuration cleared.' });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setFeedback(null);

    const client = getSupabaseClient();
    if (!client) {
      setIsTesting(false);
      setFeedback({ type: 'error', message: 'Cannot test: Supabase client is not configured.' });
      return;
    }

    try {
      // Test the public auth endpoint with a safe no-op call
      const { error } = await client.auth.getSession();
      setIsTesting(false);
      if (error) {
        setFeedback({ type: 'error', message: `Supabase returned an error: ${error.message}` });
      } else {
        setFeedback({ type: 'success', message: 'Connection to Supabase Auth endpoint successful!' });
      }
    } catch (err: any) {
      setIsTesting(false);
      setFeedback({ type: 'error', message: `Network/CORS error reaching Supabase: ${err.message || 'Check URL'}` });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0D1836] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0B132B]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Settings className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                Supabase Configuration
              </h3>
              <p className="text-xs text-slate-400">
                Inspect public project keys & connection status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm text-slate-300">
          {/* Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              config.isConfigured
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            }`}
          >
            {config.isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider">
                {config.isConfigured ? 'Supabase Credentials Configured' : 'Supabase Credentials Pending'}
              </h4>
              <p className="text-xs opacity-90 leading-relaxed">
                {config.isConfigured
                  ? `Active via ${config.source === 'env' ? 'Production Environment Variables' : 'Browser Testing Storage'}. Ready to process genuine email confirmations and password recovery.`
                  : 'The portal is currently waiting for your Supabase Project URL and Public Anon Key. You can set them below for testing or in Netlify environment variables.'}
              </p>
            </div>
          </div>

          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Supabase Anon Public Key (Publishable)
                </label>
                <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-mono">
                  <Lock className="w-3 h-3" /> Public Anon Only
                </span>
              </div>
              <textarea
                rows={2}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Android App Deep Link Scheme
              </label>
              <input
                type="text"
                placeholder="bmlconnect"
                value={inputScheme}
                onChange={(e) => setInputScheme(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-400"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used to redirect back to the app via <code>{inputScheme || 'bmlconnect'}://auth/callback</code>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </button>

              {config.isConfigured && (
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>
              )}

              {config.source === 'custom' && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-800/50 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Custom</span>
                </button>
              )}
            </div>
          </form>

          {/* Security Notice */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Zero Service-Role Guarantee
            </span>
            <p>
              This portal will automatically reject and block any attempts to provide a <code>service_role</code> secret key.
              For permanent hosting on Netlify, configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in Netlify Environment Variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
