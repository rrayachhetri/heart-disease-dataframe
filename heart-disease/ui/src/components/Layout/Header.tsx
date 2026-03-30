import { Bell } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { RootState } from '../../store';
import NotificationCenter from '../Notification/NotificationCenter';
import { useState } from 'react';
import styles from './Header.module.less';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/predict': 'New Prediction',
  '/result': 'Prediction Result',
  '/history': 'Prediction History',
};

export default function Header() {
  const location = useLocation();
  const unreadCount = useSelector(
    (s: RootState) => s.notifications.notifications.filter((n) => !n.read).length
  );
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>
          {pageTitles[location.pathname] || 'CardioSense'}
        </h1>
      </div>

      <div className={styles.right}>
        <div className={styles.notifWrapper}>
          <button
            className={styles.iconBtn}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className={styles.badge}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationCenter onClose={() => setShowNotifications(false)} />
          )}
        </div>

        <div className={styles.avatar}>
          <span>DR</span>
        </div>
      </div>
    </header>
  );
}
