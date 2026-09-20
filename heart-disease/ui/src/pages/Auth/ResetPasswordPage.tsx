import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, KeyRound, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { resetPassword } from '../../api/authApi';
import { getTextContent } from '../../content/text';
import styles from './Auth.module.less';

const t = getTextContent('resetPassword');

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className={styles.logo}>
          <Heart size={28} fill="currentColor" />
        </div>
        <h1 className={styles.heading}>{t.heading}</h1>
        <p className={styles.subheading}>{t.subheading}</p>

        {error && (
          <div className={styles.errorBanner} role="alert" aria-live="polite">
            <AlertCircle size={16} className={styles.bannerIcon} />
            <span className={styles.bannerText}>{error}</span>
          </div>
        )}
        {success && (
          <div className={styles.successBanner} role="status" aria-live="polite">
            <CheckCircle2 size={16} className={styles.bannerIcon} />
            <span className={styles.bannerText}>{t.successMessage}</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>{t.tokenLabel}</label>
              <div className={styles.inputWrapper}>
                <KeyRound size={16} className={styles.inputIcon} />
                <input
                  type="text"
                  className={styles.input}
                  placeholder={t.tokenPlaceholder}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t.passwordLabel}</label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? t.submitLoading : t.submitLabel}
            </button>
          </form>
        )}

        <p className={styles.footer}>
          {t.footerText}{' '}
          <Link to="/login" className={styles.link}>{t.footerLink}</Link>
        </p>
      </motion.div>
    </div>
  );
}
