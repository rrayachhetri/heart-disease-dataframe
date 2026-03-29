import { API_BASE_URL } from './config';

export async function predictHeartDisease(patientData) {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json(); // { prediction: 0|1, probability: 0.0–1.0 }
}
