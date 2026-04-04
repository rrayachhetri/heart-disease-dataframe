import { API_BASE_URL, authHeaders } from './config';
import type { PatientData, PredictionResult, ServerPredictionRecord, ModelInfo, PopulationPercentile } from '../types';

export async function predictHeartDisease(data: PatientData): Promise<PredictionResult> {
  const response = await fetch(`${API_BASE_URL}/predictions`, {
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
  const response = await fetch(
    `${API_BASE_URL}/predictions?skip=${skip}&limit=${limit}`,
    { headers: authHeaders() }
  );
  if (!response.ok) throw new Error(`History fetch failed: ${response.status}`);
  return response.json();
}

export async function deletePrediction(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/predictions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(`Delete failed: ${response.status}`);
  }
}

export async function checkHealth(): Promise<{ status: string; model_loaded: boolean }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
  return response.json();
}

/** Fetch ensemble model performance metrics and feature importances. */
export async function fetchModelInfo(): Promise<ModelInfo> {
  const response = await fetch(`${API_BASE_URL}/predictions/model-info`);
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
  const response = await fetch(`${API_BASE_URL}/analytics/datasets`);
  if (!response.ok) throw new Error(`Dataset comparison fetch failed: ${response.status}`);
  return response.json();
}

/** Fetch population-percentile benchmark for a patient across all cohorts. */
export async function fetchPopulationBenchmark(
  data: PatientData
): Promise<{ feature_percentiles: PopulationPercentile[] }> {
  const response = await fetch(`${API_BASE_URL}/analytics/population-benchmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Benchmark fetch failed: ${response.status}`);
  return response.json();
}
