import { Bell, LogOut, User, ChevronDown, Shield, Menu, CheckCheck, Trash2, Camera, X as XIcon, Search } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import type { RootState, AppDispatch } from '../../store';
import { logout, setAvatarUrl } from '../../store/slices/authSlice';
import { markAllAsRead, clearNotifications, markAsRead } from '../../store/slices/notificationSlice';
import type { PredictionRecord } from '../../types';
import styles from './Header.module.less';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/predict': 'New Prediction',
  '/result': 'Prediction Result',
  '/history': 'Prediction History',
  '/doctor/profile': 'Doctor Profile',
};

interface Props {
  onMobileMenuToggle?: () => void;
}

export default function Header({ onMobileMenuToggle }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector((s: RootState) => s.notifications.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const user = useSelector((s: RootState) => s.auth.user);
  const avatarUrl = useSelector((s: RootState) => s.auth.avatarUrl);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const history = useSelector((s: RootState) => s.prediction.history);

  const searchResults: PredictionRecord[] = searchQuery.trim().length > 0
    ? history.filter((r) => {
        const q = searchQuery.toLowerCase().trim();
        const risk = Math.round(r.result.probability * 100);
        const dateStr = new Date(r.timestamp).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        }).toLowerCase();
        const level = r.result.risk_level?.toLowerCase() ?? (r.result.prediction === 1 ? 'high' : 'low');
        return (
          level.includes(q) ||
          dateStr.includes(q) ||
          String(risk).includes(q) ||
          (q === 'high' && r.result.prediction === 1) ||
          (q === 'low' && r.result.prediction === 0)
        );
      }).slice(0, 6)
    : [];

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() ||
      user.email[0].toUpperCase()
    : '?';

  const fullName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email
    : '';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      dispatch(setAvatarUrl(dataUrl));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  const typeColor: Record<string, string> = {
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className={styles.header}>
      {/* Left */}
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMobileMenuToggle} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <h1 className={styles.title}>{pageTitles[location.pathname] || 'CardioSense'}</h1>
      </div>

      {/* Center — search bar, only visible on wide screens */}
      <div className={styles.center} ref={searchRef}>
        <div className={`${styles.searchWrap} ${searchOpen ? styles.searchWrapOpen : ''}`}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search history by risk, date, or %…"
            value={searchQuery}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
          />
          {searchQuery && (
            <button className={styles.searchClear} onClick={() => { setSearchQuery(''); setSearchOpen(false); }}>
              <XIcon size={13} />
            </button>
          )}
        </div>
        {searchOpen && searchQuery.trim().length > 0 && (
          <div className={styles.searchDropdown}>
            {searchResults.length === 0 ? (
              <div className={styles.searchEmpty}>No matching records found</div>
            ) : (
              searchResults.map((r) => {
                const risk = Math.round(r.result.probability * 100);
                const isHigh = r.result.prediction === 1;
                const date = new Date(r.timestamp).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                });
                return (
                  <div
                    key={r.id}
                    className={styles.searchResultItem}
                    onClick={() => { navigate('/history'); setSearchOpen(false); setSearchQuery(''); }}
                  >
                    <span
                      className={styles.searchRiskBadge}
                      style={isHigh
                        ? { background: '#FEF2F2', color: '#DC2626' }
                        : { background: '#ECFDF5', color: '#059669' }
                      }
                    >
                      {isHigh ? 'High Risk' : 'Low Risk'}
                    </span>
                    <span className={styles.searchRiskPct}>{risk}% risk</span>
                    <span className={styles.searchDate}>{date}</span>
                  </div>
                );
              })
            )}
            <div className={styles.searchFooter} onClick={() => { navigate('/history'); setSearchOpen(false); setSearchQuery(''); }}>
              View all history →
            </div>
          </div>
        )}
      </div>

      {/* Right */}
      <div className={styles.right}>
        {/* Avatar + dropdown */}
        {user && (
          <div className={styles.popoverWrap} ref={userMenuRef}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />

            <button
              className={`${styles.avatarBtn} ${showUserMenu ? styles.avatarBtnActive : ''}`}
              onClick={() => {
                setShowUserMenu(!showUserMenu);
              }}
              aria-label="User menu"
              style={{ position: 'relative' }}
            >
              <div className={styles.avatar}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
                ) : (
                  initials
                )}
              </div>
              {unreadCount > 0 && (
                <span className={styles.badge} style={{ top: 2, right: 2 }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <ChevronDown
                size={13}
                className={`${styles.chevron} ${showUserMenu ? styles.chevronOpen : ''}`}
              />
            </button>

            {showUserMenu && (
              <div className={styles.userDropdown}>
                {/* Profile block with photo change */}
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
                <button
                  className={styles.menuItem}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={15} />
                  Change Photo
                </button>
                {avatarUrl && (
                  <button
                    className={styles.menuItem}
                    onClick={() => dispatch(setAvatarUrl(null))}
                  >
                    <XIcon size={15} />
                    Remove Photo
                  </button>
                )}

                {user.role === 'doctor' && (
                  <>
                    <div className={styles.menuDivider} />
                    <button
                      className={styles.menuItem}
                      onClick={() => {
                        navigate('/doctor/profile');
                        setShowUserMenu(false);
                      }}
                    >
                      <User size={15} />
                      View Profile
                    </button>
                  </>
                )}

                <div className={styles.menuDivider} />

                {/* ── Notifications ── */}
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
                          <span className={styles.notifDot} style={{ background: typeColor[n.type] }} />
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
            )}
          </div>
        )}
      </div>
    </header>
  );
}
