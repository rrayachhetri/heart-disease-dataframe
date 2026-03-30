import { API_BASE_URL } from './config';
import type { PatientData, PredictionResult } from '../types';

export async function predictHeartDisease(data: PatientData): Promise<PredictionResult> {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function checkHealth(): Promise<{ status: string; model_loaded: boolean }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
  return response.json();
}
