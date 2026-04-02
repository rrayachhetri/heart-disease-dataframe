import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Mail, Lock, User, Stethoscope, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { registerUser, loginUser, clearAuthError } from '../store/slices/authSlice';
import type { AppDispatch, RootState } from '../store';
import type { UserRole } from '../types';
import styles from './AuthPage.module.less';

export default function RegisterPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s: RootState) => s.auth);

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
      // Auto-login after successful registration
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
        <h1 className={styles.heading}>Create your account</h1>
        <p className={styles.subheading}>Join CardioSense today</p>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Role selector */}
        <div className={styles.roleToggle}>
          <button
            type="button"
            className={`${styles.roleBtn} ${form.role === 'patient' ? styles.roleActive : ''}`}
            onClick={() => setForm((f) => ({ ...f, role: 'patient' }))}
          >
            <User size={16} /> Patient
          </button>
          <button
            type="button"
            className={`${styles.roleBtn} ${form.role === 'doctor' ? styles.roleActive : ''}`}
            onClick={() => setForm((f) => ({ ...f, role: 'doctor' }))}
          >
            <Stethoscope size={16} /> Doctor
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>First name</label>
              <input className={styles.input} placeholder="Jane" value={form.first_name} onChange={set('first_name')} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Last name</label>
              <input className={styles.input} placeholder="Doe" value={form.last_name} onChange={set('last_name')} required />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <div className={styles.inputWrapper}>
              <Mail size={16} className={styles.inputIcon} />
              <input type="email" className={styles.input} placeholder="you@example.com" value={form.email} onChange={set('email')} required autoComplete="email" />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="Min. 8 characters"
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
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
