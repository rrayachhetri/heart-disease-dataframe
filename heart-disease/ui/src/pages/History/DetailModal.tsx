import { useState } from 'react';
import { getTextContent } from '../../content/text';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Activity,
  AlertTriangle,
  CheckCircle,
  Brain,
  Globe,
  Info,
} from 'lucide-react';
import type { PredictionRecord, PatientData, TopFactor, PopulationPercentile } from '../../types';
import { useCountUp } from '../../hooks/useCountUp';
import ModalSection from './ModalSection';
import styles from './HistoryPage.module.less';

const FEATURE_LABELS: Record<keyof PatientData, string> = {
  age: 'Age', sex: 'Sex', cp: 'Chest Pain Type', trestbps: 'Resting BP (mmHg)',
  chol: 'Cholesterol (mg/dl)', fbs: 'Fasting Blood Sugar', restecg: 'Resting ECG',
  thalach: 'Max Heart Rate', exang: 'Exercise Angina', oldpeak: 'ST Depression',
  slope: 'ST Slope', ca: 'Major Vessels (0–3)', thal: 'Thalassemia',
};

function formatFeatureValue(key: keyof PatientData, value: number): string {
  switch (key) {
    case 'sex': return value === 1 ? 'Male' : 'Female';
    case 'cp': return (['Typical Angina', 'Atypical Angina', 'Non-anginal Pain', 'Asymptomatic'][value] ?? String(value));
    case 'fbs': return value === 1 ? '> 120 mg/dl' : '≤ 120 mg/dl';
    case 'restecg': return ['Normal', 'ST-T Abnormality', 'LV Hypertrophy'][value] ?? String(value);
    case 'exang': return value === 1 ? 'Yes' : 'No';
    case 'slope': return ['Upsloping', 'Flat', 'Downsloping'][value] ?? String(value);
    case 'thal': return (({ 3: 'Normal', 6: 'Fixed Defect', 7: 'Reversable Defect' } as Record<number, string>)[value] ?? String(value));
    default: return String(value);
  }
}

const COHORT_LABELS: Record<string, string> = {
  combined: 'All Cohorts', cleveland: 'Cleveland', hungarian: 'Hungarian',
  switzerland: 'Switzerland', va: 'VA',
};

const COHORT_COLORS: Record<string, string> = {
  combined: '#2563EB', cleveland: '#7c3aed', hungarian: '#0891b2',
  switzerland: '#059669', va: '#d97706',
};

const cohortKeys = ['combined', 'cleveland', 'hungarian', 'switzerland', 'va'];

