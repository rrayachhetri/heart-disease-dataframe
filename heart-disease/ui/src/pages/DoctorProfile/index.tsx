import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { getTextContent } from '../../content/text';
import { Stethoscope, Save, CheckCircle, AlertCircle, Clock3, Trash2 } from 'lucide-react';
import { getErrorMessage } from '../../sideeffects/api/apiSlice';
import DateTimePicker from '../../components/DateTimePicker';
import {
  useGetMyDoctorProfileQuery,
  useUpdateMyDoctorProfileMutation,
  useGetMySlotsQuery,
  useCreateSlotMutation,
  useDeleteSlotMutation,
} from '../../sideeffects/api/doctorEndpoints';
import styles from './DoctorProfilePage.module.less';

const t = getTextContent('doctorProfile');

export default function DoctorProfilePage() {
  const { user } = useAppSelector((s) => s.auth);
  const isDoctor = Boolean(user && user.role === 'doctor');

  const { data: profile } = useGetMyDoctorProfileQuery(undefined, { skip: !isDoctor });
  const { data: slots = [] } = useGetMySlotsQuery(undefined, { skip: !isDoctor });
  const [updateProfile, { isLoading: saving }] = useUpdateMyDoctorProfileMutation();
  const [createSlotTrigger] = useCreateSlotMutation();
  const [deleteSlotTrigger] = useDeleteSlotMutation();

  const [saved, setSaved] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [slotStart, setSlotStart] = useState('');
  const [slotEnd, setSlotEnd] = useState('');
  const [slotError, setSlotError] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    npi_number: '',
    specialty: '',
    bio: '',
    phone: '',
    consultation_fee: 75,
    is_accepting_patients: true,
    accepted_insurance: '',
  });

  const formInitialized = useRef(false);
  useEffect(() => {
    if (!profile || formInitialized.current) return;
    formInitialized.current = true;
    setForm({
      npi_number: profile.npi_number ?? '',
      specialty: profile.specialty ?? '',
      bio: profile.bio ?? '',
      phone: profile.phone ?? '',
      consultation_fee: profile.consultation_fee,
      is_accepting_patients: profile.is_accepting_patients,
      accepted_insurance: profile.accepted_insurance.join(', '),
    });
  }, [profile]);

  const createSlot = async (event: React.FormEvent) => {
    event.preventDefault();
    setSlotError(null);
    if (!slotStart || !slotEnd) {
      setSlotError('Please choose both a start and end time.');
      setPublishStatus('error');
      setTimeout(() => setPublishStatus('idle'), 2500);
      return;
    }
    try {
      await createSlotTrigger({
        starts_at: new Date(slotStart).toISOString(),
        ends_at: new Date(slotEnd).toISOString(),
      }).unwrap();
      setSlotStart('');
      setSlotEnd('');
      setPublishStatus('success');
      setTimeout(() => setPublishStatus('idle'), 2500);
    } catch (err) {
      setSlotError(getErrorMessage(err, 'Unable to publish that appointment time.'));
      setPublishStatus('error');
      setTimeout(() => setPublishStatus('idle'), 2500);
    }
  };

  const removeSlot = async (slotId: string) => {
    setSlotError(null);
    try {
      await deleteSlotTrigger(slotId).unwrap();
    } catch (err) {
      setSlotError(getErrorMessage(err, 'Booked slots cannot be removed.'));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    try {
      await updateProfile({
        ...form,
        accepted_insurance: form.accepted_insurance.split(',').map((s) => s.trim()).filter(Boolean),
      }).unwrap();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Save failed. Please try again.'));
      setSaveFailed(true);
      setTimeout(() => setSaveFailed(false), 3000);
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
          <button type="submit" className={`${styles.saveBtn} ${saveFailed ? styles.saveBtnError : ''}`} disabled={saving}>
            {saveFailed ? <AlertCircle size={16} /> : <Save size={16} />}
            {saving ? t.savingLabel : saved ? t.savedLabel : saveFailed ? 'Failed' : t.saveLabel}
          </button>
        </div>
      </form>

      <section className={styles.slotsPanel} aria-labelledby="availability-title">
        <div className={styles.slotsHeading}>
          <Clock3 size={20} />
          <div>
            <h3 id="availability-title">Local appointment availability</h3>
            <p>Published times appear to in-network patients in doctor search.</p>
          </div>
        </div>
        <form className={styles.slotForm} onSubmit={createSlot}>
          <label>
            Start
            <DateTimePicker value={slotStart} onChange={setSlotStart} required />
          </label>
          <label>
            End
            <DateTimePicker value={slotEnd} onChange={setSlotEnd} required />
          </label>
          <button type="submit" className={`${styles.addSlotBtn} ${publishStatus === 'error' ? styles.addSlotBtnError : ''}`}>
            {publishStatus === 'success' ? '✓ Published' : publishStatus === 'error' ? 'Failed' : 'Publish time'}
          </button>
        </form>
        {slotError && <p className={styles.slotError} role="alert">{slotError}</p>}
        {slots.length === 0 ? (
          <p className={styles.noSlots}>No local appointment times published.</p>
        ) : (
          <ul className={styles.slotList}>
            {slots.map((slot) => (
              <li key={slot.id}>
                <span>{new Date(slot.starts_at).toLocaleString()} - {new Date(slot.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <button type="button" onClick={() => removeSlot(slot.id)} aria-label="Remove appointment time"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
