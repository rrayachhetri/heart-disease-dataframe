import { useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { getTextContent } from '../../content/text';
import { Stethoscope, Save, CheckCircle } from 'lucide-react';
import type { DoctorProfile } from '../../types';
import { authHeaders, API_BASE_URL } from '../../api/config';
import styles from './DoctorProfilePage.module.less';

const t = getTextContent('doctorProfile');

export default function DoctorProfilePage() {
  const { user } = useAppSelector((s) => s.auth);
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
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load profile: ${r.status}`);
        return r.json();
      })
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

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const response = await fetch(`${API_BASE_URL}/doctors/me`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        ...form,
        accepted_insurance: form.accepted_insurance.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    if (response.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setSaveError(`Save failed (${response.status}). Please try again.`);
    }
  };

  if (!user || user.role !== 'doctor') {
    return <div className={styles.notice}>{t.doctorOnly}</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Stethoscope size={24} />
        <div>
          <h2 className={styles.title}>{t.pageTitle}</h2>
          <p className={styles.subtitle}>{t.pageSubtitle}</p>
        </div>
        {profile?.is_npi_verified && (
          <span className={styles.verifiedBadge}>
            <CheckCircle size={14} /> {t.verifiedBadge}
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className={styles.form}>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>{t.npiLabel}</label>
            <input value={form.npi_number} onChange={(e) => setForm((f) => ({ ...f, npi_number: e.target.value }))} placeholder={t.npiPlaceholder} />
            <span className={styles.hint}>{t.npiHint}</span>
          </div>
          <div className={styles.field}>
            <label>{t.specialtyLabel}</label>
            <input value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} placeholder={t.specialtyPlaceholder} />
          </div>
          <div className={styles.field}>
            <label>{t.phoneLabel}</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder={t.phonePlaceholder} />
          </div>
          <div className={styles.field}>
            <label>{t.feeLabel}</label>
            <input type="number" min={0} value={form.consultation_fee} onChange={(e) => setForm((f) => ({ ...f, consultation_fee: Number(e.target.value) }))} />
          </div>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label>{t.insuranceLabel}</label>
            <input value={form.accepted_insurance} onChange={(e) => setForm((f) => ({ ...f, accepted_insurance: e.target.value }))} placeholder={t.insurancePlaceholder} />
          </div>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label>{t.bioLabel}</label>
            <textarea rows={4} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder={t.bioPlaceholder} />
          </div>
        </div>

        <div className={styles.actions}>
          <label className={styles.toggle}>
            <input type="checkbox" checked={form.is_accepting_patients} onChange={(e) => setForm((f) => ({ ...f, is_accepting_patients: e.target.checked }))} />
            {t.acceptingPatients}
          </label>
          {saveError && <span className={styles.saveError}>{saveError}</span>}
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            <Save size={16} />
            {saving ? t.savingLabel : saved ? t.savedLabel : t.saveLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
