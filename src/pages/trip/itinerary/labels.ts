// Small text helpers shared by the itinerary components.
import type { I18n, Lang, MessageKey } from '../../../i18n/i18n.ts'
import { locale } from '../../../model/format.ts'
import type { LegDistance } from '../../../model/geo.ts'

/** `1,1 km`, or `≈ 0,4 km` when estimated. */
export function kmText(distance: LegDistance, lang: Lang, t: I18n['t']): string {
  const km = new Intl.NumberFormat(locale(lang), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(distance.km)
  return t(distance.estimated ? 'itinerary.kmEstimated' : 'itinerary.km', { km })
}

const categories = ['see', 'food', 'shop', 'fun', 'hotel', 'info']

/** Translated place category; unknown (free) categories are shown as they are. */
export const categoryText = (category: string, t: I18n['t']) =>
  categories.includes(category) ? t(`itinerary.category.${category}` as MessageKey) : category
