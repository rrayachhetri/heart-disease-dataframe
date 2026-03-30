import { useSelector, useDispatch } from 'react-redux';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import {
  markAsRead,
  markAllAsRead,
  clearNotifications,
} from '../../store/slices/notificationSlice';
import styles from './NotificationCenter.module.less';

interface Props {
  onClose: () => void;
}

export default function NotificationCenter({ onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector(
    (s: RootState) => s.notifications.notifications
  );

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  const typeStyles: Record<string, string> = {
    success: styles.typeSuccess,
    warning: styles.typeWarning,
    error: styles.typeError,
    info: styles.typeInfo,
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3>Notifications</h3>
        <div className={styles.actions}>
          <button
            onClick={() => dispatch(markAllAsRead())}
            title="Mark all as read"
          >
            <CheckCheck size={16} />
          </button>
          <button
            onClick={() => dispatch(clearNotifications())}
            title="Clear all"
          >
            <Trash2 size={16} />
          </button>
          <button onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>
            <Bell size={32} />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 20).map((n) => (
            <div
              key={n.id}
              className={`${styles.item} ${n.read ? styles.read : ''}`}
              onClick={() => dispatch(markAsRead(n.id))}
            >
              <div className={`${styles.dot} ${typeStyles[n.type]}`} />
              <div className={styles.itemContent}>
                <p className={styles.itemTitle}>{n.title}</p>
                <p className={styles.itemMessage}>{n.message}</p>
                <span className={styles.itemTime}>{formatTime(n.timestamp)}</span>
              </div>
              {!n.read && (
                <button className={styles.markBtn} title="Mark as read">
                  <Check size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
