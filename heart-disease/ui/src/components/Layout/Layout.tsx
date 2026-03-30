import { type ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './Layout.module.less';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`${styles.main} ${collapsed ? styles.collapsed : ''}`}>
        <Header />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
