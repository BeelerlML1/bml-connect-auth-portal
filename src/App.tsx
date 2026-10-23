/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRouter } from './lib/router';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { AuthCallbackView } from './views/AuthCallbackView';
import { ResetPasswordView } from './views/ResetPasswordView';
import { AuthErrorView } from './views/AuthErrorView';
import { AndroidSetupModal } from './components/AndroidSetupModal';
import { ConfigModal } from './components/ConfigModal';

export default function App() {
  const { currentPath, navigate } = useRouter();
  const [isAndroidGuideOpen, setIsAndroidGuideOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B132B] text-slate-100 font-['Plus_Jakarta_Sans'] selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <Header
        currentPath={currentPath}
        navigate={navigate}
        onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
      />

      {/* Main Content View Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {currentPath === '/' && (
          <HomeView
            navigate={navigate}
            onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
            onOpenConfigModal={() => setIsConfigModalOpen(true)}
          />
        )}

        {currentPath === '/auth/callback' && (
          <AuthCallbackView
            navigate={navigate}
            onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
            onOpenConfigModal={() => setIsConfigModalOpen(true)}
          />
        )}

        {currentPath === '/reset-password' && (
          <ResetPasswordView
            navigate={navigate}
            onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
            onOpenConfigModal={() => setIsConfigModalOpen(true)}
          />
        )}

        {currentPath === '/auth/error' && (
          <AuthErrorView
            navigate={navigate}
            onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
          />
        )}
      </main>

      {/* Portal Footer */}
      <Footer
        navigate={navigate}
        onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
      />

      {/* Android Deployment Guide Modal */}
      <AndroidSetupModal
        isOpen={isAndroidGuideOpen}
        onClose={() => setIsAndroidGuideOpen(false)}
      />

      {/* Supabase Configuration Modal */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}
