import { API_BASE_URL, getAccessToken } from './config';
import type { PredictionResult, PatientData } from '../../types';

export interface ChatSource { source: string; heading: string }

export interface ChatStreamHandlers {
  onMeta?: (meta: { sources: ChatSource[]; grounded_in_prediction: boolean }) => void;
  onToken: (text: string) => void;
}

/**
 * Streams an answer from /chat/stream (NDJSON). Uses fetch directly so that
 * (a) tokens render as they arrive and (b) a local-LLM outage doesn't trigger
 * the app-wide "system unavailable" redirect handled by the shared axios client.
 */
export async function askCardioSenseStream(
  question: string,
  result: PredictionResult | null,
  features: PatientData | null | undefined,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const token = getAccessToken();
  let body: Record<string, unknown> = { question };
  if (result?.id) {
    body = { question, prediction_id: result.id };
  } else if (result) {
    body = {
      question,
      context: {
        probability: result.probability,
        prediction: result.prediction,
        risk_level: result.risk_level,
        top_factors: result.top_factors ?? [],
        population_percentiles: result.population_percentiles ?? [],
        features: features ?? undefined,
      },
    };
  }

  const resp = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    signal,
  });

  if (!resp.ok || !resp.body) {
    if (resp.status === 503) {
      throw new Error('The local AI assistant is not running. Start Ollama and try again.');
    }
    const detail = await resp.json().then((j) => j?.detail).catch(() => undefined);
    throw new Error(typeof detail === 'string' ? detail : 'Could not get an answer. Please try again.');
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleLine = (line: string) => {
    if (!line.trim()) return;
    const evt = JSON.parse(line);
    if (evt.type === 'meta') handlers.onMeta?.(evt);
    else if (evt.type === 'token') handlers.onToken(evt.text);
    else if (evt.type === 'error') {
      throw new Error('The local AI assistant is not running. Start Ollama and try again.');
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    lines.forEach(handleLine);
  }
  handleLine(buffer);
}