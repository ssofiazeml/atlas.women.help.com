// Centralized adapters that expose the hardcoded "seed" items
// (centers, ratings, checklists, library placeholders, stories, home nav
// cards) with stable string ids so the admin can edit / hide / restore them.

import i18n from '../i18n/config'
import { SEED_LOCATIONS_EXPORT } from './demoData'
import { PUBLISHED_STORIES_EXPORT } from '../features/stories/storiesSeed'

// ---------- centers ---------------------------------------------------------
export type SeedCenter = {
  id: string
  name: string
  city?: string
  country?: string
  category?: string
  contact_phone?: string
  contact_web?: string
  description?: string
  lat?: number
  lng?: number
}

function pickLang(rec: Record<string, string> | undefined, lang: string): string {
  if (!rec) return ''
  return rec[lang] || rec[lang.split('-')[0]] || rec.en || Object.values(rec)[0] || ''
}

export function getSeedCenters(): SeedCenter[] {
  const lang = i18n.language || 'en'
  return SEED_LOCATIONS_EXPORT.map((l) => ({
    id: `seed-center-${l.id}`,
    name: pickLang(l.name as any, lang),
    city: l.city,
    country: l.country,
    category: (l.category && l.category[0]) || 'shelter',
    contact_phone: l.contact_phone,
    contact_web: l.contact_web,
    description: pickLang(l.description as any, lang),
    lat: l.lat,
    lng: l.lng,
  }))
}

// ---------- ratings (i18n safebridge.demo) ----------------------------------
export type SeedRating = {
  id: string
  country: string
  overall: string
  safety: string
  legal: string
  children: string
  psych: string
  digital: string
  color?: string
}

export function getSeedRatings(): SeedRating[] {
  const rows = (i18n.t('safebridge.demo', { returnObjects: true }) as any[]) || []
  return (Array.isArray(rows) ? rows : []).map((r, i) => ({
    id: `seed-rating-${i}`,
    country: String(r.country ?? ''),
    overall: String(r.overall ?? ''),
    safety: String(r.safety ?? ''),
    legal: String(r.legal ?? ''),
    children: String(r.children ?? ''),
    psych: String(r.psych ?? ''),
    digital: String(r.digital ?? ''),
    color: r.color,
  }))
}

// ---------- checklists (3 built-in lists) -----------------------------------
export type SeedChecklist = {
  id: string
  title: string
  items: { id: string; text: string }[]
}

function listFromI18n(titleKey: string, itemsKey: string, id: string): SeedChecklist {
  const items = (i18n.t(itemsKey, { returnObjects: true }) as string[]) || []
  return {
    id,
    title: i18n.t(titleKey),
    items: (Array.isArray(items) ? items : []).map((t, i) => ({ id: `${id}-i${i}`, text: t })),
  }
}

export function getSeedChecklists(): SeedChecklist[] {
  return [
    listFromI18n('checklists.for_friends', 'checklists.for_friends_items', 'seed-list-friends'),
    listFromI18n('checklists.for_you', 'checklists.for_you_items', 'seed-list-you'),
    listFromI18n('checklists.for_mothers', 'checklists.for_mothers_items', 'seed-list-mothers'),
  ]
}

// ---------- library placeholders --------------------------------------------
export type SeedLibrary = {
  id: string
  title: string
  author?: string
  date?: string
  category?: string
  abstract?: string
}

export function getSeedLibrary(): SeedLibrary[] {
  const rows = (i18n.t('research.placeholders', { returnObjects: true }) as any[]) || []
  return (Array.isArray(rows) ? rows : []).map((r, i) => ({
    id: `seed-library-${i}`,
    title: String(r.title ?? ''),
    author: r.author,
    date: r.date,
    category: r.cat,
    abstract: r.abstract,
  }))
}

// ---------- stories ---------------------------------------------------------
export type SeedStory = {
  id: string
  title: string
  situation: string
  actions: string
  outcome: string
  tags?: string[]
}

export function getSeedStories(): SeedStory[] {
  const lang = i18n.language || 'en'
  return PUBLISHED_STORIES_EXPORT.map((s) => ({
    id: `seed-story-${s.id}`,
    title: pickLang(s.title, lang),
    situation: pickLang(s.situation, lang),
    actions: pickLang(s.actions, lang),
    outcome: pickLang(s.outcome, lang),
    tags: s.tags,
  }))
}

// ---------- home nav cards --------------------------------------------------
export type SeedHomeCard = {
  id: string
  title: string
  description: string
  link: string
}

export function getSeedHomeCards(): SeedHomeCard[] {
  const t = (k: string) => i18n.t(k)
  return [
    { id: 'seed-card-map', title: t('home.map'), description: t('home.map_desc'), link: '/map' },
    { id: 'seed-card-chat', title: t('home.chat'), description: t('home.chat_desc'), link: '/chat' },
    { id: 'seed-card-checklists', title: t('home.checklists'), description: t('home.checklists_desc'), link: '/checklists' },
    { id: 'seed-card-stories', title: t('home.stories'), description: t('home.stories_desc'), link: '/stories' },
    { id: 'seed-card-research', title: t('nav.research'), description: t('research.intro'), link: '/research' },
    { id: 'seed-card-diplomacy', title: t('nav.diplomacy'), description: t('diplomacy.intro'), link: '/diplomacy' },
    { id: 'seed-card-index', title: t('nav.index'), description: t('safebridge.intro'), link: '/index' },
    { id: 'seed-card-rightsmap', title: t('nav.rightsmap'), description: t('rightsmap.intro'), link: '/rightsmap' },
  ]
}