import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { extend, expire } from '../../store/slices/sessionSlice';
import { logout } from '../../store/slices/authSlice';
import { getTextContent } from '../../content/text';
import styles from './SessionWarningBanner.module.less';

const t = getTextContent('session');

export default function SessionWarningBanner() {
  const dispatch   = useAppDispatch();
  const { status, secondsLeft } = useAppSelector((s) => s.session);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeLabel = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}`
    : `${secs}s`;

  const urgency = secondsLeft <= 30;

  const handleStay = () => dispatch(extend());
  const handleLeave = () => {
    dispatch(expire());
    dispatch(logout());
  };

  return (
    <AnimatePresence>
      {status === 'warning' && (
        <motion.div
          className={`${styles.banner} ${urgency ? styles.urgent : ''}`}
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          role="alertdialog"
          aria-live="assertive"
          aria-label={t.warningBannerAria}
        >
          <div className={styles.inner}>
            <div className={styles.left}>
              <Clock size={18} className={urgency ? styles.iconUrgent : styles.icon} />
              <div className={styles.text}>
                <span className={styles.title}>{t.warningTitle}</span>
                <span className={styles.sub}>
                  {t.warningSubPrefix}
                  <strong className={urgency ? styles.countdownUrgent : styles.countdown}>
                    {timeLabel}
                  </strong>
                  {t.warningSubSuffix}
                </span>
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.stayBtn} onClick={handleStay} type="button">
                <RefreshCw size={14} />
                {t.stayLoggedIn}
              </button>
              <button className={styles.leaveBtn} onClick={handleLeave} type="button">
                <LogOut size={14} />
                {t.signOutNow}
              </button>
            </div>
          </div>

          {/* shrinking progress bar */}
          <motion.div
            className={styles.progressBar}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: secondsLeft / 120 }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
