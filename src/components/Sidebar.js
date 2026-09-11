'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from './ThemeProvider';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Wallet, 
  Settings, 
  Box, 
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
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
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Portfolio',    path: '/orders',    icon: <Briefcase size={20} /> },
  ];

  if (isAdmin) {
    menuItems.push({ name: 'Community', path: '/customers', icon: <Users size={20} /> });
    menuItems.push({ name: 'Wallet',      path: '/dues',      icon: <Wallet size={20} /> });
    menuItems.push({ name: 'Settings',  path: '/settings',  icon: <Settings size={20} /> });
  }

  menuItems.push({ name: 'Inventory', path: '/inventory', icon: <Box size={20} /> });

  return (
    <>
      <button className={styles.hamburger} onClick={toggleSidebar} aria-label="Toggle menu">
        {isOpen ? '✕' : '☰'}
      </button>

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>

        {/* Brand */}
        <div className={styles.brand}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>P</span>
          </div>
          <span className={styles.brandText}>PrintPress</span>
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
          <span className={styles.themeIcon}>{isDark ? <Moon size={16} /> : <Sun size={16} />}</span>
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
            <LogOut size={16} /> Log Out
          </button>
        </div>

      </aside>
    </>
  );
}
