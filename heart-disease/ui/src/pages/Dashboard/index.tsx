import { useAppSelector } from '../../store/hooks';
import { getTextContent } from '../../content/text';
import {
  HeartPulse,
  Activity,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import KPICard from '../../components/Dashboard/KPICard';
import EmergencyCard from '../../components/Dashboard/EmergencyCard';
import NearbyHospitals from '../../components/Dashboard/NearbyHospitals';
import HealthTrends from '../../components/Dashboard/HealthTrends';
import PredictionCharts from './PredictionCharts';
import styles from './DashboardPage.module.less';

export default function DashboardPage() {
  const navigate = useNavigate();
  const history = useAppSelector((s) => s.prediction.history);
  const user = useAppSelector((s) => s.auth.user);
  const t = getTextContent('dashboard');

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email
    : '';
  const roleLabel = t.roleLabels[user?.role ?? ''] ?? 'Patient';

  const totalPredictions = history.length;
  const highRiskCount = history.filter((r) => r.result.prediction === 1).length;
  const lowRiskCount = totalPredictions - highRiskCount;
  const avgRisk =
    totalPredictions > 0
      ? Math.round(
          (history.reduce((sum, r) => sum + r.result.probability, 0) / totalPredictions) * 100,
        )
      : 0;

  const chartData = history
    .slice(0, 10)
    .reverse()
    .map((r, i) => ({ name: `#${i + 1}`, risk: Math.round(r.result.probability * 100) }));

  return (
    <div className={styles.page}>
      <EmergencyCard />

      {/* Welcome header */}
      <div className={styles.welcome}>
        <div>
          <h2>{t.welcomeBack} {displayName || roleLabel}</h2>
          <p>{user?.role === 'doctor' ? t.overviewDoctor : t.overviewPatient}</p>
        </div>
        <motion.button
          className={styles.ctaBtn}
          onClick={() => navigate('/predict')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <HeartPulse size={18} />
          {t.newPrediction}
        </motion.button>
      </div>

      {/* KPI grid */}
      <div className={styles.kpiGrid}>
        <KPICard
          title={t.totalPredictions}
          value={totalPredictions}
          subtitle={t.totalPredictionsSubtitle}
          icon={Activity}
          color="blue"
          onClick={() => navigate('/history')}
          linkLabel={t.viewAllHistory}
        />
        <KPICard
          title={t.averageRisk}
          value={`${avgRisk}%`}
          subtitle={t.averageRiskSubtitle}
          icon={TrendingUp}
          color="amber"
          onClick={totalPredictions > 0 ? () => navigate('/history') : undefined}
          linkLabel={t.viewAssessments}
        />
        <KPICard
          title={t.highRiskCases}
          value={highRiskCount}
          subtitle={t.highRiskCasesSubtitle}
          icon={AlertTriangle}
          color="red"
          onClick={highRiskCount > 0 ? () => navigate('/history') : undefined}
          linkLabel={t.reviewCases}
        />
        <KPICard
          title={t.lowRiskCases}
          value={lowRiskCount}
          subtitle={t.lowRiskCasesSubtitle}
          icon={ShieldCheck}
          color="green"
          onClick={lowRiskCount > 0 ? () => navigate('/history') : undefined}
          linkLabel={t.viewCases}
        />
      </div>

      {/* Charts row — shown only when there are predictions */}
      {totalPredictions > 0 && (
        <PredictionCharts
          highRiskCount={highRiskCount}
          lowRiskCount={lowRiskCount}
          chartData={chartData}
          legendHighRisk={t.legendHighRisk}
          legendLowRisk={t.legendLowRisk}
          riskDistributionTitle={t.riskDistribution}
          recentRiskTrendTitle={t.recentRiskTrend}
        />
      )}

      {/* Empty state */}
      {totalPredictions === 0 && (
        <motion.div
          className={styles.emptyState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <HeartPulse size={48} />
          <h3>{t.noPredictionsHeading}</h3>
          <p>{t.noPredictionsText}</p>
          <button className={styles.emptyBtn} onClick={() => navigate('/predict')}>
            {t.getStarted}
          </button>
        </motion.div>
      )}

      {/* Health trends derived from prediction history */}
      <HealthTrends history={history} />

      {/* Nearby hospitals / urgent care finder */}
      <NearbyHospitals />
    </div>
  );
}
