// `/plan/:slug/settings`: the trip settings (title, dates, timezone, currency, language, cover).
import { useMemo } from 'react'
import { useI18n } from '../../i18n/i18n.ts'
import { setField, withoutUndefined } from '../../model/edit.ts'
import type { TripSettings } from '../../model/trip.gen.ts'
import { usePlanner } from '../../planner/planner.ts'
import { currencySuggestions, languageSuggestions, timezoneSuggestions } from '../../planner/suggestions.ts'
import { useIssueFocus } from './form/fields.ts'
import { Group, NumberField, Row, TextField } from './form/Fields.tsx'

export default function Settings() {
  const { lang, t } = useI18n()
  const { slug, trip, update } = usePlanner()
  const settings = trip.trip
  const timezones = useMemo(() => timezoneSuggestions(), [])
  const currencies = useMemo(() => currencySuggestions(lang), [lang])
  const languages = useMemo(() => languageSuggestions(lang), [lang])
  useIssueFocus()

  const set = <K extends keyof TripSettings>(key: K) => (value: TripSettings[K] | undefined) =>
    update((current) => ({ ...current, trip: setField(current.trip, key, value) }))
  const convert = settings.convertCurrency
  // both empty: no conversion; one of them: the issue asks for the other
  const setConvert = (change: Partial<NonNullable<TripSettings['convertCurrency']>>) => {
    const next = withoutUndefined({ ...convert, ...change })
    set('convertCurrency')(Object.keys(next).length ? (next as TripSettings['convertCurrency']) : undefined)
  }

  return (
    <>
      <h1>{t('planner.settings')}</h1>
      <p>{t('planner.folder', { slug })}</p>

      <Group title={t('planner.group.trip')}>
        <TextField path="trip.title" label={t('planner.field.title')} required value={settings.title} onChange={set('title')} />
        <TextField path="trip.subtitle" label={t('planner.field.subtitle')} value={settings.subtitle} onChange={set('subtitle')} />
        <TextField path="trip.description" label={t('planner.field.description')} hint={t('planner.hint.markdown')} rows={4}
          value={settings.description} onChange={set('description')} />
        <TextField path="trip.cover" label={t('planner.field.cover')} hint={t('planner.hint.resource', { slug })}
          placeholder="images/cover.jpg" value={settings.cover} onChange={set('cover')} />
      </Group>

      <Group title={t('planner.group.dates')}>
        <Row>
          <TextField path="trip.startDate" type="date" label={t('planner.field.startDate')} required
            value={settings.startDate} onChange={set('startDate')} />
          <TextField path="trip.endDate" type="date" label={t('planner.field.endDate')} required
            value={settings.endDate} onChange={set('endDate')} />
        </Row>
        <TextField path="trip.timezone" label={t('planner.field.timezone')} hint={t('planner.hint.timezone')} required
          suggestions={timezones} placeholder="Asia/Tokyo" value={settings.timezone} onChange={set('timezone')} />
      </Group>

      <Group title={t('planner.group.money')}>
        <TextField path="trip.currency" label={t('planner.field.currency')} hint={t('planner.hint.currency')} required
          suggestions={currencies} placeholder="JPY" value={settings.currency} onChange={set('currency')} />
        <Row>
          <TextField path="trip.convertCurrency.currency" label={t('planner.field.convertCurrency')} suggestions={currencies}
            placeholder="EUR" value={convert?.currency} onChange={(currency) => setConvert({ currency })} />
          <NumberField path="trip.convertCurrency.oneEquals" label={t('planner.field.oneEquals')}
            hint={convert?.currency && settings.currency
              ? t('planner.hint.oneEquals', { from: convert.currency, to: settings.currency })
              : undefined}
            placeholder="170" value={convert?.oneEquals} onChange={(oneEquals) => setConvert({ oneEquals })} />
        </Row>
      </Group>

      <Group title={t('planner.group.language')}>
        <TextField path="trip.language" label={t('planner.field.language')} hint={t('planner.hint.language')} required
          suggestions={languages} placeholder="it" value={settings.language} onChange={set('language')} />
      </Group>
    </>
  )
}
