import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getChecklists,
  subscribeContent,
  applySeedTransforms,
  type AdminChecklist,
} from '../../lib/contentStore'

interface ChecklistItem { id: string; text: string }

function toItems(arr: string[]): ChecklistItem[] {
  return (arr || []).map((t, i) => ({ id: 'i' + i, text: t }))
}

function exportAsTxt(name: string, items: ChecklistItem[], checked: Record<string, boolean>) {
  const content = `${name}\n\n` +
    items.map(item => `[${checked[item.id] ? 'x' : ' '}] ${item.text}`).join('\n') +
    '\n\nGenerated privately. For your safety only.'

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${name.toLowerCase().replace(/\s/g, '_')}_checklist.txt`
  link.click()
  URL.revokeObjectURL(url)
}

function printPDF(name: string, items: ChecklistItem[], checked: Record<string, boolean>) {
  const win = window.open('', '_blank')
  if (!win) return

  const html = `
    <html><head><title>${name}</title><style>
    body { font-family: system-ui, sans-serif; margin: 40px; line-height: 1.55; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    ul { list-style: none; padding: 0; }
    li { padding: 6px 0; border-bottom: 1px solid #eee; }
    .checked::before { content: '☑ '; color:#0f766e; }
    .unchecked::before { content: '☐ '; }
    .note { font-size: 11px; color: #666; margin-top: 30px; }
    </style></head>
    <body>
      <h1>${name}</h1>
      <p>Private copy. Generated for your use only. Keep safe.</p>
      <ul>${items.map(i => `<li class="${checked[i.id] ? 'checked' : 'unchecked'}">${i.text}</li>`).join('')}</ul>
      <div class="note">This document does not contain any personal identifiers.</div>
    </body></html>
  `
  win.document.write(html)
  win.document.close()
  win.focus()
  // delay print trigger
  setTimeout(() => { win.print() }, 350)
}

function Checklist({ title, items }: { title: string; items: ChecklistItem[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }))

  const done = Object.values(checked).filter(v => v).length
  const pct = Math.round((done / items.length) * 100)

  const reset = () => setChecked({})

  return (
    <div className="safe-card mb-8">
      <div className="flex items-baseline justify-between mb-2">
        <div className="font-semibold text-xl">{title}</div>
        <div className="text-xs text-teal-600">{pct}% complete</div>
      </div>

      <div className="h-1 bg-slate-100 mb-4 rounded">
        <div className="h-1 bg-teal-700 rounded transition-all" style={{ width: `${pct}%` }} />
      </div>

      <ul className="space-y-1">
        {items.map(item => {
          const isDone = !!checked[item.id]
          return (
            <li key={item.id} className="flex items-start gap-2" onClick={() => toggle(item.id)}>
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggle(item.id)}
                className="mt-1"
              />
              <span className={isDone ? 'line-through text-slate-400' : ''}>
                {item.text}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex gap-2 text-sm">
        <button onClick={() => exportAsTxt(title, items, checked)} className="px-3 py-1 border rounded text-sm">Download .txt</button>
        <button onClick={() => printPDF(title, items, checked)} className="px-3 py-1 border rounded text-sm">Print / Save PDF</button>
        <button onClick={reset} className="px-3 py-1 text-sm text-slate-600 underline">Reset</button>
      </div>

      <p className="text-xs text-slate-500 mt-2">Checkboxes are private to your browser. All data cleared when you close the tab.</p>
    </div>
  )
}

export function Checklists() {
  const { t } = useTranslation()

  // Localized full item lists (deep researched guides for migrant women safety + timing appropriate)
  const helpersItems = toItems( t('checklists.for_friends_items', { returnObjects: true }) as string[] )
  const selfItems = toItems( t('checklists.for_you_items', { returnObjects: true }) as string[] )
  const mothersItems = toItems( t('checklists.for_mothers_items', { returnObjects: true }) as string[] )

  // Build seed checklists with stable ids, then apply admin overrides + hides.
  const seedLists = applySeedTransforms<{
    id: string
    title: string
    items: ChecklistItem[]
  }>('checklists', [
    { id: 'seed-list-friends', title: t('checklists.for_friends'), items: helpersItems },
    { id: 'seed-list-you', title: t('checklists.for_you'), items: selfItems },
    { id: 'seed-list-mothers', title: t('checklists.for_mothers'), items: mothersItems },
  ])
  const seedFriends = seedLists.find((l) => l.id === 'seed-list-friends')
  const seedYou = seedLists.find((l) => l.id === 'seed-list-you')
  const seedMothers = seedLists.find((l) => l.id === 'seed-list-mothers')

  const [expanded, setExpanded] = useState(false)
  const [admin, setAdmin] = useState<AdminChecklist[]>(() => getChecklists())
  useEffect(() => subscribeContent(() => setAdmin(getChecklists())), [])

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-semibold mb-1">{t('checklists.main_title')}</h1>
      <p className="text-slate-600 mb-6 text-sm">{t('checklists.intro') || 'Practical, private, translated action checklists. Choose one and save/print. Useful for friends/family and women on the move.'}</p>

      {admin.map((c) => (
        <Checklist key={c.id} title={c.title} items={c.items.map((i) => ({ id: i.id, text: i.text }))} />
      ))}

      {seedFriends && <Checklist title={seedFriends.title} items={seedFriends.items} />}
      {seedYou && <Checklist title={seedYou.title} items={seedYou.items} />}

      <div className="mt-2">
        <button className="text-xs mb-2 underline" onClick={() => setExpanded(v => !v)}>{expanded ? 'Hide' : 'Show'} mothers-with-children checklist</button>
        {expanded && seedMothers && <Checklist title={seedMothers.title} items={seedMothers.items} />}
      </div>

      <div className="text-xs text-slate-500 mt-4">
        These guides supplement but do not replace support from local specialists, embassies, hotlines or lawyers.
      </div>
    </div>
  )
}
