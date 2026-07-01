// Free geocoding (OpenStreetMap Nominatim) and free translation
// (MyMemory) used by the /secret-admin panel so that any content the
// admin adds automatically gets accurate map coordinates and gets
// mirrored to every supported UI language.
//
// Both services are anonymous and require no API key. They are called
// from the browser, so results are best-effort — if the network fails
// we fall back to the original text / no coordinates and the admin
// can always edit values by hand.

export const SUPPORTED_LANGS = ['en', 'ru', 'es', 'fr', 'ar', 'zh'] as const
export type Lang = (typeof SUPPORTED_LANGS)[number]

// Guess the source language from the characters used in the string.
// It only needs to distinguish the alphabets we actually ship.
export function detectLang(text: string): Lang {
  if (/[\u0400-\u04FF]/.test(text)) return 'ru'
  if (/[\u0600-\u06FF]/.test(text)) return 'ar'
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'
  if (/[àâçéèêëîïôûùüÿœæ]/i.test(text)) return 'fr'
  if (/[ñáéíóúü¿¡]/i.test(text)) return 'es'
  return 'en'
}

const MYMEMORY_TARGET: Record<Lang, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  es: 'es-ES',
  fr: 'fr-FR',
  ar: 'ar-SA',
  zh: 'zh-CN',
}

async function translateOne(text: string, source: Lang, target: Lang): Promise<string> {
  if (source === target) return text
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${MYMEMORY_TARGET[source]}|${MYMEMORY_TARGET[target]}`
    const res = await fetch(url)
    if (!res.ok) return text
    const json: any = await res.json()
    const t = json?.responseData?.translatedText
    if (typeof t === 'string' && t.trim()) return t
  } catch {
    /* ignore */
  }
  return text
}

/** Translate one string to every supported language. */
export async function translateToAll(
  text: string,
  source?: Lang
): Promise<Record<Lang, string>> {
  const out: Record<Lang, string> = {} as Record<Lang, string>
  const trimmed = (text || '').trim()
  if (!trimmed) {
    for (const l of SUPPORTED_LANGS) out[l] = ''
    return out
  }
  const src = source || detectLang(trimmed)
  out[src] = trimmed
  await Promise.all(
    SUPPORTED_LANGS.filter((l) => l !== src).map(async (l) => {
      out[l] = await translateOne(trimmed, src, l)
    })
  )
  return out
}

/**
 * Translate several named fields of an object in one shot.
 * Returns { field: { lang: text } } which callers can store on the
 * item under a `translations` key.
 */
export async function translateFields(
  obj: Record<string, string | undefined>,
  fields: string[],
  source?: Lang
): Promise<Record<string, Record<Lang, string>>> {
  const entries = await Promise.all(
    fields.map(async (f) => {
      const value = obj[f]
      if (!value || !String(value).trim()) return [f, null] as const
      return [f, await translateToAll(String(value), source)] as const
    })
  )
  const out: Record<string, Record<Lang, string>> = {}
  for (const [k, v] of entries) if (v) out[k] = v
  return out
}

/**
 * Pick the best localized value for a field. Falls back to the raw
 * string on the item, then to English, then to any available value.
 */
export function pickLocalized(
  item: any,
  field: string,
  lang: string | undefined
): string {
  if (!item) return ''
  const rec = item?.translations?.[field]
  const l = (lang || 'en').split('-')[0]
  if (rec && typeof rec === 'object') {
    if (rec[l]) return rec[l]
    if (rec.en) return rec.en
    const first = Object.values(rec).find((x) => typeof x === 'string' && x)
    if (first) return first as string
  }
  return typeof item[field] === 'string' ? item[field] : ''
}

// ---------------------------------------------------------------------------
// Geocoding (OpenStreetMap Nominatim) — free, no key. Please respect the
// public usage policy: we only call it when the admin submits a form, and
// we always send a descriptive User-Agent via the Referer header the
// browser adds automatically.
// ---------------------------------------------------------------------------

export type Geocoded = { lat: number; lng: number; displayName: string }

export async function geocodeAddress(query: string): Promise<Geocoded | null> {
  const q = query.trim()
  if (!q) return null
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=0&q=${encodeURIComponent(
      q
    )}`
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'Accept-Language': 'en' },
    })
    if (!res.ok) return null
    const arr: any = await res.json()
    if (Array.isArray(arr) && arr[0]) {
      const lat = parseFloat(arr[0].lat)
      const lng = parseFloat(arr[0].lon)
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng, displayName: String(arr[0].display_name || '') }
      }
    }
  } catch {
    /* ignore */
  }
  return null
}