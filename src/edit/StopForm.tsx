import { useEffect, useId, useRef, type FormEvent } from 'react'
import { useTrip } from '../data/trip-context.ts'
import { useI18n } from '../i18n/i18n.ts'
import { type StopPatch, updateStop } from '../model/edit.ts'
import type { Stop } from '../model/trip.gen.ts'
import { useEdit } from './edit.ts'
import styles from './StopForm.module.css'

interface Props {
  stop: Stop
  /** Name shown in the title: the place or the stop title. */
  name: string
  /** Date of the day and position of the stop in it. */
  date: string
  index: number
  onClose: () => void
}

/** An empty field removes the value (a number input gives '' for a value that is not a number too). */
function numberField(value: FormDataEntryValue | null): number | undefined {
  const text = String(value ?? '').trim()
  return text === '' ? undefined : Number(text)
}

function textField(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? '').trim()
  return text === '' ? undefined : text
}

/** A modal form for the time, duration, price and notes of a stop. */
export default function StopForm({ stop, name, date, index, onClose }: Props) {
  const { trip } = useTrip()
  const { update } = useEdit()
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const id = useId()
  const place = trip.places.find((p) => p.id === stop.placeId)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const patch: StopPatch = {
      time: textField(data.get('time')),
      durationMin: numberField(data.get('durationMin')),
      price: numberField(data.get('price')),
      notes: textField(data.get('notes')),
    }
    update((current) => updateStop(current, date, index, patch))
    onClose()
  }

  return (
    // Esc and the backdrop close the dialog without applying
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={`${id}-title`} onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}>
      <form className={styles.form} onSubmit={submit}>
        <h2 id={`${id}-title`} className={styles.title}>{t('edit.editStop', { name })}</h2>
        <div className={styles.row}>
          <label className={styles.field}>
            {t('edit.time')}
            <input type="time" name="time" defaultValue={stop.time ?? ''} />
          </label>
          <label className={styles.field}>
            {t('edit.duration')}
            <input type="number" name="durationMin" min="0" step="1" inputMode="numeric" defaultValue={stop.durationMin ?? ''} />
          </label>
        </div>
        <label className={styles.field}>
          {t('edit.price', { currency: trip.trip.currency })}
          {/* the place price applies when the stop has none */}
          <input type="number" name="price" min="0" step="any" inputMode="decimal" defaultValue={stop.price ?? ''}
            placeholder={place?.price !== undefined ? String(place.price) : undefined} />
        </label>
        <label className={styles.field}>
          {t('edit.notes')}
          <textarea name="notes" rows={4} defaultValue={stop.notes ?? ''} />
        </label>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>{t('edit.cancel')}</button>
          <button type="submit" className={styles.apply}>{t('edit.apply')}</button>
        </div>
      </form>
    </dialog>
  )
}
