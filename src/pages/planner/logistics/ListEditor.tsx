import { type FormEvent, type ReactNode, useState } from 'react'
import { ChevronIcon, PlusIcon, TrashIcon } from '../../../components/icons.tsx'
import { useI18n } from '../../../i18n/i18n.ts'
import { addLogistics, type LogisticsList, type LogisticsLists, removeLogistics } from '../../../model/edit.ts'
import { usePlanner } from '../../../planner/planner.ts'
import styles from '../days/Days.module.css'
import { fieldId } from '../form/fields.ts'
import type { OpenSet } from '../form/open-set.ts'
import placeStyles from '../places/Places.module.css'
import { itemKey } from './keys.ts'

interface Props<L extends LogisticsList> {
  list: L
  title: string
  /** Placeholder of the name of a new item. */
  newName: string
  /** The new item, from its name (the id comes from the name). */
  create: (name: string) => Omit<LogisticsLists[L], 'id'>
  /** The closed line of an item. */
  summary: (item: LogisticsLists[L]) => ReactNode
  fields: (index: number) => ReactNode
  /** The question before removing the item, when it is linked to something. */
  removeConfirm?: (item: LogisticsLists[L]) => string | undefined
  editors: OpenSet
}

/** A logistics list: each item opens to its fields; a name and Add create a new one. */
export default function ListEditor<L extends LogisticsList>(props: Props<L>) {
  const { list, title, newName, create, summary, fields, removeConfirm, editors } = props
  const { isOpen, toggle, open, closeAll } = editors
  const { t } = useI18n()
  const { trip, update, issuesAt } = usePlanner()
  const [name, setName] = useState('')
  const items = (trip.logistics?.[list] ?? []) as LogisticsLists[L][]

  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = name.trim()
    if (!value) return
    // the new item is the last one: open it to fill in the rest
    open(itemKey(list, items.length))
    update((current) => addLogistics(current, list, value, create(value)).trip)
    setName('')
  }
  const remove = (index: number) => {
    const question = removeConfirm?.(items[index])
    if (question && !window.confirm(question)) return
    closeAll()
    update((current) => removeLogistics(current, list, index))
  }

  return (
    <section className={placeStyles.section} aria-label={title}>
      <h2>{title}</h2>
      {items.length > 0 && (
        <ul className={placeStyles.list}>
          {items.map((item, i) => {
            const key = itemKey(list, i)
            const expanded = isOpen(key)
            const hasError = issuesAt(key).some((issue) => issue.error)
            return (
              <li key={i} className={expanded ? `${styles.stop} ${styles.open}` : styles.stop}>
                <button type="button" id={fieldId(key)} className={styles.stopHead} aria-expanded={expanded} onClick={() => toggle(key)}>
                  <span className={styles.stopInfo}>
                    {summary(item)}
                    {hasError && !expanded && <span className={styles.errorDot} role="img" aria-label={t('planner.hasErrors')} />}
                  </span>
                  <ChevronIcon open={expanded} />
                </button>
                {expanded && (
                  <div className={styles.stopBody}>
                    <p className={placeStyles.id}>{t('planner.place.id', { id: item.id })}</p>
                    {fields(i)}
                    <button type="button" className={styles.remove} onClick={() => remove(i)}>
                      <TrashIcon />
                      {t('planner.remove')}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <form className={placeStyles.add} onSubmit={add}>
        <input className={placeStyles.input} value={name} placeholder={newName} aria-label={newName} autoComplete="off"
          onChange={(event) => setName(event.target.value)} />
        <button type="submit" className={placeStyles.addButton} disabled={!name.trim()}>
          <PlusIcon />
          {t('planner.addPlace')}
        </button>
      </form>
    </section>
  )
}
