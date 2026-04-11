import { Bell, LogOut, User, Shield, CheckCheck, Trash2, Camera, X as XIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { logout, setAvatarUrl } from '../../../store/slices/authSlice';
import { markAllAsRead, clearNotifications, markAsRead } from '../../../store/slices/notificationSlice';
import styles from './Header.module.less';

interface Props {
  fileInputRef: React.RefObject<HTMLInputElement>;
  onClose: () => void;
}

const TYPE_COLOR: Record<string, string> = {
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',
};

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function UserMenuDropdown({ fileInputRef, onClose }: Props) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const avatarUrl = useAppSelector((s) => s.auth.avatarUrl);
  const notifications = useAppSelector((s) => s.notifications.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!user) return null;

  const initials =
    `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() ||
    user.email[0].toUpperCase();
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className={styles.userDropdown}>
      {/* Profile block */}
      <div className={styles.profileBlock}>
        <div
          className={styles.profileAvatarWrap}
          onClick={() => fileInputRef.current?.click()}
          title="Change photo"
        >
          <div className={styles.profileAvatar}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
            ) : (
              initials
            )}
          </div>
          <div className={styles.profileAvatarOverlay}>
            <Camera size={13} />
          </div>
        </div>
        <div className={styles.profileInfo}>
          <p className={styles.profileName}>{fullName}</p>
          <p className={styles.profileEmail}>{user.email}</p>
        </div>
      </div>

      <span className={styles.rolePill}>
        <Shield size={11} />
        {user.role}
      </span>

      <div className={styles.menuDivider} />
      <button className={styles.menuItem} onClick={() => fileInputRef.current?.click()}>
        <Camera size={15} />
        Change Photo
      </button>
      {avatarUrl && (
        <button className={styles.menuItem} onClick={() => dispatch(setAvatarUrl(null))}>
          <XIcon size={15} />
          Remove Photo
        </button>
      )}

      {user.role === 'doctor' && (
        <>
          <div className={styles.menuDivider} />
          <button
            className={styles.menuItem}
            onClick={() => { navigate('/doctor/profile'); onClose(); }}
          >
            <User size={15} />
            View Profile
          </button>
        </>
      )}

      <div className={styles.menuDivider} />

      {/* Notifications */}
      <div className={styles.notifSection}>
        <div className={styles.notifSectionHeader}>
          <span className={styles.notifTitle}>Notifications</span>
          {unreadCount > 0 && (
            <span className={styles.notifCount}>{unreadCount} unread</span>
          )}
          <div className={styles.notifActions}>
            <button onClick={() => dispatch(markAllAsRead())} title="Mark all read">
              <CheckCheck size={14} />
            </button>
            <button onClick={() => dispatch(clearNotifications())} title="Clear all">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div className={styles.notifListInline}>
          {notifications.length === 0 ? (
            <div className={styles.notifEmpty}>
              <Bell size={20} />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                className={`${styles.notifItem} ${n.read ? styles.notifRead : ''}`}
                onClick={() => dispatch(markAsRead(n.id))}
              >
                <span className={styles.notifDot} style={{ background: TYPE_COLOR[n.type] }} />
                <div className={styles.notifContent}>
                  <p className={styles.notifItemTitle}>{n.title}</p>
                  <p className={styles.notifItemMsg}>{n.message}</p>
                  <span className={styles.notifTime}>{formatTime(n.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.menuDivider} />
      <button className={styles.menuItemDanger} onClick={handleLogout}>
        <LogOut size={15} />
        Sign Out
      </button>
    </div>
  );
}
