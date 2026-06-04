import { useTranslation } from 'react-i18next'

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="safe-card p-5 flex flex-col">
      <div className="h-28 mb-4 bg-gradient-to-br from-slate-100 to-white rounded flex items-center justify-center text-slate-400 text-xs tracking-widest">IMAGE PLACEHOLDER</div>
      <div className="font-semibold mb-2 text-lg">{title}</div>
      <p className="text-sm text-slate-600 flex-1">{desc}</p>
      <button className="mt-4 text-left text-sm underline text-teal-700 self-start">Read</button>
    </div>
  )
}

export function DigitalDiplomacy() {
  const { t } = useTranslation()

  const items = [
    { title: t('diplomacy.item1_title'), desc: t('diplomacy.item1_desc') },
    { title: t('diplomacy.item2_title'), desc: t('diplomacy.item2_desc') },
    { title: t('diplomacy.item3_title'), desc: t('diplomacy.item3_desc') },
    { title: t('diplomacy.item4_title'), desc: t('diplomacy.item4_desc') },
  ]

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <div className="mb-8">
        <div className="text-sm uppercase tracking-widest text-teal-700 font-medium mb-1">{t('diplomacy.title')}</div>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">{t('diplomacy.title')}</h1>
        <p className="max-w-3xl text-slate-600 mb-2">{t('diplomacy.intro')}</p>
        <p className="text-xs text-slate-500">{t('diplomacy.empty_note')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {items.map((it, idx) => (
          <Card key={idx} title={it.title} desc={it.desc} />
        ))}
      </div>
    </div>
  )
}
