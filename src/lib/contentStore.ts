import { supabase } from '../integrations/supabase/client'

// Synchronous local cache backed by the shared cloud content table. Existing
// components can keep reading immediately while cloud hydration and live
// updates happen in the background.

export type HomeCard = {
  id: string
  title: string
  description: string
  image?: string // data URL (base64) so it persists in localStorage
  link?: string
  createdAt: number
  translations?: Record<string, Record<string, string>>
}

const STORAGE_KEY = 'atlas:home-cards:v1'
const EVENT_NAME = 'atlas:home-cards:changed'
export const ADMIN_TOKEN_KEY = 'atlas:secret-admin:token'

export function getHomeCards(): HomeCard[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as HomeCard[]
  } catch {
    return []
  }
}

function save(cards: HomeCard[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
  window.dispatchEvent(new CustomEvent(EVENT_NAME))
  persistCloud(STORAGE_KEY, cards)
}

export function addHomeCard(card: Omit<HomeCard, 'id' | 'createdAt'>): HomeCard {
  const created: HomeCard = {
    ...card,
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    createdAt: Date.now(),
  }
  const next = [created, ...getHomeCards()]
  save(next)
  return created
}

export function deleteHomeCard(id: string) {
  save(getHomeCards().filter((c) => c.id !== id))
}

export function subscribeHomeCards(cb: () => void): () => void {
  const handler = () => cb()
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener('storage', handler)
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// ---------------------------------------------------------------------------
// Generic admin-content store. All sections of the site can be edited from
// /secret-admin and the data is persisted in localStorage. Components read
// the data through these helpers and subscribe to changes.
// ---------------------------------------------------------------------------

const CHANGE_EVENT = 'atlas:content:changed'

const CONTENT_KEYS = [
  STORAGE_KEY,
  'atlas:admin:centers:v1',
  'atlas:admin:ratings:v1',
  'atlas:admin:checklists:v1',
  'atlas:admin:country-index:v1',
  'atlas:admin:library:v1',
  'atlas:admin:stories:v1',
  'atlas:admin:home-texts:v1',
  'atlas:admin:about:v1',
  'atlas:admin:hotlines:v1',
  'atlas:hotline-suggestions:v1',
  'atlas:admin:sections:v1',
  'atlas:admin:overrides:v1',
  'atlas:admin:hidden:v1',
] as const

function emitChange(key: string) {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }))
  if (key === STORAGE_KEY) window.dispatchEvent(new CustomEvent(EVENT_NAME))
  if (key === 'atlas:hotline-suggestions:v1') {
    window.dispatchEvent(new CustomEvent('atlas:inbox:changed'))
  }
}

function cacheCloudValue(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
  emitChange(key)
}

async function persistCloud(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  const adminToken = window.sessionStorage.getItem(ADMIN_TOKEN_KEY)
  if (!adminToken) return
  const { error } = await supabase.functions.invoke('site-content', {
    body: { action: 'save', key, value, adminToken },
  })
  if (error) console.error('[Atlas] Не удалось сохранить изменение в облаке', error)
}

async function refreshCloudContent() {
  const { data, error } = await supabase.from('site_content').select('key,value')
  if (error || !data) return
  for (const row of data) cacheCloudValue(row.key, row.value)
}

let cloudStarted = false
export function startCloudContentSync() {
  if (cloudStarted || typeof window === 'undefined') return
  cloudStarted = true
  void refreshCloudContent()

  const channel = supabase
    .channel('atlas-site-content-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'site_content' },
      (payload) => {
        const row = payload.new as { key?: string; value?: unknown }
        if (row?.key) cacheCloudValue(row.key, row.value)
      },
    )
    .subscribe()

  window.addEventListener('focus', refreshCloudContent)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refreshCloudContent()
  })
  window.addEventListener('beforeunload', () => void supabase.removeChannel(channel), { once: true })
}

