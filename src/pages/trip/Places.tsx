import { useI18n } from '../../i18n/i18n.ts'

/** Placeholder: filled by the places feature. */
export default function Places() {
  const { t } = useI18n()
  return (
    <>
      <h1>{t('places.title')}</h1>
      <p>{t('common.comingSoon')}</p>
    </>
  )
}
