import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { forgotPassword } from '../../api/authApi';
import { getTextContent } from '../../content/text';
import styles from './Auth.module.less';

const t = getTextContent('forgotPassword');

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDevToken('');
    setLoading(true);
    try {
      const res = await forgotPassword(email, firstName, lastName);
      setMessage(res.message);
      if (res.dev_reset_token) setDevToken(res.dev_reset_token);
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
        {message && (
          <div className={styles.successBanner} role="status" aria-live="polite">
            <CheckCircle2 size={16} className={styles.bannerIcon} />
            <span className={styles.bannerText}>{message}</span>
          </div>
        )}

        {devToken && (
          <div className={styles.devTokenBox}>
            {t.devTokenNote}
            <br />
            <Link to={`/reset-password?token=${encodeURIComponent(devToken)}`}>
              Reset password
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>{t.emailLabel}</label>
            <div className={styles.inputWrapper}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                type="email"
                className={styles.input}
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t.firstNameLabel}</label>
            <div className={styles.inputWrapper}>
              <User size={16} className={styles.inputIcon} />
              <input
                type="text"
                className={styles.input}
                placeholder={t.firstNamePlaceholder}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t.lastNameLabel}</label>
            <div className={styles.inputWrapper}>
              <User size={16} className={styles.inputIcon} />
              <input
                type="text"
                className={styles.input}
                placeholder={t.lastNamePlaceholder}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? t.submitLoading : t.submitLabel}
          </button>
        </form>

        <p className={styles.footer}>
          {t.footerText}{' '}
          <Link to="/login" className={styles.link}>{t.footerLink}</Link>
        </p>
      </motion.div>
    </div>
  );
}
