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
  source: 'env' | 'custom' | 'none';
  errorMessage?: string;
  deepLinkScheme: string;
}

const STORAGE_KEY_URL = 'bml_connect_supabase_url';
const STORAGE_KEY_ANON = 'bml_connect_supabase_anon_key';
const STORAGE_KEY_SCHEME = 'bml_connect_deep_link_scheme';

let clientInstance: SupabaseClient | null = null;
let currentConfigHash = '';

/**
 * Reads the current Supabase configuration from environment variables or browser storage.
 */
export function getSupabaseConfig(): SupabaseConfigState {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const defaultScheme = (import.meta.env.VITE_APP_DEEP_LINK_SCHEME || 'bmlconnect').trim();

  // 1. Check environment variables first
  if (envUrl && envKey && !envUrl.includes('your-project-id')) {
    const validation = validateSupabaseConfig(envUrl, envKey);
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: validation.isValid,
      source: 'env',
      errorMessage: validation.errorMessage,
      deepLinkScheme: defaultScheme,
    };
  }

  // 2. Check local storage if env vars not provided
  if (typeof window !== 'undefined') {
    const customUrl = (localStorage.getItem(STORAGE_KEY_URL) || '').trim();
    const customKey = (localStorage.getItem(STORAGE_KEY_ANON) || '').trim();
    const customScheme = (localStorage.getItem(STORAGE_KEY_SCHEME) || defaultScheme).trim();

    if (customUrl && customKey) {
      const validation = validateSupabaseConfig(customUrl, customKey);
      return {
        url: customUrl,
        anonKey: customKey,
        isConfigured: validation.isValid,
        source: 'custom',
        errorMessage: validation.errorMessage,
        deepLinkScheme: customScheme,
      };
    }
  }

  return {
    url: '',
    anonKey: '',
    isConfigured: false,
    source: 'none',
    errorMessage: 'No Supabase URL and Anon Key configured.',
    deepLinkScheme: defaultScheme,
  };
}

/**
 * Returns an initialized Supabase client singleton or null if not configured.
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
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Saves custom public config (e.g. entered via setup modal during sandbox testing).
 */
export function saveCustomConfig(url: string, anonKey: string, scheme?: string): { success: boolean; error?: string } {
  const validation = validateSupabaseConfig(url, anonKey);
  if (!validation.isValid) {
    return { success: false, error: validation.errorMessage || 'Invalid configuration' };
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    if (scheme) {
      localStorage.setItem(STORAGE_KEY_SCHEME, scheme.trim());
    }
    // Invalidate client instance
    clientInstance = null;
    currentConfigHash = '';
    window.dispatchEvent(new Event('bml_config_changed'));
  }

  return { success: true };
}

/**
 * Clears custom saved config.
 */
export function clearCustomConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
    localStorage.removeItem(STORAGE_KEY_SCHEME);
    clientInstance = null;
    currentConfigHash = '';
    window.dispatchEvent(new Event('bml_config_changed'));
  }
}
