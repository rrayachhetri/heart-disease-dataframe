import { type ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import QuoteBanner from './QuoteBanner';
import styles from './Layout.module.less';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const check = () => setCollapsed(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className={styles.layout}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div className={`${styles.main} ${collapsed ? styles.collapsed : ''}`}>
        <Header />
        <QuoteBanner collapsed={collapsed} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
