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
import styles from './DashboardPage.module.less';

interface Props {
  highRiskCount: number;
  lowRiskCount: number;
  chartData: { name: string; risk: number }[];
  legendHighRisk: string;
  legendLowRisk: string;
  riskDistributionTitle: string;
  recentRiskTrendTitle: string;
}

const PIE_COLORS = ['#DC2626', '#059669'];

export default function PredictionCharts({
  highRiskCount,
  lowRiskCount,
  chartData,
  legendHighRisk,
  legendLowRisk,
  riskDistributionTitle,
  recentRiskTrendTitle,
}: Props) {
  const pieData = [
    { name: 'High Risk', value: highRiskCount || 0 },
    { name: 'Low Risk', value: lowRiskCount || 0 },
  ];

  return (
    <div className={styles.chartsRow}>
      <motion.div
        className={styles.chartCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3>{riskDistributionTitle}</h3>
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
            <i style={{ background: PIE_COLORS[0] }} /> {legendHighRisk}
          </span>
          <span className={styles.legendItem}>
            <i style={{ background: PIE_COLORS[1] }} /> {legendLowRisk}
          </span>
        </div>
      </motion.div>

      <motion.div
        className={styles.chartCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3>{recentRiskTrendTitle}</h3>
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
  );
}
