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
    let active = true;

    (async () => {
      const [modelRes, datasetRes] = await Promise.allSettled([
        fetchModelInfo(),
        fetchDatasetComparison(),
      ]);

      if (!active) return;

      if (modelRes.status === 'fulfilled') {
        setModelInfo(modelRes.value);
      }

      if (datasetRes.status === 'fulfilled') {
        setDatasetSummaries(datasetRes.value.datasets.filter((d) => d.name !== 'combined'));
      }

      setLoaded(true);
    })();

    return () => {
      active = false;
    };
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

      {loaded && datasetSummaries.length > 0 && <CohortExplorer datasets={datasetSummaries} />}
      {loaded && modelInfo && <ModelPerformanceCard modelInfo={modelInfo} />}

      {loaded && !modelInfo && datasetSummaries.length === 0 && (
        <p role="status" aria-live="polite">{t.loading}</p>
      )}
    </div>
  );
}
