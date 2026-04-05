import { useEffect, useRef } from 'react';
import styles from './CohortTooltip.module.less';
import type { DatasetSummary } from '../../api/predictApi';

interface Props {
  cohort: DatasetSummary | null;
  visible: boolean;
  position: { x: number; y: number };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function CohortTooltip({ cohort, visible, position, onMouseEnter, onMouseLeave }: Props) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Get tooltip dimensions
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width || 280; // fallback width
    const tooltipHeight = tooltipRect.height || 400; // fallback height

    // Smart responsive positioning
    let finalX = position.x;
    let finalY = position.y;

    // Handle horizontal positioning
    if (finalX + tooltipWidth > viewportWidth - 20) {
      // Position to the left of the trigger if it would overflow right
      finalX = Math.max(20, position.x - tooltipWidth - 20);
    }
    
    // Handle vertical positioning  
    if (finalY + tooltipHeight > viewportHeight - 20) {
      // Position above the trigger if it would overflow below
      finalY = Math.max(20, position.y - tooltipHeight - 20);
    }
    
    // Ensure minimum margins on all sides
    finalX = Math.max(20, Math.min(finalX, viewportWidth - tooltipWidth - 20));
    finalY = Math.max(20, Math.min(finalY, viewportHeight - tooltipHeight - 20));

    // Apply positioning
    tooltip.style.left = `${finalX}px`;
    tooltip.style.top = `${finalY}px`;
    tooltip.style.right = 'auto';
    tooltip.style.width = '';
    
    // Force a maximum height
    const maxHeight = Math.min(400, viewportHeight - 40);
    tooltip.style.maxHeight = `${maxHeight}px`;
  }, [visible, position]);

  if (!visible || !cohort) return null;

  const diseaseRate = Math.round(cohort.meta.disease_rate * 100);
  
  // Key features to show in tooltip with full statistical data
  const keyFeatures = [
    { 
      label: 'Age', 
      unit: 'yrs',
      mean: cohort.features.age?.mean ?? 0,
      std: cohort.features.age?.std ?? 0,
      median: cohort.features.age?.median ?? 0,
      q1: cohort.features.age?.q1 ?? 0,
      q3: cohort.features.age?.q3 ?? 0,
      min: cohort.features.age?.min ?? 0,
      max: cohort.features.age?.max ?? 0
    },
    { 
      label: 'Cholesterol', 
      unit: 'mg/dL',
      mean: cohort.features.chol?.mean ?? 0,
      std: cohort.features.chol?.std ?? 0,
      median: cohort.features.chol?.median ?? 0,
      q1: cohort.features.chol?.q1 ?? 0,
      q3: cohort.features.chol?.q3 ?? 0,
      min: cohort.features.chol?.min ?? 0,
      max: cohort.features.chol?.max ?? 0
    },
    { 
      label: 'Resting BP', 
      unit: 'mmHg',
      mean: cohort.features.trestbps?.mean ?? 0,
      std: cohort.features.trestbps?.std ?? 0,
      median: cohort.features.trestbps?.median ?? 0,
      q1: cohort.features.trestbps?.q1 ?? 0,
      q3: cohort.features.trestbps?.q3 ?? 0,
      min: cohort.features.trestbps?.min ?? 0,
      max: cohort.features.trestbps?.max ?? 0
    },
    { 
      label: 'Max Heart Rate', 
      unit: 'bpm',
      mean: cohort.features.thalach?.mean ?? 0,
      std: cohort.features.thalach?.std ?? 0,
      median: cohort.features.thalach?.median ?? 0,
      q1: cohort.features.thalach?.q1 ?? 0,
      q3: cohort.features.thalach?.q3 ?? 0,
      min: cohort.features.thalach?.min ?? 0,
      max: cohort.features.thalach?.max ?? 0
    }
  ];

  // Gender distribution (assuming sex: 1=male, 0=female)
  const malePercent = cohort.features.sex ? Math.round(cohort.features.sex.mean * 100) : 0;
  const femalePercent = 100 - malePercent;

  return (
    <div 
      ref={tooltipRef}
      className={styles.tooltip}
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.header}>
        <h4 className={styles.title}>{cohort.name.charAt(0).toUpperCase() + cohort.name.slice(1)} Cohort</h4>
        <div className={styles.subtitle}>Detailed Population Statistics</div>
      </div>

      <div className={styles.content}>
        {/* Overview Stats */}
        <div className={styles.section}>
          <div className={styles.overviewGrid}>
            <div className={styles.overviewItem}>
              <span className={styles.overviewValue}>{cohort.meta.total_records}</span>
              <span className={styles.overviewLabel}>Patients</span>
            </div>
            <div className={styles.overviewItem}>
              <span className={`${styles.overviewValue} ${styles.riskValue}`}>{diseaseRate}%</span>
              <span className={styles.overviewLabel}>Disease</span>
            </div>
            <div className={styles.overviewItem}>
              <span className={styles.overviewValue}>{malePercent}%</span>
              <span className={styles.overviewLabel}>Male</span>
            </div>
            <div className={styles.overviewItem}>
              <span className={styles.overviewValue}>{femalePercent}%</span>
              <span className={styles.overviewLabel}>Female</span>
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* Key Clinical Features */}
        <div className={styles.section}>
          <div className={styles.featuresList}>
            {keyFeatures.map((feature, index) => (
              <div key={index} className={styles.featureItem}>
                <div className={styles.featureLabel}>{feature.label}</div>
                <div className={styles.featureStats}>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>
                      {feature.mean.toFixed(1)} {feature.unit}
                    </span>
                    <span className={styles.statLabel}>
                      ±{feature.std.toFixed(1)}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>
                      {feature.median.toFixed(1)} {feature.unit}
                    </span>
                    <span className={styles.statLabel}>
                      {feature.q1.toFixed(0)}–{feature.q3.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}