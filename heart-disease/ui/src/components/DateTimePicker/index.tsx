import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import styles from './DateTimePicker.module.less';

interface DateTimePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  min?: string;
  placeholder?: string;
}

interface Parsed {
  year: number;
  month: number; // 0-11
  day: number;
  hour: number;
  minute: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** All parsing/formatting here stays in local date parts only — never round-trips
 * through Date.toISOString()/UTC, so it can't reintroduce the timezone bug fixed earlier. */
function parseValue(value: string): Parsed | null {
  if (!value) return null;
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = (timePart || '00:00').split(':').map(Number);
  if (!year || !month || !day) return null;
  return { year, month: month - 1, day, hour: hour || 0, minute: minute || 0 };
}

function toValue(p: Parsed): string {
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

function formatDisplay(p: Parsed): string {
  const date = new Date(p.year, p.month, p.day);
  const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const hour12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  const ampm = p.hour < 12 ? 'AM' : 'PM';
  return `${dateLabel}, ${hour12}:${pad(p.minute)} ${ampm}`;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Lightweight, on-brand replacement for the native datetime-local calendar popup,
 * which can't be restyled and can render off-screen near viewport edges. */
export default function DateTimePicker({ id, value, onChange, required, min, placeholder }: DateTimePickerProps) {
  const parsed = parseValue(value);
  const minParsed = min ? parseValue(min) : null;
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? new Date().getMonth());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !wrapperRef.current) return;
    const trigger = wrapperRef.current.getBoundingClientRect();
    const panelWidth = 280;
    const panelHeight = 360;
    const margin = 12;

    let left = trigger.left;
    if (left + panelWidth > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - panelWidth - margin);
    }
    let top = trigger.bottom + 6;
    if (top + panelHeight > window.innerHeight - margin) {
      top = Math.max(margin, trigger.top - panelHeight - 6);
    }
    setPanelStyle({ position: 'fixed', top, left, width: panelWidth });
  }, [open]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();

  const goToMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const isBeforeMin = (day: number) => {
    if (!minParsed) return false;
    const candidate = new Date(viewYear, viewMonth, day).setHours(0, 0, 0, 0);
    const minDate = new Date(minParsed.year, minParsed.month, minParsed.day).setHours(0, 0, 0, 0);
    return candidate < minDate;
  };

  const selectDay = (day: number) => {
    onChange(toValue({ year: viewYear, month: viewMonth, day, hour: parsed?.hour ?? 9, minute: parsed?.minute ?? 0 }));
  };

  const changeTime = (hour: number, minute: number) => {
    const base = parsed ?? { year: viewYear, month: viewMonth, day: new Date().getDate(), hour: 9, minute: 0 };
    onChange(toValue({ ...base, hour, minute }));
  };

  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        id={id}
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <CalendarDays size={16} />
        <span className={parsed ? undefined : styles.placeholder}>
          {parsed ? formatDisplay(parsed) : placeholder || 'Select date & time'}
        </span>
      </button>

      {open && (
        <div className={styles.panel} style={panelStyle} role="dialog" aria-label="Choose date and time">
          <div className={styles.panelHeader}>
            <button type="button" aria-label="Previous month" onClick={() => goToMonth(-1)}>
              <ChevronLeft size={16} />
            </button>
            <span>{new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
            <button type="button" aria-label="Next month" onClick={() => goToMonth(1)}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className={styles.weekdays}>
            {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
          </div>
          <div className={styles.days}>
            {cells.map((day, i) => {
              if (day === null) return <span key={`blank-${i}`} />;
              const isSelected = parsed?.year === viewYear && parsed?.month === viewMonth && parsed?.day === day;
              const disabled = isBeforeMin(day);
              return (
                <button
                  type="button"
                  key={day}
                  className={`${styles.day} ${isSelected ? styles.daySelected : ''}`}
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <label className={styles.timeRow}>
            <Clock size={15} />
            <input
              type="time"
              value={parsed ? `${pad(parsed.hour)}:${pad(parsed.minute)}` : ''}
              onChange={(event) => {
                const [hour, minute] = event.target.value.split(':').map(Number);
                if (!Number.isNaN(hour) && !Number.isNaN(minute)) changeTime(hour, minute);
              }}
            />
          </label>
          <button type="button" className={styles.doneBtn} onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
