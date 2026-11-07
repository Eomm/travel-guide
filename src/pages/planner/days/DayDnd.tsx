import {
  type Announcements, closestCenter, type CollisionDetection, DndContext, type DragEndEvent, DragOverlay, type DragStartEvent, KeyboardSensor,
  pointerWithin, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { type ReactNode, useState } from 'react'
import { useI18n } from '../../../i18n/i18n.ts'
import { stopPoint } from '../../../model/points.ts'
import type { Trip } from '../../../model/trip.gen.ts'
import { usePlanner } from '../../../planner/planner.ts'
import styles from './Days.module.css'
import { type Dragged, drop, parseDragged, parseTarget, type Target } from './dnd.ts'
import { useOpen } from './open.ts'

const draggedName = (trip: Trip, dragged: Dragged | undefined) => {
  if (!dragged) return ''
  if (dragged.kind === 'place') return trip.places.find((p) => p.id === dragged.placeId)?.name ?? ''
  const stop = trip.days[dragged.day]?.stops[dragged.stop]
  return stop ? stopPoint(stop, trip).name : ''
}

/**
 * Under the pointer, a stop wins over the day (or wishlist) that holds it; the keyboard, without a pointer,
 * moves to the closest one.
 */
const collision: CollisionDetection = (args) => {
  const within = pointerWithin(args)
  const stops = within.filter((c) => String(c.id).startsWith('stop:'))
  if (stops.length) return stops
  return within.length ? within : closestCenter(args)
}

/** The drag and drop of the Days page: stops between days and the wishlist, places from the wishlist. */
export default function DayDnd({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const { trip, update } = usePlanner()
  const { closeAll } = useOpen()
  const [dragged, setDragged] = useState<Dragged>()
  const [message, setMessage] = useState<string>()
  const sensors = useSensors(
    // a small move before dragging, so a click on the handle stays a click
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // on touch, a long press: a swipe scrolls the page
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const targetName = (target: Target | undefined) => {
    if (!target) return ''
    if (target.kind === 'wishlist') return t('planner.wishlist')
    return t('planner.dnd.position', { day: t('itinerary.dayNumber', { n: target.day + 1 }), position: target.index + 1 })
  }
  const announcements: Announcements = {
    onDragStart: ({ active }) => t('planner.dnd.picked', { name: draggedName(trip, parseDragged(active.id)) }),
    onDragOver: ({ over }) => (over ? t('planner.dnd.over', { target: targetName(parseTarget(over.id, trip)) }) : undefined),
    onDragEnd: ({ over }) => (over ? t('planner.dnd.dropped', { target: targetName(parseTarget(over.id, trip)) }) : t('planner.dnd.cancelled')),
    onDragCancel: () => t('planner.dnd.cancelled'),
  }

  const start = ({ active }: DragStartEvent) => {
    setMessage(undefined)
    setDragged(parseDragged(active.id))
  }
  const end = ({ active, over }: DragEndEvent) => {
    setDragged(undefined)
    const source = parseDragged(active.id)
    const target = over && parseTarget(over.id, trip)
    if (!source || !target || !over) return
    // in its own day a stop takes the place of the stop it is dropped on (the keyboard moves one stop at a time);
    // elsewhere it goes after the stop when dropped below its middle
    const sameDay = source.kind === 'stop' && target.kind === 'day' && target.day === source.day
    const onStop = target.kind === 'day' && String(over.id).startsWith('stop:')
    const moved = active.rect.current.translated
    const below = onStop && (sameDay
      ? source.kind === 'stop' && target.index > source.stop
      : !!moved && moved.top + moved.height / 2 > over.rect.top + over.rect.height / 2)
    const result = drop(trip, source, target, below)
    if (!result) return
    if ('refused' in result) {
      setMessage(t(result.refused === 'booked' ? 'planner.dnd.bookedLocked' : 'planner.dnd.noPlace'))
      return
    }
    // the open editors are by position: they would open other stops now
    closeAll()
    update((current) => {
      const next = drop(current, source, target, below)
      return next && 'trip' in next ? next.trip : current
    })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={collision} onDragStart={start} onDragEnd={end}
      onDragCancel={() => setDragged(undefined)}
      accessibility={{ announcements, screenReaderInstructions: { draggable: t('planner.dnd.instructions') } }}>
      {message && <p className={styles.dndMessage} role="alert">{message}</p>}
      {children}
      <DragOverlay>
        {dragged && <div className={styles.overlay}>{draggedName(trip, dragged)}</div>}
      </DragOverlay>
    </DndContext>
  )
}
