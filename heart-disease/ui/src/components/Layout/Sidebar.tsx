import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: Props) {
  const location = useLocation();
  const user = useSelector((s: RootState) => s.auth.user);
  const navItems = user?.role === 'doctor' ? doctorNavItems : patientNavItems;

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
        {!collapsed && <span className={styles.logoText}>CardioSense</span>}
        <button
          className={styles.mobileClose}
          onClick={onMobileClose}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <nav className={styles.nav}>
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={`${styles.navItem} ${
              location.pathname === path ? styles.active : ''
            }`}
            title={collapsed ? label : undefined}
            onClick={onMobileClose}
          >
            <Icon size={20} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        className={styles.toggle}
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
