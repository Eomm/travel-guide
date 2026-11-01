import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { en } from './en.ts'
import { I18nContext, initialLang, interpolate, saveLang, type I18n, type Lang, type MessageKey, type MessageParams } from './i18n.ts'
import { it } from './it.ts'
import { ja } from './ja.ts'

const dictionaries: Record<Lang, Record<MessageKey, string>> = { it, en, ja }

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const i18n = useMemo<I18n>(
    () => ({
      lang,
      setLang: (next) => {
        saveLang(next)
        setLangState(next)
      },
      t: (key: MessageKey, params?: MessageParams) => interpolate(dictionaries[lang][key], params),
    }),
    [lang],
  )
  return <I18nContext value={i18n}>{children}</I18nContext>
}
