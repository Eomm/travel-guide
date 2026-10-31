// `/:slug/places/:placeId`: everything about one place, with its audio guides and where it is in the itinerary.
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { BackIcon, GlobeIcon, PhoneIcon, PlacesIcon, TicketIcon } from '../../components/icons.tsx'
import PlaceBadges from '../../components/PlaceBadges.tsx'
import Price from '../../components/Price.tsx'
import Stars from '../../components/Stars.tsx'
import { useTrip } from '../../data/trip-context.ts'
import { resolveResource } from '../../data/trips.ts'
import { useI18n, type Lang } from '../../i18n/i18n.ts'
import { formatDate, locale } from '../../model/format.ts'
import { placeUrl } from '../../model/maps.ts'
import { categoryLabel, groupWeekly, placeUses, weekdays, type Weekday } from '../../model/places.ts'
import type { AudioTrack, OpeningHours, Place } from '../../model/trip.gen.ts'
import styles from './PlaceDetail.module.css'

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** Weekday name in the UI language: 2024-01-01 was a Monday. */
function weekdayName(day: Weekday, lang: Lang): string {
  const date = new Date(Date.UTC(2024, 0, 1 + weekdays.indexOf(day)))
  return capitalize(new Intl.DateTimeFormat(locale(lang), { weekday: 'short', timeZone: 'UTC' }).format(date))
}

/** `Italiano` for `it`; the tag itself when the browser does not know it. */
function languageName(tag: string, lang: Lang): string {
  try {
    return capitalize(new Intl.DisplayNames(locale(lang), { type: 'language' }).of(tag) ?? tag)
  } catch {
    return tag
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}

function WeeklyHours({ weekly }: { weekly: NonNullable<OpeningHours['weekly']> }) {
  const { lang, t } = useI18n()
  return (
    <table className={styles.weekly}>
      <tbody>
        {groupWeekly(weekly).map((group) => (
          <tr key={group.from}>
            <th scope="row">
              {weekdayName(group.from, lang)}
              {group.to !== group.from && ` – ${weekdayName(group.to, lang)}`}
            </th>
            <td>{group.ranges.length > 0 ? group.ranges.join(', ').replaceAll('-', '–') : t('places.closed')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function AudioGuide({ track }: { track: AudioTrack }) {
  const { slug } = useTrip()
  const { lang, t } = useI18n()
  return (
    <li className={styles.track}>
      <p className={styles.trackTitle}>
        {track.title}
        {track.language && <span className={styles.trackLang}> · {languageName(track.language, lang)}</span>}
      </p>
      {track.src ? (
        <audio className={styles.audio} controls preload="none" src={resolveResource(slug, track.src)} />
      ) : (
        <p className={styles.muted}>{t('places.audioUnavailable')}</p>
      )}
      {track.transcript && (
        <details className={styles.transcript}>
          <summary>{t('places.transcript')}</summary>
          <p className={styles.text}>{track.transcript}</p>
        </details>
      )}
    </li>
  )
}

function Actions({ place }: { place: Place }) {
  const { t } = useI18n()
  const maps = placeUrl(place)
  const links = [
    maps && { href: maps, label: t('places.openInMaps'), Icon: PlacesIcon, external: true },
    place.url && { href: place.url, label: t('places.website'), Icon: GlobeIcon, external: true },
    place.bookingUrl && { href: place.bookingUrl, label: t('places.booking'), Icon: TicketIcon, external: true },
    place.phone && { href: `tel:${place.phone.replace(/[^\d+]/g, '')}`, label: t('places.call'), Icon: PhoneIcon, external: false },
  ].filter((link) => !!link)
  if (links.length === 0) return null
  return (
    <div className={styles.actions}>
      {links.map(({ href, label, Icon, external }, index) => (
        <a
          key={href}
          href={href}
          className={index === 0 ? `${styles.action} ${styles.primary}` : styles.action}
          {...(external && { target: '_blank', rel: 'noreferrer' })}
        >
          <Icon />
          {label}
        </a>
      ))}
    </div>
  )
}

export default function PlaceDetail() {
  const { placeId } = useParams()
  const { slug, trip } = useTrip()
  const { lang, t } = useI18n()
  const place = trip.places.find((p) => p.id === placeId)

  const back = (
    <Link to=".." relative="path" className={styles.back}>
      <BackIcon />
      {t('places.backToList')}
    </Link>
  )

  if (!place) {
    return (
      <>
        <h1>{t('places.notFound')}</h1>
        <p>{back}</p>
      </>
    )
  }

  const uses = placeUses(trip).get(place.id) ?? []
  const hours = place.openingHours
  const hasHours = hours && (hours.text || hours.closures || hours.weekly)

  return (
    <article>
      {back}
      {place.image && <img className={styles.hero} src={resolveResource(slug, place.image)} alt="" />}
      <h1 className={styles.name}>{place.name}</h1>
      <div className={styles.meta}>
        {place.category && <span>{categoryLabel(place.category, t)}</span>}
        {place.stars !== undefined && <Stars count={place.stars} />}
        <PlaceBadges place={place} />
      </div>
      {place.description && <p className={styles.description}>{place.description}</p>}

      <Actions place={place} />

      {place.tip && (
        <aside className={styles.tip}>
          <strong>{t('places.tip')}</strong>
          <p className={styles.text}>{place.tip}</p>
        </aside>
      )}

      {place.info && (
        <Section title={t('places.info')}>
          <p className={styles.text}>{place.info}</p>
        </Section>
      )}

      {hasHours && (
        <Section title={t('places.openingHours')}>
          {hours.text && <p className={styles.text}>{hours.text}</p>}
          {hours.weekly && <WeeklyHours weekly={hours.weekly} />}
          {hours.closures && <p className={`${styles.text} ${styles.muted}`}>{hours.closures}</p>}
        </Section>
      )}

      {place.visitDuration && (
        <Section title={t('places.visitDuration')}>
          <p>{place.visitDuration}</p>
        </Section>
      )}

      {(place.price !== undefined || place.priceInfo) && (
        <Section title={t('places.price')}>
          {place.price !== undefined && (
            <p>
              <Price amount={place.price} />
            </p>
          )}
          {place.priceInfo && <p className={styles.muted}>{place.priceInfo}</p>}
        </Section>
      )}

      {place.directions && (
        <Section title={t('places.directions')}>
          <p className={styles.text}>{place.directions}</p>
        </Section>
      )}

      {place.address && (
        <Section title={t('places.address')}>
          <p>{place.address}</p>
        </Section>
      )}

      {place.notes && (
        <Section title={t('places.notes')}>
          <p className={styles.text}>{place.notes}</p>
        </Section>
      )}

      {place.audio && place.audio.length > 0 && (
        <Section title={t('places.audio')}>
          <ul className={styles.tracks}>
            {place.audio.map((track, index) => (
              <AudioGuide key={track.id ?? index} track={track} />
            ))}
          </ul>
        </Section>
      )}

      <Section title={t('places.itinerary')}>
        {uses.length > 0 ? (
          <ul className={styles.uses}>
            {uses.map((use, index) => (
              <li key={use.stopId ?? index}>
                <Link to={{ pathname: `/${slug}`, hash: `day-${use.date}` }} className={styles.use}>
                  <span className={styles.useDay}>{t('places.dayNumber', { number: use.dayNumber })}</span>
                  <span>
                    {formatDate(use.date, lang, 'short')}
                    {use.time && ` · ${use.time}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>{t('places.inWishlist')}</p>
        )}
      </Section>
    </article>
  )
}
