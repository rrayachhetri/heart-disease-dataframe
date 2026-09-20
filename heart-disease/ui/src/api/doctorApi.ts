import { API_BASE_URL, authHeaders } from './config';
import type { DoctorProfile } from '../types';

export interface InsuranceMatch {
  doctor_id: string;
  insurance: string;
  in_network: boolean;
  matched_plan: string | null;
  verification_source: string;
  note: string;
}

export interface DoctorRecommendation extends DoctorProfile {
  insurance_match: InsuranceMatch;
}

export async function fetchDoctorRecommendations(
  insurance: string,
  specialty?: string
): Promise<DoctorRecommendation[]> {
  const params = new URLSearchParams({ insurance });
  if (specialty) params.set('specialty', specialty);

  const response = await fetch(`${API_BASE_URL}/doctors/recommendations?${params}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Doctor search failed: ${response.status}`);
  return response.json();
}

export async function verifyDoctorInsurance(
  doctorId: string,
  insurance: string
): Promise<InsuranceMatch> {
  const params = new URLSearchParams({ insurance });
  const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/insurance?${params}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Insurance verification failed: ${response.status}`);
  return response.json();
}
