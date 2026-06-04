import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Download, ExternalLink } from 'lucide-react'
import { getLibrary, subscribeContent, type LibraryArticle } from '../../lib/contentStore'

export function ResearchLibrary() {
  const { t } = useTranslation()
  const placeholders = (t('research.placeholders', { returnObjects: true }) || []) as any[]
  const [admin, setAdmin] = useState<LibraryArticle[]>(() => getLibrary())
  useEffect(() => subscribeContent(() => setAdmin(getLibrary())), [])

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <div className="mb-8">
        <div className="text-sm uppercase tracking-widest text-teal-700 font-medium mb-1">{t('research.title')}</div>
        <h1 className="text-3xl font-semibold tracking-tight text-safe-800 mb-3">{t('research.title')}</h1>
        <p className="max-w-3xl text-slate-600">{t('research.intro')}</p>
      </div>

      {admin.length === 0 && placeholders.length === 0 && (
        <div className="mb-6 text-xs text-slate-500 border-l-2 border-slate-200 pl-3">{t('research.empty')}</div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {admin.map((a) => (
          <div key={a.id} className="safe-card p-5">
            <div className="flex gap-3 items-start">
              <div className="mt-1 text-teal-700"><BookOpen size={18} /></div>
              <div className="flex-1">
                <div className="font-semibold mb-1">{a.title}</div>
                {a.category && (
                  <div className="text-xs text-slate-500 mb-2">{a.category}</div>
                )}
                {a.image && <img src={a.image} alt="" className="rounded mb-3 h-28 w-full object-cover" />}
                <div className="text-sm leading-relaxed mb-4 text-slate-700 whitespace-pre-wrap">{a.text}</div>
                {a.downloadUrl && (
                  <a
                    href={a.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 border rounded text-xs inline-flex items-center gap-1 hover:bg-slate-50"
                  >
                    <Download size={14} /> {t('research.card.pdf')}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {placeholders.length > 0 ? (
          placeholders.map((p: any, idx: number) => (
            <div key={idx} className="safe-card p-5">
              <div className="flex gap-3 items-start">
                <div className="mt-1 text-teal-700"><BookOpen size={18} /></div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">{p.title}</div>
                  <div className="text-xs text-slate-500 mb-2">
                    {t('research.card.author_label')}: {p.author} • {t('research.card.date_label')}: {p.date} • {t('research.card.category_label')}: {p.cat}
                  </div>
                  <div className="text-sm leading-relaxed mb-4 text-slate-700">
                    {t('research.card.abstract_label')}: {p.abstract}
                  </div>
                  <div className="flex gap-3 items-center text-sm">
                    <button className="px-3 py-1 border rounded text-xs inline-flex items-center gap-1 hover:bg-slate-50">
                      <ExternalLink size={14} /> {t('research.card.open')}
                    </button>
                    <button className="px-3 py-1 border rounded text-xs inline-flex items-center gap-1 hover:bg-slate-50">
                      <Download size={14} /> {t('research.card.pdf')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : admin.length === 0 ? (
          <div className="safe-card p-5 text-sm text-slate-500">{t('research.empty')}</div>
        ) : null}
      </div>
    </div>
  )
}
