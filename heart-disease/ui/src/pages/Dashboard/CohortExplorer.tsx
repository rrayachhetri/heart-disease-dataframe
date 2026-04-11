import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database } from 'lucide-react';
import { getTextContent } from '../../content/text';
import type { DatasetSummary } from '../../api/predictApi';
import CohortTooltip from '../../components/Dashboard/CohortTooltip';
import CohortFeatureExplorer from './CohortFeatureExplorer';
import styles from './DashboardPage.module.less';

interface Props {
  datasets: DatasetSummary[];
}

export default function CohortExplorer({ datasets }: Props) {
  const t = getTextContent('dashboard');

  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState('age');
  const [showCohortDetails, setShowCohortDetails] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    cohort: DatasetSummary | null;
    visible: boolean;
    position: { x: number; y: number };
  }>({ cohort: null, visible: false, position: { x: 0, y: 0 } });

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const featureExplorerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to Feature Explorer when a cohort is selected
  useEffect(() => {
    if (selectedCohort && featureExplorerRef.current) {
      const scrollTimer = setTimeout(() => {
        featureExplorerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      }, 100);
      return () => clearTimeout(scrollTimer);
    }
  }, [selectedCohort]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <motion.div
      className={styles.datasetCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className={styles.datasetCardHeader}>
        <Database size={18} />
        <div>
          <h3>{t.trainingDataTitle}</h3>
          <p className={styles.datasetSubtitle}>
            {t.trainingDataSubtitle(datasets.reduce((s, d) => s + d.meta.total_records, 0))}
          </p>
        </div>
      </div>

      {/* Clickable cohort tiles */}
      <div className={styles.cohortGrid}>
        {datasets.map((ds) => {
          const diseaseRate = Math.round(ds.meta.disease_rate * 100);
          const isSelected = selectedCohort === ds.name;
          return (
            <button
              key={ds.name}
              className={`${styles.cohortTile} ${isSelected ? styles.cohortTileSelected : ''}`}
              onClick={() => {
                setSelectedCohort(isSelected ? null : ds.name);
                setShowCohortDetails(showCohortDetails === ds.name ? null : ds.name);
              }}
              onMouseEnter={(e) => {
                if (hideTimeoutRef.current) { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null; }
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = setTimeout(() => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipData({ cohort: ds, visible: true, position: { x: rect.right + 10, y: rect.top - 20 } });
                }, 150);
              }}
              onMouseLeave={() => {
                if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; }
                hideTimeoutRef.current = setTimeout(() => {
                  setTooltipData((prev) => ({ ...prev, visible: false }));
                }, 200);
              }}
              type="button"
            >
              <div className={styles.cohortName}>{ds.name.charAt(0).toUpperCase() + ds.name.slice(1)}</div>
              <div className={styles.cohortRecords}>{ds.meta.total_records} patients</div>
              <div className={styles.cohortRateRow}>
                <span className={styles.cohortRateLabel}>{t.diseaseRateLabel}</span>
                <span className={styles.cohortRateValue}>{diseaseRate}%</span>
              </div>
              <div className={styles.cohortBarBg}>
                <motion.div
                  className={styles.cohortBarFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${diseaseRate}%` }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  style={{
                    background:
                      diseaseRate > 70
                        ? 'linear-gradient(90deg, #F59E0B, #DC2626)'
                        : diseaseRate > 45
                        ? 'linear-gradient(90deg, #7ae8e3, #2563EB)'
                        : 'linear-gradient(90deg, #34D399, #059669)',
                  }}
                />
              </div>
              <div className={styles.cohortAvgRow}>
                <span>Avg age: {ds.features.age?.mean.toFixed(0) ?? '–'}</span>
                <span>Avg chol: {ds.features.chol?.mean.toFixed(0) ?? '–'}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Inline Cohort Population Statistics ────────────────────────── */}
      <AnimatePresence>
        {showCohortDetails && (() => {
          const cohort = datasets.find((d) => d.name === showCohortDetails);
          if (!cohort) return null;
          const diseaseRate = Math.round(cohort.meta.disease_rate * 100);
          const keyFeatures = [
            { label: 'Age', unit: 'yrs', ...cohort.features.age },
            { label: 'Cholesterol', unit: 'mg/dL', ...cohort.features.chol },
            { label: 'Resting BP', unit: 'mmHg', ...cohort.features.trestbps },
            { label: 'Max Heart Rate', unit: 'bpm', ...cohort.features.thalach },
          ].filter((f) => f.mean !== undefined) as Array<{ label: string; unit: string; mean: number; std: number; median: number; q1: number; q3: number }>;
          const malePercent = cohort.features.sex ? Math.round(cohort.features.sex.mean * 100) : 0;
          const femalePercent = 100 - malePercent;
          return (
            <motion.div
              key="cohort-details"
              className={styles.cohortDetailsInline}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className={styles.cohortDetailsHeader}>
                <h4 className={styles.cohortDetailsTitle}>
                  {cohort.name.charAt(0).toUpperCase() + cohort.name.slice(1)} Cohort — Population Statistics
                </h4>
                <button className={styles.cohortDetailsClose} onClick={() => setShowCohortDetails(null)}>×</button>
              </div>
              <div className={styles.cohortDetailsContent}>
                <div className={styles.cohortOverviewGrid}>
                  {[
                    { value: cohort.meta.total_records, label: 'Patients', cls: '' },
                    { value: `${diseaseRate}%`, label: 'Disease Rate', cls: styles.cohortRiskValue },
                    { value: `${malePercent}%`, label: 'Male', cls: '' },
                    { value: `${femalePercent}%`, label: 'Female', cls: '' },
                  ].map(({ value, label, cls }) => (
                    <div key={label} className={styles.cohortOverviewItem}>
                      <span className={`${styles.cohortOverviewValue} ${cls}`}>{value}</span>
                      <span className={styles.cohortOverviewLabel}>{label}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.cohortFeaturesList}>
                  {keyFeatures.map((feature) => (
                    <div key={feature.label} className={styles.cohortFeatureItem}>
                      <div className={styles.cohortFeatureLabel}>{feature.label}</div>
                      <div className={styles.cohortFeatureStats}>
                        <div className={styles.cohortStatRow}>
                          <span className={styles.cohortStatLabel}>
                            Mean: {feature.mean.toFixed(1)} {feature.unit} (±{feature.std.toFixed(1)})
                          </span>
                        </div>
                        <div className={styles.cohortStatRow}>
                          <span className={styles.cohortStatLabel}>
                            Median: {feature.median.toFixed(1)} {feature.unit} | IQR: {feature.q1.toFixed(0)}–{feature.q3.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Feature Explorer Panel ──────────────────────────────────────── */}
      <AnimatePresence>
        {selectedCohort && (() => {
          const cohort = datasets.find((d) => d.name === selectedCohort);
          if (!cohort) return null;
          return (
            <CohortFeatureExplorer
              cohort={cohort}
              selectedFeature={selectedFeature}
              onFeatureChange={setSelectedFeature}
              allDatasets={datasets}
              explorerRef={featureExplorerRef}
              onClose={() => setSelectedCohort(null)}
            />
          );
        })()}
      </AnimatePresence>

      {/* Floating tooltip */}
      <CohortTooltip
        cohort={tooltipData.cohort}
        visible={tooltipData.visible}
        position={tooltipData.position}
        onMouseEnter={() => {
          if (hideTimeoutRef.current) { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null; }
        }}
        onMouseLeave={() => setTooltipData((prev) => ({ ...prev, visible: false }))}
      />
    </motion.div>
  );
}
