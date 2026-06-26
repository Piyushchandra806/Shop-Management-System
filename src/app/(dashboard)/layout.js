'use client';

import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
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
