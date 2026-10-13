import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import type { PredictionResult, PatientData } from '../../types';
import { askCardioSenseStream, type ChatSource } from '../../sideeffects/api/chatApi';
import styles from './AskCardioSense.module.less';

const SUGGESTIONS_WITH_RESULT = [
  'Why is my risk level what it is?',
  'What does my cholesterol mean?',
  'What can I do to lower my risk?',
];
const SUGGESTIONS_GENERAL = [
  'What do the risk levels mean?',
  'What is ST depression?',
  'How accurate is this model?',
];

interface Props {
  result?: PredictionResult | null;
  patientData?: PatientData | null;
  /** Standalone page variant: larger layout, no card chrome title duplication. */
  standalone?: boolean;
}

interface Reply { q: string; answer: string; sources: ChatSource[]; pending: boolean }

export default function AskCardioSense({ result = null, patientData = null, standalone = false }: Props) {
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState<Reply | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loading = reply?.pending ?? false;

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = async (q: string) => {
    const text = q.trim();
    if (!text || loading) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setQuestion('');
    setReply({ q: text, answer: '', sources: [], pending: true });
    try {
      await askCardioSenseStream(
        text, result, patientData,
        {
          onMeta: (m) => setReply((r) => (r ? { ...r, sources: m.sources } : r)),
          onToken: (t) => setReply((r) => (r ? { ...r, answer: r.answer + t } : r)),
        },
        controller.signal,
      );
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setReply((r) => (r && !r.answer ? null : r));
    } finally {
      setReply((r) => (r ? { ...r, pending: false } : r));
    }
  };

  const suggestions = result ? SUGGESTIONS_WITH_RESULT : SUGGESTIONS_GENERAL;

  return (
    <section className={`${styles.card} ${standalone ? styles.standalone : ''}`} aria-label="Ask CardioSense">
      {!standalone && <h3 className={styles.title}><MessageCircle size={18} /> Ask CardioSense</h3>}
      <p className={styles.hint}>
        {result
          ? 'Ask about your result. '
          : 'Ask about heart-risk factors, the model, or what the numbers mean. Run a prediction to get answers about your own result. '}
        Answers run on a local AI model and are educational only — not medical advice.
      </p>
      <div className={styles.chips}>
        {suggestions.map((s) => (
          <button key={s} type="button" className={styles.chip} disabled={loading} onClick={() => submit(s)}>
            {s}
          </button>
        ))}
      </div>
      <form className={styles.form} onSubmit={(e) => { e.preventDefault(); submit(question); }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question…"
          aria-label="Your question"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !question.trim()} aria-label="Send question">
          <Send size={16} />
        </button>
      </form>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {reply && (
        <div className={styles.reply}>
          <p className={styles.q}>{reply.q}</p>
          <p>{reply.answer || (reply.pending ? 'Thinking…' : '')}</p>
          {!reply.pending && reply.sources.length > 0 && (
            <p className={styles.sources}>Sources: {reply.sources.map((s) => s.heading).join(' · ')}</p>
          )}
        </div>
      )}
    </section>
  );
}