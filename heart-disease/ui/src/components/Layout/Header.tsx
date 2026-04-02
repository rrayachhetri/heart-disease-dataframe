import { Bell, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import NotificationCenter from '../Notification/NotificationCenter';
import styles from './Header.module.less';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/predict': 'New Prediction',
  '/result': 'Prediction Result',
  '/history': 'Prediction History',
  '/doctor/profile': 'Doctor Profile',
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const unreadCount = useSelector(
    (s: RootState) => s.notifications.notifications.filter((n) => !n.read).length
  );
  const user = useSelector((s: RootState) => s.auth.user);
  const [showNotifications, setShowNotifications] = useState(false);

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.email[0].toUpperCase()
    : '?';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>
          {pageTitles[location.pathname] || 'CardioSense'}
        </h1>
      </div>

      <div className={styles.right}>
        {/* Notifications */}
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

        {/* User info */}
        {user && (
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {user.first_name ? `${user.first_name} ${user.last_name}` : user.email}
            </span>
            <span className={styles.userRole}>{user.role}</span>
          </div>
        )}

        <div className={styles.avatar}>
          <span>{initials}</span>
        </div>

        {/* Logout */}
        <button className={styles.iconBtn} onClick={handleLogout} aria-label="Logout" title="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
