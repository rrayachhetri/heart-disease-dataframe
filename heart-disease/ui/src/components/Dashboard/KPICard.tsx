import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { getTextContent } from '../../content/text';
import styles from './KPICard.module.less';

const t = getTextContent('kpiCard');

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'amber';
  trend?: { value: number; label: string };
  onClick?: () => void;
  linkLabel?: string;
}

const iconBoxVariants: Record<string, string> = {
  blue: styles.iconBoxBlue,
  green: styles.iconBoxGreen,
  red: styles.iconBoxRed,
  amber: styles.iconBoxAmber,
};

const linkRowVariants: Record<string, string> = {
  blue: styles.linkRowBlue,
  green: styles.linkRowGreen,
  red: styles.linkRowRed,
  amber: styles.linkRowAmber,
};

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  onClick,
  linkLabel = t.viewDetails,
}: Props) {
  return (
    <motion.div
      className={`${styles.card} ${onClick ? styles.clickable : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      whileHover={onClick ? { y: -3 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <div className={styles.header}>
        <div>
          <p className={styles.title}>{title}</p>
          <p className={styles.value}>{value}</p>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={`${styles.iconBox} ${iconBoxVariants[color]}`}>
          <Icon size={22} />
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
      {onClick && (
        <div className={`${styles.linkRow} ${linkRowVariants[color]}`}>
          <span>{linkLabel}</span>
          <ArrowRight size={14} />
        </div>
      )}
    </motion.div>
  );
}
