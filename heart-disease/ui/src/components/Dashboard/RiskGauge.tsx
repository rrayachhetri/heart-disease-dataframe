import { motion } from 'framer-motion';
import styles from './RiskGauge.module.less';

interface Props {
  probability: number;
  size?: number;
}

export default function RiskGauge({ probability, size = 200 }: Props) {
  const pct = Math.round(probability * 100);
  const color = pct >= 50 ? '#DC2626' : pct >= 30 ? '#D97706' : '#059669';

  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - probability * circumference;

  return (
    <div className={styles.gauge} style={{ width: size, height: size / 2 + 40 }}>
      <svg
        width={size}
        height={size / 2 + 10}
        viewBox={`0 0 ${size} ${size / 2 + 10}`}
      >
        <path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <motion.path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className={styles.label}>
        <motion.span
          className={styles.percentage}
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {pct}%
        </motion.span>
        <span className={styles.subtext}>Risk Score</span>
      </div>
    </div>
  );
}
