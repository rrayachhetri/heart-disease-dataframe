import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Clock, LogIn, ShieldAlert } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { resetSession } from '../../store/slices/sessionSlice';
import { getTextContent } from '../../content/text';
import styles from './SessionTimeoutPage.module.less';

const t = getTextContent('sessionTimeout');

export default function SessionTimeoutPage() {
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();

  const handleSignIn = () => {
    dispatch(resetSession());
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        transition={{ duration: 0.35 }}
      >
        {/* Brand mark */}
        <div className={styles.brand}>
          <Heart size={26} fill="currentColor" />
        </div>

        {/* Icon */}
        <motion.div
          className={styles.iconWrap}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
        >
          <Clock size={36} strokeWidth={1.5} />
        </motion.div>

        <h1 className={styles.heading}>{t.heading}</h1>
        <p className={styles.sub}>
          {t.protectionNote !== undefined && (
            <>You were signed out after <strong>{t.protectionNote}</strong> to protect your account and patient data.</>
          )}
        </p>

        <div className={styles.infoBox}>
          <ShieldAlert size={14} />
          <span>{t.infoText}</span>
        </div>

        <button className={styles.signInBtn} onClick={handleSignIn} type="button">
          <LogIn size={16} />
          {t.signInBtn}
        </button>

        <p className={styles.footnote}>{t.footnote}</p>
      </motion.div>
    </div>
  );
}
