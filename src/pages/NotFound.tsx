import { Link } from 'react-router'
import { useI18n } from '../i18n/i18n.ts'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <>
      <h1>{t('notFound.title')}</h1>
      <p>
        <Link to="/">{t('notFound.backHome')}</Link>
      </p>
    </>
  )
}
