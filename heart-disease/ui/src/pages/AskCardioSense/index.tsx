import { MessageCircle } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import AskCardioSense from '../../components/AskCardioSense';

export default function AskCardioSensePage() {
  const result = useAppSelector((s) => s.prediction.currentResult);
  const patientData = useAppSelector((s) => s.prediction.currentPatientData);

  return (
    <div style={{ padding: '8px 4px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto 4px', maxWidth: 760 }}>
        <MessageCircle size={22} /> Ask CardioSense
      </h2>
      <p style={{ margin: '0 auto 8px', maxWidth: 760, color: '#64748b', fontSize: 14 }}>
        {result
          ? 'Using your most recent prediction as context.'
          : 'No recent prediction — answers will be general.'}
      </p>
      <AskCardioSense standalone result={result} patientData={patientData} />
    </div>
  );
}