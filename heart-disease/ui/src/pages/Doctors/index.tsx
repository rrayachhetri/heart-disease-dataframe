import { useState } from 'react';
import { AlertCircle, BadgeCheck, MapPin, Search, ShieldCheck, Stethoscope } from 'lucide-react';
import { fetchDoctorRecommendations, type DoctorRecommendation } from '../../api/doctorApi';
import styles from './DoctorsPage.module.less';

export default function DoctorsPage() {
  const [insurance, setInsurance] = useState('');
  const [specialty, setSpecialty] = useState('Cardiology');
  const [doctors, setDoctors] = useState<DoctorRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!insurance.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setDoctors(await fetchDoctorRecommendations(insurance.trim(), specialty.trim() || undefined));
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to find doctors right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.icon}><Stethoscope size={24} /></div>
          <div>
            <h2>Find a doctor</h2>
            <p>Explore accepting providers whose declared network matches your insurance.</p>
          </div>
        </div>
      </header>

      <form className={styles.searchPanel} onSubmit={search}>
        <div className={styles.field}>
          <label htmlFor="insurance">Insurance plan</label>
          <input id="insurance" value={insurance} onChange={(event) => setInsurance(event.target.value)} placeholder="e.g. Blue Cross" required />
        </div>
        <div className={styles.field}>
          <label htmlFor="specialty">Specialty <span>(optional)</span></label>
          <input id="specialty" value={specialty} onChange={(event) => setSpecialty(event.target.value)} placeholder="e.g. Cardiology" />
        </div>
        <button type="submit" disabled={loading} className={styles.searchButton}>
          <Search size={17} /> {loading ? 'Searching...' : 'Find providers'}
        </button>
      </form>

      <p className={styles.disclaimer}>
        <ShieldCheck size={15} /> Network matches use plans declared by each provider. Confirm benefits with your insurer before booking.
      </p>

      {error && <div className={styles.error} role="alert"><AlertCircle size={17} /> {error}</div>}
      {searched && !loading && doctors.length === 0 && !error && (
        <div className={styles.empty} role="status">No accepting providers matched that insurance and specialty.</div>
      )}

      <div className={styles.grid}>
        {doctors.map((doctor) => (
          <article className={styles.card} key={doctor.id}>
            <div className={styles.cardHeader}>
              <div className={styles.avatar}>{doctor.first_name[0]}{doctor.last_name[0]}</div>
              <div>
                <h3>Dr. {doctor.first_name} {doctor.last_name}</h3>
                <p>{doctor.specialty || 'Primary care'}</p>
              </div>
              {doctor.is_npi_verified && <BadgeCheck className={styles.verified} size={19} aria-label="NPI verified" />}
            </div>
            <div className={styles.meta}><MapPin size={15} /> Available for new patients</div>
            <p className={styles.bio}>{doctor.bio || 'Provider profile available for consultation.'}</p>
            <div className={styles.cardFooter}>
              <span>${doctor.consultation_fee.toFixed(0)} consultation</span>
              <strong>In network: {doctor.insurance_match.matched_plan}</strong>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
