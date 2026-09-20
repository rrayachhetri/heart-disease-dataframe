import { useEffect, useState } from 'react';
import type { ModelInfo } from '../../types';
import { fetchModelInfo, fetchDatasetComparison, type DatasetSummary } from '../../api/predictApi';
import CohortExplorer from '../Dashboard/CohortExplorer';
import ModelPerformanceCard from '../Dashboard/ModelPerformanceCard';
import { getTextContent } from '../../content/text';
import dashboardStyles from '../Dashboard/DashboardPage.module.less';
import styles from './ModelInsightsPage.module.less';

const t = getTextContent('modelInsights');

export default function ModelInsightsPage() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [datasetSummaries, setDatasetSummaries] = useState<DatasetSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const loading = !loaded;

  useEffect(() => {
    Promise.allSettled([
      fetchModelInfo().then(setModelInfo),
      fetchDatasetComparison().then((r) =>
        setDatasetSummaries(r.datasets.filter((d) => d.name !== 'combined')),
      ),
    ]).finally(() => setLoaded(true));
  }, []);

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.welcome}>
        <div>
          <h2>{t.heading}</h2>
          <p>{t.subheading}</p>
        </div>
      </div>

      {loading && (
        <div className={styles.skeletonWrap} aria-hidden="true">
          <div className={styles.skeletonCard}>
            <div className={styles.skeletonLineLg} />
            <div className={styles.skeletonLineSm} />
            <div className={styles.skeletonGrid}>
              <div className={styles.skeletonPill} />
              <div className={styles.skeletonPill} />
              <div className={styles.skeletonPill} />
              <div className={styles.skeletonPill} />
            </div>
          </div>
          <div className={styles.skeletonCardTall}>
            <div className={styles.skeletonLineLg} />
            <div className={styles.skeletonChart} />
          </div>
        </div>
      )}

      {datasetSummaries.length > 0 && <CohortExplorer datasets={datasetSummaries} />}
      {modelInfo && <ModelPerformanceCard modelInfo={modelInfo} />}

      {loaded && !modelInfo && datasetSummaries.length === 0 && (
        <p role="status" aria-live="polite">{t.loading}</p>
      )}
    </div>
  );
}
