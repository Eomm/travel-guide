import { useId, useMemo, useState } from 'react'
import { CloseIcon, DownloadIcon, EditIcon, WarningIcon } from '../components/icons.tsx'
import { useI18n } from '../i18n/i18n.ts'
import { formatIssue } from '../model/issues.ts'
import type { Trip } from '../model/trip.gen.ts'
import { downloadTrip, type TripEditor, tripIssues } from './edit.ts'
import styles from './EditBar.module.css'

/** The header button that starts edit mode. */
export function EditButton({ editor }: { editor: TripEditor }) {
  const { t } = useI18n()
  return (
    <button type="button" className={styles.start} onClick={editor.start} aria-label={t('edit.start')} title={t('edit.start')}>
      <EditIcon />
    </button>
  )
}

/** Under the header while editing: the problems of the draft, its download and the way out. */
export default function EditBar({ trip, editor }: { trip: Trip; editor: TripEditor }) {
  const { t } = useI18n()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const { errors, warnings } = useMemo(() => tripIssues(trip), [trip])
  const issues = [...errors.map((issue) => ({ issue, error: true })), ...warnings.map((issue) => ({ issue, error: false }))]

  const exit = () => {
    if (!editor.dirty || window.confirm(t('edit.discardConfirm'))) editor.exit()
  }
  const download = () => {
    downloadTrip(trip)
    editor.saved()
  }

  const summary = [
    errors.length > 0 && t(errors.length === 1 ? 'edit.errors.one' : 'edit.errors.other', { count: errors.length }),
    warnings.length > 0 && t(warnings.length === 1 ? 'edit.warnings.one' : 'edit.warnings.other', { count: warnings.length }),
  ].filter(Boolean).join(' · ')

  return (
    <div className={styles.edit}>
      <div className={styles.bar}>
        {issues.length > 0 ? (
          <button type="button" className={errors.length ? `${styles.issues} ${styles.hasErrors}` : styles.issues}
            aria-expanded={open} aria-controls={listId} onClick={() => setOpen(!open)}>
            <WarningIcon />
            {summary}
          </button>
        ) : (
          <span className={styles.valid}>{t('edit.valid')}</span>
        )}
        <button type="button" className={styles.download} onClick={download} disabled={errors.length > 0}
          title={errors.length ? t('edit.downloadBlocked') : undefined}>
          <DownloadIcon />
          {t('edit.download')}
          {editor.dirty && <span className={styles.dirty} role="img" aria-label={t('edit.unsaved')} title={t('edit.unsaved')} />}
        </button>
        <button type="button" className={styles.exit} onClick={exit} aria-label={t('edit.exit')} title={t('edit.exit')}>
          <CloseIcon />
        </button>
      </div>
      {open && issues.length > 0 && (
        <ul id={listId} className={styles.list} aria-label={t('edit.issues')}>
          {issues.map(({ issue, error }, i) => (
            <li key={i} className={error ? styles.error : styles.warning}>{formatIssue(issue)}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
