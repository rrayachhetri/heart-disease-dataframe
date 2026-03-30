import { type InputHTMLAttributes } from 'react';
import styles from './FormField.module.less';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function FormField({
  label,
  hint,
  error,
  icon,
  ...inputProps
}: Props) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {hint && <span className={styles.hint}>{hint}</span>}
      </label>
      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input className={styles.input} {...inputProps} />
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
