import { useTrip } from '../data/trip-context.ts'
import { useI18n } from '../i18n/i18n.ts'
import { formatPrice } from '../model/format.ts'
import styles from './Price.module.css'

/** A trip price, `1.700 ¥ ≈ 10 €`: in the trip currency, then the muted conversion. Inside TripLayout only. */
export default function Price({ amount }: { amount: number }) {
  const { trip } = useTrip()
  const { lang } = useI18n()
  const price = formatPrice(amount, trip.trip, lang)
  return (
    <span className={styles.price}>
      {price.main}
      {price.converted && <span className={styles.converted}> {price.converted}</span>}
    </span>
  )
}
