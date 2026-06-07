import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const current = i18n.language?.split('-')[0] || 'en'

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    // Dynamic RTL for Arabic
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }

  return (
    <div className="language-switch relative">
      <label htmlFor="lang-select" className="sr-only">Language</label>
      <select
        id="lang-select"
        value={current}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-white border border-slate-200 text-sm rounded px-2.5 py-1.5 focus:outline focus:outline-2 focus:outline-teal-700 cursor-pointer"
        aria-label="Select site language"
      >
        {LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  )
}
