import { useI18n } from '../../i18n/i18n.ts'

/** Placeholder: filled by the budget feature. */
export default function Budget() {
  const { t } = useI18n()
  return (
    <>
      <h1>{t('budget.title')}</h1>
      <p>{t('common.comingSoon')}</p>
    </>
  )
}
