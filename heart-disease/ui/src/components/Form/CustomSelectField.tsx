import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './CustomSelectField.module.less';

interface Option {
  label: string;
  value: number;
}

interface Props {
  label: string;
  hint?: string;
  options: Option[];
  value: number;
  onChange: (value: number) => void;
}

export default function CustomSelectField({
  label,
  hint,
  options,
  value,
  onChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = options.findIndex(opt => opt.value === value);
        const nextIndex = event.key === 'ArrowDown' 
          ? Math.min(currentIndex + 1, options.length - 1)
          : Math.max(currentIndex - 1, 0);
        onChange(options[nextIndex].value);
      }
    }
  };

  return (
    <div className={styles.field} ref={dropdownRef}>
      <label className={styles.label}>
        {label}
        {hint && <span className={styles.hint}>{hint}</span>}
      </label>
      
      <div className={styles.selectWrapper}>
        <button
          ref={buttonRef}
          type="button"
          className={styles.selectButton}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={styles.selectedText}>
            {selectedOption?.label || 'Select an option'}
          </span>
          <ChevronDown 
            size={16} 
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} 
          />
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.optionsList} role="listbox">
              {options.map((option) => (
                <div
                  key={option.value}
                  className={`${styles.option} ${
                    option.value === value ? styles.optionSelected : ''
                  }`}
                  onClick={() => handleSelect(option.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(option.value);
                    }
                  }}
                  tabIndex={0}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}