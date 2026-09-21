import { useState } from 'react';
import { AlertCircle, BadgeCheck, CalendarClock, MapPin, Phone, Search, ShieldCheck, Stethoscope, X } from 'lucide-react';
import { getErrorMessage } from '../../sideeffects/api/apiSlice';
import DateTimePicker from '../../components/DateTimePicker';
import {
  useLazyGetDoctorRecommendationsQuery,
  useLazySearchLocalDoctorsQuery,
  useLazyGetAvailableSlotsQuery,
  useBookAppointmentMutation,
  useRequestAppointmentMutation,
  type DoctorRecommendation,
  type LocalProvider,
} from '../../sideeffects/api/doctorEndpoints';
import { useAppSelector } from '../../store/hooks';
import styles from './DoctorsPage.module.less';

/** A single, normalized result row combining in-app registered doctors and real NPI-sourced providers. */
type SearchResult =
  | { source: 'registered'; id: string; name: string; specialty: string | null; bio: string | null; fee: number; matchedPlan: string; isNpiVerified: boolean }
  | { source: 'external'; id: string; name: string; specialty: string | null; phone: string | null; address: string | null; registeredDoctorId: string | null; provider: LocalProvider };

export default function DoctorsPage() {
  const [insurance, setInsurance] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [insuranceRequiredError, setInsuranceRequiredError] = useState(false);
  const user = useAppSelector((state) => state.auth.user);

  const [triggerSearch, { data: doctors = [], isFetching: registeredLoading, isError: registeredIsError, error: registeredError, isUninitialized: registeredUninitialized }] = useLazyGetDoctorRecommendationsQuery();
  const [triggerLocalSearch, { data: localProviders = [], isFetching: localLoading, isError: localIsError, error: localSearchError, isUninitialized: localUninitialized }] = useLazySearchLocalDoctorsQuery();

  const loading = registeredLoading || localLoading;
  const searched = !registeredUninitialized || !localUninitialized;
  const error = registeredIsError
    ? getErrorMessage(registeredError, 'Unable to find doctors right now.')
    : localIsError
      ? getErrorMessage(localSearchError, 'Unable to find local doctors right now.')
      : null;

  // De-dupe: if a real provider is already registered in-app and matched by the declared-network
  // search, don't show it twice — the registered card already carries the verified insurance match.
  const registeredIds = new Set(doctors.map((d) => d.id));
  const results: SearchResult[] = [
    ...doctors.map((doctor): SearchResult => ({
      source: 'registered',
      id: doctor.id,
      name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
      specialty: doctor.specialty,
      bio: doctor.bio,
      fee: doctor.consultation_fee,
      matchedPlan: doctor.insurance_match.matched_plan ?? insurance,
      isNpiVerified: doctor.is_npi_verified,
    })),
    ...localProviders
      .filter((provider) => !provider.registered_doctor_id || !registeredIds.has(provider.registered_doctor_id))
      .map((provider): SearchResult => ({
        source: 'external',
        id: provider.npi,
        name: [provider.first_name, provider.last_name].filter(Boolean).join(' ') || provider.organization_name || 'Local provider',
        specialty: provider.specialty,
        phone: provider.phone,
        address: [provider.address_line, provider.city, provider.state].filter(Boolean).join(', ') || null,
        registeredDoctorId: provider.registered_doctor_id,
        provider,
      })),
  ];

  const [bookingTarget, setBookingTarget] = useState<{ doctorId: string; label: string; verified: boolean; matchedPlan?: string } | null>(null);
  const [triggerSlots, { data: slots = [], isFetching: slotsLoading }] = useLazyGetAvailableSlotsQuery();
  const [bookAppointmentTrigger] = useBookAppointmentMutation();
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);
  const [bookingSlotStatus, setBookingSlotStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [requestProvider, setRequestProvider] = useState<LocalProvider | null>(null);
  const [requestInsurance, setRequestInsurance] = useState('');
  const [requestPreferredTime, setRequestPreferredTime] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [requestAppointmentTrigger, { isLoading: requestSubmitting }] = useRequestAppointmentMutation();
  const [requestConfirmation, setRequestConfirmation] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [requestInsuranceRequiredError, setRequestInsuranceRequiredError] = useState(false);

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    if (!insurance.trim()) {
      setInsuranceRequiredError(true);
      return;
    }
    setInsuranceRequiredError(false);
    const trimmedSpecialty = specialty.trim() || undefined;
    triggerSearch({ insurance: insurance.trim(), specialty: trimmedSpecialty });
    if (postalCode.trim()) {
      triggerLocalSearch({ postalCode: postalCode.trim(), specialty: trimmedSpecialty });
    }
  };

  const openBooking = (result: SearchResult) => {
    const doctorId = result.source === 'registered' ? result.id : result.registeredDoctorId;
    if (!doctorId) return;
    setBookingTarget(
      result.source === 'registered'
        ? { doctorId, label: result.name, verified: true, matchedPlan: result.matchedPlan }
        : { doctorId, label: result.name, verified: false }
    );
    setBookingMessage(null);
    setBookingError(null);
    setBookingSlotId(null);
    setBookingSlotStatus('idle');
    triggerSlots(doctorId);
  };

  const confirmBooking = async (slot: { id: string; starts_at: string }) => {
    if (!bookingTarget) return;
    setBookingError(null);
    setBookingSlotId(slot.id);
    try {
      await bookAppointmentTrigger({ doctorId: bookingTarget.doctorId, slotId: slot.id, insurance }).unwrap();
      const label = new Date(slot.starts_at).toLocaleString();
      setBookingMessage(`Appointment confirmed for ${label}.`);
      setBookingSlotStatus('success');
    } catch (err) {
      setBookingError(getErrorMessage(err, "Unable to book this appointment. Confirm your insurance is in this doctor's network."));
      setBookingSlotStatus('error');
      setTimeout(() => setBookingSlotStatus('idle'), 2500);
    }
  };

  const openRequest = (provider: LocalProvider) => {
    setRequestProvider(provider);
    setRequestInsurance(insurance);
    setRequestPreferredTime('');
    setRequestNotes('');
    setRequestConfirmation(null);
    setRequestError(null);
    setRequestInsuranceRequiredError(false);
  };

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestProvider) return;
    if (!requestInsurance.trim()) {
      setRequestInsuranceRequiredError(true);
      return;
    }
    setRequestInsuranceRequiredError(false);
    setRequestError(null);
    try {
      await requestAppointmentTrigger({
        provider_npi: requestProvider.npi,
        provider_name: [requestProvider.first_name, requestProvider.last_name].filter(Boolean).join(' ') || requestProvider.organization_name || 'Local provider',
        provider_phone: requestProvider.phone,
        specialty: requestProvider.specialty,
        insurance: requestInsurance.trim(),
        preferred_time: requestPreferredTime ? new Date(requestPreferredTime).toISOString() : null,
        notes: requestNotes.trim() || null,
      }).unwrap();
      setRequestStatus('success');
      setRequestConfirmation(
        requestProvider.phone
          ? `Request saved. Call ${requestProvider.phone} to confirm your appointment and insurance coverage.`
          : 'Request saved. Contact the office directly to confirm your appointment and insurance coverage.'
      );
    } catch (err) {
      setRequestError(getErrorMessage(err, 'Unable to save this appointment request.'));
      setRequestStatus('error');
      setTimeout(() => setRequestStatus('idle'), 2500);
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

      {insuranceRequiredError && (
        <div className={styles.validationSummary} role="alert" aria-live="polite">
          <div className={styles.validationIcon}>
            <AlertCircle size={19} aria-hidden="true" />
          </div>
          <div>
            <strong>A few details need attention</strong>
            <p>Enter an insurance plan to search for doctors.</p>
          </div>
        </div>
      )}

      <form className={styles.searchPanel} onSubmit={search} noValidate>
        <div className={styles.field}>
          <label htmlFor="insurance">Insurance plan</label>
          <input
            id="insurance"
            value={insurance}
            onChange={(event) => {
              setInsurance(event.target.value);
              if (insuranceRequiredError) setInsuranceRequiredError(false);
            }}
            placeholder="e.g. Blue Cross"
            aria-invalid={insuranceRequiredError}
            className={insuranceRequiredError ? styles.fieldInputError : undefined}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="specialty">Specialty <span>(optional)</span></label>
          <input id="specialty" value={specialty} onChange={(event) => setSpecialty(event.target.value)} placeholder="e.g. Cardiology" />
        </div>
        <div className={styles.field}>
          <label htmlFor="postalCode">ZIP / postal code <span>(optional)</span></label>
          <input id="postalCode" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} placeholder="e.g. 94105" />
        </div>
        <button type="submit" disabled={loading} className={styles.searchButton}>
          <Search size={17} /> {loading ? 'Searching...' : 'Find doctors'}
        </button>
      </form>

      <p className={styles.disclaimer}>
        <ShieldCheck size={15} /> Registered providers show a verified insurance-network match. Providers found by ZIP code are self-reported — confirm coverage with the office before booking. Add a ZIP code to also include real local providers in your results.
      </p>

      {error && <div className={styles.error} role="alert"><AlertCircle size={17} /> {error}</div>}
      {searched && !loading && results.length === 0 && !error && (
        <div className={styles.empty} role="status">No providers matched that insurance, specialty, or ZIP code.</div>
      )}

      <div className={styles.grid}>
        {results.map((result) => (
          <article className={styles.card} key={`${result.source}-${result.id}`}>
            <div className={styles.cardHeader}>
              <div className={styles.avatar}>{result.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <h3>{result.name}</h3>
                <p>{result.specialty || 'Specialty not listed'}</p>
              </div>
              {result.source === 'registered' && result.isNpiVerified && (
                <BadgeCheck className={styles.verified} size={19} aria-label="NPI verified" />
              )}
            </div>

            {result.source === 'registered' ? (
              <>
                <div className={styles.meta}><MapPin size={15} /> Available for new patients</div>
                <p className={styles.bio}>{result.bio || 'Provider profile available for consultation.'}</p>
                <div className={styles.cardFooter}>
                  <span>${result.fee.toFixed(0)} consultation</span>
                  <strong>Verified in network: {result.matchedPlan}</strong>
                </div>
              </>
            ) : (
              <>
                <div className={styles.meta}><MapPin size={15} /> {result.address || 'Address not listed'}</div>
                {result.phone && <div className={styles.meta}><Phone size={15} /> {result.phone}</div>}
                <div className={styles.cardFooter}>
                  <span>{result.registeredDoctorId ? 'Bookable in-app' : 'Self-reported insurance'}</span>
                  {result.registeredDoctorId && <BadgeCheck size={15} className={styles.verified} aria-label="Bookable in-app" />}
                </div>
              </>
            )}

            {user?.role === 'patient' && (
              result.source === 'registered' || result.registeredDoctorId ? (
                <button type="button" className={styles.bookingButton} onClick={() => openBooking(result)}>
                  <CalendarClock size={16} /> View appointments
                </button>
              ) : (
                <button type="button" className={styles.bookingButton} onClick={() => openRequest(result.provider)}>
                  <CalendarClock size={16} /> Request appointment
                </button>
              )
            )}
          </article>
        ))}
      </div>

      {bookingTarget && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setBookingTarget(null)}>
          <section className={styles.bookingModal} role="dialog" aria-modal="true" aria-labelledby="booking-title" onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 id="booking-title">Book {bookingTarget.label}</h3>
                <p>{bookingTarget.verified ? `In network with ${bookingTarget.matchedPlan}` : 'Confirm your insurance at booking.'}</p>
              </div>
              <button type="button" className={styles.closeButton} aria-label="Close booking" onClick={() => setBookingTarget(null)}><X size={18} /></button>
            </div>
            {slotsLoading && <p className={styles.slotStatus}>Loading appointment times...</p>}
            {bookingMessage && <p className={styles.bookingSuccess}>{bookingMessage}</p>}
            {bookingError && <p className={styles.bookingError} role="alert">{bookingError}</p>}
            {!slotsLoading && !bookingMessage && !bookingError && slots.length === 0 && <p className={styles.slotStatus}>No appointment times are open yet.</p>}
            {!bookingMessage && (
              <div className={styles.slotList}>
                {slots.map((slot) => {
                  const isThisSlot = bookingSlotId === slot.id;
                  const label = isThisSlot && bookingSlotStatus === 'success'
                    ? '✓ Booked'
                    : isThisSlot && bookingSlotStatus === 'error'
                      ? 'Failed'
                      : new Date(slot.starts_at).toLocaleString();
                  return (
                    <button
                      type="button"
                      key={slot.id}
                      className={`${styles.slotButton} ${isThisSlot && bookingSlotStatus === 'error' ? styles.slotButtonError : ''}`}
                      disabled={bookingSlotStatus === 'success'}
                      onClick={() => confirmBooking(slot)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {requestProvider && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setRequestProvider(null)}>
          <section className={styles.bookingModal} role="dialog" aria-modal="true" aria-labelledby="request-title" onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 id="request-title">Request an appointment</h3>
                <p>{[requestProvider.first_name, requestProvider.last_name].filter(Boolean).join(' ') || requestProvider.organization_name}</p>
              </div>
              <button type="button" className={styles.closeButton} aria-label="Close request" onClick={() => setRequestProvider(null)}><X size={18} /></button>
            </div>
            {requestConfirmation ? (
              <p className={styles.bookingSuccess}>{requestConfirmation}</p>
            ) : (
              <form onSubmit={submitRequest} className={styles.requestForm} noValidate>
                {requestInsuranceRequiredError && (
                  <div className={styles.validationSummary} role="alert" aria-live="polite">
                    <div className={styles.validationIcon}>
                      <AlertCircle size={19} aria-hidden="true" />
                    </div>
                    <div>
                      <strong>A few details need attention</strong>
                      <p>Enter your insurance plan to save this request.</p>
                    </div>
                  </div>
                )}
                <label>
                  Your insurance
                  <input
                    value={requestInsurance}
                    onChange={(event) => {
                      setRequestInsurance(event.target.value);
                      if (requestInsuranceRequiredError) setRequestInsuranceRequiredError(false);
                    }}
                    placeholder="e.g. Blue Cross"
                    aria-invalid={requestInsuranceRequiredError}
                    className={requestInsuranceRequiredError ? styles.fieldInputError : undefined}
                  />
                </label>
                <label>
                  Preferred date/time <span>(optional)</span>
                  <DateTimePicker value={requestPreferredTime} onChange={setRequestPreferredTime} />
                </label>
                <label>
                  Notes <span>(optional)</span>
                  <textarea rows={3} value={requestNotes} onChange={(event) => setRequestNotes(event.target.value)} placeholder="Reason for visit, availability, etc." />
                </label>
                {requestError && <p className={styles.bookingError} role="alert">{requestError}</p>}
                <button
                  type="submit"
                  className={`${styles.addSlotBtn} ${requestStatus === 'error' ? styles.addSlotBtnError : ''}`}
                  disabled={requestSubmitting}
                >
                  {requestSubmitting
                    ? 'Saving...'
                    : requestStatus === 'success'
                      ? '✓ Saved'
                      : requestStatus === 'error'
                        ? 'Failed'
                        : 'Save appointment request'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
