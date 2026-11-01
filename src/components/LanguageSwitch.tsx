import { languageNames, languages, useI18n, type Lang } from '../i18n/i18n.ts'
import { GlobeIcon } from './icons.tsx'
import styles from './LanguageSwitch.module.css'

/** Picks the UI language: shows the current code, opens the native picker with the full names. */
export default function LanguageSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <label className={styles.switch} title={t('common.language')}>
      <GlobeIcon />
      <span aria-hidden="true">{lang.toUpperCase()}</span>
      {/* transparent and over the whole control: a tap anywhere opens the picker */}
      <select value={lang} onChange={(event) => setLang(event.target.value as Lang)} aria-label={t('common.language')}>
        {languages.map((option) => (
          <option key={option} value={option} lang={option}>
            {languageNames[option]}
          </option>
        ))}
      </select>
    </label>
  )
}
