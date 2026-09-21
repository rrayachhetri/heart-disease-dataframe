import { api } from './api';
import type { PatientData, PredictionResult, ServerPredictionRecord, ModelInfo, PopulationPercentile } from '../../types';

export async function predictHeartDisease(data: PatientData): Promise<PredictionResult> {
  const { data: result } = await api.post<PredictionResult>('/predictions', data);
  return result;
}

export async function fetchPredictionHistory(
  skip = 0,
  limit = 50
): Promise<{ predictions: ServerPredictionRecord[]; total: number }> {
  const { data } = await api.get('/predictions', { params: { skip, limit } });
  return data;
}

export async function deletePrediction(id: string): Promise<void> {
  await api.delete(`/predictions/${id}`);
}

export async function checkHealth(): Promise<{ status: string; model_loaded: boolean }> {
  const { data } = await api.get('/health');
  return data;
}

/** Fetch ensemble model performance metrics and feature importances. */
export async function fetchModelInfo(): Promise<ModelInfo> {
  const { data } = await api.get<ModelInfo>('/predictions/model-info');
  return data;
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
  const { data } = await api.get<DatasetComparisonResponse>('/analytics/datasets');
  return data;
}

/** Fetch population-percentile benchmark for a patient across all cohorts. */
export async function fetchPopulationBenchmark(
  data: PatientData
): Promise<{ feature_percentiles: PopulationPercentile[] }> {
  const { data: result } = await api.post('/analytics/population-benchmark', data);
  return result;
}
