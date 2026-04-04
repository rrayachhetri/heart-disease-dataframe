import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Trash2,
  ClipboardList,
  Eye,
  X,
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import type { RootState, AppDispatch } from '../store';
import type { PredictionRecord, PatientData } from '../types';
import { clearHistory, removeFromHistory } from '../store/slices/predictionSlice';
import { useNavigate } from 'react-router-dom';
import styles from './HistoryPage.module.less';

const FEATURE_LABELS: Record<keyof PatientData, string> = {
  age: 'Age',
  sex: 'Sex',
  cp: 'Chest Pain Type',
  trestbps: 'Resting BP (mmHg)',
  chol: 'Cholesterol (mg/dl)',
  fbs: 'Fasting Blood Sugar',
  restecg: 'Resting ECG',
  thalach: 'Max Heart Rate',
  exang: 'Exercise Angina',
  oldpeak: 'ST Depression',
  slope: 'ST Slope',
  ca: 'Major Vessels (0–3)',
  thal: 'Thalassemia',
};

function formatFeatureValue(key: keyof PatientData, value: number): string {
  switch (key) {
    case 'sex':
      return value === 1 ? 'Male' : 'Female';
    case 'cp':
      return (
        ['Typical Angina', 'Atypical Angina', 'Non-anginal Pain', 'Asymptomatic'][value] ??
        String(value)
      );
    case 'fbs':
      return value === 1 ? '> 120 mg/dl' : '≤ 120 mg/dl';
    case 'restecg':
      return ['Normal', 'ST-T Abnormality', 'LV Hypertrophy'][value] ?? String(value);
    case 'exang':
      return value === 1 ? 'Yes' : 'No';
    case 'slope':
      return ['Upsloping', 'Flat', 'Downsloping'][value] ?? String(value);
    case 'thal':
      return (
        ({ 3: 'Normal', 6: 'Fixed Defect', 7: 'Reversable Defect' } as Record<number, string>)[
          value
        ] ?? String(value)
      );
    default:
      return String(value);
  }
}

function DetailModal({
  record,
  onClose,
}: {
  record: PredictionRecord;
  onClose: () => void;
}) {
  const pct = Math.round(record.result.probability * 100);
  const isHigh = record.result.prediction === 1;
  const riskLevel = record.result.risk_level || (isHigh ? 'high' : 'low');
  const riskColor =
    riskLevel === 'high' ? '#DC2626' : riskLevel === 'moderate' ? '#D97706' : '#059669';
  const circumference = 2 * Math.PI * 34;

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div
              className={styles.modalIconWrap}
              style={{ background: isHigh ? '#FEF2F2' : '#ECFDF5' }}
            >
              {isHigh ? (
                <AlertTriangle size={20} color="#DC2626" />
              ) : (
                <CheckCircle size={20} color="#059669" />
              )}
            </div>
            <div>
              <h3 className={styles.modalTitle}>Assessment Details</h3>
              <p className={styles.modalDate}>{formatDate(record.timestamp)}</p>
            </div>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Risk Result */}
        <div
          className={styles.modalResult}
          style={{
            borderColor: riskColor + '33',
            background: riskColor + '08',
          }}
        >
          <div className={styles.modalResultLeft}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#E2E8F0" strokeWidth="8" />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke={riskColor}
                strokeWidth="8"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference * (1 - pct / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
              <text
                x="40"
                y="40"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="16"
                fontWeight="700"
                fill={riskColor}
              >
                {pct}%
              </text>
            </svg>
          </div>
          <div className={styles.modalResultRight}>
            <span
              className={styles.modalRiskBadge}
              style={{
                background: riskColor + '18',
                color: riskColor,
                border: `1px solid ${riskColor}33`,
              }}
            >
              {isHigh ? <Heart size={13} /> : <Activity size={13} />}
              {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
            </span>
            <p className={styles.modalRiskLabel}>Risk Score</p>
            <p className={styles.modalRiskDesc}>
              {isHigh
                ? 'Elevated cardiovascular risk detected. Medical consultation recommended.'
                : 'No significant cardiovascular risk detected at this time.'}
            </p>
          </div>
        </div>

        {/* Clinical Parameters Grid */}
        <div className={styles.modalSection}>
          <h4 className={styles.modalSectionTitle}>Clinical Parameters</h4>
          <div className={styles.modalGrid}>
            {(Object.entries(record.patientData) as [keyof PatientData, number][]).map(
              ([key, value]) => (
                <div key={key} className={styles.modalParam}>
                  <span className={styles.modalParamLabel}>{FEATURE_LABELS[key]}</span>
                  <span className={styles.modalParamValue}>{formatFeatureValue(key, value)}</span>
                </div>
              )
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HistoryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const history = useSelector((s: RootState) => s.prediction.history);
  const [selected, setSelected] = useState<PredictionRecord | null>(null);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (history.length === 0) {
    return (
      <div className={styles.empty}>
        <ClipboardList size={48} />
        <h3>No prediction history</h3>
        <p>Completed predictions will appear here.</p>
        <button onClick={() => navigate('/predict')}>Make a Prediction</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Prediction History</h2>
          <p>
            {history.length} assessment{history.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button className={styles.clearBtn} onClick={() => dispatch(clearHistory())}>
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      <div className={styles.table}>
        <div className={styles.thead}>
          <span>Date</span>
          <span>Age</span>
          <span>Sex</span>
          <span>Risk Score</span>
          <span>Result</span>
          <span>Actions</span>
        </div>
        <AnimatePresence>
          {history.map((record) => {
            const pct = Math.round(record.result.probability * 100);
            const isHigh = record.result.prediction === 1;

            return (
              <motion.div
                key={record.id}
                className={styles.row}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                layout
                onClick={() => setSelected(record)}
              >
                <span className={styles.date}>{formatDate(record.timestamp)}</span>
                <span>{record.patientData.age}</span>
                <span>{record.patientData.sex === 1 ? 'Male' : 'Female'}</span>
                <span>
                  <div className={styles.scoreMini}>
                    <div
                      className={styles.scoreMiniBar}
                      style={{
                        width: `${pct}%`,
                        background: isHigh ? '#DC2626' : '#059669',
                      }}
                    />
                    <span>{pct}%</span>
                  </div>
                </span>
                <span>
                  <span
                    className={`${styles.badge} ${isHigh ? styles.badgeHigh : styles.badgeLow}`}
                  >
                    {isHigh ? 'High Risk' : 'Low Risk'}
                  </span>
                </span>
                <span
                  className={styles.rowActions}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className={styles.viewBtn}
                    onClick={() => setSelected(record)}
                    title="View details"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => dispatch(removeFromHistory(record.id))}
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selected && <DetailModal record={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
