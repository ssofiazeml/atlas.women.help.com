// Simple localStorage-backed content store for user-added home page cards.
// Data is persisted in the browser. Add/remove items from the secret admin
// panel and they will appear on the home page automatically.

export type HomeCard = {
  id: string
  title: string
  description: string
  image?: string // data URL (base64) so it persists in localStorage
  link?: string
  createdAt: number
}

const STORAGE_KEY = 'atlas:home-cards:v1'
const EVENT_NAME = 'atlas:home-cards:changed'

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
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }))
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
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }))
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
}
const K_HOME = 'atlas:admin:home-texts:v1'
export const getHomeTexts = (): HomeTexts => readObject<HomeTexts>(K_HOME) || {}
export const saveHomeTexts = (t: HomeTexts) => writeObject(K_HOME, t)