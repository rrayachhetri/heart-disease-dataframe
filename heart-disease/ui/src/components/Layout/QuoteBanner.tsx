import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { PredictionRecord } from '../../types';
import styles from './QuoteBanner.module.less';

// ── Static fallback tips ──────────────────────────────────────────────────────
const TIPS = [
  '❤️ A healthy heart is a happy heart — move more, stress less.',
  '🫀 Every heartbeat is a gift. Protect it with every choice you make.',
  '💚 Eat well, sleep well, move well — your heart will thank you.',
  '💙 Walking 30 minutes a day can reduce your risk of heart disease by 35%.',
  '🫀 Sleep 7–9 hours a night. Your heart rests and repairs while you sleep.',
  '💙 Stay hydrated — even mild dehydration strains your heart.',
  '❤️ Reduce salt, reduce risk. Your heart beats easier with lower sodium.',
  '🫀 Manage stress — chronic stress is a silent threat to cardiovascular health.',
  '💚 Omega-3 fatty acids in fish and nuts are your heart\'s best friends.',
  '❤️ Regular check-ups catch problems early. Prevention beats cure every time.',
];

// ── Risk level badge ──────────────────────────────────────────────────────────
function riskIcon(level: string) {
  if (!level) return '📊';
  const l = level.toLowerCase();
  if (l.includes('low')) return '✅';
  if (l.includes('medium') || l.includes('moderate')) return '⚠️';
  if (l.includes('high')) return '🔴';
  return '📊';
}

// ── Build personalised messages from profile + history ────────────────────────
function buildPersonalised(
  firstName: string | null,
  history: PredictionRecord[],
): string[] {
  const msgs: string[] = [];
  const name = firstName ? `${firstName}` : 'you';

  if (history.length === 0) return msgs;

  const latest = history[0];
  const { result, patientData } = latest;
  const pct = Math.round(result.probability * 100);
  const level = result.risk_level ?? (result.prediction === 1 ? 'High' : 'Low');

  // Greeting + latest result
  msgs.push(
    `${riskIcon(level)} Hi ${name} — your latest assessment: ${level} Risk · ${pct}% probability`,
  );

  // Assessment count
  if (history.length === 1) {
    msgs.push(`📋 You've completed 1 heart health assessment — great start, ${name}!`);
  } else {
    msgs.push(`📋 ${name}, you've completed ${history.length} heart health assessments so far`);
  }

  // Trend analysis (need ≥2 records)
  if (history.length >= 2) {
    const prev = history[1];
    const prevPct = Math.round(prev.result.probability * 100);
    const diff = pct - prevPct;
    if (diff <= -5) {
      msgs.push(`📉 Great progress, ${name}! Your risk dropped by ${Math.abs(diff)}% since your last check`);
    } else if (diff >= 5) {
      msgs.push(`📈 ${name}, your risk increased by ${diff}% since last time — consider reviewing your lifestyle`);
    } else {
      msgs.push(`➡️ ${name}, your risk has been stable across your last two assessments`);
    }
  }

  // Feature-specific suggestions from latest data
  if (patientData.chol >= 240) {
    msgs.push(`🥗 Your last recorded cholesterol was ${patientData.chol} mg/dL — aim for under 200 through diet and exercise`);
  } else if (patientData.chol >= 200) {
    msgs.push(`🥗 Cholesterol at ${patientData.chol} mg/dL — borderline high. More fibre and less saturated fat can help`);
  }

  if (patientData.trestbps >= 140) {
    msgs.push(`💊 Resting BP of ${patientData.trestbps} mmHg detected — reducing sodium and staying active can lower it`);
  } else if (patientData.trestbps >= 130) {
    msgs.push(`💊 Resting BP ${patientData.trestbps} mmHg — elevated. Monitoring regularly is a good habit, ${name}`);
  }

  if (patientData.fbs === 1) {
    msgs.push(`🩸 Fasting blood sugar >120 mg/dL noted — watch your carbohydrate intake and consult your doctor`);
  }

  if (patientData.exang === 1) {
    msgs.push(`🏃 Exercise-induced chest pain detected — discuss this with your doctor before intense activity`);
  }

  if (patientData.thalach > 0 && patientData.thalach < 120) {
    msgs.push(`💓 Max heart rate of ${patientData.thalach} bpm — low for your profile. Regular cardio may improve capacity`);
  }

  if (patientData.age >= 55) {
    msgs.push(`🕐 At ${patientData.age}, proactive heart care matters most — keep up with your annual check-ups, ${name}`);
  }

  return msgs;
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  collapsed?: boolean;
}

export default function QuoteBanner({ collapsed = false }: Props) {
  const user = useSelector((s: RootState) => s.auth.user);
  const history = useSelector((s: RootState) => s.prediction.history);

  const track = useMemo(() => {
    const personal = buildPersonalised(user?.first_name ?? null, history);
    // Interleave personal messages with general tips, personal first
    const combined = personal.length > 0
      ? [...personal, ...TIPS]
      : TIPS;
    // Duplicate for seamless infinite scroll
    return [...combined, ...combined];
  }, [user, history]);

  return (
    <div className={`${styles.banner}${collapsed ? ` ${styles.collapsed}` : ''}`} aria-hidden="true">
      <div className={styles.track}>
        {track.map((q, i) => (
          <span key={i} className={styles.quote}>
            {q}
            <span className={styles.sep}>•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
