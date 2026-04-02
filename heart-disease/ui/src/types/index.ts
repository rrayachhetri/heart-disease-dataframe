export interface PatientData {
  age: number;
  sex: number;
  cp: number;
  trestbps: number;
  chol: number;
  fbs: number;
  restecg: number;
  thalach: number;
  exang: number;
  oldpeak: number;
  slope: number;
  ca: number;
  thal: number;
}

export interface PredictionResult {
  id?: string;       // server-assigned ID (present when authenticated)
  probability: number;
  prediction: number;
  risk_level: string;
}

export interface PredictionRecord {
  id: string;
  timestamp: number;
  patientData: PatientData;
  result: PredictionResult;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  first_name: string | null;
  last_name: string | null;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: UserRole;
  first_name: string;
  last_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ── Doctor ────────────────────────────────────────────────────────────────────

export interface DoctorProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  npi_number: string | null;
  specialty: string | null;
  bio: string | null;
  phone: string | null;
  consultation_fee: number;
  accepted_insurance: string[];
  is_npi_verified: boolean;
  is_accepting_patients: boolean;
  rating: number;
}
