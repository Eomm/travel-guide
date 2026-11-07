import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import { ChevronIcon, GripIcon, HeartIcon } from '../../../components/icons.tsx'
import { useI18n } from '../../../i18n/i18n.ts'
import type { Place } from '../../../model/trip.gen.ts'
import { usePlanner } from '../../../planner/planner.ts'
import styles from './Days.module.css'
import { placeDragId, wishlistDropId } from './dnd.ts'

function WishlistPlace({ place }: { place: Place }) {
  const { t } = useI18n()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: placeDragId(place.id) })
  return (
    <li ref={setNodeRef} className={isDragging ? `${styles.wish} ${styles.dragging}` : styles.wish}>
      <button type="button" ref={setActivatorNodeRef} className={styles.handle} {...attributes} {...listeners}
        aria-label={t('planner.dnd.dragPlace', { name: place.name })} title={t('planner.dnd.dragPlace', { name: place.name })}>
        <GripIcon />
      </button>
      <span className={styles.stopName}>{place.name}</span>
    </li>
  )
}

/**
 * The places not in any day: drag one into a day to add it as a stop, or drop a stop here to take it out
 * of its day (the place stays in the catalog).
 */
export default function Wishlist() {
  const { t } = useI18n()
  const { trip } = usePlanner()
  const [open, setOpen] = useState(false)
  const { setNodeRef, isOver, active } = useDroppable({ id: wishlistDropId })
  const used = new Set(trip.days.flatMap((day) => day.stops.map((stop) => stop.placeId)))
  const places = trip.places.filter((place) => !used.has(place.id)).sort((a, b) => a.name.localeCompare(b.name))
  // while a stop is dragged the wishlist is a drop target, even when closed
  const draggingStop = String(active?.id ?? '').startsWith('stop:')

  return (
    <section ref={setNodeRef} className={[styles.wishlist, isOver && styles.over, draggingStop && styles.target].filter(Boolean).join(' ')}
      aria-labelledby="wishlist-title">
      <button type="button" className={styles.wishHead} aria-expanded={open} onClick={() => setOpen(!open)}>
        <HeartIcon />
        <span id="wishlist-title" className={styles.stopName}>
          {t('planner.wishlist')} ({places.length})
        </span>
        <ChevronIcon open={open} />
      </button>
      {(open || draggingStop) && <p className={styles.wishHint}>{t('planner.wishlistHint')}</p>}
      {open && (places.length > 0 ? (
        <ul className={styles.wishes}>
          {places.map((place) => <WishlistPlace key={place.id} place={place} />)}
        </ul>
      ) : (
        <p className={styles.wishHint}>{t('places.emptyWishlist')}</p>
      ))}
    </section>
  )
}
