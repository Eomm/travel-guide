import { useI18n } from '../i18n/i18n.ts'
import type { Place } from '../model/trip.gen.ts'
import styles from './PlaceBadges.module.css'

/** Closed badge of a place; nothing when it is open. */
export default function PlaceBadges({ place }: { place: Place }) {
  const { t } = useI18n()
  if (place.status !== 'closedTemporarily' && place.status !== 'closedPermanently') return null
  return (
    <span className={styles.badges}>
      <span className={`${styles.badge} ${styles.closed}`}>{t(`places.${place.status}`)}</span>
    </span>
  )
}
