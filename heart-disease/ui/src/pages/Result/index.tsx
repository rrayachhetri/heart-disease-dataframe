import { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { getTextContent } from '../../content/text';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  Brain,
  Globe,
  Info,
  History,
  Activity,
} from 'lucide-react';
import type { TopFactor, PopulationPercentile } from '../../types';
import RiskGauge from '../../components/Dashboard/RiskGauge';
import { useCountUp } from '../../hooks/useCountUp';
import Section from './Section';
import styles from './ResultPage.module.less';

const FIELD_LABELS: Record<string, string> = {
  age: 'Age', sex: 'Sex', cp: 'Chest Pain', trestbps: 'Resting BP',
  chol: 'Cholesterol', fbs: 'Fasting BS', restecg: 'Resting ECG',
  thalach: 'Max HR', exang: 'Exercise Angina', oldpeak: 'ST Depression',
  slope: 'ST Slope', ca: 'Major Vessels', thal: 'Thalassemia',
};

const FIELD_UNITS: Record<string, string> = {
  trestbps: 'mmHg', chol: 'mg/dL', thalach: 'bpm', age: 'yrs',
};

function formatFieldValue(key: string, val: number): string {
  switch (key) {
    case 'sex': return val === 1 ? 'Male' : 'Female';
    case 'cp': return ['Typical Angina', 'Atypical Angina', 'Non-anginal', 'Asymptomatic'][val] ?? String(val);
    case 'fbs': return val === 1 ? '> 120 mg/dL' : '≤ 120 mg/dL';
    case 'restecg': return ['Normal', 'ST-T Wave', 'LV Hypertrophy'][val] ?? String(val);
    case 'exang': return val === 1 ? 'Yes' : 'No';
    case 'slope': return ['Upsloping', 'Flat', 'Downsloping'][val] ?? String(val);
    case 'thal': return ({ 3: 'Normal', 6: 'Fixed Defect', 7: 'Reversable' } as Record<number, string>)[val] ?? String(val);
    default: { const u = FIELD_UNITS[key]; return u ? `${val} ${u}` : String(val); }
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

export default function ResultPage() {
  const navigate = useNavigate();
  const result = useAppSelector((s) => s.prediction.currentResult);
  const patientData = useAppSelector((s) => s.prediction.currentPatientData);
  const t = getTextContent('result');

  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);
  const [hiddenCohorts, setHiddenCohorts] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  if (!result || !patientData) {
    return (
      <div className={styles.empty}>
        <HeartPulse size={48} />
        <h3>{t.emptyHeading}</h3>
        <p>{t.emptyText}</p>
        <button onClick={() => navigate('/predict')}>{t.emptyBtn}</button>
      </div>
    );
  }

  const { prediction, probability } = result;
  const isHigh = prediction === 1;
  const pct = Math.round(probability * 100);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animatedPct = useCountUp(pct);

  const topFactors: TopFactor[] = result.top_factors ?? [];
  const maxAbs = topFactors.length > 0 ? Math.abs(topFactors[0].contribution) : 1;

  const topFeatureNames = new Set(topFactors.map((f) => f.feature));
  const benchmarkItems: PopulationPercentile[] = (result.population_percentiles ?? [])
    .filter((p) => topFeatureNames.has(p.feature))
    .slice(0, 6);

  const riskColor = pct >= 70 ? '#DC2626' : pct >= 40 ? '#D97706' : '#059669';

  const toggleCohort = (key: string) =>
    setHiddenCohorts((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleCopy = () => {
    const text = `CardioSense Risk Result: ${pct}% (${pct >= 70 ? 'High' : pct >= 40 ? 'Moderate' : 'Low'} Risk)\nTop factors: ${topFactors.map((f) => f.label).join(', ')}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.page}>

      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <motion.div
        className={`${styles.heroBanner} ${isHigh ? styles.heroBannerHigh : styles.heroBannerLow}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className={styles.heroLeft}>
          <motion.div
            className={styles.heroIcon}
            animate={isHigh ? { scale: [1, 1.13, 1] } : {}}
            transition={isHigh ? { duration: 1.3, repeat: Infinity, ease: 'easeInOut' } : {}}
          >
            {isHigh ? <AlertTriangle size={28} /> : <ShieldCheck size={28} />}
          </motion.div>
          <div>
            <h2 className={styles.heroTitle}>
              {isHigh ? t.highRiskTitle : t.lowRiskTitle}
            </h2>
            <p className={styles.heroDesc}>
              {isHigh ? t.highRiskDesc : t.lowRiskDesc}
            </p>
          </div>
        </div>
        <div className={styles.heroScore}>
          <span className={styles.heroScoreNum} style={{ color: riskColor }}>
            {animatedPct}%
          </span>
          <span className={styles.heroScoreLabel}>{t.riskScore}</span>
        </div>
      </motion.div>

      {/* ── Gauge + Patient Data ─────────────────────────────────────────── */}
      <div className={styles.topGrid}>
        <motion.div
          className={styles.gaugeCard}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          whileHover={{ boxShadow: '0 12px 40px rgba(0,0,0,0.10)' }}
        >
          <h3 className={styles.cardTitle}>{t.riskScore}</h3>
          <div className={styles.gaugeWrap}>
            <RiskGauge probability={probability} size={200} />
          </div>
          <div className={styles.scoreBar}>
            <div className={styles.scoreLabels}>
              <span>{t.scoreLabelLow}</span><span>{t.scoreLabelModerate}</span><span>{t.scoreLabelHigh}</span>
            </div>
            <div className={styles.scoreBg}>
              <motion.div
                className={styles.scoreFill}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  background: isHigh
                    ? 'linear-gradient(90deg, #F59E0B, #DC2626)'
                    : 'linear-gradient(90deg, #059669, #10B981)',
                }}
              />
            </div>
          </div>
          <div
            className={styles.riskBadge}
            style={{ background: riskColor + '18', color: riskColor, border: `1px solid ${riskColor}33` }}
          >
            <Activity size={13} />
            {pct >= 70 ? t.riskBadgeHigh : pct >= 40 ? t.riskBadgeModerate : t.riskBadgeLow}
          </div>
        </motion.div>

        <motion.div
          className={styles.patientCard}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          whileHover={{ boxShadow: '0 12px 40px rgba(0,0,0,0.10)' }}
        >
          <h3 className={styles.cardTitle}>{t.patientDataSummary}</h3>
          <div className={styles.detailGrid}>
            {Object.entries(patientData).map(([key, val], i) => (
              <motion.div
                key={key}
                className={styles.detailItem}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.03 }}
                whileHover={{ scale: 1.02 }}
              >
                <span className={styles.detailLabel}>{FIELD_LABELS[key] || key}</span>
                <span className={styles.detailValue}>{formatFieldValue(key, val)}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Why This Score? ──────────────────────────────────────────────── */}
      {topFactors.length > 0 && (
        <Section
          title={t.whyThisScore}
          icon={<Brain size={15} />}
          subtitle={t.whySubtitle}
          delay={0.35}
        >
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
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + idx * 0.07 }}
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
                        transition={{ duration: 0.8, delay: 0.15 + idx * 0.07 }}
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
                        transition={{ duration: 0.22 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <Info size={12} style={{ flexShrink: 0, color: '#94A3B8', marginTop: 2 }} />
                        <span>
                          Your <strong>{f.label}</strong> ({f.value}{f.unit ? ` ${f.unit}` : ''}) is{' '}
                          {isRisk ? 'above' : 'below'} the population average of {f.population_mean.toFixed(1)}{f.unit ? ` ${f.unit}` : ''},{' '}
                          which{' '}
                          <strong style={{ color: isRisk ? '#DC2626' : '#059669' }}>
                            {isRisk ? 'increases' : 'decreases'}
                          </strong>{' '}
                          the predicted risk probability by {Math.abs(parseFloat(deltaPct))}%.
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
          <p className={styles.factorHint}>
            <Info size={11} /> Click any row to see a detailed interpretation.
          </p>
        </Section>
      )}

      {/* ── How Do You Compare? ──────────────────────────────────────────── */}
      {benchmarkItems.length > 0 && (
        <Section
          title={t.compareSectionTitle}
          icon={<Globe size={15} />}
          subtitle="Your key values as percentile ranks across 4 research cohorts (920 combined patients). Click a cohort to hide/show its bars."
          delay={0.45}
        >
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + idx * 0.06 }}
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
                            transition={{ duration: 0.2 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <span className={styles.benchmarkCohort}>{COHORT_LABELS[cohort]}</span>
                            <div className={styles.benchmarkBarBg}>
                              <motion.div
                                className={styles.benchmarkBarFill}
                                style={{ background: COHORT_COLORS[cohort] }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pctVal}%` }}
                                transition={{ duration: 0.8, delay: 0.1 + idx * 0.04 + ci * 0.04 }}
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
          {benchmarkItems[0]?.interpretation && (
            <p className={styles.benchmarkNote}>{benchmarkItems[0].interpretation}</p>
          )}
        </Section>
      )}

      {/* ── Disclaimer ───────────────────────────────────────────────────── */}
      <motion.div
        className={styles.disclaimer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p>
          This prediction is generated by a machine learning model for educational and research purposes only.
          It should not be used as a substitute for professional medical diagnosis.
        </p>
      </motion.div>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <motion.div
        className={styles.actions}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
      >
        <motion.button
          className={styles.primaryBtn}
          onClick={() => navigate('/predict')}
          whileHover={{ scale: 1.03, boxShadow: '0 8px 28px rgba(164,252,248,0.55)' }}
          whileTap={{ scale: 0.97 }}
        >
          <ArrowLeft size={16} />
          New Prediction
        </motion.button>
        <motion.button
          className={styles.secondaryBtn}
          onClick={() => navigate('/history')}
          whileHover={{ scale: 1.03, boxShadow: '0 8px 28px rgba(164,252,248,0.55)' }}
          whileTap={{ scale: 0.97 }}
        >
          <History size={16} />
          View History
        </motion.button>
        <motion.button
          className={styles.ghostBtn}
          onClick={handleCopy}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {copied ? t.copiedBtn : t.copyBtn}
        </motion.button>
      </motion.div>
    </div>
  );
}
