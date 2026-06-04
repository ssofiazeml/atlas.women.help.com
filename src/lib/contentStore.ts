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