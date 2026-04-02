import { API_BASE_URL, authHeaders } from './config';
import type { PatientData, PredictionResult } from '../types';

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
): Promise<{ predictions: unknown[]; total: number }> {
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
