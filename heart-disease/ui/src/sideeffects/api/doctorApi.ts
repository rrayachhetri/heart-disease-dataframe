import { api } from './api';
import type { DoctorProfile } from '../../types';

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

export interface AppointmentSlot {
  id: string;
  doctor_id: string;
  starts_at: string;
  ends_at: string;
}

export interface AppointmentBooking {
  id: string;
  doctor_id: string;
  slot_id: string;
  starts_at: string;
  ends_at: string;
  insurance_plan: string;
  status: string;
}

export async function fetchDoctorRecommendations(
  insurance: string,
  specialty?: string
): Promise<DoctorRecommendation[]> {
  const { data } = await api.get<DoctorRecommendation[]>('/doctors/recommendations', {
    params: { insurance, specialty },
  });
  return data;
}

export async function verifyDoctorInsurance(
  doctorId: string,
  insurance: string
): Promise<InsuranceMatch> {
  const { data } = await api.get<InsuranceMatch>(`/doctors/${doctorId}/insurance`, {
    params: { insurance },
  });
  return data;
}

// ── Local doctor directory (real providers via CMS NPI Registry) ────────────────────────

export interface LocalProvider {
  npi: string;
  first_name: string | null;
  last_name: string | null;
  credential: string | null;
  organization_name: string | null;
  specialty: string | null;
  phone: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  registered_doctor_id: string | null;
}

export interface AppointmentRequestPayload {
  provider_npi: string;
  provider_name: string;
  provider_phone?: string | null;
  specialty?: string | null;
  insurance: string;
  preferred_time?: string | null;
  notes?: string | null;
}

export interface AppointmentRequestRecord extends AppointmentRequestPayload {
  id: string;
  status: string;
  created_at: string;
}

export async function searchLocalDoctors(
  postalCode: string,
  specialty?: string
): Promise<LocalProvider[]> {
  const { data } = await api.get<LocalProvider[]>('/local-doctors/search', {
    params: { postal_code: postalCode, specialty },
  });
  return data;
}

export async function requestAppointment(
  payload: AppointmentRequestPayload
): Promise<AppointmentRequestRecord> {
  const { data } = await api.post<AppointmentRequestRecord>('/local-doctors/requests', payload);
  return data;
}

export async function fetchMyAppointmentRequests(): Promise<AppointmentRequestRecord[]> {
  const { data } = await api.get<AppointmentRequestRecord[]>('/local-doctors/requests/me');
  return data;
}

export async function fetchAvailableSlots(doctorId: string): Promise<AppointmentSlot[]> {
  const { data } = await api.get<AppointmentSlot[]>(`/doctors/${doctorId}/slots`);
  return data;
}

export async function bookAppointment(
  doctorId: string,
  slotId: string,
  insurance: string
): Promise<AppointmentBooking> {
  const { data } = await api.post<AppointmentBooking>(`/doctors/${doctorId}/bookings`, {
    slot_id: slotId,
    insurance,
  });
  return data;
}

// ── Doctor's own profile + published availability (doctor-role only) ────────────────────

export interface DoctorProfileUpdatePayload {
  npi_number?: string;
  specialty?: string;
  bio?: string;
  phone?: string;
  consultation_fee?: number;
  is_accepting_patients?: boolean;
  accepted_insurance?: string[];
}

export interface SlotCreatePayload {
  starts_at: string;
  ends_at: string;
}

export async function fetchMyDoctorProfile(): Promise<DoctorProfile> {
  const { data } = await api.get<DoctorProfile>('/doctors/me');
  return data;
}

export async function updateMyDoctorProfile(payload: DoctorProfileUpdatePayload): Promise<DoctorProfile> {
  const { data } = await api.put<DoctorProfile>('/doctors/me', payload);
  return data;
}

export async function fetchMySlots(): Promise<AppointmentSlot[]> {
  const { data } = await api.get<AppointmentSlot[]>('/doctors/me/slots');
  return data;
}

export async function createMySlot(payload: SlotCreatePayload): Promise<AppointmentSlot> {
  const { data } = await api.post<AppointmentSlot>('/doctors/me/slots', payload);
  return data;
}

export async function deleteMySlot(slotId: string): Promise<void> {
  await api.delete(`/doctors/me/slots/${slotId}`);
}
