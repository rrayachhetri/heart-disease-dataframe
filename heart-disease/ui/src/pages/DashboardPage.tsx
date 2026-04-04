import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  HeartPulse,
  Activity,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Cpu,
  Info,
  Database,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import type { RootState } from '../store';
import type { ModelInfo } from '../types';
import { fetchModelInfo, fetchDatasetComparison, type DatasetSummary } from '../api/predictApi';
import KPICard from '../components/Dashboard/KPICard';
import styles from './DashboardPage.module.less';

export default function DashboardPage() {
  const navigate = useNavigate();
  const history = useSelector((s: RootState) => s.prediction.history);
  const user = useSelector((s: RootState) => s.auth.user);

  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [showVcInfo, setShowVcInfo] = useState(false);
  const [datasetSummaries, setDatasetSummaries] = useState<DatasetSummary[]>([]);

  useEffect(() => {
    fetchModelInfo()
      .then(setModelInfo)
      .catch(() => { /* API may not be running — fail silently */ });
    fetchDatasetComparison()
      .then((r) => setDatasetSummaries(r.datasets.filter((d) => d.name !== 'combined')))
      .catch(() => { /* fail silently */ });
  }, []);

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email
    : '';
  const ROLE_LABEL_MAP: Record<string, string> = { doctor: 'Doctor', admin: 'Admin', patient: 'Patient' };
  const roleLabel = ROLE_LABEL_MAP[user?.role ?? ''] ?? 'Patient';

  const totalPredictions = history.length;
  const highRiskCount = history.filter((r) => r.result.prediction === 1).length;
  const lowRiskCount = totalPredictions - highRiskCount;
  const avgRisk =
    totalPredictions > 0
      ? Math.round(
          (history.reduce((sum, r) => sum + r.result.probability, 0) /
            totalPredictions) *
            100
        )
      : 0;

  const pieData = [
    { name: 'High Risk', value: highRiskCount || 0 },
    { name: 'Low Risk', value: lowRiskCount || 0 },
  ];
  const PIE_COLORS = ['#DC2626', '#059669'];

  const chartData = history
    .slice(0, 10)
    .reverse()
    .map((r, i) => ({
      name: `#${i + 1}`,
      risk: Math.round(r.result.probability * 100),
    }));

  return (
    <div className={styles.page}>
      <div className={styles.welcome}>
        <div>
          <h2>Welcome back, {displayName || roleLabel}</h2>
          <p>
            {user?.role === 'doctor'
              ? "Here's an overview of your patients' heart disease risk assessments."
              : "Here's an overview of your heart disease risk assessments."}
          </p>
        </div>
        <motion.button
          className={styles.ctaBtn}
          onClick={() => navigate('/predict')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <HeartPulse size={18} />
          New Prediction
        </motion.button>
      </div>

      <div className={styles.kpiGrid}>
        <KPICard
          title="Total Predictions"
          value={totalPredictions}
          subtitle="All time assessments"
          icon={Activity}
          color="blue"
          onClick={() => navigate('/history')}
          linkLabel="View all history"
        />
        <KPICard
          title="Average Risk"
          value={`${avgRisk}%`}
          subtitle="Mean probability score"
          icon={TrendingUp}
          color="amber"
          onClick={totalPredictions > 0 ? () => navigate('/history') : undefined}
          linkLabel="View assessments"
        />
        <KPICard
          title="High Risk Cases"
          value={highRiskCount}
          subtitle="Prediction = 1"
          icon={AlertTriangle}
          color="red"
          onClick={highRiskCount > 0 ? () => navigate('/history') : undefined}
          linkLabel="Review cases"
        />
        <KPICard
          title="Low Risk Cases"
          value={lowRiskCount}
          subtitle="Prediction = 0"
          icon={ShieldCheck}
          color="green"
          onClick={lowRiskCount > 0 ? () => navigate('/history') : undefined}
          linkLabel="View cases"
        />
      </div>

      {totalPredictions > 0 && (
        <div className={styles.chartsRow}>
          <motion.div
            className={styles.chartCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3>Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[pieData.indexOf(entry)]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <i style={{ background: PIE_COLORS[0] }} /> High Risk
              </span>
              <span className={styles.legendItem}>
                <i style={{ background: PIE_COLORS[1] }} /> Low Risk
              </span>
            </div>
          </motion.div>

          <motion.div
            className={styles.chartCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3>Recent Risk Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="risk"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#riskGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {totalPredictions === 0 && (
        <motion.div
          className={styles.emptyState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <HeartPulse size={48} />
          <h3>No predictions yet</h3>
          <p>Start by creating your first heart disease risk assessment.</p>
          <button
            className={styles.emptyBtn}
            onClick={() => navigate('/predict')}
          >
            Get Started
          </button>
        </motion.div>
      )}

      {/* ── Model Performance Card ──────────────────────────────────────── */}
      {modelInfo && (
        <motion.div
          className={styles.modelCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
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

          <div className={styles.modelMetricsGrid}>
            {[
              { label: 'Accuracy',    key: 'val_accuracy' },
              { label: 'Sensitivity', key: 'val_sensitivity' },
              { label: 'Specificity', key: 'val_specificity' },
              { label: 'Precision',   key: 'val_precision' },
              { label: 'F1 Score',    key: 'val_f1' },
              { label: 'Val AUC',     key: 'val_auc' },
            ].map(({ label, key }) => {
              const val = modelInfo.metrics[key as keyof typeof modelInfo.metrics] ?? 0;
              const pct = Math.round(val * 100);
              return (
                <div key={key} className={styles.metricItem}>
                  <div className={styles.metricTop}>
                    <span className={styles.metricLabel}>{label}</span>
                    <span className={styles.metricValue}>{pct}%</span>
                  </div>
                  <div className={styles.metricBarBg}>
                    <motion.div
                      className={styles.metricBarFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {modelInfo.feature_importances.length > 0 && (
            <div className={styles.featureImportanceWrap}>
              <h4>Feature Importances (RF component)</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={modelInfo.feature_importances.map((f) => ({
                    name: f.label.replace('Blood Pressure', 'BP').replace('Thalassemia', 'Thal').replace('Exercise', 'Ex.').replace('Fasting Blood Sugar', 'Fasting BS').replace('Resting ECG', 'Rst ECG').replace('Max Heart Rate', 'Max HR').replace('ST Depression', 'ST Dep.').replace('ST Slope', 'ST Slope').replace('Major Vessels', 'Vessels'),
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
      )}
      {/* ── Dataset Cohorts Card ────────────────────────────────────────── */}
      {datasetSummaries.length > 0 && (
        <motion.div
          className={styles.datasetCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className={styles.datasetCardHeader}>
            <Database size={18} />
            <div>
              <h3>Training Data — Population Cohorts</h3>
              <p className={styles.datasetSubtitle}>
                Model trained on {datasetSummaries.reduce((s, d) => s + d.meta.total_records, 0)} patients
                across 4 UCI Heart Disease research datasets
              </p>
            </div>
          </div>
          <div className={styles.cohortGrid}>
            {datasetSummaries.map((ds) => {
              const diseaseRate = Math.round(ds.meta.disease_rate * 100);
              return (
                <div key={ds.name} className={styles.cohortTile}>
                  <div className={styles.cohortName}>{ds.name.charAt(0).toUpperCase() + ds.name.slice(1)}</div>
                  <div className={styles.cohortRecords}>{ds.meta.total_records} patients</div>
                  <div className={styles.cohortRateRow}>
                    <span className={styles.cohortRateLabel}>Disease rate</span>
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
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
