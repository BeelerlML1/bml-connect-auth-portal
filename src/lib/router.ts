/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';

export type AppRoute = '/' | '/auth/callback' | '/reset-password' | '/auth/error';

/**
 * Normalizes pathname to one of the 4 supported application routes.
 */
export function getNormalizedRoute(pathname: string, search: string): AppRoute {
  // Check if query string specified explicit route (e.g. for testing or static fallback)
  const params = new URLSearchParams(search);
  const routeParam = params.get('route');
  if (routeParam) {
    if (routeParam === '/auth/callback' || routeParam === 'callback') return '/auth/callback';
    if (routeParam === '/reset-password' || routeParam === 'reset-password') return '/reset-password';
    if (routeParam === '/auth/error' || routeParam === 'error') return '/auth/error';
    if (routeParam === '/') return '/';
  }

  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/auth/callback' || cleanPath.startsWith('/auth/callback')) {
    return '/auth/callback';
  }
  if (cleanPath === '/reset-password' || cleanPath.startsWith('/reset-password')) {
    return '/reset-password';
  }
  if (cleanPath === '/auth/error' || cleanPath.startsWith('/auth/error')) {
    return '/auth/error';
  }

  return '/';
}

export function useRouter() {
  const [currentPath, setCurrentPath] = useState<AppRoute>(() =>
    typeof window !== 'undefined'
      ? getNormalizedRoute(window.location.pathname, window.location.search)
      : '/'
  );

  useEffect(() => {
    const handleLocationChange = () => {
      const nextRoute = getNormalizedRoute(window.location.pathname, window.location.search);
      setCurrentPath(nextRoute);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('pushstate_custom', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('pushstate_custom', handleLocationChange);
    };
  }, []);

  const navigate = useCallback((to: string, searchParams?: Record<string, string>) => {
    const search = searchParams ? '?' + new URLSearchParams(searchParams).toString() : '';
    const fullTarget = `${to}${search}`;
    window.history.pushState({}, '', fullTarget);
    window.dispatchEvent(new Event('pushstate_custom'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { currentPath, navigate };
}
