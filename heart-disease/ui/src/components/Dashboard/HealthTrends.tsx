import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getTextContent } from '../../content/text';
import type { PredictionRecord } from '../../types';
import styles from './HealthTrends.module.less';

const t = getTextContent('healthTrends');

interface Props {
  history: PredictionRecord[];
}

interface Metric {
  key: 'chol' | 'trestbps' | 'thalach';
  label: string;
  unit: string;
  /** For this metric, does a lower value mean "improving"? */
  lowerIsBetter: boolean;
}

const METRICS: Metric[] = [
  { key: 'chol', label: t.cholesterolLabel, unit: 'mg/dl', lowerIsBetter: true },
  { key: 'trestbps', label: t.bloodPressureLabel, unit: 'mm Hg', lowerIsBetter: true },
  { key: 'thalach', label: t.heartRateLabel, unit: 'bpm', lowerIsBetter: false },
];

export default function HealthTrends({ history }: Props) {
  // history is newest-first; oldest assessment is the last element.
  if (history.length < 2) {
    return (
      <section className={styles.card} aria-labelledby="health-trends-heading">
        <h3 id="health-trends-heading" className={styles.heading}>{t.heading}</h3>
        <p className={styles.subheading}>{t.subheading}</p>
        <p className={styles.empty}>{t.empty}</p>
      </section>
    );
  }

  const latest = history[0].patientData;
  const first = history[history.length - 1].patientData;

  return (
    <section className={styles.card} aria-labelledby="health-trends-heading">
      <h3 id="health-trends-heading" className={styles.heading}>{t.heading}</h3>
      <p className={styles.subheading}>{t.subheading}</p>

      <ul className={styles.list}>
        {METRICS.map((m) => {
          const latestVal = latest[m.key];
          const firstVal = first[m.key];
          const delta = latestVal - firstVal;
          const improving = m.lowerIsBetter ? delta < 0 : delta > 0;
          const worsening = m.lowerIsBetter ? delta > 0 : delta < 0;
          const Icon = delta === 0 ? Minus : improving ? TrendingDown : TrendingUp;
          const tagClass = improving ? styles.tagGood : worsening ? styles.tagBad : styles.tagNeutral;
          const tagText = improving ? t.improvingTag : worsening ? t.worseningTag : t.stableTag;

          return (
            <li key={m.key} className={styles.item}>
              <div>
                <p className={styles.metricLabel}>{m.label}</p>
                <p className={styles.metricValue}>
                  {t.latestVsFirst(latestVal, firstVal)} {m.unit}
                </p>
              </div>
              <span className={`${styles.tag} ${tagClass}`}>
                <Icon size={14} aria-hidden="true" />
                {tagText}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
