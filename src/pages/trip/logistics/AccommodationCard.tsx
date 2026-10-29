import { Link } from 'react-router'
import { HotelIcon } from '../../../components/icons.tsx'
import Price from '../../../components/Price.tsx'
import { useTrip } from '../../../data/trip-context.ts'
import { useI18n } from '../../../i18n/i18n.ts'
import { formatLocalDateTime } from '../../../model/format.ts'
import { placeUrl } from '../../../model/maps.ts'
import type { Accommodation } from '../../../model/trip.gen.ts'
import Card, { Fact, type CardLink } from './Card.tsx'
import { countNights } from './dates.ts'

export default function AccommodationCard({ accommodation: a }: { accommodation: Accommodation }) {
  const { slug, trip } = useTrip()
  const { lang, t } = useI18n()
  const place = trip.places.find((p) => p.id === a.placeId)
  const nights = countNights(a.checkIn, a.checkOut)
  // coordinates of the stay, else of its catalog place; the address helps a search by name
  const mapsUrl = placeUrl({
    name: a.address ? `${a.name}, ${a.address}` : a.name,
    lat: a.lat ?? place?.lat,
    lng: a.lng ?? place?.lng,
    googlePlaceId: a.googlePlaceId ?? place?.googlePlaceId,
  })
  const links: CardLink[] = []
  if (mapsUrl) links.push({ href: mapsUrl, label: t('logistics.openInMaps') })
  if (a.url) links.push({ href: a.url, label: t('logistics.website') })
  return (
    <Card
      icon={<HotelIcon />}
      title={place ? <Link to={`/${slug}/places/${place.id}`}>{a.name}</Link> : a.name}
      meta={nights > 0 && t(nights === 1 ? 'logistics.nights.one' : 'logistics.nights.other', { count: nights })}
      notes={a.notes}
      links={links}
    >
      <Fact label={t('logistics.checkIn')}>{formatLocalDateTime(a.checkIn, lang)}</Fact>
      <Fact label={t('logistics.checkOut')}>{formatLocalDateTime(a.checkOut, lang)}</Fact>
      {a.price !== undefined && (
        <Fact label={t('logistics.price')}>
          <Price amount={a.price} />
        </Fact>
      )}
      {a.price !== undefined && nights > 1 && (
        <Fact label={t('logistics.perNight')}>
          <Price amount={Math.round(a.price / nights)} />
        </Fact>
      )}
      {a.address && <Fact label={t('logistics.address')}>{a.address}</Fact>}
    </Card>
  )
}
