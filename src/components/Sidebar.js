'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from './ThemeProvider';
import styles from './sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const toggleSidebar = () => setIsOpen(!isOpen);

  // If session is loading or empty, don't show the sidebar
  if (!session) return null;

  const user = session.user;
  const isAdmin = user.role === 'admin';
  const isDark = theme === 'dark';

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Orders',    path: '/orders',    icon: '📋' },
  ];

  if (isAdmin) {
    menuItems.push({ name: 'Customers', path: '/customers', icon: '👥' });
    menuItems.push({ name: 'Dues',      path: '/dues',      icon: '💸' });
    menuItems.push({ name: 'Settings',  path: '/settings',  icon: '⚙️' });
  }

  menuItems.push({ name: 'Inventory', path: '/inventory', icon: '📦' });

  return (
    <>
      <button className={styles.hamburger} onClick={toggleSidebar} aria-label="Toggle menu">
        {isOpen ? '✕' : '☰'}
      </button>

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>

        {/* Brand */}
        <div className={styles.brand}>
          <span className={styles.logo}>🖨️</span>
          <span className={styles.brandText}>MayankComputer</span>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Dark / Light Toggle */}
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className={styles.themeIcon}>{isDark ? '🌙' : '☀️'}</span>
          <span className={styles.themeToggleLabel}>
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </span>
          <span className={`${styles.toggleTrack} ${isDark ? styles.toggleTrackDark : ''}`}>
            <span className={`${styles.toggleThumb} ${isDark ? styles.toggleThumbDark : ''}`} />
          </span>
        </button>

        {/* User Info & Logout */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <div className={styles.userRole}>
              <span>Role:</span>
              <span className={`${styles.roleBadge} ${isAdmin ? styles.roleAdmin : styles.roleOperator}`}>
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={styles.logoutBtn}
          >
            🚪 Log Out
          </button>
        </div>

      </aside>
    </>
  );
}
