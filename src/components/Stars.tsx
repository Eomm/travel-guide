import { useI18n } from '../i18n/i18n.ts'
import styles from './Stars.module.css'

/** Rating 0–5 as ★ icons, with a text label for screen readers. */
export default function Stars({ count }: { count: number }) {
  const { t } = useI18n()
  const stars = Math.max(0, Math.min(5, Math.round(count)))
  return (
    <span className={styles.stars} role="img" aria-label={t(stars === 1 ? 'places.stars.one' : 'places.stars.other', { count: stars })}>
      {'★'.repeat(stars)}
      <span className={styles.empty}>{'★'.repeat(5 - stars)}</span>
    </span>
  )
}
