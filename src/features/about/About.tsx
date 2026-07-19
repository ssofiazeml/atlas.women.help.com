import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAboutTexts, subscribeContent, type AboutTexts } from '../../lib/contentStore'
import { pickLocalized } from '../../lib/translate'

function toList(v?: string): string[] {
  if (!v) return []
  return v
    .split(/\r?\n/)
    .map((s) => s.replace(/^[-•·\s]+/, '').trim())
    .filter(Boolean)
}

export function About() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'en').split('-')[0]
  const [texts, setTexts] = useState<AboutTexts>(() => getAboutTexts())

  useEffect(() => subscribeContent(() => setTexts(getAboutTexts())), [])

  // Admin-provided text (if any) takes priority, otherwise we fall back
  // to the localised default strings from the i18n bundle.
  const title = pickLocalized(texts, 'title', lang) || texts.title || t('about.title')
  const intro = pickLocalized(texts, 'intro', lang) || texts.intro || t('about.intro')
  const mission = pickLocalized(texts, 'mission', lang) || texts.mission || t('about.mission')
  const includes = toList(pickLocalized(texts, 'includes', lang) || texts.includes || t('about.includes'))
  const principles = toList(pickLocalized(texts, 'principles', lang) || texts.principles || t('about.principles'))

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">
      <header className="mb-10 md:mb-14">
        <div className="text-xs uppercase tracking-widest text-safe-teal font-medium mb-3">{t('about.eyebrow')}</div>
        <h1 className="text-4xl md:text-5xl font-semibold text-safe-800 tracking-tight leading-tight">
          {title}
        </h1>
      </header>

      {texts.photo && (
        <img
          src={texts.photo}
          alt=""
          className="w-full rounded-2xl border border-slate-200 mb-10 max-h-[380px] object-cover"
        />
      )}

      <section className="prose prose-slate max-w-none mb-12">
        {intro.split(/\n\n+/).map((p, i) => (
          <p key={i} className="text-base md:text-lg text-slate-700 leading-relaxed mb-4">{p}</p>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-safe-800 mb-4">{t('about.mission_heading')}</h2>
        <div className="safe-card bg-white">
          <p className="text-base md:text-lg text-slate-700 leading-relaxed">{mission}</p>
        </div>
      </section>

      {includes.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-safe-800 mb-4">{t('about.includes_heading')}</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {includes.map((line, i) => (
              <li key={i} className="safe-card bg-white flex gap-3">
                <span className="text-safe-teal font-semibold shrink-0">0{i + 1}</span>
                <span className="text-slate-700">{line}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {principles.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-safe-800 mb-4">{t('about.principles_heading')}</h2>
          <ul className="grid gap-3">
            {principles.map((line, i) => (
              <li key={i} className="safe-card bg-white flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-safe-teal shrink-0" />
                <span className="text-slate-700">{line}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}