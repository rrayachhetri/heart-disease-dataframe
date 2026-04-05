import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  Brain,
  Globe,
  ChevronDown,
  Info,
  History,
  Activity,
} from 'lucide-react';
import type { RootState } from '../store';
import type { TopFactor, PopulationPercentile } from '../types';
import RiskGauge from '../components/Dashboard/RiskGauge';
import styles from './ResultPage.module.less';

// ── Animated count-up ─────────────────────────────────────────────────────────
function useCountUp(target: number, durationMs = 1400, delayMs = 400): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let rafId: number;
    const timeout = setTimeout(() => {
      const startTime = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }, delayMs);
    return () => { clearTimeout(timeout); cancelAnimationFrame(rafId); };
  }, [target, durationMs, delayMs]);
  return value;
}

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

// ── Collapsible section wrapper ───────────────────────────────────────────────
function Section({
  title, icon, subtitle, delay, children,
}: {
  title: string; icon: React.ReactNode; subtitle?: string;
  delay: number; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <motion.div
      className={styles.section}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <button className={styles.sectionHeader} onClick={() => setOpen((v) => !v)}>
        <div className={styles.sectionHeaderLeft}>
          <span className={styles.sectionIcon}>{icon}</span>
          <div>
            <span className={styles.sectionTitle}>{title}</span>
            {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className={styles.chevron}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.sectionBody}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResultPage() {
  const navigate = useNavigate();
  const result = useSelector((s: RootState) => s.prediction.currentResult);
  const patientData = useSelector((s: RootState) => s.prediction.currentPatientData);

  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);
  const [hiddenCohorts, setHiddenCohorts] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  if (!result || !patientData) {
    return (
      <div className={styles.empty}>
        <HeartPulse size={48} />
        <h3>No prediction result</h3>
        <p>Submit a prediction first to see results here.</p>
        <button onClick={() => navigate('/predict')}>Go to Prediction</button>
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
              {isHigh ? 'Higher Risk Detected' : 'Lower Risk Detected'}
            </h2>
            <p className={styles.heroDesc}>
              {isHigh
                ? 'Elevated cardiovascular risk — a follow-up with a cardiologist is recommended.'
                : 'Lower cardiovascular risk detected — continue monitoring and maintaining healthy habits.'}
            </p>
          </div>
        </div>
        <div className={styles.heroScore}>
          <span className={styles.heroScoreNum} style={{ color: riskColor }}>
            {animatedPct}%
          </span>
          <span className={styles.heroScoreLabel}>Risk Score</span>
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
          <h3 className={styles.cardTitle}>Risk Score</h3>
          <div className={styles.gaugeWrap}>
            <RiskGauge probability={probability} size={200} />
          </div>
          <div className={styles.scoreBar}>
            <div className={styles.scoreLabels}>
              <span>Low</span><span>Moderate</span><span>High</span>
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
            {pct >= 70 ? 'High Risk' : pct >= 40 ? 'Moderate Risk' : 'Low Risk'}
          </div>
        </motion.div>

        <motion.div
          className={styles.patientCard}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          whileHover={{ boxShadow: '0 12px 40px rgba(0,0,0,0.10)' }}
        >
          <h3 className={styles.cardTitle}>Patient Data Summary</h3>
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
          title="Why This Score?"
          icon={<Brain size={15} />}
          subtitle="Top features influencing this prediction. Click a row to see a plain-English explanation."
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
          title="How Do You Compare?"
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
          {copied ? '✓ Copied!' : 'Copy Summary'}
        </motion.button>
      </motion.div>
    </div>
  );
}
