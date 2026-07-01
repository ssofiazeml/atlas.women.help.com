import React, { useEffect, useState } from 'react'
import { geocodeAddress, translateFields } from '../../lib/translate'
import {
  // home cards (already shipped)
  addHomeCard,
  deleteHomeCard,
  getHomeCards,
  readFileAsDataUrl,
  subscribeHomeCards,
  type HomeCard,
  // generic content
  subscribeContent,
  // centers
  getCenters,
  addCenter,
  updateCenter,
  deleteCenter,
  type AdminCenter,
  // ratings
  getRatings,
  addRating,
  updateRating,
  deleteRating,
  type CountryRating,
  // checklists
  getChecklists,
  addChecklist,
  updateChecklist,
  deleteChecklist,
  type AdminChecklist,
  // country index
  getCountryIndex,
  addCountryIndex,
  updateCountryIndex,
  deleteCountryIndex,
  type CountryIndexEntry,
  // library
  getLibrary,
  addLibrary,
  updateLibrary,
  deleteLibrary,
  type LibraryArticle,
  // stories
  getStories,
  addStory,
  updateStory,
  deleteStory,
  type AdminStory,
  // home texts
  getHomeTexts,
  saveHomeTexts,
  type HomeTexts,
} from '../../lib/contentStore'
import {
  setSeedOverride,
  clearSeedOverride,
  getSeedOverride,
  hideSeed,
  unhideSeed,
  getHidden,
  isSeedHidden,
  applySeedTransforms,
} from '../../lib/contentStore'
import {
  getSeedCenters,
  getSeedRatings,
  getSeedChecklists,
  getSeedLibrary,
  getSeedStories,
  getSeedHomeCards,
  type SeedCenter,
  type SeedRating,
  type SeedChecklist,
  type SeedLibrary,
  type SeedStory,
  type SeedHomeCard,
} from '../../lib/seeds'

const ADMIN_PASSWORD = 'Admin2026!'
const SESSION_KEY = 'atlas:secret-admin:authed'

type TabKey =
  | 'home'
  | 'centers'
  | 'ratings'
  | 'checklists'
  | 'country-index'
  | 'library'
  | 'stories'
  | 'cards'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: 'Главная — общие тексты' },
  { key: 'centers', label: 'Карта центров помощи' },
  { key: 'ratings', label: 'Рейтинг безопасности стран' },
  { key: 'checklists', label: 'Чек-листы' },
  { key: 'country-index', label: 'Индекс стран' },
  { key: 'library', label: 'Библиотека' },
  { key: 'stories', label: 'Истории девушек' },
  { key: 'cards', label: 'Карточки на главной' },
]

export function SecretAdmin() {
  const [authed, setAuthed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.sessionStorage.getItem(SESSION_KEY) === '1'
  })

  if (!authed) {
    return (
      <LoginGate
        onSuccess={() => {
          window.sessionStorage.setItem(SESSION_KEY, '1')
          setAuthed(true)
        }}
      />
    )
  }

  return (
    <AdminShell
      onLogout={() => {
        window.sessionStorage.removeItem(SESSION_KEY)
        setAuthed(false)
      }}
    />
  )
}

function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setError('')
      onSuccess()
    } else {
      setError('Неверный пароль. Попробуйте ещё раз.')
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-5 py-16">
      <form onSubmit={submit} className="safe-card w-full max-w-sm bg-white">
        <h1 className="text-2xl font-semibold text-safe-800 mb-2">Вход в админку</h1>
        <p className="text-sm text-slate-600 mb-5">
          Эта страница защищена. Введите пароль, чтобы продолжить.
        </p>
        <label className="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-safe-teal"
          placeholder="••••••••"
        />
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <button
          type="submit"
          className="mt-4 w-full bg-safe-800 text-white rounded-md py-2 text-sm font-medium hover:opacity-90 transition"
        >
          Войти
        </button>
      </form>
    </main>
  )
}

function AdminShell({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<TabKey>('home')

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-safe-800 tracking-tight">
            Админ-панель
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Управляйте контентом каждого раздела сайта. Изменения сохраняются автоматически.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="text-sm text-slate-600 hover:text-safe-800 underline"
        >
          Выйти
        </button>
      </div>

      <div className="grid md:grid-cols-[240px,1fr] gap-6">
        <aside className="space-y-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full text-left text-sm px-3 py-2 rounded-md transition ${
                tab === t.key
                  ? 'bg-safe-800 text-white'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </aside>

        <section className="min-w-0">
          {tab === 'home' && <HomeTextsSection />}
          {tab === 'centers' && <CentersSection />}
          {tab === 'ratings' && <RatingsSection />}
          {tab === 'checklists' && <ChecklistsSection />}
          {tab === 'country-index' && <CountryIndexSection />}
          {tab === 'library' && <LibrarySection />}
          {tab === 'stories' && <StoriesSection />}
          {tab === 'cards' && <HomeCardsSection />}
        </section>
      </div>
    </main>
  )
}

// --- shared helpers --------------------------------------------------------
function useLive<T>(getter: () => T): [T, () => void] {
  const [value, setValue] = useState<T>(() => getter())
  const refresh = () => setValue(getter())
  useEffect(() => subscribeContent(refresh), [])
  return [value, refresh]
}

