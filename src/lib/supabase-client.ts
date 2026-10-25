/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateSupabaseConfig } from './auth-helpers';

export interface SupabaseConfigState {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  errorMessage?: string;
  deepLinkScheme: string;
}

// Fixed Android deep-link scheme for BML CONNECT
export const BML_DEEP_LINK_SCHEME = 'bmlconnect';

let clientInstance: SupabaseClient | null = null;
let currentConfigHash = '';

/**
 * Safely reads Vite environment variables (or process.env fallback during node:test).
 */
function getEnv(): Record<string, string | undefined> {
  if (typeof import.meta !== 'undefined' && import.meta && (import.meta as any).env) {
    return (import.meta as any).env;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }
  return {};
}

/**
 * Reads fixed build-time Supabase configuration strictly from environment variables.
 * Never uses localStorage, sessionStorage, or user-editable browser storage.
 */
export function getSupabaseConfig(): SupabaseConfigState {
  const env = getEnv();
  const envUrl = (env.VITE_SUPABASE_URL || '').trim();
  const envKey = (env.VITE_SUPABASE_ANON_KEY || '').trim();

  // If env vars are completely unset or contain default placeholders
  if (!envUrl || !envKey || envUrl.includes('your-project-id')) {
    return {
      url: '',
      anonKey: '',
      isConfigured: false,
      errorMessage: 'Authentication service is not configured. Please contact system support.',
      deepLinkScheme: BML_DEEP_LINK_SCHEME,
    };
  }

  // Validate format and ensure no secret/service_role key is used
  const validation = validateSupabaseConfig(envUrl, envKey);

  return {
    url: validation.sanitizedUrl || envUrl,
    anonKey: envKey,
    isConfigured: validation.isValid,
    errorMessage: validation.errorMessage,
    deepLinkScheme: BML_DEEP_LINK_SCHEME,
  };
}

/**
 * Returns the initialized Supabase client singleton, or null if configuration is missing/invalid.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  const hash = `${config.url}|${config.anonKey}`;
  if (clientInstance && currentConfigHash === hash) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
    currentConfigHash = hash;
    return clientInstance;
  } catch (err) {
    // Never log raw tokens or keys
    console.error('Failed to initialize Supabase client instance.');
    return null;
  }
}

/**
 * Returns true if the portal has valid build-time Supabase credentials configured.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}
