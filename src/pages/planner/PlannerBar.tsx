import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { DownloadIcon, TrashIcon, WarningIcon } from '../../components/icons.tsx'
import { useI18n } from '../../i18n/i18n.ts'
import { formatIssue, type Issue } from '../../model/issues.ts'
import type { Trip } from '../../model/trip.gen.ts'
import { downloadTrip, issueSection, type Planner } from '../../planner/planner.ts'
import styles from './PlannerBar.module.css'

/** Location state of a section page opened from an issue: the path of the field to show. */
export interface IssueLocationState {
  focus?: string
}

/** Under the header: the problems of the trip, its export and the discard of the draft. */
export default function PlannerBar({ planner }: { planner: Planner }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const listId = useId()
  const [open, setOpen] = useState(false)
  // the trip as exported: the note stays until the next change
  const [exported, setExported] = useState<Trip>()
  const { slug, trip, hasDraft, unsaved, published, issues: { errors, warnings } } = planner
  const issues = [...errors.map((issue) => ({ issue, error: true })), ...warnings.map((issue) => ({ issue, error: false }))]

  const show = (issue: Issue) => {
    setOpen(false)
    navigate(`/plan/${slug}/${issueSection(issue.path, trip)}`, { state: { focus: issue.path } satisfies IssueLocationState })
  }
  const download = () => {
    downloadTrip(trip)
    setExported(trip)
  }
  const discard = () => {
    if (window.confirm(t(published ? 'planner.discardConfirm' : 'planner.deleteConfirm'))) planner.discard()
  }

  const summary = [
    errors.length > 0 && t(errors.length === 1 ? 'planner.errors.one' : 'planner.errors.other', { count: errors.length }),
    warnings.length > 0 && t(warnings.length === 1 ? 'planner.warnings.one' : 'planner.warnings.other', { count: warnings.length }),
  ].filter(Boolean).join(' · ')

  return (
    <div className={styles.planner}>
      <div className={styles.bar}>
        {issues.length > 0 ? (
          <button type="button" className={errors.length ? `${styles.issues} ${styles.hasErrors}` : styles.issues}
            aria-expanded={open} aria-controls={listId} onClick={() => setOpen(!open)}>
            <WarningIcon />
            {summary}
          </button>
        ) : (
          <span className={styles.valid}>{t('planner.valid')}</span>
        )}
        <button type="button" className={styles.download} onClick={download} disabled={errors.length > 0}
          title={errors.length ? t('planner.exportBlocked') : undefined}>
          <DownloadIcon />
          {t('planner.export')}
        </button>
        <button type="button" className={styles.discard} onClick={discard} disabled={!hasDraft}
          aria-label={t(published ? 'planner.discard' : 'planner.delete')} title={t(published ? 'planner.discard' : 'planner.delete')}>
          <TrashIcon />
        </button>
      </div>
      {unsaved && <p className={`${styles.note} ${styles.error}`} role="alert">{t('planner.unsaved')}</p>}
      {exported === trip && <p className={styles.note}>{t('planner.exported', { slug })}</p>}
      {open && issues.length > 0 && (
        <ul id={listId} className={styles.list} aria-label={t('planner.issues')}>
          {issues.map(({ issue, error }, i) => (
            <li key={i}>
              <button type="button" className={error ? styles.error : styles.warning} onClick={() => show(issue)}>
                {formatIssue(issue)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
