import { API_BASE_URL, authHeaders } from './config';
import type { PatientData, PredictionResult, ServerPredictionRecord, ModelInfo, PopulationPercentile } from '../types';
import { store } from '../store';
import { setUnavailable } from '../store/slices/systemSlice';

/**
 * Thin wrapper around fetch that dispatches setUnavailable on network
 * errors and 5xx server errors, so the system-unavailable page is shown.
 * 4xx responses are NOT treated as system outages (e.g. 401 = auth issue).
 */
async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(input as RequestInfo, init);
  } catch {
    // TypeError = network offline, DNS failure, CORS, etc.
    store.dispatch(setUnavailable('network'));
    throw new Error('Network request failed');
  }
  if (res.status >= 500) {
    store.dispatch(setUnavailable(res.status === 503 ? 'model_not_loaded' : 'api_down'));
    throw new Error(`API error: ${res.status}`);
  }
  return res;
}

export async function predictHeartDisease(data: PatientData): Promise<PredictionResult> {
  const response = await apiFetch(`${API_BASE_URL}/predictions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function fetchPredictionHistory(
  skip = 0,
  limit = 50
): Promise<{ predictions: ServerPredictionRecord[]; total: number }> {
  const response = await apiFetch(
    `${API_BASE_URL}/predictions?skip=${skip}&limit=${limit}`,
    { headers: authHeaders() }
  );
  if (!response.ok) throw new Error(`History fetch failed: ${response.status}`);
  return response.json();
}

export async function deletePrediction(id: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/predictions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(`Delete failed: ${response.status}`);
  }
}

export async function checkHealth(): Promise<{ status: string; model_loaded: boolean }> {
  const response = await apiFetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
  return response.json();
}

/** Fetch ensemble model performance metrics and feature importances. */
export async function fetchModelInfo(): Promise<ModelInfo> {
  const response = await apiFetch(`${API_BASE_URL}/predictions/model-info`);
  if (!response.ok) throw new Error(`Model info fetch failed: ${response.status}`);
  return response.json();
}

// ── Analytics API ─────────────────────────────────────────────────────────────

export interface DatasetFeatureStats {
  mean: number; std: number; median: number;
  q1: number; q3: number; min: number; max: number; count: number;
}

export interface DatasetSummary {
  name: string;
  meta: { total_records: number; disease_rate: number };
  features: Record<string, DatasetFeatureStats>;
}

export interface DatasetComparisonResponse {
  datasets: DatasetSummary[];
}

/** Fetch per-dataset descriptive stats and disease rates. */
export async function fetchDatasetComparison(): Promise<DatasetComparisonResponse> {
  const response = await apiFetch(`${API_BASE_URL}/analytics/datasets`);
  if (!response.ok) throw new Error(`Dataset comparison fetch failed: ${response.status}`);
  return response.json();
}

/** Fetch population-percentile benchmark for a patient across all cohorts. */
export async function fetchPopulationBenchmark(
  data: PatientData
): Promise<{ feature_percentiles: PopulationPercentile[] }> {
  const response = await apiFetch(`${API_BASE_URL}/analytics/population-benchmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Benchmark fetch failed: ${response.status}`);
  return response.json();
}
