import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  HeartPulse,
  ClipboardList,
  Activity,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  X,
} from 'lucide-react';
import type { RootState } from '../../store';
import styles from './Sidebar.module.less';

const patientNavItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/predict', label: 'New Prediction', icon: HeartPulse },
  { path: '/history', label: 'History', icon: ClipboardList },
];

const doctorNavItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/predict', label: 'New Prediction', icon: HeartPulse },
  { path: '/history', label: 'History', icon: ClipboardList },
  { path: '/doctor/profile', label: 'My Profile', icon: Stethoscope },
];

interface Props {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
  onNavClick: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose, onNavClick }: Props) {
  const user = useSelector((s: RootState) => s.auth.user);
  const navItems = user?.role === 'doctor' ? doctorNavItems : patientNavItems;
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <aside
      className={[
        styles.sidebar,
        collapsed ? styles.collapsed : '',
        mobileOpen ? styles.mobileOpen : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.logo}>
        <Activity className={styles.logoIcon} size={28} />
        {(!collapsed || mobileOpen) && <span className={styles.logoText}>CardioSense</span>}
        
        {/* Mobile close button */}
        {isMobile && (
          <button
            className={styles.mobileClose}
            onClick={onMobileClose}
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className={styles.nav}>
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `${styles.navItem}${isActive ? ` ${styles.active}` : ''}`
            }
            title={collapsed && !mobileOpen ? label : undefined}
            onClick={onNavClick}
          >
            <Icon size={20} />
            {(!collapsed || mobileOpen) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Desktop toggle button */}
      {!isMobile && (
        <button
          className={styles.toggle}
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      )}
    </aside>
  );
}