export async function migrateLocalContentToCloud(adminToken: string) {
  const entries = CONTENT_KEYS.flatMap((key) => {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    try {
      return [{ key, value: JSON.parse(raw) }]
    } catch {
      return []
    }
  })
  const { data, error } = await supabase.functions.invoke('site-content', {
    body: { action: 'bootstrap', entries, adminToken },
  })
  if (error) throw error
  const cloudEntries = Array.isArray(data?.entries) ? data.entries : []
  for (const entry of cloudEntries) {
    if (typeof entry?.key === 'string') cacheCloudValue(entry.key, entry.value)
  }
}

startCloudContentSync()

function readList<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function writeList<T>(key: string, list: T[]) {
  window.localStorage.setItem(key, JSON.stringify(list))
  emitChange(key)
  persistCloud(key, list)
}

function readObject<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeObject<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
  emitChange(key)
  persistCloud(key, value)
}

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function subscribeContent(cb: () => void): () => void {
  const handler = () => cb()
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

// ---- 1. Map centers --------------------------------------------------------
// Stored as plain objects. They are merged with the seed map data in MapView.
// A translations map is `{ fieldName: { lang: text } }`. It is populated
// automatically by the admin form when the user saves a center so that
// the description shows up in every UI language.
export type Translations = Record<string, Record<string, string>>

export type AdminCenter = {
  id: string
  name: string
  city: string
  country: string
  address?: string
  contact?: string
  website?: string
  description?: string
  lat?: number
  lng?: number
  category?: string
  createdAt: number
  translations?: Translations
  // Extended fields for the redesigned map card
  email?: string
  hours?: string
  cost?: 'free' | 'partial' | 'paid' | ''
  languages?: string
  categories?: string[]
  photo?: string // data URL
  open24?: boolean
}
const K_CENTERS = 'atlas:admin:centers:v1'
export const getCenters = () => readList<AdminCenter>(K_CENTERS)
export const addCenter = (c: Omit<AdminCenter, 'id' | 'createdAt'>) => {
  const item: AdminCenter = { ...c, id: newId(), createdAt: Date.now() }
  writeList(K_CENTERS, [item, ...getCenters()])
  return item
}
export const updateCenter = (id: string, patch: Partial<AdminCenter>) =>
  writeList(K_CENTERS, getCenters().map((c) => (c.id === id ? { ...c, ...patch } : c)))
export const deleteCenter = (id: string) =>
  writeList(K_CENTERS, getCenters().filter((c) => c.id !== id))

// ---- 2. Country safety ratings --------------------------------------------
export type CountryRating = {
  id: string
  country: string
  overall: string
  safety: string
  legal: string
  children: string
  psych: string
  digital: string
  color?: string // hex, used on the rights map
  risks?: string
  translations?: Translations
}
const K_RATINGS = 'atlas:admin:ratings:v1'
export const getRatings = () => readList<CountryRating>(K_RATINGS)
export const addRating = (r: Omit<CountryRating, 'id'>) => {
  const item: CountryRating = { ...r, id: newId() }
  writeList(K_RATINGS, [...getRatings(), item])
  return item
}
export const updateRating = (id: string, patch: Partial<CountryRating>) =>
  writeList(K_RATINGS, getRatings().map((r) => (r.id === id ? { ...r, ...patch } : r)))
export const deleteRating = (id: string) =>
  writeList(K_RATINGS, getRatings().filter((r) => r.id !== id))

// ---- 3. Custom checklists --------------------------------------------------
export type ChecklistTask = { id: string; text: string }
export type AdminChecklist = {
  id: string
  title: string
  description?: string
  items: ChecklistTask[]
  createdAt: number
  translations?: Translations // fields: title, description, item_<id>
}
const K_LISTS = 'atlas:admin:checklists:v1'
export const getChecklists = () => readList<AdminChecklist>(K_LISTS)
export const addChecklist = (c: Omit<AdminChecklist, 'id' | 'createdAt'>) => {
  const item: AdminChecklist = { ...c, id: newId(), createdAt: Date.now() }
  writeList(K_LISTS, [item, ...getChecklists()])
  return item
}
export const updateChecklist = (id: string, patch: Partial<AdminChecklist>) =>
  writeList(K_LISTS, getChecklists().map((c) => (c.id === id ? { ...c, ...patch } : c)))
export const deleteChecklist = (id: string) =>
  writeList(K_LISTS, getChecklists().filter((c) => c.id !== id))

// ---- 4. Country index ------------------------------------------------------
export type CountryIndexEntry = {
  id: string
  country: string
  laws: string
  documents: string
  phones: string
  notes?: string
  translations?: Translations
}
const K_INDEX = 'atlas:admin:country-index:v1'
export const getCountryIndex = () => readList<CountryIndexEntry>(K_INDEX)
export const addCountryIndex = (e: Omit<CountryIndexEntry, 'id'>) => {
  const item: CountryIndexEntry = { ...e, id: newId() }
  writeList(K_INDEX, [item, ...getCountryIndex()])
  return item
}
export const updateCountryIndex = (id: string, patch: Partial<CountryIndexEntry>) =>
  writeList(K_INDEX, getCountryIndex().map((e) => (e.id === id ? { ...e, ...patch } : e)))
export const deleteCountryIndex = (id: string) =>
  writeList(K_INDEX, getCountryIndex().filter((e) => e.id !== id))

// ---- 5. Library articles ---------------------------------------------------
export type LibraryArticle = {
  id: string
  title: string
  category: string
  text: string
  downloadUrl?: string
  image?: string
  createdAt: number
  translations?: Translations
}
const K_LIBRARY = 'atlas:admin:library:v1'
export const getLibrary = () => readList<LibraryArticle>(K_LIBRARY)
export const addLibrary = (a: Omit<LibraryArticle, 'id' | 'createdAt'>) => {
  const item: LibraryArticle = { ...a, id: newId(), createdAt: Date.now() }
  writeList(K_LIBRARY, [item, ...getLibrary()])
  return item
}
export const updateLibrary = (id: string, patch: Partial<LibraryArticle>) =>
  writeList(K_LIBRARY, getLibrary().map((a) => (a.id === id ? { ...a, ...patch } : a)))
export const deleteLibrary = (id: string) =>
  writeList(K_LIBRARY, getLibrary().filter((a) => a.id !== id))

// ---- 6. Stories ------------------------------------------------------------
export type AdminStory = {
  id: string
  name: string
  photo?: string
  title?: string
  text: string
  createdAt: number
  translations?: Translations
}
const K_STORIES = 'atlas:admin:stories:v1'
export const getStories = () => readList<AdminStory>(K_STORIES)
export const addStory = (s: Omit<AdminStory, 'id' | 'createdAt'>) => {
  const item: AdminStory = { ...s, id: newId(), createdAt: Date.now() }
  writeList(K_STORIES, [item, ...getStories()])
  return item
}
export const updateStory = (id: string, patch: Partial<AdminStory>) =>
  writeList(K_STORIES, getStories().map((s) => (s.id === id ? { ...s, ...patch } : s)))
export const deleteStory = (id: string) =>
  writeList(K_STORIES, getStories().filter((s) => s.id !== id))

// ---- 7. Home page texts (hero title / intro / contacts) -------------------
export type HomeTexts = {
  title?: string
  intro?: string
  contact?: string
  translations?: Translations
}
const K_HOME = 'atlas:admin:home-texts:v1'
export const getHomeTexts = (): HomeTexts => readObject<HomeTexts>(K_HOME) || {}
export const saveHomeTexts = (t: HomeTexts) => writeObject(K_HOME, t)

// ---- 8. About page --------------------------------------------------------
export type AboutTexts = {
  title?: string
  intro?: string
  mission?: string
  includes?: string
  principles?: string
  photo?: string // data URL, admin-uploaded
  translations?: Translations
}
const K_ABOUT = 'atlas:admin:about:v1'
export const getAboutTexts = (): AboutTexts => readObject<AboutTexts>(K_ABOUT) || {}
export const saveAboutTexts = (t: AboutTexts) => writeObject(K_ABOUT, t)

// ---- 9. Hotlines (separate section, grouped by country) -------------------
// `country` empty (or scope === 'international') means the number is shown
// for every country as an international hotline.
export type AdminHotline = {
  id: string
  title: string
  country: string // '' for international
  scope?: 'country' | 'international' | 'eu'
  phone: string
  hours?: string
  languages?: string
  note?: string
  website?: string
  createdAt: number
  translations?: Translations
}
const K_HOTLINES = 'atlas:admin:hotlines:v1'
export const getHotlines = () =>
  readList<AdminHotline & { scope?: AdminHotline['scope'] | 'russia' }>(K_HOTLINES).map((item) =>
    item.scope === 'russia' ? { ...item, scope: 'eu' as const, country: 'ЕС' } : item
  )
export const addHotline = (h: Omit<AdminHotline, 'id' | 'createdAt'>) => {
  const item: AdminHotline = { ...h, id: newId(), createdAt: Date.now() }
  writeList(K_HOTLINES, [item, ...getHotlines()])
  return item
}
export const updateHotline = (id: string, patch: Partial<AdminHotline>) =>
  writeList(K_HOTLINES, getHotlines().map((h) => (h.id === id ? { ...h, ...patch } : h)))
export const deleteHotline = (id: string) =>
  writeList(K_HOTLINES, getHotlines().filter((h) => h.id !== id))

// ---- 10. Hotline suggestions from visitors (moderation queue) --------------
export type PendingHotline = {
  id: number
  title?: string
  country: string // '' for international
  scope: 'country' | 'international' | 'eu'
  phone: string
  comment?: string
}
const K_HOTLINE_QUEUE = 'atlas:hotline-suggestions:v1'
export const getPendingHotlines = () =>
  readList<PendingHotline & { scope: PendingHotline['scope'] | 'russia' }>(K_HOTLINE_QUEUE).map((item) =>
    item.scope === 'russia' ? { ...item, scope: 'eu' as const, country: 'ЕС' } : item
  )
export function addPendingHotline(h: Omit<PendingHotline, 'id'>) {
  const item: PendingHotline = { ...h, id: Date.now() }
  writeList(K_HOTLINE_QUEUE, [item, ...getPendingHotlines()])
  try {
    window.dispatchEvent(new CustomEvent('atlas:inbox:changed'))
  } catch {
    /* noop */
  }
  return item
}
export function removePendingHotline(id: number) {
  writeList(K_HOTLINE_QUEUE, getPendingHotlines().filter((h) => h.id !== id))
  try {
    window.dispatchEvent(new CustomEvent('atlas:inbox:changed'))
  } catch {
    /* noop */
  }
}


// ---------------------------------------------------------------------------
// 8. Site section visibility (admin controlled)
// Each public section of the site can be hidden from visitors and brought
// back later — only from the admin panel.
// ---------------------------------------------------------------------------

const K_SECTIONS = 'atlas:admin:sections:v1'

export type SiteSectionKey =
  | 'map'
  | 'hotlines'
  | 'chat'
  | 'checklists'
  | 'stories'
  | 'suggest'
  | 'research'
  | 'diplomacy'
  | 'about'


// Default visibility. The anonymous help section (chat) is hidden until an
// admin turns it back on.
const DEFAULT_SECTION_VISIBILITY: Record<SiteSectionKey, boolean> = {
  map: true,
  hotlines: true,

  chat: false,
  checklists: true,
  stories: true,
  suggest: true,
  research: true,
  diplomacy: true,
  about: true,
}

export function getSectionVisibility(): Record<SiteSectionKey, boolean> {
  const stored = readObject<Partial<Record<SiteSectionKey, boolean>>>(K_SECTIONS) || {}
  return { ...DEFAULT_SECTION_VISIBILITY, ...stored }
}

export function isSectionVisible(key: SiteSectionKey): boolean {
  return getSectionVisibility()[key] !== false
}

export function setSectionVisible(key: SiteSectionKey, visible: boolean) {
  const stored = readObject<Partial<Record<SiteSectionKey, boolean>>>(K_SECTIONS) || {}
  stored[key] = visible
  writeObject(K_SECTIONS, stored)
}

// ---------------------------------------------------------------------------
// 9. Seed-item overrides + hidden list
// The site ships with hardcoded "seed" items (centers from demoData,
// translations placeholders, etc.). The admin must be able to edit or hide
// them WITHOUT removing them from the source code. We store:
//   - overrides[section][seedId] = partial patch merged on top of the seed
//   - hidden[section] = string[] of seed ids that should not render
// ---------------------------------------------------------------------------

const K_OVERRIDES = 'atlas:admin:overrides:v1'
const K_HIDDEN = 'atlas:admin:hidden:v1'

type OverrideMap = Record<string, Record<string, any>>
type HiddenMap = Record<string, string[]>

export function getSectionOverrides(section: string): Record<string, any> {
  const all = readObject<OverrideMap>(K_OVERRIDES) || {}
  return all[section] || {}
}
export function getSeedOverride<T = any>(section: string, id: string): Partial<T> | null {
  return (getSectionOverrides(section)[id] as Partial<T>) || null
}
export function setSeedOverride(section: string, id: string, patch: Record<string, any>) {
  const all = readObject<OverrideMap>(K_OVERRIDES) || {}
  all[section] = { ...(all[section] || {}), [id]: patch }
  writeObject(K_OVERRIDES, all)
}
export function clearSeedOverride(section: string, id: string) {
  const all = readObject<OverrideMap>(K_OVERRIDES) || {}
  if (all[section] && all[section][id]) {
    delete all[section][id]
    writeObject(K_OVERRIDES, all)
  }
}
export function getHidden(section: string): string[] {
  const all = readObject<HiddenMap>(K_HIDDEN) || {}
  return all[section] || []
}
export function isSeedHidden(section: string, id: string): boolean {
  return getHidden(section).includes(id)
}
export function hideSeed(section: string, id: string) {
  const all = readObject<HiddenMap>(K_HIDDEN) || {}
  const cur = new Set(all[section] || [])
  cur.add(id)
  all[section] = Array.from(cur)
  writeObject(K_HIDDEN, all)
}
export function unhideSeed(section: string, id: string) {
  const all = readObject<HiddenMap>(K_HIDDEN) || {}
  all[section] = (all[section] || []).filter((x) => x !== id)
  writeObject(K_HIDDEN, all)
}

/**
 * Apply hidden filter + overrides to a list of seed items.
 * Each seed must have a stable `id` (string).
 */
export function applySeedTransforms<T extends { id: string }>(
  section: string,
  seeds: T[]
): T[] {
  const hidden = new Set(getHidden(section))
  const overrides = getSectionOverrides(section)
  const out: T[] = []
  for (const s of seeds) {
    if (hidden.has(s.id)) continue
    const patch = overrides[s.id]
    out.push(patch ? deepMerge(s, patch) : s)
  }
  return out
}

function deepMerge<T>(base: T, patch: any): T {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) return patch as T
  const result: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) }
  for (const k of Object.keys(patch)) {
    const bv = (base as any)?.[k]
    const pv = patch[k]
    if (pv && typeof pv === 'object' && !Array.isArray(pv) && bv && typeof bv === 'object') {
      result[k] = deepMerge(bv, pv)
    } else {
      result[k] = pv
    }
  }
  return result
}