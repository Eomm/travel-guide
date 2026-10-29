import { useI18n } from '../../i18n/i18n.ts'

/** Placeholder: filled by the logistics feature. */
export default function Logistics() {
  const { t } = useI18n()
  return (
    <>
      <h1>{t('logistics.title')}</h1>
      <p>{t('common.comingSoon')}</p>
    </>
  )
}
