import { type ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import QuoteBanner from './QuoteBanner';
import styles from './Layout.module.less';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false); // Lifted user menu state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 768; // <= matches CSS max-width: @breakpoint-md (768px)
      setIsMobile(mobile);
      setCollapsed(mobile); // Auto-collapse on mobile
      if (!mobile) {
        setMobileOpen(false); // Close mobile sidebar when switching to desktop
      }
    };
    check(); // Initial check
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleToggle = () => {
    if (isMobile) {
      // Close user menu if open when opening mobile sidebar
      if (userMenuOpen) {
        setUserMenuOpen(false);
      }
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const handleMobileNavClick = () => {
    // Close sidebar when navigation item is clicked on mobile
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleUserMenuToggle = () => {
    // Close mobile sidebar if open when opening user menu
    if (isMobile && mobileOpen) {
      setMobileOpen(false);
    }
    setUserMenuOpen(!userMenuOpen);
  };

  const handleUserMenuClose = () => {
    setUserMenuOpen(false);
  };

  // Close both menus when clicking outside
  const handleOverlayClick = () => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <div className={styles.layout}>
      {/* Mobile overlay - handles both sidebar and user menu */}
      {isMobile && (mobileOpen || userMenuOpen) && (
        <div 
          className={styles.overlay} 
          onClick={handleOverlayClick}
        />
      )}
      
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={handleToggle}
        onMobileClose={() => setMobileOpen(false)}
        onNavClick={handleMobileNavClick}
      />
      
      <div className={`${styles.main} ${collapsed && !isMobile ? styles.collapsed : ''}`}>
        <Header 
          onMenuClick={handleToggle}
          userMenuOpen={userMenuOpen}
          onUserMenuToggle={handleUserMenuToggle}
          onUserMenuClose={handleUserMenuClose}
        />
        <QuoteBanner collapsed={collapsed} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
