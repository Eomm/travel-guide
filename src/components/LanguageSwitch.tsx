import { languages, useI18n } from '../i18n/i18n.ts'
import styles from './LanguageSwitch.module.css'

export default function LanguageSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <div className={styles.switch} role="group" aria-label={t('common.language')}>
      {languages.map((option) => (
        <button key={option} type="button" lang={option} aria-pressed={option === lang} onClick={() => setLang(option)}>
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
