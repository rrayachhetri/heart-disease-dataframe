import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { getTextContent } from '../../content/text';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, ClipboardList, Eye } from 'lucide-react';
import type { PredictionRecord } from '../../types';
import { clearHistory, removeFromHistory } from '../../store/slices/predictionSlice';
import { useNavigate } from 'react-router-dom';
import DetailModal from './DetailModal';
import styles from './HistoryPage.module.less';

export default function HistoryPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const history = useAppSelector((s) => s.prediction.history);
  const t = getTextContent('history');
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
        <h3>{t.emptyHeading}</h3>
        <p>{t.emptyText}</p>
        <button onClick={() => navigate('/predict')}>Make a Prediction</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>{t.pageTitle}</h2>
          <p>
            {history.length} assessment{history.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button className={styles.clearBtn} onClick={() => dispatch(clearHistory())}>
          <Trash2 size={16} />
          {t.clearAllBtn}
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
