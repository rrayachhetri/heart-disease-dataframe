import { type SelectHTMLAttributes } from 'react';
import styles from './SelectField.module.less';

interface Option {
  label: string;
  value: number;
}

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  hint?: string;
  options: Option[];
  value: number;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
}

export default function SelectField({
  label,
  hint,
  options,
  value,
  onChange,
  icon,
  ...rest
}: Props) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {hint && <span className={styles.hint}>{hint}</span>}
      </label>
      <div className={styles.selectWrapper}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <select
          className={styles.select}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
