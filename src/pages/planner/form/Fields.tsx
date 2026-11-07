// The Planner form fields. Each field edits one value of the draft as you type, shows the build issues of its
// path below it, and has the id that an issue click focuses (fields.ts). An empty optional field is a missing value.
import { type ReactNode, useId, useState } from 'react'
import { useI18n } from '../../../i18n/i18n.ts'
import { usePlanner } from '../../../planner/planner.ts'
import type { Suggestion } from '../../../planner/suggestions.ts'
import { fieldId, textValue } from './fields.ts'
import styles from './Fields.module.css'

interface FrameProps {
  /** Issue path of the value, e.g. `trip.title`. */
  path: string
  label: string
  hint?: ReactNode
  required?: boolean
  /** A problem found by the field itself, before the build checks (e.g. not a number). */
  localError?: string
  children: (control: ControlProps) => ReactNode
}

interface ControlProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
}

function FieldFrame({ path, label, hint, required, localError, children }: FrameProps) {
  const { issuesAt } = usePlanner()
  const base = useId()
  const issues = [...(localError ? [{ message: localError, error: true }] : []), ...issuesAt(path)]
  const describedBy = [hint && `${base}-hint`, issues.length > 0 && `${base}-issues`].filter(Boolean).join(' ')
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId(path)} className={styles.label}>
        {label}
        {required && <span className={styles.required} aria-hidden="true"> *</span>}
      </label>
      {children({
        id: fieldId(path),
        'aria-describedby': describedBy || undefined,
        'aria-invalid': issues.some((issue) => issue.error) || undefined,
        'aria-required': required || undefined,
      })}
      {hint && <p id={`${base}-hint`} className={styles.hint}>{hint}</p>}
      {issues.length > 0 && (
        <ul id={`${base}-issues`} className={styles.issues}>
          {issues.map((issue, i) => (
            <li key={i} className={issue.error ? styles.error : styles.warning}>{issue.message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

type Common = Omit<FrameProps, 'children' | 'localError'>

interface TextFieldProps extends Common {
  value: string | undefined
  onChange: (value: string | undefined) => void
  type?: 'text' | 'url' | 'tel' | 'date' | 'time'
  /** Rows of a multi-line field (Markdown text). */
  rows?: number
  /** Values offered while typing; any other value is accepted too. */
  suggestions?: Suggestion[]
  placeholder?: string
}

export function TextField({ value, onChange, type = 'text', rows, suggestions, placeholder, ...frame }: TextFieldProps) {
  const listId = useId()
  // a required text stays as '' (the issue says "must not be empty"): the pages can rely on it being a string
  const change = (event: { target: { value: string } }) =>
    onChange(frame.required ? event.target.value : textValue(event.target.value))
  return (
    <FieldFrame {...frame}>
      {(control) =>
        rows ? (
          <textarea {...control} className={styles.input} rows={rows} value={value ?? ''} placeholder={placeholder} onChange={change} />
        ) : (
          <>
            <input {...control} className={styles.input} type={type} value={value ?? ''} placeholder={placeholder}
              list={suggestions && listId} autoComplete="off" spellCheck={type === 'text' ? undefined : false} onChange={change} />
            {suggestions && (
              <datalist id={listId}>
                {suggestions.map((s) => <option key={s.value} value={s.value} label={s.label} />)}
              </datalist>
            )}
          </>
        )
      }
    </FieldFrame>
  )
}

interface ListFieldProps extends Common {
  value: string[] | undefined
  onChange: (value: string[] | undefined) => void
  placeholder?: string
}

const splitList = (text: string) => text.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)

/**
 * A short list typed as text, items separated by commas (tags, dates, opening hours). The text stays as typed
 * while it parses to the same list, so a trailing comma or space is not eaten.
 */
export function ListField({ value, onChange, placeholder, ...frame }: ListFieldProps) {
  const joined = (value ?? []).join(', ')
  const [text, setText] = useState(joined)
  if (splitList(text).join(', ') !== joined) setText(joined)
  return (
    <FieldFrame {...frame}>
      {(control) => (
        <input {...control} className={styles.input} type="text" value={text} placeholder={placeholder} autoComplete="off"
          onChange={(event) => {
            setText(event.target.value)
            const items = splitList(event.target.value)
            onChange(items.length ? items : undefined)
          }} />
      )}
    </FieldFrame>
  )
}

interface NumberFieldProps extends Common {
  value: number | undefined
  onChange: (value: number | undefined) => void
  /** Whole numbers only (minutes, stars). */
  integer?: boolean
  placeholder?: string
}

const formatNumber = (value: number | undefined) => (value === undefined ? '' : String(value))

/** A number typed as text: half-typed values (`1.`, `-`) stay in the field, as no value until they are a number. */
export function NumberField({ value, onChange, integer, placeholder, ...frame }: NumberFieldProps) {
  const { t } = useI18n()
  const [text, setText] = useState(() => formatNumber(value))
  const [shown, setShown] = useState(value)
  if (value !== shown) {
    // changed from outside (another field, a discard): show the new value
    setShown(value)
    setText(formatNumber(value))
  }
  const parsed = text.trim() === '' ? undefined : Number(text.trim().replace(',', '.'))
  const invalid = parsed !== undefined && !Number.isFinite(parsed)
  return (
    <FieldFrame {...frame} localError={invalid ? t('planner.notNumber') : undefined}>
      {(control) => (
        <input {...control} className={styles.input} type="text" inputMode={integer ? 'numeric' : 'decimal'} value={text}
          placeholder={placeholder} autoComplete="off"
          onChange={(event) => {
            const next = event.target.value
            setText(next)
            const number = next.trim() === '' ? undefined : Number(next.trim().replace(',', '.'))
            // not a number (yet): no value, so the previous one is not exported by mistake
            const value = number !== undefined && Number.isFinite(number) ? number : undefined
            setShown(value)
            onChange(value)
          }} />
      )}
    </FieldFrame>
  )
}

interface DateTimeFieldProps extends Common {
  /** `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM`. */
  value: string | undefined
  onChange: (value: string | undefined) => void
  /** Label of the time input (the date input has the field label). */
  timeLabel: string
}

/** A date with an optional time: `YYYY-MM-DD`, or `YYYY-MM-DDTHH:MM` when the time is set. */
export function DateTimeField({ value, onChange, timeLabel, ...frame }: DateTimeFieldProps) {
  const [date = '', time = ''] = (value ?? '').split('T')
  const change = (nextDate: string, nextTime: string) =>
    onChange(!nextDate && !nextTime ? undefined : nextTime ? `${nextDate}T${nextTime}` : nextDate)
  return (
    <FieldFrame {...frame}>
      {(control) => (
        <div className={styles.dateTime}>
          <input {...control} className={styles.input} type="date" value={date}
            onChange={(event) => change(event.target.value, time)} />
          <input className={styles.input} type="time" value={time} aria-label={timeLabel} title={timeLabel}
            onChange={(event) => change(date, event.target.value)} />
        </div>
      )}
    </FieldFrame>
  )
}

interface SelectFieldProps<T extends string> extends Common {
  value: T | undefined
  onChange: (value: T | undefined) => void
  options: { value: T; label: string }[]
  /** Label of the empty choice, for an optional value. */
  empty?: string
}

export function SelectField<T extends string>({ value, onChange, options, empty, ...frame }: SelectFieldProps<T>) {
  return (
    <FieldFrame {...frame}>
      {(control) => (
        <select {...control} className={styles.input} value={value ?? ''}
          onChange={(event) => onChange((event.target.value || undefined) as T | undefined)}>
          {(empty !== undefined || value === undefined) && <option value="">{empty ?? ''}</option>}
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}
    </FieldFrame>
  )
}

/** The issues of a whole object (a stop, a day), shown at the top of its editor. */
export function IssueList({ path }: { path: string }) {
  const { issuesAt } = usePlanner()
  const issues = issuesAt(path)
  if (issues.length === 0) return null
  return (
    <ul className={styles.issues}>
      {issues.map((issue, i) => (
        <li key={i} className={issue.error ? styles.error : styles.warning}>{issue.message}</li>
      ))}
    </ul>
  )
}

/** A titled group of fields. */
export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{title}</legend>
      {children}
    </fieldset>
  )
}

/** Fields side by side on wide screens, stacked on phones. */
export function Row({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>
}
