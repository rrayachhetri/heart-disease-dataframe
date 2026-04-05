import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import styles from './StatTooltip.module.less';

interface Props {
  term: string;
  children: React.ReactNode;
  className?: string;
}

const STAT_DEFINITIONS = {
  'Mean': 'Average value calculated by summing all values and dividing by the count',
  'StdDev': 'Standard deviation - measures how spread out the data is from the average',
  'Median': 'Middle value when all data points are arranged in order from lowest to highest',
  'IQR': 'Interquartile range - the spread of the middle 50% of the data (Q3 - Q1)',
  'Min': 'Minimum (lowest) value observed in the dataset',
  'Max': 'Maximum (highest) value observed in the dataset',
} as const;

export default function StatTooltip({ term, children, className }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const definition = STAT_DEFINITIONS[term as keyof typeof STAT_DEFINITIONS];

  if (!definition) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      className={`${styles.wrapper} ${className || ''}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipContent}>
            <strong>{term}</strong>
            <br />
            {definition}
          </div>
        </div>
      )}
    </div>
  );
}