import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import styles from './ResultPage.module.less';

export default function Section({
  title,
  icon,
  subtitle,
  delay,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  delay: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <motion.div
      className={styles.section}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <button className={styles.sectionHeader} onClick={() => setOpen((v) => !v)}>
        <div className={styles.sectionHeaderLeft}>
          <span className={styles.sectionIcon}>{icon}</span>
          <div>
            <span className={styles.sectionTitle}>{title}</span>
            {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className={styles.chevron}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.sectionBody}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
