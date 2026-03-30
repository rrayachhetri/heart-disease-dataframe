import { useSelector } from 'react-redux';
import {
  HeartPulse,
  Activity,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
} from 'recharts';
import type { RootState } from '../store';
import KPICard from '../components/Dashboard/KPICard';
import styles from './DashboardPage.module.less';

export default function DashboardPage() {
  const navigate = useNavigate();
  const history = useSelector((s: RootState) => s.prediction.history);

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
          <h2>Welcome back, Doctor</h2>
          <p>Here's an overview of your heart disease risk assessments.</p>
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
        />
        <KPICard
          title="Average Risk"
          value={`${avgRisk}%`}
          subtitle="Mean probability score"
          icon={TrendingUp}
          color="amber"
        />
        <KPICard
          title="High Risk Cases"
          value={highRiskCount}
          subtitle="Prediction = 1"
          icon={AlertTriangle}
          color="red"
        />
        <KPICard
          title="Low Risk Cases"
          value={lowRiskCount}
          subtitle="Prediction = 0"
          icon={ShieldCheck}
          color="green"
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
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
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
    </div>
  );
}
