import { PhoneCall, AlertOctagon } from 'lucide-react';
import { getTextContent } from '../../content/text';
import styles from './EmergencyCard.module.less';

const t = getTextContent('emergency');

export default function EmergencyCard() {
  return (
    <section className={styles.card} aria-labelledby="emergency-heading">
      <div className={styles.icon} aria-hidden="true">
        <AlertOctagon size={26} />
      </div>
      <div className={styles.text}>
        <h2 id="emergency-heading" className={styles.heading}>{t.heading}</h2>
        <p className={styles.body}>{t.body}</p>
      </div>
      <a href="tel:911" className={styles.callBtn} aria-label={t.callBtnAria}>
        <PhoneCall size={18} aria-hidden="true" />
        {t.callBtn}
      </a>
    </section>
  );
}
