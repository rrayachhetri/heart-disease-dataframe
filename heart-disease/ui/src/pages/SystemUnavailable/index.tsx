import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getTextContent } from '../../content/text';
import { motion } from 'framer-motion';
import { Heart, ServerCrash, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { clearUnavailable } from '../../store/slices/systemSlice';
import styles from './SystemUnavailablePage.module.less';

const RETRY_INTERVAL_MS = 15_000;

export default function SystemUnavailablePage() {
  const dispatch  = useAppDispatch();
  const { reason, detectedAt } = useAppSelector((s) => s.system);
  const [countdown, setCountdown]   = useState(RETRY_INTERVAL_MS / 1000);
  const [retrying,  setRetrying]    = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const reasons = getTextContent('systemUnavailable').reasons;
  const copy = reasons[reason ?? 'api_down'] ?? reasons.api_down;

  const tryReconnect = useCallback(async () => {
    setRetrying(true);
    setRetryCount((n) => n + 1);
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        dispatch(clearUnavailable());
      }
    } catch {
      // still down
    } finally {
      setRetrying(false);
      setCountdown(RETRY_INTERVAL_MS / 1000);
    }
  }, [dispatch]);

  // Auto-retry countdown
  useEffect(() => {
    setCountdown(RETRY_INTERVAL_MS / 1000);
    const tick = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          tryReconnect();
          return RETRY_INTERVAL_MS / 1000;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(tick);
  }, [tryReconnect]);

  const detectedTime = detectedAt
    ? new Date(detectedAt).toLocaleTimeString()
    : null;

  const isOnline = navigator.onLine;

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        transition={{ duration: 0.35 }}
      >
        {/* Brand */}
        <div className={styles.brand}>
          <Heart size={26} fill="currentColor" />
        </div>

        {/* Status icon */}
        <motion.div
          className={styles.iconWrap}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
        >
          {isOnline ? <ServerCrash size={38} strokeWidth={1.5} /> : <WifiOff size={38} strokeWidth={1.5} />}
        </motion.div>

        <h1 className={styles.heading}>System temporarily unavailable</h1>
        <p className={styles.detail}>{copy.detail}</p>

        {/* Status row */}
        <div className={styles.statusRow}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>{copy.title}</span>
          {detectedTime && (
            <span className={styles.detectedAt}>since {detectedTime}</span>
          )}
        </div>

        {/* Connectivity indicator */}
        <div className={`${styles.connRow} ${isOnline ? styles.connOnline : styles.connOffline}`}>
          {isOnline
            ? <><Wifi size={13} /> Network connected — waiting for server</>
            : <><WifiOff size={13} /> No network connection detected</>}
        </div>

        {/* Retry button */}
        <button
          className={styles.retryBtn}
          onClick={tryReconnect}
          disabled={retrying}
          type="button"
        >
          <motion.span
            animate={retrying ? { rotate: 360 } : { rotate: 0 }}
            transition={retrying ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}
            style={{ display: 'inline-flex' }}
          >
            <RefreshCw size={15} />
          </motion.span>
          {retrying ? 'Checking…' : `Retry now`}
        </button>

        {/* Auto retry */}
        <p className={styles.autoRetry}>
          Auto-retrying in <strong>{countdown}s</strong>
          {retryCount > 0 && <> &middot; attempt {retryCount}</>}
        </p>

        <p className={styles.footnote}>
          Your prediction history and account data are safe and will be
          accessible once the service is restored.
        </p>
      </motion.div>
    </div>
  );
}
