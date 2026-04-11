import { ChevronDown, X as XIcon, Search, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setAvatarUrl } from '../../../store/slices/authSlice';
import { getTextContent } from '../../../content/text';
import type { PredictionRecord } from '../../../types';
import UserMenuDropdown from './UserMenuDropdown';
import styles from './Header.module.less';

const tHeader = getTextContent('header');
const tNav    = getTextContent('nav');
const tApp    = getTextContent('app');

const pageTitles: Record<string, string> = {
  '/': tNav.dashboard,
  '/predict': tNav.newPrediction,
  '/result': tNav.predictionResult,
  '/history': tNav.history,
  '/doctor/profile': tNav.doctorProfile,
};

interface Props {
  onMenuClick?: () => void;
  userMenuOpen: boolean;
  onUserMenuToggle: () => void;
  onUserMenuClose: () => void;
}

export default function Header({ onMenuClick, userMenuOpen, onUserMenuToggle, onUserMenuClose }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((s) => s.notifications.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const user = useAppSelector((s) => s.auth.user);
  const avatarUrl = useAppSelector((s) => s.auth.avatarUrl);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const history = useAppSelector((s) => s.prediction.history);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        onUserMenuClose();
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onUserMenuClose]);

  return (
    <header className={styles.header}>
      {/* Left */}
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onMenuClick}
          aria-label={tHeader.toggleMenuAria}
        >
          <Menu size={20} />
        </button>
        <h1 className={styles.title}>{pageTitles[location.pathname] || tApp.name}</h1>
      </div>

      {/* Center — search bar */}
      <div className={styles.center} ref={searchRef}>
        <div className={`${styles.searchWrap} ${searchOpen ? styles.searchWrapOpen : ''}`}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder={tHeader.searchPlaceholder}
            value={searchQuery}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
          />
          {searchQuery && (
            <button
              className={styles.searchClear}
              onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
            >
              <XIcon size={13} />
            </button>
          )}
        </div>
        {searchOpen && searchQuery.trim().length > 0 && (
          <div className={styles.searchDropdown}>
            {searchResults.length === 0 ? (
              <div className={styles.searchEmpty}>{tHeader.searchEmpty}</div>
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
                      className={`${styles.searchRiskBadge} ${isHigh ? styles.searchRiskBadgeHigh : styles.searchRiskBadgeLow}`}
                    >
                      {isHigh ? tHeader.highRisk : tHeader.lowRisk}
                    </span>
                    <span className={styles.searchRiskPct}>{risk}{tHeader.riskSuffix}</span>
                    <span className={styles.searchDate}>{date}</span>
                  </div>
                );
              })
            )}
            <div
              className={styles.searchFooter}
              onClick={() => { navigate('/history'); setSearchOpen(false); setSearchQuery(''); }}
            >
              {tHeader.searchFooter}
            </div>
          </div>
        )}
      </div>

      {/* Right */}
      <div className={styles.right}>
        {user && (
          <div className={styles.popoverWrap} ref={userMenuRef}>
            {/* Hidden file input for avatar upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleAvatarChange}
            />

            <button
              className={`${styles.avatarBtn} ${userMenuOpen ? styles.avatarBtnActive : ''}`}
              onClick={onUserMenuToggle}
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
                className={`${styles.chevron} ${userMenuOpen ? styles.chevronOpen : ''}`}
              />
            </button>

            {userMenuOpen && (
              <UserMenuDropdown fileInputRef={fileInputRef} onClose={onUserMenuClose} />
            )}
          </div>
        )}
      </div>
    </header>
  );
}
