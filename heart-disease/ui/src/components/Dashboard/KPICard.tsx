import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './KPICard.module.less';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'amber';
  trend?: { value: number; label: string };
}

const colorMap = {
  blue: { bg: '#EFF6FF', icon: '#2563EB', border: '#BFDBFE' },
  green: { bg: '#ECFDF5', icon: '#059669', border: '#A7F3D0' },
  red: { bg: '#FEF2F2', icon: '#DC2626', border: '#FECACA' },
  amber: { bg: '#FFFBEB', icon: '#D97706', border: '#FDE68A' },
};

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: Props) {
  const c = colorMap[color];

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.header}>
        <div>
          <p className={styles.title}>{title}</p>
          <p className={styles.value}>{value}</p>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div
          className={styles.iconBox}
          style={{ backgroundColor: c.bg, borderColor: c.border }}
        >
          <Icon size={22} style={{ color: c.icon }} />
        </div>
      </div>
      {trend && (
        <div className={styles.trend}>
          <span className={trend.value >= 0 ? styles.trendUp : styles.trendDown}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className={styles.trendLabel}>{trend.label}</span>
        </div>
      )}
    </motion.div>
  );
}
