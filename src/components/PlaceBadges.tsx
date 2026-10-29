import { useI18n } from '../i18n/i18n.ts'
import type { Place } from '../model/trip.gen.ts'
import styles from './PlaceBadges.module.css'

/** Closed / veg / gluten-free badges of a place; nothing when none applies. */
export default function PlaceBadges({ place, glutenFree = false }: { place: Place; glutenFree?: boolean }) {
  const { t } = useI18n()
  const closed = place.status === 'closedTemporarily' || place.status === 'closedPermanently'
  if (!closed && !place.veg && !(glutenFree && place.glutenFree)) return null
  return (
    <span className={styles.badges}>
      {place.status === 'closedTemporarily' && <span className={`${styles.badge} ${styles.closed}`}>{t('places.closedTemporarily')}</span>}
      {place.status === 'closedPermanently' && <span className={`${styles.badge} ${styles.closed}`}>{t('places.closedPermanently')}</span>}
      {place.veg && <span className={`${styles.badge} ${styles.veg}`}>{t('places.veg')}</span>}
      {glutenFree && place.glutenFree && <span className={`${styles.badge} ${styles.veg}`}>{t('places.glutenFree')}</span>}
    </span>
  )
}
