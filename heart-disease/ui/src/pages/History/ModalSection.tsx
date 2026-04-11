import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import styles from './HistoryPage.module.less';

export default function ModalSection({
  icon,
  title,
  children,
  defaultOpen = true,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.modalSection}>
      <button className={styles.modalSectionHeader} onClick={() => setOpen((v) => !v)}>
        <span className={styles.modalSectionHeaderLeft}>
          {icon}
          <span className={styles.modalSectionTitle}>{title}</span>
        </span>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className={styles.modalChevron}
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.modalSectionBody}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
