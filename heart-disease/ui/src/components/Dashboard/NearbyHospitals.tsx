import { useState } from 'react';
import { MapPin, Navigation, Loader2, ExternalLink } from 'lucide-react';
import { getTextContent } from '../../content/text';
import styles from './NearbyHospitals.module.less';

const t = getTextContent('nearbyHospitals');

interface Hospital {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
}

const SEARCH_RADIUS_METERS = 8000;
const MAX_RESULTS = 5;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Status = 'idle' | 'locating' | 'searching' | 'done' | 'denied' | 'location_error' | 'search_error';

export default function NearbyHospitals() {
  const [status, setStatus] = useState<Status>('idle');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  const handleFind = () => {
    if (!('geolocation' in navigator)) {
      setStatus('location_error');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        setStatus('searching');
        try {
          const query = `[out:json][timeout:25];(node["amenity"="hospital"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});way["amenity"="hospital"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude}););out center ${MAX_RESULTS * 3};`;
          const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
          });
          if (!res.ok) throw new Error('overpass error');
          const data = await res.json();
          const results: Hospital[] = (data.elements ?? [])
            .map((el: any) => {
              const lat = el.lat ?? el.center?.lat;
              const lon = el.lon ?? el.center?.lon;
              if (lat == null || lon == null) return null;
              return {
                id: el.id,
                name: el.tags?.name || 'Unnamed hospital',
                lat,
                lon,
                distanceKm: haversineKm(latitude, longitude, lat, lon),
              };
            })
            .filter((h: Hospital | null): h is Hospital => h !== null)
            .sort((a: Hospital, b: Hospital) => a.distanceKm - b.distanceKm)
            .slice(0, MAX_RESULTS);

          setHospitals(results);
          setStatus('done');
        } catch {
          setStatus('search_error');
        }
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'location_error');
      },
    );
  };

  return (
    <section className={styles.card} aria-labelledby="nearby-hospitals-heading">
      <div className={styles.header}>
        <div className={styles.iconBox} aria-hidden="true">
          <MapPin size={20} />
        </div>
        <div>
          <h3 id="nearby-hospitals-heading" className={styles.heading}>{t.heading}</h3>
          <p className={styles.subheading}>{t.subheading}</p>
        </div>
      </div>

      {status === 'idle' && (
        <button type="button" className={styles.findBtn} onClick={handleFind}>
          <Navigation size={16} aria-hidden="true" />
          {t.findBtn}
        </button>
      )}

      {(status === 'locating' || status === 'searching') && (
        <p className={styles.status} role="status">
          <Loader2 size={16} className={styles.spinner} aria-hidden="true" />
          {status === 'locating' ? t.finding : t.searching}
        </p>
      )}

      {(status === 'denied' || status === 'location_error' || status === 'search_error') && (
        <div role="alert">
          <p className={styles.status}>
            {status === 'denied' ? t.permissionDenied : status === 'location_error' ? t.locationError : t.searchError}
          </p>
          <a
            className={styles.manualLink}
            href="https://www.google.com/maps/search/hospitals+near+me"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.manualSearchLink} <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      )}

      {status === 'done' && hospitals.length === 0 && (
        <div>
          <p className={styles.status}>{t.noResults}</p>
          <a
            className={styles.manualLink}
            href="https://www.google.com/maps/search/hospitals+near+me"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.manualSearchLink} <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      )}

      {status === 'done' && hospitals.length > 0 && (
        <ul className={styles.list}>
          {hospitals.map((h) => (
            <li key={h.id} className={styles.listItem}>
              <div>
                <p className={styles.hospitalName}>{h.name}</p>
                <p className={styles.hospitalDistance}>{t.distanceAway(h.distanceKm)}</p>
              </div>
              <a
                className={styles.directionsBtn}
                href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.directionsLabel(h.name)}
              >
                {t.directionsBtn}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