function SectionShell({
  title,
  intro,
  children,
}: {
  title: string
  intro?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-safe-800 mb-1">{title}</h2>
      {intro && <p className="text-sm text-slate-600 mb-5">{intro}</p>}
      {children}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  'w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-safe-teal'

function SaveBtn({ children = 'Сохранить' }: { children?: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="bg-safe-800 text-white rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 transition"
    >
      {children}
    </button>
  )
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-red-600 hover:underline"
    >
      Удалить
    </button>
  )
}

// === Generic seed-items block ==============================================
// Renders the built-in (hardcoded) items for a section with inline
// edit/delete controls. Edits store an override patch; deletes hide the
// item. A "restore hidden" panel lets the user bring back deleted items.

type SeedFieldType = 'text' | 'textarea' | 'color'
type SeedFieldDef = { key: string; label: string; type?: SeedFieldType }

function SeedItemsBlock<T extends { id: string }>({
  sectionKey,
  title,
  getSeeds,
  fields,
  summary,
}: {
  sectionKey: string
  title: string
  getSeeds: () => T[]
  fields: SeedFieldDef[]
  summary: (item: T) => React.ReactNode
}) {
  const [tick, setTick] = useState(0)
  useEffect(() => subscribeContent(() => setTick((x) => x + 1)), [])
  void tick

  const rawSeeds = getSeeds()
  const visible = applySeedTransforms(sectionKey, rawSeeds)
  const hiddenIds = getHidden(sectionKey)
  const hiddenItems = rawSeeds.filter((s) => hiddenIds.includes(s.id))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, any>>({})

  const startEdit = (item: T) => {
    setEditingId(item.id)
    const next: Record<string, any> = {}
    for (const f of fields) next[f.key] = (item as any)[f.key] ?? ''
    setDraft(next)
  }
  const cancelEdit = () => {
    setEditingId(null)
    setDraft({})
  }
  const [translatingId, setTranslatingId] = useState<string | null>(null)
  const saveEdit = async (id: string) => {
    // Translate the free-text fields the admin just edited so the
    // override reads correctly in every UI language.
    const textualKeys = fields
      .filter((f) => f.type !== 'color')
      .map((f) => f.key)
    setTranslatingId(id)
    try {
      const translations = await translateFields(draft, textualKeys)
      setSeedOverride(sectionKey, id, { ...draft, translations })
    } finally {
      setTranslatingId(null)
    }
    cancelEdit()
  }
  const resetItem = (id: string) => {
    if (confirm('Вернуть оригинальное содержимое (отменить все правки)?')) {
      clearSeedOverride(sectionKey, id)
      cancelEdit()
    }
  }

  return (
    <div className="mb-10">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-semibold text-safe-800">
          {title} <span className="text-xs text-slate-500 font-normal">({visible.length} видимых из {rawSeeds.length})</span>
        </h3>
      </div>

      {rawSeeds.length === 0 && (
        <p className="text-sm text-slate-500 mb-3">Встроенных элементов нет.</p>
      )}

      <div className="space-y-3">
        {rawSeeds.map((seed) => {
          if (hiddenIds.includes(seed.id)) return null
          const merged = (visible.find((v) => (v as any).id === seed.id) || seed) as T
          const hasOverride = !!getSeedOverride(sectionKey, seed.id)
          const isEditing = editingId === seed.id
          return (
            <div key={seed.id} className="safe-card bg-white">
              {isEditing ? (
                <div className="grid gap-3">
                  {fields.map((f) => (
                    <Field key={f.key} label={f.label}>
                      {f.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          value={draft[f.key] ?? ''}
                          onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                          className={inputCls}
                        />
                      ) : f.type === 'color' ? (
                        <input
                          type="color"
                          value={draft[f.key] ?? '#16a34a'}
                          onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                          className="h-10 w-20 border border-slate-300 rounded-md"
                        />
                      ) : (
                        <input
                          value={draft[f.key] ?? ''}
                          onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                          className={inputCls}
                        />
                      )}
                    </Field>
                  ))}
                  <div className="flex gap-3 items-center">
                    <button
                      type="button"
                      onClick={() => saveEdit(seed.id)}
                      className="bg-safe-800 text-white rounded-md px-3 py-1.5 text-sm font-medium hover:opacity-90"
                    >
                      {translatingId === seed.id ? 'Перевожу…' : 'Сохранить'}
                    </button>
                    <button type="button" onClick={cancelEdit} className="text-sm text-slate-600 underline">
                      Отмена
                    </button>
                    {hasOverride && (
                      <button
                        type="button"
                        onClick={() => resetItem(seed.id)}
                        className="text-xs text-amber-700 underline ml-auto"
                      >
                        Вернуть оригинал
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm text-slate-700 min-w-0 flex-1">{summary(merged)}</div>
                    {hasOverride && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded shrink-0">
                        изменено
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => startEdit(merged)}
                      className="text-xs text-safe-800 underline"
                    >
                      Редактировать
                    </button>
                    <DeleteBtn
                      onClick={() => confirm('Скрыть эту заготовку со страницы сайта?') && hideSeed(sectionKey, seed.id)}
                    />
                    {hasOverride && (
                      <button
                        type="button"
                        onClick={() => resetItem(seed.id)}
                        className="text-xs text-amber-700 underline"
                      >
                        Вернуть оригинал
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {hiddenItems.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-slate-600">
            Скрытые элементы ({hiddenItems.length}) — можно восстановить
          </summary>
          <div className="mt-2 space-y-2">
            {hiddenItems.map((h) => (
              <div key={h.id} className="flex items-center justify-between border rounded px-3 py-2 bg-slate-50">
                <div className="text-sm text-slate-700 truncate">{summary(h)}</div>
                <button
                  type="button"
                  onClick={() => unhideSeed(sectionKey, h.id)}
                  className="text-xs text-safe-800 underline ml-3 shrink-0"
                >
                  Восстановить
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// Silence unused-import linter for helpers consumed inside SeedItemsBlock.
void isSeedHidden

// === 1. HOME TEXTS =========================================================
function HomeTextsSection() {
  const [texts, setTexts] = useState<HomeTexts>(() => getHomeTexts())
  const [saved, setSaved] = useState(false)

  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const translations = await translateFields(
      { title: texts.title, intro: texts.intro, contact: texts.contact },
      ['title', 'intro', 'contact']
    )
    saveHomeTexts({ ...texts, translations })
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <SectionShell
      title="Главная страница — общие тексты"
      intro="Заголовок, подзаголовок и контакт, которые видны на главной странице сайта. Оставьте поле пустым, чтобы вернуть оригинальный текст."
    >
      <form onSubmit={submit} className="safe-card bg-white grid gap-4">
        <Field label="Главный заголовок">
          <input
            value={texts.title || ''}
            onChange={(e) => setTexts({ ...texts, title: e.target.value })}
            className={inputCls}
            placeholder="Например: Атлас — каталог помощи для женщин"
          />
        </Field>
        <Field label="Подзаголовок / описание">
          <textarea
            rows={3}
            value={texts.intro || ''}
            onChange={(e) => setTexts({ ...texts, intro: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Контакт (телефон / email / ссылка)">
          <input
            value={texts.contact || ''}
            onChange={(e) => setTexts({ ...texts, contact: e.target.value })}
            className={inputCls}
            placeholder="например: help@atlas.org"
          />
        </Field>
        <div className="flex items-center gap-3">
          <SaveBtn>{busy ? 'Перевожу и сохраняю…' : 'Сохранить'}</SaveBtn>
          {saved && <span className="text-sm text-green-700">Сохранено ✓</span>}
        </div>
      </form>
    </SectionShell>
  )
}

// === 2. CENTERS ============================================================
function CentersSection() {
  const [list] = useLive(getCenters)
  const [editing, setEditing] = useState<AdminCenter | null>(null)
  const [busy, setBusy] = useState<null | 'geocoding' | 'translating' | 'saving'>(null)
  const [geoNote, setGeoNote] = useState<string>('')
  const [draft, setDraft] = useState<Omit<AdminCenter, 'id' | 'createdAt'>>({
    name: '',
    city: '',
    country: '',
    address: '',
    contact: '',
    website: '',
    description: '',
    category: 'shelter',
  })

  const reset = () => {
    setEditing(null)
    setGeoNote('')
    setDraft({
      name: '',
      city: '',
      country: '',
      address: '',
      contact: '',
      website: '',
      description: '',
      category: 'shelter',
    })
  }

  const buildAddressQuery = (d: typeof draft) =>
    [d.address, d.city, d.country].filter(Boolean).join(', ')

  const findCoords = async () => {
    const q = buildAddressQuery(draft)
    if (!q.trim()) {
      setGeoNote('Введите адрес, город или страну, чтобы найти координаты.')
      return
    }
    setBusy('geocoding')
    setGeoNote('Ищу точные координаты…')
    const res = await geocodeAddress(q)
    setBusy(null)
    if (res) {
      setDraft((d) => ({ ...d, lat: res.lat, lng: res.lng }))
      setGeoNote(`Найдено: ${res.displayName}`)
    } else {
      setGeoNote('Не удалось найти координаты. Уточните адрес или введите широту/долготу вручную.')
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.name.trim()) return

    let finalDraft: typeof draft = { ...draft }

    // 1) Auto-geocode if the admin has not entered coordinates and
    //    an address is available.
    const hasCoords = typeof finalDraft.lat === 'number' && typeof finalDraft.lng === 'number'
    const addressQuery = buildAddressQuery(finalDraft)
    if (!hasCoords && addressQuery.trim()) {
      setBusy('geocoding')
      setGeoNote('Определяю координаты по адресу…')
      const res = await geocodeAddress(addressQuery)
      if (res) {
        finalDraft.lat = res.lat
        finalDraft.lng = res.lng
        setGeoNote(`Найдено: ${res.displayName}`)
      } else {
        setGeoNote('Координаты не найдены — центр будет в списке, но не на карте.')
      }
    }

    // 2) Translate the description (and city/country/address labels) to
    //    every supported language. The centre name is intentionally kept
    //    as the admin typed it.
    setBusy('translating')
    const translations = await translateFields(
      {
        description: finalDraft.description || '',
        city: finalDraft.city || '',
        country: finalDraft.country || '',
        address: finalDraft.address || '',
      },
      ['description', 'city', 'country', 'address']
    )
    finalDraft = { ...finalDraft, translations }

    setBusy('saving')
    if (editing) {
      updateCenter(editing.id, finalDraft)
    } else {
      addCenter(finalDraft)
    }
    setBusy(null)
    reset()
  }

  const startEdit = (c: AdminCenter) => {
    setEditing(c)
    setDraft({
      name: c.name,
      city: c.city,
      country: c.country,
      address: c.address || '',
      contact: c.contact || '',
      website: c.website || '',
      description: c.description || '',
      category: c.category || 'shelter',
    })
  }

  return (
    <SectionShell
      title="Карта центров помощи"
      intro="Добавьте центры — они появятся в списке и на карте /map. Координаты не обязательны: без них центр будет в списке, но не на карте."
    >
      <SeedItemsBlock<SeedCenter>
        sectionKey="centers"
        title="Встроенные центры (из шаблона Orchids)"
        getSeeds={getSeedCenters}
        fields={[
          { key: 'name', label: 'Название центра' },
          { key: 'city', label: 'Город' },
          { key: 'country', label: 'Страна' },
          { key: 'description', label: 'Описание', type: 'textarea' },
          { key: 'contact_phone', label: 'Телефон' },
          { key: 'contact_web', label: 'Сайт' },
        ]}
        summary={(c) => (
          <div>
            <div className="font-semibold text-slate-800">{c.name}</div>
            <div className="text-xs text-slate-500">{c.city}{c.country ? `, ${c.country}` : ''}</div>
            {c.description && <div className="text-xs text-slate-600 mt-1 line-clamp-2">{c.description}</div>}
          </div>
        )}
      />

      <form onSubmit={submit} className="safe-card bg-white grid md:grid-cols-2 gap-4 mb-8">
        <Field label="Название центра">
          <input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Категория">
          <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inputCls}>
            <option value="shelter">Убежище</option>
            <option value="legal">Юридическая помощь</option>
            <option value="psychological">Психологическая помощь</option>
            <option value="crisis">Кризисный центр</option>
            <option value="medical">Медицинская помощь</option>
            <option value="hotline">Горячая линия</option>
          </select>
        </Field>
        <Field label="Город">
          <input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Страна">
          <input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Адрес">
          <input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Контакт (телефон)">
          <input value={draft.contact} onChange={(e) => setDraft({ ...draft, contact: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Сайт / ссылка">
          <input value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} className={inputCls} placeholder="https://" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Широта (lat, опционально)">
            <input type="number" step="0.0001" value={draft.lat ?? ''} onChange={(e) => setDraft({ ...draft, lat: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} />
          </Field>
          <Field label="Долгота (lng, опционально)">
            <input type="number" step="0.0001" value={draft.lng ?? ''} onChange={(e) => setDraft({ ...draft, lng: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Описание">
            <textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <div className="md:col-span-2 flex gap-3">
          <SaveBtn>
            {busy === 'geocoding'
              ? 'Ищу координаты…'
              : busy === 'translating'
                ? 'Перевожу на все языки…'
                : busy === 'saving'
                  ? 'Сохраняю…'
                  : editing
                    ? 'Сохранить изменения'
                    : 'Добавить центр'}
          </SaveBtn>
          <button
            type="button"
            onClick={findCoords}
            className="text-sm px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50"
            disabled={busy !== null}
          >
            📍 Найти координаты по адресу
          </button>
          {editing && (
            <button type="button" onClick={reset} className="text-sm text-slate-600 underline">
              Отмена
            </button>
          )}
        </div>
        {geoNote && (
          <div className="md:col-span-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-3 py-2">
            {geoNote}
          </div>
        )}
      </form>

      <h3 className="font-semibold mb-3">Добавленные центры ({list.length})</h3>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500">Пока нет добавленных центров.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((c) => (
            <div key={c.id} className="safe-card bg-white">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-slate-500">
                    {c.city}
                    {c.country ? `, ${c.country}` : ''}
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 border rounded">{c.category}</span>
              </div>
              {c.description && <p className="text-sm text-slate-700 mt-2">{c.description}</p>}
              {c.address && <p className="text-xs text-slate-500 mt-1">📍 {c.address}</p>}
              {c.contact && <p className="text-xs text-teal-700 mt-1">📞 {c.contact}</p>}
              {c.website && <p className="text-xs text-teal-700 break-all">🌐 {c.website}</p>}
              <div className="flex gap-3 mt-3">
                <button type="button" onClick={() => startEdit(c)} className="text-xs text-safe-800 underline">
                  Редактировать
                </button>
                <DeleteBtn onClick={() => confirm('Удалить этот центр?') && deleteCenter(c.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

// === 3. RATINGS ============================================================
function RatingsSection() {
  const [list] = useLive(getRatings)
  const [editing, setEditing] = useState<CountryRating | null>(null)
  const empty: Omit<CountryRating, 'id'> = {
    country: '',
    overall: '',
    safety: '',
    legal: '',
    children: '',
    psych: '',
    digital: '',
    color: '#16a34a',
    risks: '',
  }
  const [draft, setDraft] = useState<Omit<CountryRating, 'id'>>(empty)

  const reset = () => {
    setEditing(null)
    setDraft(empty)
  }

  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.country.trim()) return
    setBusy(true)
    const translations = await translateFields(
      {
        overall: draft.overall,
        safety: draft.safety,
        legal: draft.legal,
        children: draft.children,
        psych: draft.psych,
        digital: draft.digital,
        risks: draft.risks,
      },
      ['overall', 'safety', 'legal', 'children', 'psych', 'digital', 'risks']
    )
    const withTx = { ...draft, translations }
    if (editing) updateRating(editing.id, withTx)
    else addRating(withTx)
    setBusy(false)
    reset()
  }

  return (
    <SectionShell
      title="Рейтинг безопасности стран"
      intro="Записи отображаются в разделе «Индекс SafeBridge» (/index) и на карте прав (/rightsmap). Поле «Цвет» используется для маркера страны на карте."
    >
      <SeedItemsBlock<SeedRating>
        sectionKey="ratings"
        title="Встроенные строки рейтинга"
        getSeeds={getSeedRatings}
        fields={[
          { key: 'country', label: 'Страна' },
          { key: 'overall', label: 'Общий' },
          { key: 'safety', label: 'Безопасность' },
          { key: 'legal', label: 'Юр. помощь' },
          { key: 'children', label: 'Поддержка детей' },
          { key: 'psych', label: 'Психол. помощь' },
          { key: 'digital', label: 'Цифр. безопасность' },
          { key: 'color', label: 'Цвет на карте', type: 'color' },
        ]}
        summary={(r) => (
          <div>
            <span className="font-semibold">{r.country}</span>
            <span className="text-xs text-slate-500 ml-2">общий: {r.overall} · безоп.: {r.safety} · юр.: {r.legal}</span>
          </div>
        )}
      />

      <form onSubmit={submit} className="safe-card bg-white grid md:grid-cols-2 gap-4 mb-8">
        <Field label="Страна">
          <input required value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Общий индекс">
          <input value={draft.overall} onChange={(e) => setDraft({ ...draft, overall: e.target.value })} className={inputCls} placeholder="например: A / 8.5 / Высокий" />
        </Field>
        <Field label="Безопасность">
          <input value={draft.safety} onChange={(e) => setDraft({ ...draft, safety: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Юридическая защита">
          <input value={draft.legal} onChange={(e) => setDraft({ ...draft, legal: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Защита детей">
          <input value={draft.children} onChange={(e) => setDraft({ ...draft, children: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Психологическая помощь">
          <input value={draft.psych} onChange={(e) => setDraft({ ...draft, psych: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Цифровая безопасность">
          <input value={draft.digital} onChange={(e) => setDraft({ ...draft, digital: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Цвет страны на карте">
          <input type="color" value={draft.color || '#16a34a'} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className="h-10 w-20 border border-slate-300 rounded-md" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Описание рисков">
            <textarea rows={3} value={draft.risks} onChange={(e) => setDraft({ ...draft, risks: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <div className="md:col-span-2 flex gap-3">
          <SaveBtn>{busy ? 'Перевожу…' : editing ? 'Сохранить изменения' : 'Добавить страну'}</SaveBtn>
          {editing && (
            <button type="button" onClick={reset} className="text-sm text-slate-600 underline">
              Отмена
            </button>
          )}
        </div>
      </form>

      <h3 className="font-semibold mb-3">Страны в рейтинге ({list.length})</h3>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500">Пока нет добавленных стран.</p>
      ) : (
        <div className="overflow-x-auto safe-card bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-slate-50 text-xs">
                <th className="px-3 py-2">Страна</th>
                <th className="px-3 py-2">Общий</th>
                <th className="px-3 py-2">Безоп.</th>
                <th className="px-3 py-2">Юр.</th>
                <th className="px-3 py-2">Цвет</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b last:border-none">
                  <td className="px-3 py-2 font-medium">{r.country}</td>
                  <td className="px-3 py-2">{r.overall}</td>
                  <td className="px-3 py-2">{r.safety}</td>
                  <td className="px-3 py-2">{r.legal}</td>
                  <td className="px-3 py-2">
                    <span className="inline-block w-4 h-4 rounded-full align-middle" style={{ background: r.color || '#999' }} />
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button onClick={() => { setEditing(r); setDraft(r) }} className="text-xs text-safe-800 underline mr-3">Изм.</button>
                    <DeleteBtn onClick={() => confirm('Удалить страну?') && deleteRating(r.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  )
}

// === 4. CHECKLISTS =========================================================
function ChecklistsSection() {
  const [list] = useLive(getChecklists)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<string[]>([''])
  const [editing, setEditing] = useState<AdminChecklist | null>(null)

  const reset = () => {
    setEditing(null)
    setTitle('')
    setDescription('')
    setItems([''])
  }

  const startEdit = (c: AdminChecklist) => {
    setEditing(c)
    setTitle(c.title)
    setDescription(c.description || '')
    setItems(c.items.map((i) => i.text))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const cleanItems = items
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text, i) => ({ id: `${i}-${Math.random().toString(36).slice(2, 7)}`, text }))
    if (editing) {
      updateChecklist(editing.id, { title, description, items: cleanItems })
    } else {
      addChecklist({ title, description, items: cleanItems })
    }
    reset()
  }

  return (
    <SectionShell
      title="Чек-листы"
      intro="Создавайте чек-листы для переезда и других ситуаций. Они появятся в разделе /checklists и пользователи смогут отмечать пункты."
    >
      <SeedItemsBlock<SeedChecklist>
        sectionKey="checklists"
        title="Встроенные чек-листы"
        getSeeds={getSeedChecklists}
        fields={[{ key: 'title', label: 'Название чек-листа' }]}
        summary={(c) => (
          <div>
            <div className="font-semibold">{c.title}</div>
            <div className="text-xs text-slate-500">{c.items.length} пунктов</div>
          </div>
        )}
      />

      <form onSubmit={submit} className="safe-card bg-white grid gap-4 mb-8">
        <Field label="Название чек-листа">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Краткое описание">
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
        </Field>
        <div>
          <span className="block text-xs font-medium text-slate-600 mb-1">Пункты</span>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={it}
                  onChange={(e) => setItems(items.map((v, idx) => (idx === i ? e.target.value : v)))}
                  className={inputCls}
                  placeholder={`Пункт ${i + 1}`}
                />
                <button
                  type="button"
                  onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-600 px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setItems([...items, ''])}
            className="mt-2 text-sm text-safe-800 underline"
          >
            + Добавить пункт
          </button>
        </div>
        <div className="flex gap-3">
          <SaveBtn>{editing ? 'Сохранить чек-лист' : 'Создать чек-лист'}</SaveBtn>
          {editing && (
            <button type="button" onClick={reset} className="text-sm text-slate-600 underline">
              Отмена
            </button>
          )}
        </div>
      </form>

      <h3 className="font-semibold mb-3">Ваши чек-листы ({list.length})</h3>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500">Пока нет чек-листов.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((c) => (
            <div key={c.id} className="safe-card bg-white">
              <div className="font-semibold">{c.title}</div>
              {c.description && <div className="text-xs text-slate-500 mb-2">{c.description}</div>}
              <ul className="text-sm list-disc pl-5 space-y-0.5">
                {c.items.map((i) => (
                  <li key={i.id}>{i.text}</li>
                ))}
              </ul>
              <div className="flex gap-3 mt-3">
                <button onClick={() => startEdit(c)} className="text-xs text-safe-800 underline">
                  Редактировать
                </button>
                <DeleteBtn onClick={() => confirm('Удалить чек-лист?') && deleteChecklist(c.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

// === 5. COUNTRY INDEX ======================================================
function CountryIndexSection() {
  const [list] = useLive(getCountryIndex)
  const empty: Omit<CountryIndexEntry, 'id'> = {
    country: '',
    laws: '',
    documents: '',
    phones: '',
    notes: '',
  }
  const [draft, setDraft] = useState<Omit<CountryIndexEntry, 'id'>>(empty)
  const [editing, setEditing] = useState<CountryIndexEntry | null>(null)

  const reset = () => {
    setEditing(null)
    setDraft(empty)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.country.trim()) return
    if (editing) updateCountryIndex(editing.id, draft)
    else addCountryIndex(draft)
    reset()
  }

  return (
    <SectionShell
      title="Индекс стран"
      intro="Справочник по странам: законы, документы, телефоны. Отображается в разделе /index под таблицей рейтинга."
    >
      <form onSubmit={submit} className="safe-card bg-white grid gap-4 mb-8">
        <Field label="Страна">
          <input required value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Законы (защита, права, иммиграция)">
          <textarea rows={3} value={draft.laws} onChange={(e) => setDraft({ ...draft, laws: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Необходимые документы">
          <textarea rows={3} value={draft.documents} onChange={(e) => setDraft({ ...draft, documents: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Важные телефоны">
          <textarea rows={2} value={draft.phones} onChange={(e) => setDraft({ ...draft, phones: e.target.value })} className={inputCls} placeholder="112 — экстренные, ..." />
        </Field>
        <Field label="Заметки">
          <textarea rows={2} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className={inputCls} />
        </Field>
        <div className="flex gap-3">
          <SaveBtn>{editing ? 'Сохранить' : 'Добавить страну'}</SaveBtn>
          {editing && (
            <button type="button" onClick={reset} className="text-sm text-slate-600 underline">
              Отмена
            </button>
          )}
        </div>
      </form>

      <h3 className="font-semibold mb-3">Страны в индексе ({list.length})</h3>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500">Пока нет записей.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((e) => (
            <div key={e.id} className="safe-card bg-white">
              <div className="font-semibold mb-1">{e.country}</div>
              {e.laws && <p className="text-xs text-slate-700"><b>Законы:</b> {e.laws}</p>}
              {e.documents && <p className="text-xs text-slate-700 mt-1"><b>Документы:</b> {e.documents}</p>}
              {e.phones && <p className="text-xs text-slate-700 mt-1"><b>Телефоны:</b> {e.phones}</p>}
              {e.notes && <p className="text-xs text-slate-500 mt-1 italic">{e.notes}</p>}
              <div className="flex gap-3 mt-3">
                <button onClick={() => { setEditing(e); setDraft(e) }} className="text-xs text-safe-800 underline">Редактировать</button>
                <DeleteBtn onClick={() => confirm('Удалить запись?') && deleteCountryIndex(e.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

// === 6. LIBRARY ============================================================
function LibrarySection() {
  const [list] = useLive(getLibrary)
  const empty: Omit<LibraryArticle, 'id' | 'createdAt'> = {
    title: '',
    category: '',
    text: '',
    downloadUrl: '',
  }
  const [draft, setDraft] = useState(empty)
  const [editing, setEditing] = useState<LibraryArticle | null>(null)

  const reset = () => {
    setEditing(null)
    setDraft(empty)
  }

  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Изображение слишком большое (макс. 2 МБ).')
      return
    }
    setDraft({ ...draft, image: await readFileAsDataUrl(file) })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.title.trim()) return
    if (editing) updateLibrary(editing.id, draft)
    else addLibrary(draft)
    reset()
  }

  return (
    <SectionShell
      title="Библиотека"
      intro="Статьи, гайды и документы — появятся на странице /research."
    >
      <SeedItemsBlock<SeedLibrary>
        sectionKey="library"
        title="Встроенные карточки библиотеки"
        getSeeds={getSeedLibrary}
        fields={[
          { key: 'title', label: 'Название' },
          { key: 'author', label: 'Автор' },
          { key: 'date', label: 'Дата' },
          { key: 'category', label: 'Категория' },
          { key: 'abstract', label: 'Краткое содержание', type: 'textarea' },
        ]}
        summary={(a) => (
          <div>
            <div className="font-semibold">{a.title}</div>
            <div className="text-xs text-slate-500">{a.author} · {a.date} · {a.category}</div>
            {a.abstract && <div className="text-xs text-slate-600 mt-1 line-clamp-2">{a.abstract}</div>}
          </div>
        )}
      />

      <form onSubmit={submit} className="safe-card bg-white grid gap-4 mb-8">
        <Field label="Название статьи">
          <input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Категория">
          <input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inputCls} placeholder="например: Юридические гайды" />
        </Field>
        <Field label="Текст / краткое содержание">
          <textarea rows={5} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Ссылка на скачивание файла (PDF и т.п.)">
          <input value={draft.downloadUrl} onChange={(e) => setDraft({ ...draft, downloadUrl: e.target.value })} className={inputCls} placeholder="https://..." />
        </Field>
        <Field label="Обложка (опционально)">
          <input type="file" accept="image/*" onChange={onImage} className="text-sm" />
          {draft.image && <img src={draft.image} alt="" className="mt-2 h-24 rounded border" />}
        </Field>
        <div className="flex gap-3">
          <SaveBtn>{editing ? 'Сохранить' : 'Опубликовать статью'}</SaveBtn>
          {editing && (
            <button type="button" onClick={reset} className="text-sm text-slate-600 underline">
              Отмена
            </button>
          )}
        </div>
      </form>

      <h3 className="font-semibold mb-3">Статьи ({list.length})</h3>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500">Пока нет статей.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((a) => (
            <div key={a.id} className="safe-card bg-white">
              {a.image && <img src={a.image} alt="" className="h-28 w-full object-cover rounded mb-2" />}
              <div className="font-semibold">{a.title}</div>
              {a.category && <div className="text-xs text-teal-700 mb-1">{a.category}</div>}
              <p className="text-sm text-slate-700 line-clamp-4">{a.text}</p>
              {a.downloadUrl && <p className="text-xs text-teal-700 mt-2 break-all">↓ {a.downloadUrl}</p>}
              <div className="flex gap-3 mt-3">
                <button onClick={() => { setEditing(a); setDraft(a) }} className="text-xs text-safe-800 underline">Редактировать</button>
                <DeleteBtn onClick={() => confirm('Удалить статью?') && deleteLibrary(a.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

// === 7. STORIES ============================================================
function StoriesSection() {
  const [list] = useLive(getStories)
  const empty: Omit<AdminStory, 'id' | 'createdAt'> = { name: '', title: '', text: '' }
  const [draft, setDraft] = useState(empty)
  const [editing, setEditing] = useState<AdminStory | null>(null)

  const reset = () => {
    setEditing(null)
    setDraft(empty)
  }

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Фото слишком большое (макс. 2 МБ).')
      return
    }
    setDraft({ ...draft, photo: await readFileAsDataUrl(file) })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.text.trim()) return
    if (editing) updateStory(editing.id, draft)
    else addStory(draft)
    reset()
  }

  return (
    <SectionShell
      title="Истории девушек"
      intro="Истории появятся в разделе /stories вместе с уже опубликованными."
    >
      <SeedItemsBlock<SeedStory>
        sectionKey="stories"
        title="Встроенные истории"
        getSeeds={getSeedStories}
        fields={[
          { key: 'title', label: 'Заголовок' },
          { key: 'situation', label: 'Ситуация', type: 'textarea' },
          { key: 'actions', label: 'Действия', type: 'textarea' },
          { key: 'outcome', label: 'Результат', type: 'textarea' },
        ]}
        summary={(s) => (
          <div>
            <div className="font-semibold">{s.title}</div>
            <div className="text-xs text-slate-600 mt-1 line-clamp-2">{s.situation}</div>
          </div>
        )}
      />

      <form onSubmit={submit} className="safe-card bg-white grid gap-4 mb-8">
        <Field label="Имя или псевдоним">
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputCls} placeholder="Анна / Аноним" />
        </Field>
        <Field label="Заголовок истории">
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Фото (опционально)">
          <input type="file" accept="image/*" onChange={onPhoto} className="text-sm" />
          {draft.photo && <img src={draft.photo} alt="" className="mt-2 h-24 w-24 object-cover rounded-full border" />}
        </Field>
        <Field label="Текст истории">
          <textarea required rows={6} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} className={inputCls} />
        </Field>
        <div className="flex gap-3">
          <SaveBtn>{editing ? 'Сохранить' : 'Опубликовать историю'}</SaveBtn>
          {editing && (
            <button type="button" onClick={reset} className="text-sm text-slate-600 underline">
              Отмена
            </button>
          )}
        </div>
      </form>

      <h3 className="font-semibold mb-3">Истории ({list.length})</h3>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500">Пока нет историй.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((s) => (
            <div key={s.id} className="safe-card bg-white">
              <div className="flex items-center gap-3 mb-2">
                {s.photo && <img src={s.photo} alt="" className="h-12 w-12 object-cover rounded-full" />}
                <div>
                  <div className="font-semibold">{s.title || 'Без заголовка'}</div>
                  <div className="text-xs text-slate-500">{s.name}</div>
                </div>
              </div>
              <p className="text-sm text-slate-700 line-clamp-5">{s.text}</p>
              <div className="flex gap-3 mt-3">
                <button onClick={() => { setEditing(s); setDraft(s) }} className="text-xs text-safe-800 underline">Редактировать</button>
                <DeleteBtn onClick={() => confirm('Удалить историю?') && deleteStory(s.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

// === 8. HOME CARDS (existing) ==============================================
function HomeCardsSection() {
  const [cards, setCards] = useState<HomeCard[]>(() => getHomeCards())
  useEffect(() => subscribeHomeCards(() => setCards(getHomeCards())), [])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [image, setImage] = useState<string | undefined>(undefined)
  const [saved, setSaved] = useState(false)

  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Изображение слишком большое (макс. 2 МБ).')
      return
    }
    setImage(await readFileAsDataUrl(file))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addHomeCard({ title, description, link: link || undefined, image })
    setTitle(''); setDescription(''); setLink(''); setImage(undefined)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <SectionShell
      title="Карточки на главной"
      intro="Дополнительные карточки на главной странице сайта (рядом со стандартными разделами)."
    >
      <SeedItemsBlock<SeedHomeCard>
        sectionKey="home-cards"
        title="Встроенные карточки на главной"
        getSeeds={getSeedHomeCards}
        fields={[
          { key: 'title', label: 'Заголовок' },
          { key: 'description', label: 'Описание', type: 'textarea' },
          { key: 'link', label: 'Ссылка' },
        ]}
        summary={(c) => (
          <div>
            <div className="font-semibold">{c.title}</div>
            <div className="text-xs text-slate-500 line-clamp-1">{c.description}</div>
            <div className="text-[10px] text-slate-400 mt-1">→ {c.link}</div>
          </div>
        )}
      />

      <form onSubmit={submit} className="safe-card bg-white grid gap-4 mb-8">
        <Field label="Заголовок"><input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
        <Field label="Описание"><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} /></Field>
        <Field label="Ссылка (опционально)"><input value={link} onChange={(e) => setLink(e.target.value)} className={inputCls} placeholder="https://… или /map" /></Field>
        <Field label="Изображение (опционально)">
          <input type="file" accept="image/*" onChange={onImage} className="text-sm" />
          {image && <img src={image} alt="" className="mt-2 h-24 rounded border" />}
        </Field>
        <div className="flex items-center gap-3">
          <SaveBtn>Добавить карточку</SaveBtn>
          {saved && <span className="text-sm text-green-700">Сохранено ✓</span>}
        </div>
      </form>

      <h3 className="font-semibold mb-3">Карточки ({cards.length})</h3>
      {cards.length === 0 ? (
        <p className="text-sm text-slate-500">Пока нет карточек.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {cards.map((c) => (
            <div key={c.id} className="safe-card bg-white">
              {c.image && <img src={c.image} alt="" className="h-28 w-full object-cover rounded mb-2" />}
              <div className="font-semibold">{c.title}</div>
              {c.description && <p className="text-slate-600 text-sm">{c.description}</p>}
              {c.link && <p className="text-xs text-slate-500 mt-1 break-all">→ {c.link}</p>}
              <DeleteBtn onClick={() => confirm('Удалить карточку?') && deleteHomeCard(c.id)} />
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}