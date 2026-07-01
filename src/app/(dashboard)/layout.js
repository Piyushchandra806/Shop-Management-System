'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      // 1. Tab Closed/Returned Detection (Requirement 4)
      const wasLoggedIn = sessionStorage.getItem('wasLoggedIn');
      if (!wasLoggedIn) {
        // Closed tab and returned -> Force Logout
        signOut({ redirect: true, callbackUrl: '/login' });
        return;
      }

      // 2. 1-Minute Inactivity Auto-Logout (Requirement 4)
      let inactivityTimeout;

      const resetInactivityTimer = () => {
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(() => {
          console.log('[Inactivity Auto-Logout] User has been inactive for 1 minute.');
          // Remove flag and logout
          sessionStorage.removeItem('wasLoggedIn');
          signOut({ redirect: true, callbackUrl: '/login' });
        }, 60000); // 1 minute = 60000 ms
      };

      // Events indicating activity
      const activityEvents = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
      
      activityEvents.forEach(eventName => {
        window.addEventListener(eventName, resetInactivityTimer);
      });

      // Start initial timer
      resetInactivityTimer();

      // Clean up event listeners and timer on unmount
      return () => {
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
        activityEvents.forEach(eventName => {
          window.removeEventListener(eventName, resetInactivityTimer);
        });
      };
    }
  }, [session, status]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        padding: '32px',
        marginLeft: 'var(--sidebar-width)',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        transition: 'var(--transition-slow)',
        minWidth: 0
      }} className="main-content-layout">
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </main>

      {/* CSS overrides for mobile view responsiveness */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .main-content-layout {
            margin-left: 0 !important;
            padding: 20px !important;
            padding-top: 72px !important; /* Spacing for floating hamburger menu */
          }
        }
      `}</style>
    </div>
  );
}
