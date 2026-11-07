import { PlusIcon, TrashIcon } from '../../../components/icons.tsx'
import { useI18n } from '../../../i18n/i18n.ts'
import { setField } from '../../../model/edit.ts'
import type { AudioTrack } from '../../../model/trip.gen.ts'
import { fieldId } from './fields.ts'
import { IssueList, NumberField, Row, TextField } from './Fields.tsx'
import styles from './Fields.module.css'

interface Props {
  /** Issue path of the list, e.g. `places[0].audio`. */
  path: string
  value: AudioTrack[] | undefined
  onChange: (value: AudioTrack[] | undefined) => void
}

/** The audio guides of a place or a stop: a file in the trip folder (or a URL), with title and transcript. */
export default function AudioTracks({ path, value = [], onChange }: Props) {
  const { t } = useI18n()
  const change = (index: number, track: AudioTrack) => onChange(value.map((current, i) => (i === index ? track : current)))
  const remove = (index: number) => {
    const next = value.filter((_, i) => i !== index)
    onChange(next.length ? next : undefined)
  }

  return (
    <fieldset id={fieldId(path)} tabIndex={-1} className={styles.group}>
      <legend className={styles.legend}>{t('places.audio')}</legend>
      {value.map((track, i) => {
        const at = (key: string) => `${path}[${i}].${key}`
        const set = <K extends keyof AudioTrack>(key: K) => (v: AudioTrack[K] | undefined) => change(i, setField(track, key, v))
        return (
          <div key={i} id={fieldId(`${path}[${i}]`)} tabIndex={-1} className={styles.item}>
            <IssueList path={`${path}[${i}]`} />
            <TextField path={at('title')} label={t('planner.audio.title')} required value={track.title} onChange={set('title')} />
            <TextField path={at('src')} label={t('planner.audio.src')} hint={t('planner.hint.audioSrc')} placeholder="audio/museum.mp3"
              value={track.src} onChange={set('src')} />
            <Row>
              <TextField path={at('language')} label={t('planner.audio.language')} placeholder="it" value={track.language}
                onChange={set('language')} />
              <NumberField path={at('durationSec')} integer label={t('planner.audio.duration')} value={track.durationSec}
                onChange={set('durationSec')} />
            </Row>
            <TextField path={at('transcript')} label={t('places.transcript')} rows={3} value={track.transcript}
              onChange={set('transcript')} />
            <button type="button" className={styles.remove} onClick={() => remove(i)}>
              <TrashIcon />
              {t('planner.audio.remove')}
            </button>
          </div>
        )
      })}
      <button type="button" className={styles.add} onClick={() => onChange([...value, { title: '' }])}>
        <PlusIcon />
        {t('planner.audio.add')}
      </button>
    </fieldset>
  )
}
