import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, HeartPulse, ShieldCheck, AlertTriangle, Brain, Globe } from 'lucide-react';
import type { RootState } from '../store';
import type { TopFactor, PopulationPercentile } from '../types';
import RiskGauge from '../components/Dashboard/RiskGauge';
import styles from './ResultPage.module.less';

const FIELD_LABELS: Record<string, string> = {
  age: 'Age',
  sex: 'Sex',
  cp: 'Chest Pain',
  trestbps: 'Resting BP',
  chol: 'Cholesterol',
  fbs: 'Fasting BS',
  restecg: 'Resting ECG',
  thalach: 'Max HR',
  exang: 'Exercise Angina',
  oldpeak: 'ST Depression',
  slope: 'ST Slope',
  ca: 'Major Vessels',
  thal: 'Thalassemia',
};

const COHORT_LABELS: Record<string, string> = {
  combined: 'All Cohorts',
  cleveland: 'Cleveland',
  hungarian: 'Hungarian',
  switzerland: 'Switzerland',
  va: 'VA',
};

const COHORT_COLORS: Record<string, string> = {
  combined: '#2563EB',
  cleveland: '#7c3aed',
  hungarian: '#0891b2',
  switzerland: '#059669',
  va: '#d97706',
};

export default function ResultPage() {
  const navigate = useNavigate();
  const result = useSelector((s: RootState) => s.prediction.currentResult);
  const patientData = useSelector(
    (s: RootState) => s.prediction.currentPatientData
  );

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
  const topFactors: TopFactor[] = result.top_factors ?? [];
  const maxAbs = topFactors.length > 0 ? Math.abs(topFactors[0].contribution) : 1;

  // Show only features that appear in top_factors for the benchmark, fallback to first 6
  const topFeatureNames = new Set(topFactors.map((f) => f.feature));
  const benchmarkItems: PopulationPercentile[] = (result.population_percentiles ?? [])
    .filter((p) => topFeatureNames.has(p.feature))
    .slice(0, 6);

  const cohortKeys = ['combined', 'cleveland', 'hungarian', 'switzerland', 'va'];

  return (
    <div className={styles.page}>
      <motion.div
        className={`${styles.resultCard} ${isHigh ? styles.high : styles.low}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.resultIcon}>
          {isHigh ? <AlertTriangle size={32} /> : <ShieldCheck size={32} />}
        </div>
        <h2>{isHigh ? 'Higher Risk Detected' : 'Lower Risk Detected'}</h2>
        <p>
          {isHigh
            ? 'The model indicates an elevated risk of heart disease. A follow-up with a cardiologist is recommended.'
            : 'The model indicates a lower risk of heart disease. Continue monitoring and maintaining healthy habits.'}
        </p>
      </motion.div>

      <div className={styles.grid}>
        <motion.div
          className={styles.gaugeCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3>Risk Score</h3>
          <RiskGauge probability={probability} size={220} />
          <div className={styles.scoreBar}>
            <div className={styles.scoreLabels}>
              <span>Low</span>
              <span>Moderate</span>
              <span>High</span>
            </div>
            <div className={styles.scoreBg}>
              <motion.div
                className={styles.scoreFill}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{
                  background: isHigh
                    ? 'linear-gradient(90deg, #F59E0B, #DC2626)'
                    : 'linear-gradient(90deg, #059669, #10B981)',
                }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          className={styles.detailsCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3>Patient Data Summary</h3>
          <div className={styles.detailGrid}>
            {Object.entries(patientData).map(([key, val]) => (
              <div key={key} className={styles.detailItem}>
                <span className={styles.detailLabel}>
                  {FIELD_LABELS[key] || key}
                </span>
                <span className={styles.detailValue}>{val}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Why This Score? ─────────────────────────────────────────────── */}
      {topFactors.length > 0 && (
        <motion.div
          className={styles.factorsCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3>
            <Brain size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Why This Score?
          </h3>
          <p>Top features influencing this prediction — compared to the average patient in the training population.</p>
          <div className={styles.factorList}>
            {topFactors.map((f, idx) => {
              const barPct = maxAbs > 0 ? (Math.abs(f.contribution) / maxAbs) * 100 : 0;
              const isRisk = f.direction === 'increases_risk';
              const deltaPct = (f.contribution * 100).toFixed(1);
              return (
                <div key={f.feature} className={styles.factorRow}>
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
                      transition={{ duration: 0.7, delay: 0.1 + idx * 0.06 }}
                    />
                  </div>
                  <span className={`${styles.factorBadge} ${isRisk ? styles.badgeRisk : styles.badgeSafe}`}>
                    {isRisk ? '+' : ''}{deltaPct}%
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── How Do You Compare? (Population Benchmark) ─────────────────── */}
      {benchmarkItems.length > 0 && (
        <motion.div
          className={styles.benchmarkCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3>
            <Globe size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            How Do You Compare?
          </h3>
          <p>
            Your key values as percentile ranks within each of the 4 research cohorts (Cleveland, Hungarian,
            Switzerland, VA) and the combined pool of 920 patients.
          </p>

          {/* Cohort legend */}
          <div className={styles.cohortLegend}>
            {cohortKeys.map((k) => (
              <span key={k} className={styles.cohortDot}>
                <i style={{ background: COHORT_COLORS[k] }} />
                {COHORT_LABELS[k]}
              </span>
            ))}
          </div>

          <div className={styles.benchmarkList}>
            {benchmarkItems.map((item, idx) => (
              <div key={item.feature} className={styles.benchmarkRow}>
                <div className={styles.benchmarkLabel}>
                  <span className={styles.benchmarkFeature}>{item.label}</span>
                  <span className={styles.benchmarkValue}>{item.value}</span>
                </div>
                <div className={styles.benchmarkBars}>
                  {cohortKeys.map((cohort, ci) => {
                    const pctVal = item.percentiles[cohort] ?? 0;
                    return (
                      <div key={cohort} className={styles.benchmarkBarRow}>
                        <span className={styles.benchmarkCohort}>{COHORT_LABELS[cohort]}</span>
                        <div className={styles.benchmarkBarBg}>
                          <motion.div
                            className={styles.benchmarkBarFill}
                            style={{ background: COHORT_COLORS[cohort] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pctVal}%` }}
                            transition={{ duration: 0.7, delay: 0.1 + idx * 0.04 + ci * 0.03 }}
                          />
                        </div>
                        <span className={styles.benchmarkPct}>{pctVal.toFixed(0)}th</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <p className={styles.benchmarkNote}>
            {benchmarkItems[0]?.interpretation}
          </p>
        </motion.div>
      )}

      <motion.div
        className={styles.disclaimer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p>
          This prediction is generated by a machine learning model for
          educational and research purposes only. It should not be used as a
          substitute for professional medical diagnosis.
        </p>
      </motion.div>

      <div className={styles.actions}>
        <button
          className={styles.backBtn}
          onClick={() => navigate('/predict')}
        >
          <ArrowLeft size={16} />
          New Prediction
        </button>
        <button
          className={styles.historyBtn}
          onClick={() => navigate('/history')}
        >
          View History
        </button>
      </div>
    </div>
  );
}
