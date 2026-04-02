import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Stethoscope, Save, CheckCircle } from 'lucide-react';
import type { RootState, AppDispatch } from '../store';
import { authHeaders, API_BASE_URL } from '../api/config';
import type { DoctorProfile } from '../types';
import styles from './DoctorProfilePage.module.less';

export default function DoctorProfilePage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    npi_number: '',
    specialty: '',
    bio: '',
    phone: '',
    consultation_fee: 75,
    is_accepting_patients: true,
    accepted_insurance: '',
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/doctors/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data: DoctorProfile) => {
        setProfile(data);
        setForm({
          npi_number: data.npi_number ?? '',
          specialty: data.specialty ?? '',
          bio: data.bio ?? '',
          phone: data.phone ?? '',
          consultation_fee: data.consultation_fee,
          is_accepting_patients: data.is_accepting_patients,
          accepted_insurance: data.accepted_insurance.join(', '),
        });
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`${API_BASE_URL}/doctors/me`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        ...form,
        accepted_insurance: form.accepted_insurance.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!user || user.role !== 'doctor') {
    return <div className={styles.notice}>This page is only available to doctors.</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Stethoscope size={24} />
        <div>
          <h2 className={styles.title}>Doctor Profile</h2>
          <p className={styles.subtitle}>
            Complete your profile so patients can find and connect with you.
          </p>
        </div>
        {profile?.is_npi_verified && (
          <span className={styles.verifiedBadge}>
            <CheckCircle size={14} /> NPI Verified
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className={styles.form}>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>NPI Number</label>
            <input value={form.npi_number} onChange={(e) => setForm((f) => ({ ...f, npi_number: e.target.value }))} placeholder="10-digit NPI" />
            <span className={styles.hint}>Phase 1: entering NPI auto-verifies. Phase 2 will use real NPI registry.</span>
          </div>
          <div className={styles.field}>
            <label>Specialty</label>
            <input value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} placeholder="e.g. Cardiology" />
          </div>
          <div className={styles.field}>
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 555 000 0000" />
          </div>
          <div className={styles.field}>
            <label>Consultation Fee (USD)</label>
            <input type="number" min={0} value={form.consultation_fee} onChange={(e) => setForm((f) => ({ ...f, consultation_fee: Number(e.target.value) }))} />
          </div>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label>Accepted Insurance Plans (comma-separated)</label>
            <input value={form.accepted_insurance} onChange={(e) => setForm((f) => ({ ...f, accepted_insurance: e.target.value }))} placeholder="BlueCross, Aetna, UnitedHealth" />
          </div>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label>Bio</label>
            <textarea rows={4} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Brief professional background…" />
          </div>
        </div>

        <div className={styles.actions}>
          <label className={styles.toggle}>
            <input type="checkbox" checked={form.is_accepting_patients} onChange={(e) => setForm((f) => ({ ...f, is_accepting_patients: e.target.checked }))} />
            Accepting new patients
          </label>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
