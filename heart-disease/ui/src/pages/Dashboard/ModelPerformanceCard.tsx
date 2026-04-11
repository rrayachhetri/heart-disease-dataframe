import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import type { ModelInfo } from '../../types';
import styles from './DashboardPage.module.less';

interface Props {
  modelInfo: ModelInfo;
}

export default function ModelPerformanceCard({ modelInfo }: Props) {
  const [showVcInfo, setShowVcInfo] = useState(false);

  const auc = modelInfo.metrics.cv_auc_mean;
  let grade = 'C';
  let gradeColor = styles.gradeC;
  let tagline = 'Acceptable for exploratory use';
  if (auc >= 0.90) { grade = 'A'; gradeColor = styles.gradeA; tagline = 'Excellent — clinically reliable screening model'; }
  else if (auc >= 0.85) { grade = 'B+'; gradeColor = styles.gradeB; tagline = 'Very good — suitable for clinical decision support'; }
  else if (auc >= 0.80) { grade = 'B'; gradeColor = styles.gradeB; tagline = 'Good — reliable for general risk screening'; }

  const METRICS = [
    { label: 'Accuracy',    key: 'val_accuracy',    sub: 'Right call out of every 10 patients' },
    { label: 'Sensitivity', key: 'val_sensitivity', sub: 'Sick patients correctly flagged' },
    { label: 'Specificity', key: 'val_specificity', sub: 'Healthy patients correctly cleared' },
    { label: 'Precision',   key: 'val_precision',   sub: 'High-risk alerts that are real' },
    { label: 'F1 Score',    key: 'val_f1',          sub: 'Balance between alerts & misses' },
    { label: 'Val AUC',     key: 'val_auc',         sub: 'Ability to rank sick above healthy' },
  ];

  const radarData = METRICS.map(({ label, key }) => ({
    metric:
      label === 'Sensitivity' ? 'Catches disease'
      : label === 'Specificity' ? 'Avoids false alarms'
      : label === 'Val AUC' ? 'Ranking power'
      : label === 'F1 Score' ? 'Balance'
      : label,
    value: Math.round((modelInfo.metrics[key as keyof typeof modelInfo.metrics] ?? 0) * 100),
  }));

  const sens = Math.round((modelInfo.metrics.val_sensitivity ?? 0) * 100);
  const spec = Math.round((modelInfo.metrics.val_specificity ?? 0) * 100);

  return (
    <motion.div
      className={styles.modelCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {/* Header */}
      <div className={styles.modelCardHeader}>
        <div className={styles.modelCardTitle}>
          <Cpu size={18} />
          <div>
            <h3>Model Performance</h3>
            <div className={styles.modelTypeRow}>
              <button
                className={styles.modelTypeBtn}
                onClick={() => setShowVcInfo((v) => !v)}
                type="button"
              >
                {modelInfo.model_type}
                <Info size={12} />
              </button>
              <AnimatePresence>
                {showVcInfo && (
                  <motion.div
                    className={styles.vcPopover}
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className={styles.vcPopoverHeader}>
                      <span>VotingClassifier — How it works</span>
                      <button onClick={() => setShowVcInfo(false)}>×</button>
                    </div>
                    <p className={styles.vcPopoverDesc}>
                      An ensemble meta-learner that trains three independent classifiers and
                      averages their predicted probabilities (<em>soft voting</em>) using
                      learned weights, producing a final score that is more robust than any
                      single model alone.
                    </p>
                    <div className={styles.vcEstimators}>
                      {[
                        {
                          icon: '🌲',
                          name: 'Random Forest  (RF-300)',
                          weight: 2,
                          desc: '300 decision trees, balanced class weights (min_samples_leaf=2). Handles non-linear boundaries and is robust to noise.',
                        },
                        {
                          icon: '📈',
                          name: 'Gradient Boosting  (GBM-200)',
                          weight: 2,
                          desc: '200 boosted trees (lr=0.05, subsample=0.8, max_depth=4). Each tree corrects errors of the previous — excellent on tabular clinical data.',
                        },
                        {
                          icon: '⚖️',
                          name: 'Logistic Regression  (LR)',
                          weight: 1,
                          desc: 'L2-regularised linear model on StandardScaler-normalised features. Adds stability and probabilistic calibration.',
                        },
                      ].map((e) => (
                        <div key={e.name} className={styles.vcEstimatorRow}>
                          <span className={styles.vcIcon}>{e.icon}</span>
                          <div>
                            <div className={styles.vcEstName}>
                              {e.name}
                              <span className={styles.vcWeight}>weight&nbsp;{e.weight}</span>
                            </div>
                            <p className={styles.vcEstDesc}>{e.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.vcVotingNote}>
                      final&nbsp;P&nbsp;=&nbsp;(2×RF&nbsp;+&nbsp;2×GBM&nbsp;+&nbsp;1×LR)&nbsp;/&nbsp;5
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className={styles.modelAucBadge}>
          AUC&nbsp;{(modelInfo.metrics.cv_auc_mean * 100).toFixed(1)}%
          <span>&nbsp;±&nbsp;{(modelInfo.metrics.cv_auc_std * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Training config tags */}
      <div className={styles.trainTagsRow}>
        {['RF-300', 'GBM-200', 'LR', '920 patients', '5-fold CV', 'soft voting'].map((tag) => (
          <span key={tag} className={styles.trainTag}>{tag}</span>
        ))}
      </div>

      {/* Grade bar */}
      <div className={styles.gradeBar}>
        <div className={`${styles.gradeBadge} ${gradeColor}`}>{grade}</div>
        <div className={styles.gradeBody}>
          <span className={styles.gradeTagline}>{tagline}</span>
          <span className={styles.gradeSubline}>
            Validated on {Math.round(modelInfo.metrics.val_auc * 100)}% AUC hold-out &middot;{' '}
            {(auc * 100).toFixed(1)}% cross-validated AUC across 5 independent data splits
          </span>
        </div>
      </div>

      {/* Sensitivity / Specificity insight cards */}
      <div className={styles.insightRow}>
        <div className={styles.insightCard}>
          <span className={styles.insightIcon}>🫀</span>
          <div>
            <div className={styles.insightValue}>{sens} of 100</div>
            <div className={styles.insightLabel}>sick patients correctly flagged</div>
            <div className={styles.insightSub}>Missing the other {100 - sens} is the main risk of any screening tool.</div>
          </div>
        </div>
        <div className={styles.insightCard}>
          <span className={styles.insightIcon}>✅</span>
          <div>
            <div className={styles.insightValue}>{spec} of 100</div>
            <div className={styles.insightLabel}>healthy patients correctly cleared</div>
            <div className={styles.insightSub}>The other {100 - spec} would receive an unnecessary follow-up.</div>
          </div>
        </div>
      </div>

      {/* Radar + metric tiles */}
      <div className={styles.analyticsRow}>
        <div className={styles.analyticsCard}>
          <p className={styles.radarTitle}>
            Performance Radar — how the model scores across every dimension
          </p>
          <div className={styles.radarWrapper}>
            <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} margin={{ top: 10, right: 28, bottom: 10, left: 28 }}>
              <PolarGrid stroke="rgba(122,232,227,0.15)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} tickCount={4} />
              <Radar name="Model" dataKey="value" stroke="#7ae8e3" fill="#7ae8e3" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Score']} />
            </RadarChart>
          </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.analyticsCard}>
          <p className={styles.radarTitle}>
            Validation Metrics — plain-English interpretation of each score
          </p>
          <div className={styles.metricTilesGrid}>
          {METRICS.map(({ label, key, sub }) => {
            const val = modelInfo.metrics[key as keyof typeof modelInfo.metrics] ?? 0;
            const pct = Math.round(val * 100);
            let tileColor = 'tileRed';
            let fillClass = styles.metricTileBarFillRed;
            let badge = 'LOW';
            if (pct >= 80) { tileColor = 'tileGreen'; fillClass = styles.metricTileBarFillGreen; badge = 'GOOD'; }
            else if (pct >= 65) { tileColor = 'tileAmber'; fillClass = styles.metricTileBarFillAmber; badge = 'FAIR'; }
            return (
              <div key={key} className={`${styles.metricTile} ${styles[tileColor]}`}>
                <div className={styles.metricTileTop}>
                  <span className={styles.metricTileLabel}>{label}</span>
                  <span className={`${styles.metricTileBadge} ${styles[tileColor]}`}>{badge}</span>
                </div>
                <div className={styles.metricTileRow}>
                  <span className={styles.metricTileValue}>{pct}%</span>
                  <div className={styles.metricTileBarBg}>
                    <motion.div
                      className={fillClass}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    />
                  </div>
                </div>
                <div className={styles.metricTileSub}>{sub}</div>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Feature importances */}
      {modelInfo.feature_importances.length > 0 && (
        <div className={`${styles.featureImportanceWrap} ${styles.analyticsCard}`}>
          <h4>Feature Importances (RF component)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={modelInfo.feature_importances.map((f) => ({
                name: f.label
                  .replace('Blood Pressure', 'BP')
                  .replace('Thalassemia', 'Thal')
                  .replace('Exercise', 'Ex.')
                  .replace('Fasting Blood Sugar', 'Fasting BS')
                  .replace('Resting ECG', 'Rst ECG')
                  .replace('Max Heart Rate', 'Max HR')
                  .replace('ST Depression', 'ST Dep.')
                  .replace('Major Vessels', 'Vessels'),
                importance: +(f.importance * 100).toFixed(2),
              }))}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 'auto']} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v) => [`${v}%`, 'Importance']} />
              <Bar dataKey="importance" fill="#7ae8e3" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
