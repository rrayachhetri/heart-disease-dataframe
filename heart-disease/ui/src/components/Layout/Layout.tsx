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

  useEffect(() => {
    const check = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
        setMobileOpen(false);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className={styles.layout}>
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`${styles.main} ${collapsed ? styles.collapsed : ''}`}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <QuoteBanner collapsed={collapsed} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
