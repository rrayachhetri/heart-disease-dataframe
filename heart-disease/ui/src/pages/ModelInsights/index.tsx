import { useEffect, useState } from 'react';
import { Activity, Cpu, Timer, Workflow } from 'lucide-react';
import { useGetModelInfoQuery, useGetDatasetComparisonQuery } from '../../sideeffects/api/predictEndpoints';
import CohortExplorer from '../Dashboard/CohortExplorer';
import ModelPerformanceCard from '../Dashboard/ModelPerformanceCard';
import { getTextContent } from '../../content/text';
import dashboardStyles from '../Dashboard/DashboardPage.module.less';
import styles from './ModelInsightsPage.module.less';

const t = getTextContent('modelInsights');

export default function ModelInsightsPage() {
  const { data: modelInfo, isFetching: modelInfoLoading } = useGetModelInfoQuery();
  const { data: datasetComparison, isFetching: datasetLoading } = useGetDatasetComparisonQuery();
  const [lastProcessingMs, setLastProcessingMs] = useState<number | null>(null);
  const [lastMetrics, setLastMetrics] = useState<Record<string, number>>({});

  const datasetSummaries = (datasetComparison?.datasets ?? []).filter((d) => d.name !== 'combined');
  const loading = modelInfoLoading || datasetLoading;
  const loaded = !loading;

  useEffect(() => {
    const saved = localStorage.getItem('lastPredictionTelemetry');
    if (!saved) return;

    try {
      const telemetry = JSON.parse(saved) as {
        processingTimeMs?: number;
        processingMetrics?: Record<string, number>;
      };
      if (typeof telemetry.processingTimeMs === 'number') {
        setLastProcessingMs(telemetry.processingTimeMs);
      }
      if (telemetry.processingMetrics) setLastMetrics(telemetry.processingMetrics);
    } catch {
      localStorage.removeItem('lastPredictionTelemetry');
    }
  }, []);

  return (
    <div className={`${dashboardStyles.page} ${styles.page}`}>
      <div className={dashboardStyles.welcome}>
        <div>
          <h2>{t.heading}</h2>
          <p>{t.subheading}</p>
        </div>
        {loaded && modelInfo && (
          <aside className={styles.inferencePanel} aria-labelledby="inference-details-title">
            <div className={styles.inferenceHeader}>
              <div className={styles.inferenceTitle}>
                <Activity size={16} aria-hidden="true" />
                <h3 id="inference-details-title">Inference details</h3>
              </div>
              <span className={styles.liveBadge}>Live model</span>
            </div>

            <div className={styles.inferenceStats}>
              <div className={styles.inferenceStat}>
                <Cpu size={15} aria-hidden="true" />
                <span>Model memory</span>
                <strong>{modelInfo.model_memory_mb.toFixed(1)} MB</strong>
              </div>
              <div className={styles.inferenceStat}>
                <Timer size={15} aria-hidden="true" />
                <span>Latest prediction</span>
                <strong>{lastProcessingMs === null ? 'Not run yet' : `${lastProcessingMs.toFixed(1)} ms`}</strong>
              </div>
              <div className={styles.inferenceStat}>
                <Activity size={15} aria-hidden="true" />
                <span>API process RAM</span>
                <strong>{modelInfo.runtime_ram_mb.toFixed(1)} MB</strong>
              </div>
            </div>

            <div className={styles.processingLine}>
              <Workflow size={15} aria-hidden="true" />
              <span>{modelInfo.processing_steps.length} measured processing stages per prediction</span>
            </div>

            <div className={styles.processingDetails}>
              <div className={styles.detailHeading}>Runtime details</div>
              <div className={styles.detailGrid}>
                <span>CPU capacity</span><strong>{modelInfo.cpu_cores} cores</strong>
                <span>CPU time</span><strong>{lastMetrics.cpu_time_ms === undefined ? 'Not run yet' : `${lastMetrics.cpu_time_ms.toFixed(2)} ms`}</strong>
                <span>Feature frame</span><strong>{lastMetrics.feature_frame_ms === undefined ? 'Not run yet' : `${lastMetrics.feature_frame_ms.toFixed(2)} ms`}</strong>
                <span>Model inference</span><strong>{lastMetrics.model_inference_ms === undefined ? 'Not run yet' : `${lastMetrics.model_inference_ms.toFixed(2)} ms`}</strong>
                <span>Explainability</span><strong>{lastMetrics.explainability_ms === undefined ? 'Not run yet' : `${lastMetrics.explainability_ms.toFixed(2)} ms`}</strong>
                <span>Population benchmark</span><strong>{lastMetrics.benchmarking_ms === undefined ? 'Not run yet' : `${lastMetrics.benchmarking_ms.toFixed(2)} ms`}</strong>
              </div>
            </div>
          </aside>
        )}
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
