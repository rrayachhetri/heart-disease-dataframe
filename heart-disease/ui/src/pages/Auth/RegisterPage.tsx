import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, User, Stethoscope, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerUser, loginUser, clearAuthError } from '../../store/slices/authSlice';
import { getTextContent } from '../../content/text';
import type { UserRole } from '../../types';
import styles from './Auth.module.less';

const t = getTextContent('register');

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'patient' as UserRole,
  });
  const [showPassword, setShowPassword] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const regResult = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(regResult)) {
      const loginResult = await dispatch(loginUser({ email: form.email, password: form.password }));
      if (loginUser.fulfilled.match(loginResult)) {
        navigate('/');
      }
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

        {/* Role selector */}
        <div className={styles.roleToggle}>
          <button
            type="button"
            className={`${styles.roleBtn} ${form.role === 'patient' ? styles.roleActive : ''}`}
            onClick={() => setForm((f) => ({ ...f, role: 'patient' }))}
          >
            <User size={16} /> {t.patientRole}
          </button>
          <button
            type="button"
            className={`${styles.roleBtn} ${form.role === 'doctor' ? styles.roleActive : ''}`}
            onClick={() => setForm((f) => ({ ...f, role: 'doctor' }))}
          >
            <Stethoscope size={16} /> {t.doctorRole}
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t.firstNameLabel}</label>
              <input className={styles.input} placeholder={t.firstNamePlaceholder} value={form.first_name} onChange={set('first_name')} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t.lastNameLabel}</label>
              <input className={styles.input} placeholder={t.lastNamePlaceholder} value={form.last_name} onChange={set('last_name')} required />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t.emailLabel}</label>
            <div className={styles.inputWrapper}>
              <Mail size={16} className={styles.inputIcon} />
              <input type="email" className={styles.input} placeholder={t.emailPlaceholder} value={form.email} onChange={set('email')} required autoComplete="email" />
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
                value={form.password}
                onChange={set('password')}
                required
                minLength={8}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
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
