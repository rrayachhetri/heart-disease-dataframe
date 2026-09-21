import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import type { DatasetSummary } from '../../sideeffects/api/predictApi';
import StatTooltip from '../../components/Dashboard/StatTooltip';
import styles from './DashboardPage.module.less';

interface Props {
  cohort: DatasetSummary;
  selectedFeature: string;
  onFeatureChange: (f: string) => void;
  allDatasets: DatasetSummary[];
  explorerRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}

const FEATURE_LABELS: Record<string, string> = {
  age: 'Age', sex: 'Sex', cp: 'Chest Pain', trestbps: 'Resting BP',
  chol: 'Cholesterol', fbs: 'Fasting BS', restecg: 'Resting ECG',
  thalach: 'Max Heart Rate', exang: 'Ex. Angina', oldpeak: 'ST Depression',
  slope: 'ST Slope', ca: 'Major Vessels', thal: 'Thalassemia',
};

const FEAT_UNITS: Record<string, string> = {
  age: 'yrs', trestbps: 'mmHg', chol: 'mg/dL', thalach: 'bpm', oldpeak: 'mm',
};

const COHORT_COLORS: Record<string, string> = {
  cleveland: '#7c3aed', hungarian: '#0891b2', switzerland: '#059669', va: '#d97706',
};

export default function CohortFeatureExplorer({
  cohort,
  selectedFeature,
  onFeatureChange,
  allDatasets,
  explorerRef,
  onClose,
}: Props) {
  const featureKeys = Object.keys(FEATURE_LABELS).filter((k) => cohort.features[k]);
  const stats = cohort.features[selectedFeature];

  const compChartData = allDatasets.map((ds) => ({
    name: ds.name.charAt(0).toUpperCase() + ds.name.slice(1),
    mean: ds.features[selectedFeature]?.mean ?? 0,
    fill: COHORT_COLORS[ds.name] ?? '#7ae8e3',
  }));

  return (
    <motion.div
      ref={explorerRef}
      key="detail"
      className={styles.cohortDetail}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className={styles.cohortDetailHeader}>
        <span className={styles.cohortDetailTitle}>
          {cohort.name.charAt(0).toUpperCase() + cohort.name.slice(1)} Cohort — Feature Explorer
        </span>
        <button className={styles.cohortDetailClose} onClick={onClose}>×</button>
      </div>

      {/* Feature selector pills */}
      <div className={styles.featurePills}>
        {featureKeys.map((k) => (
          <button
            key={k}
            type="button"
            className={`${styles.featurePill} ${selectedFeature === k ? styles.featurePillActive : ''}`}
            onClick={() => onFeatureChange(k)}
          >
            {FEATURE_LABELS[k]}
          </button>
        ))}
      </div>

      <div className={styles.cohortDetailBody}>
        {/* Stats cards */}
        {stats && (
          <div className={styles.statsCards}>
            {[
              { label: 'Mean', value: stats.mean.toFixed(1), unit: FEAT_UNITS[selectedFeature] },
              { label: 'Std Dev', value: `±${stats.std.toFixed(1)}`, unit: '' },
              { label: 'Median', value: stats.median.toFixed(1), unit: FEAT_UNITS[selectedFeature] },
              { label: 'IQR', value: `${stats.q1.toFixed(1)}–${stats.q3.toFixed(1)}`, unit: '' },
              { label: 'Min', value: stats.min.toFixed(1), unit: '' },
              { label: 'Max', value: stats.max.toFixed(1), unit: '' },
            ].map(({ label, value, unit }) => (
              <StatTooltip key={label} term={label === 'Std Dev' ? 'StdDev' : label} className={styles.statCard}>
                <div className={styles.statValue}>{value}{unit ? <span className={styles.statUnit}> {unit}</span> : null}</div>
                <div className={styles.statLabel}>{label}</div>
              </StatTooltip>
            ))}
          </div>
        )}

        {/* Cross-cohort comparison bar chart */}
        <div className={styles.compChart}>
          <p className={styles.compChartTitle}>
            {FEATURE_LABELS[selectedFeature]} — mean across all cohorts
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={compChartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) => [
                  `${v.toFixed(1)}${FEAT_UNITS[selectedFeature] ? ' ' + FEAT_UNITS[selectedFeature] : ''}`,
                  FEATURE_LABELS[selectedFeature],
                ]}
              />
              <Bar dataKey="mean" radius={[4, 4, 0, 0]}>
                {compChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
