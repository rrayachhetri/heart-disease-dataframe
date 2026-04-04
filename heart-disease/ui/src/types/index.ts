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

/** A single feature's contribution to the predicted risk score. */
export interface TopFactor {
  feature: string;
  label: string;
  value: number;
  population_mean: number;
  unit: string;
  /** Probability delta (−1 to +1). Positive = increases risk. */
  contribution: number;
  direction: 'increases_risk' | 'decreases_risk';
}

export interface PredictionResult {
  id?: string;       // server-assigned ID (present when authenticated)
  probability: number;
  prediction: number;
  risk_level: string;
  /** Top contributing features (returned by ensemble model). */
  top_factors?: TopFactor[];
}

export interface PredictionRecord {
  id: string;
  timestamp: number;
  patientData: PatientData;
  result: PredictionResult;
}

/** Shape of a prediction record returned by the server (GET /api/predictions). */
export interface ServerPredictionRecord {
  id: string;
  risk_score: number;
  risk_level: string;
  prediction: number;
  features: PatientData;
  created_at: string;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// ── Model info ────────────────────────────────────────────────────────────────

export interface ModelMetrics {
  val_auc: number;
  val_accuracy: number;
  val_sensitivity: number;
  val_specificity: number;
  val_precision: number;
  val_f1: number;
  cv_auc_mean: number;
  cv_auc_std: number;
}

export interface FeatureImportanceItem {
  feature: string;
  label: string;
  importance: number;
}

export interface ModelInfo {
  model_type: string;
  metrics: ModelMetrics;
  feature_importances: FeatureImportanceItem[];
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
