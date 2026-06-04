import { useTranslation } from 'react-i18next'

export function SafeBridgeIndex() {
  const { t } = useTranslation()

  const cols = t('safebridge.col', { returnObjects: true }) as any
  const rows = t('safebridge.demo', { returnObjects: true }) as any[]

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
            {rows.map((r: any, i: number) => (
              <tr key={i} className="border-b last:border-none">
                <td className="px-4 py-3 font-medium">{r.country}</td>
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
    </div>
  )
}
