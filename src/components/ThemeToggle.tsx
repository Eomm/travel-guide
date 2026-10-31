import { useI18n } from '../i18n/i18n.ts'
import { useTheme } from '../theme/theme.ts'
import { MoonIcon, SunIcon } from './icons.tsx'
import styles from './ThemeToggle.module.css'

/** Switches between the light and the dark theme. */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const { t } = useI18n()
  const next = theme === 'dark' ? 'light' : 'dark'
  const label = t(next === 'dark' ? 'theme.switchToDark' : 'theme.switchToLight')
  return (
    <button type="button" className={styles.toggle} onClick={toggle} aria-label={label} title={label}>
      {next === 'dark' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}