export default function DetailModal({ record, onClose }: { record: PredictionRecord; onClose: () => void }) {
  const tH = getTextContent('history');
  const pct = Math.round(record.result.probability * 100);
  const animatedPct = useCountUp(pct, 1200, 300);
  const isHigh = record.result.prediction === 1;
  const riskLevel = record.result.risk_level || (isHigh ? 'high' : 'low');
  const riskColor = riskLevel === 'high' ? '#DC2626' : riskLevel === 'moderate' ? '#D97706' : '#059669';
  const circumference = 2 * Math.PI * 34;

  const topFactors: TopFactor[] = record.result.top_factors ?? [];
  const maxAbs = topFactors.length > 0 ? Math.abs(topFactors[0].contribution) : 1;
  const topFeatureNames = new Set(topFactors.map((f) => f.feature));
  const benchmarkItems: PopulationPercentile[] = (record.result.population_percentiles ?? [])
    .filter((p) => topFeatureNames.has(p.feature))
    .slice(0, 6);

  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);
  const [hiddenCohorts, setHiddenCohorts] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const toggleCohort = (key: string) =>
    setHiddenCohorts((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleCopy = () => {
    const text = `CardioSense Risk Result: ${pct}% (${riskLevel} risk)\nTop factors: ${topFactors.map((f) => f.label).join(', ')}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.93, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 28 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <motion.div
              className={styles.modalIconWrap}
              style={{ background: isHigh ? '#FEF2F2' : '#ECFDF5' }}
              animate={isHigh ? { scale: [1, 1.12, 1] } : {}}
              transition={isHigh ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : {}}
            >
              {isHigh
                ? <AlertTriangle size={20} color="#DC2626" />
                : <CheckCircle size={20} color="#059669" />}
            </motion.div>
            <div>
              <h3 className={styles.modalTitle}>{tH.modalTitle}</h3>
              <p className={styles.modalDate}>{formatDate(record.timestamp)}</p>
            </div>
          </div>
          <div className={styles.modalHeaderActions}>
            <motion.button
              className={styles.copyBtn}
              onClick={handleCopy}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={tH.copySummaryTitle}
            >
              {copied ? tH.copiedBtn : tH.copyBtn}
            </motion.button>
            <motion.button
              className={styles.modalClose}
              onClick={onClose}
              aria-label={tH.closeAria}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={18} />
            </motion.button>
          </div>
        </div>

        {/* ── Risk Hero ── */}
        <motion.div
          className={styles.modalHero}
          style={{ borderColor: riskColor + '30', background: riskColor + '07' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.modalHeroGauge}>
            <svg width="88" height="88" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#E2E8F0" strokeWidth="8" />
              <motion.circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke={riskColor}
                strokeWidth="8"
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
                transition={{ duration: 1.2, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ strokeDasharray: circumference }}
              />
              <text x="40" y="40" textAnchor="middle" dominantBaseline="central"
                fontSize="15" fontWeight="800" fill={riskColor}>
                {animatedPct}%
              </text>
            </svg>
          </div>
          <div className={styles.modalHeroInfo}>
            <span
              className={styles.modalRiskBadge}
              style={{ background: riskColor + '18', color: riskColor, border: `1px solid ${riskColor}30` }}
            >
              <Activity size={12} />
              {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
            </span>
            <p className={styles.modalRiskDesc}>
              {isHigh ? tH.riskHigh : tH.riskLow}
            </p>
            <div className={styles.modalScoreBar}>
              <div className={styles.modalScoreLabels}>
                <span>{tH.scoreLabelLow}</span><span>{tH.scoreLabelModerate}</span><span>{tH.scoreLabelHigh}</span>
              </div>
              <div className={styles.modalScoreBg}>
                <motion.div
                  className={styles.modalScoreFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{
                    background: isHigh
                      ? 'linear-gradient(90deg,#F59E0B,#DC2626)'
                      : 'linear-gradient(90deg,#34D399,#059669)',
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Clinical Parameters ── */}
        <ModalSection icon={<Activity size={13} />} title={tH.clinicalParams}>
          <div className={styles.modalGrid}>
            {(Object.entries(record.patientData) as [keyof PatientData, number][]).map(
              ([key, value], i) => (
                <motion.div
                  key={key}
                  className={styles.modalParam}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.03 * i }}
                  whileHover={{ scale: 1.02 }}
                >
                  <span className={styles.modalParamLabel}>{FEATURE_LABELS[key]}</span>
                  <span className={styles.modalParamValue}>{formatFeatureValue(key, value)}</span>
                </motion.div>
              )
            )}
          </div>
        </ModalSection>

        {/* ── Why This Score? ── */}
        {topFactors.length > 0 && (
          <ModalSection icon={<Brain size={13} />} title={tH.whyThisScore}>
            <p className={styles.modalSectionHint}>{tH.whyHint}</p>
            <div className={styles.factorList}>
              {topFactors.map((f, idx) => {
                const barPct = maxAbs > 0 ? (Math.abs(f.contribution) / maxAbs) * 100 : 0;
                const isRisk = f.direction === 'increases_risk';
                const deltaPct = (f.contribution * 100).toFixed(1);
                const isExpanded = expandedFactor === f.feature;
                return (
                  <motion.div
                    key={f.feature}
                    className={`${styles.factorRow} ${isExpanded ? styles.factorRowExpanded : ''}`}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + idx * 0.06 }}
                    whileHover={{ backgroundColor: isRisk ? 'rgba(220,38,38,0.04)' : 'rgba(5,150,105,0.04)' }}
                    onClick={() => setExpandedFactor(isExpanded ? null : f.feature)}
                  >
                    <div className={styles.factorMainRow}>
                      <div className={styles.factorInfo}>
                        <span className={styles.factorLabel}>{f.label}</span>
                        <span className={styles.factorValues}>
                          {f.value}{f.unit ? ` ${f.unit}` : ''}
                          <span className={styles.factorMeanText}> · avg {f.population_mean.toFixed(1)}{f.unit ? ` ${f.unit}` : ''}</span>
                        </span>
                      </div>
                      <div className={styles.factorBarWrap}>
                        <motion.div
                          className={`${styles.factorBar} ${isRisk ? styles.factorBarRisk : styles.factorBarSafe}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${barPct}%` }}
                          transition={{ duration: 0.75, delay: 0.1 + idx * 0.07 }}
                        />
                      </div>
                      <span className={`${styles.factorBadge} ${isRisk ? styles.badgeRisk : styles.badgeSafe}`}>
                        {isRisk ? '↑' : '↓'} {isRisk ? '+' : ''}{deltaPct}%
                      </span>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          className={styles.factorDetail}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <Info size={11} style={{ flexShrink: 0, color: '#94A3B8', marginTop: 2 }} />
                          <span>
                            Your <strong>{f.label}</strong> ({f.value}{f.unit ? ` ${f.unit}` : ''}) is{' '}
                            {isRisk ? 'above' : 'below'} the avg of {f.population_mean.toFixed(1)}{f.unit ? ` ${f.unit}` : ''},{' '}
                            which{' '}
                            <strong style={{ color: isRisk ? '#DC2626' : '#059669' }}>
                              {isRisk ? 'increases' : 'decreases'}
                            </strong>{' '}
                            predicted risk by {Math.abs(parseFloat(deltaPct))}%.
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </ModalSection>
        )}

        {/* ── How Do You Compare? ── */}
        {benchmarkItems.length > 0 && (
          <ModalSection icon={<Globe size={13} />} title={tH.compareSection} defaultOpen={false}>
            <div className={styles.cohortLegend}>
              {cohortKeys.map((k) => (
                <motion.button
                  key={k}
                  className={`${styles.cohortDot} ${hiddenCohorts.has(k) ? styles.cohortDotHidden : ''}`}
                  onClick={() => toggleCohort(k)}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  title={hiddenCohorts.has(k) ? `Show ${COHORT_LABELS[k]}` : `Hide ${COHORT_LABELS[k]}`}
                >
                  <i style={{ background: hiddenCohorts.has(k) ? '#CBD5E1' : COHORT_COLORS[k] }} />
                  {COHORT_LABELS[k]}
                </motion.button>
              ))}
            </div>
            <div className={styles.benchmarkList}>
              {benchmarkItems.map((item, idx) => (
                <motion.div
                  key={item.feature}
                  className={styles.benchmarkRow}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + idx * 0.05 }}
                >
                  <div className={styles.benchmarkLabel}>
                    <span className={styles.benchmarkFeature}>{item.label}</span>
                    <span className={styles.benchmarkValue}>{item.value}</span>
                  </div>
                  <div className={styles.benchmarkBars}>
                    {cohortKeys.map((cohort, ci) => {
                      const pctVal = item.percentiles[cohort] ?? 0;
                      return (
                        <AnimatePresence key={cohort}>
                          {!hiddenCohorts.has(cohort) && (
                            <motion.div
                              className={styles.benchmarkBarRow}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.18 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <span className={styles.benchmarkCohort}>{COHORT_LABELS[cohort]}</span>
                              <div className={styles.benchmarkBarBg}>
                                <motion.div
                                  className={styles.benchmarkBarFill}
                                  style={{ background: COHORT_COLORS[cohort] }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pctVal}%` }}
                                  transition={{ duration: 0.75, delay: 0.08 + idx * 0.04 + ci * 0.03 }}
                                />
                              </div>
                              <span className={styles.benchmarkPct}>{pctVal.toFixed(0)}th</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </ModalSection>
        )}
      </motion.div>
    </motion.div>
  );
}
