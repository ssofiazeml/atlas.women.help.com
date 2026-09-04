import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Phone, Globe, Clock, ExternalLink } from 'lucide-react'
import {
  getHotlines,
  subscribeContent,
  type AdminHotline,
} from '../../lib/contentStore'
import { pickLocalized } from '../../lib/translate'
import { localizeSchedule, localizeLanguages } from '../../lib/humanize'

const isInternational = (h: AdminHotline) =>
  h.scope === 'international' || (h.scope !== 'russia' && (!h.country || !h.country.trim()))

export function Hotlines() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'en').split('-')[0]

  const [all, setAll] = useState<AdminHotline[]>(() => getHotlines())
  useEffect(() => subscribeContent(() => setAll(getHotlines())), [])

  const [country, setCountry] = useState('')

  // Countries are derived from the data, so every new hotline country shows
  // up in the selector automatically.
  const countries = useMemo(() => {
    const map = new Map<string, string>()
    for (const h of all) {
      if (isInternational(h)) continue
      const raw = (h.country || '').trim()
      if (!raw) continue
      const key = raw.toLowerCase()
      if (!map.has(key)) map.set(key, raw)
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, lang))
  }, [all, lang])

  const international = useMemo(() => all.filter(isInternational), [all])
  const local = useMemo(
    () =>
      country
        ? all.filter(
            (h) => !isInternational(h) && (h.country || '').trim().toLowerCase() === country.toLowerCase()
          )
        : [],
    [all, country]
  )

  return (
    <main className="max-w-4xl mx-auto px-5 py-10">
      <h1 className="text-3xl font-semibold text-safe-800 mb-2">
        {t('hotlines.title', { defaultValue: 'Горячие линии' })}
      </h1>
      <p className="text-slate-600 text-sm mb-6">
        {t('hotlines.intro', {
          defaultValue: 'Выберите страну — вы увидите местные номера и международные линии помощи.',
        })}
      </p>

      <div className="safe-card bg-white mb-6">
        <label htmlFor="hotline-country" className="block text-xs font-medium text-slate-600 mb-1">
          {t('hotlines.select_country', { defaultValue: 'Страна' })}
        </label>
        <select
          id="hotline-country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">
            {t('hotlines.country_placeholder', { defaultValue: 'Выберите страну' })}
          </option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {countries.length === 0 && (
          <p className="text-xs text-slate-500 mt-2">
            {t('hotlines.no_countries', { defaultValue: 'Пока не добавлено ни одной страны.' })}
          </p>
        )}
      </div>

      {country && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-safe-800 mb-3">
            {t('hotlines.local_title', { defaultValue: 'Номера в стране' })}: {country}
          </h2>
          {local.length === 0 ? (
            <p className="text-sm text-slate-500">
              {t('hotlines.local_empty', { defaultValue: 'Для этой страны номера пока не добавлены.' })}
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {local.map((h) => (
                <HotlineCard key={h.id} h={h} lang={lang} />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-safe-800 mb-3 flex items-center gap-2">
          <Globe size={18} /> {t('hotlines.intl_title', { defaultValue: 'Международные линии' })}
        </h2>
        {international.length === 0 ? (
          <p className="text-sm text-slate-500">
            {t('hotlines.intl_empty', { defaultValue: 'Международные номера пока не добавлены.' })}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {international.map((h) => (
              <HotlineCard key={h.id} h={h} lang={lang} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function HotlineCard({ h, lang }: { h: AdminHotline; lang: string }) {
  const { t } = useTranslation()
  const title = pickLocalized(h, 'title', lang) || h.title
  const note = pickLocalized(h, 'note', lang) || h.note
  const hours = localizeSchedule(pickLocalized(h, 'hours', lang) || h.hours, t)
  const languages = localizeLanguages(pickLocalized(h, 'languages', lang) || h.languages, t)
  return (
    <div className="safe-card bg-white">
      <h3 className="font-semibold text-safe-800 leading-snug">{title}</h3>
      <div className="text-xs text-slate-500 mt-0.5">
        {isInternational(h)
          ? t('hotlines.international', { defaultValue: 'Международная' })
          : h.scope === 'russia'
            ? t('hotlines.russia', { defaultValue: 'Работает на территории РФ' })
            : h.country}
      </div>
      <a
        href={`tel:${h.phone.replace(/\s/g, '')}`}
        className="mt-3 inline-flex items-center gap-2 text-safe-800 font-semibold break-all"
      >
        <Phone size={16} /> {h.phone}
      </a>
      <dl className="mt-2 text-xs text-slate-700 space-y-0.5">
        {hours && (
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-slate-500" /> {hours}
          </div>
        )}
        {languages && (
          <div>
            <dt className="inline text-slate-500">{t('card.languages', { defaultValue: 'Языки' })}: </dt>
            <dd className="inline">{languages}</dd>
          </div>
        )}
      </dl>
      {note && <p className="text-sm text-slate-700 mt-2 leading-relaxed">{note}</p>}
      {h.website && (
        <a
          href={h.website}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 border border-safe-800 text-safe-800 text-xs rounded-md px-3 py-1.5 hover:bg-safe-800 hover:text-white transition"
        >
          <ExternalLink size={14} /> {t('card.btn_website', { defaultValue: 'Сайт' })}
        </a>
      )}
    </div>
  )
}

export default Hotlines
