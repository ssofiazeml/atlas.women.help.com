import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getRatings,
  getCountryIndex,
  subscribeContent,
  applySeedTransforms,
  type CountryRating,
  type CountryIndexEntry,
} from '../../lib/contentStore'

export function SafeBridgeIndex() {
  const { t } = useTranslation()

  const cols = t('safebridge.col', { returnObjects: true }) as any
  const rows = t('safebridge.demo', { returnObjects: true }) as any[]
  const seedRows = (Array.isArray(rows) ? rows : []).map((r, i) => ({
    ...r,
    id: `seed-rating-${i}`,
  }))
  const visibleSeedRows = applySeedTransforms<any>('ratings', seedRows)

  const [ratings, setRatings] = useState<CountryRating[]>(() => getRatings())
  const [index, setIndex] = useState<CountryIndexEntry[]>(() => getCountryIndex())
  useEffect(
    () =>
      subscribeContent(() => {
        setRatings(getRatings())
        setIndex(getCountryIndex())
      }),
    []
  )

  const allRows = [...ratings, ...visibleSeedRows]

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <div className="mb-8">
        <div className="text-sm uppercase tracking-widest text-teal-700 font-medium mb-1">{t('safebridge.title')}</div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">{t('safebridge.title')}</h1>
        <p className="max-w-3xl text-slate-600">{t('safebridge.intro')}</p>
        <p className="text-xs text-slate-500 mt-2">{t('safebridge.note')}</p>
      </div>

      <div className="overflow-x-auto safe-card">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-slate-50">
              <th className="px-4 py-3">{cols.country}</th>
              <th className="px-4 py-3">{cols.overall}</th>
              <th className="px-4 py-3">{cols.safety}</th>
              <th className="px-4 py-3">{cols.legal}</th>
              <th className="px-4 py-3">{cols.children}</th>
              <th className="px-4 py-3">{cols.psych}</th>
              <th className="px-4 py-3">{cols.digital}</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((r: any, i: number) => (
              <tr key={i} className="border-b last:border-none">
                <td className="px-4 py-3 font-medium">
                  {r.color && (
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle"
                      style={{ background: r.color }}
                    />
                  )}
                  {r.country}
                </td>
                <td className="px-4 py-3">{r.overall}</td>
                <td className="px-4 py-3">{r.safety}</td>
                <td className="px-4 py-3">{r.legal}</td>
                <td className="px-4 py-3">{r.children}</td>
                <td className="px-4 py-3">{r.psych}</td>
                <td className="px-4 py-3">{r.digital}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {index.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-safe-800 mb-4">Справочник по странам</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {index.map((e) => (
              <div key={e.id} className="safe-card">
                <div className="font-semibold text-lg mb-1">{e.country}</div>
                {e.laws && (
                  <p className="text-sm text-slate-700 mb-1">
                    <span className="text-xs uppercase tracking-widest text-teal-700">Законы:</span> {e.laws}
                  </p>
                )}
                {e.documents && (
                  <p className="text-sm text-slate-700 mb-1">
                    <span className="text-xs uppercase tracking-widest text-teal-700">Документы:</span> {e.documents}
                  </p>
                )}
                {e.phones && (
                  <p className="text-sm text-slate-700 mb-1">
                    <span className="text-xs uppercase tracking-widest text-teal-700">Телефоны:</span> {e.phones}
                  </p>
                )}
                {e.notes && <p className="text-xs text-slate-500 italic mt-2">{e.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
