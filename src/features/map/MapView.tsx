import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Search, Navigation, ExternalLink, X } from 'lucide-react'
import {
  getCenters,
  subscribeContent,
  type AdminCenter,
} from '../../lib/contentStore'
import { geocodeAddress, pickLocalized } from '../../lib/translate'

// Fix default marker icons for Leaflet + Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'shelter', label: 'Кризисное убежище' },
  { key: 'domestic', label: 'Домашнее насилие' },
  { key: 'sexual', label: 'Сексуальное насилие' },
  { key: 'legal', label: 'Юридическая помощь' },
  { key: 'psychological', label: 'Психологическая поддержка' },
  { key: 'migrant', label: 'Помощь мигранткам' },
  { key: 'children', label: 'Помощь детям' },
  { key: 'emergency', label: 'Экстренная помощь' },
  { key: 'medical', label: 'Медицинская помощь' },
  { key: 'hotline', label: 'Горячая линия' },
]

const highlightIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  className: 'atlas-marker-highlight',
})

function normalizeCategories(c: AdminCenter): string[] {
  if (Array.isArray(c.categories) && c.categories.length) return c.categories
  if (c.category) return [c.category]
  return []
}

function FlyTo({ target }: { target: { lat: number; lng: number; zoom?: number } | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], target.zoom ?? 13, { duration: 1.1 })
    }
  }, [target, map])
  return null
}

export function MapView() {
  const { i18n } = useTranslation()
  const lang = (i18n.language || 'en').split('-')[0]
  const [centers, setCenters] = useState<AdminCenter[]>(() => getCenters())

  useEffect(() => subscribeContent(() => setCenters(getCenters())), [])

  // ---- Search (address / org / city / country) ----
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)
  const [searchPin, setSearchPin] = useState<{ lat: number; lng: number; label: string } | null>(null)

  // ---- Filters ----
  const [filterCountry, setFilterCountry] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterLang, setFilterLang] = useState('')
  const [only24, setOnly24] = useState(false)
  const [onlyFree, setOnlyFree] = useState(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const markerRefs = useRef<Record<string, L.Marker | null>>({})
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const countries = useMemo(
    () => Array.from(new Set(centers.map((c) => c.country).filter(Boolean))).sort(),
    [centers]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return centers.filter((c) => {
      const cats = normalizeCategories(c)
      const matchesText =
        !q ||
        [c.name, c.city, c.country, c.address, c.description]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      const matchesCountry = !filterCountry || c.country === filterCountry
      const matchesCat = !filterCat || cats.includes(filterCat)
      const matchesLang = !filterLang || (c.languages || '').toLowerCase().includes(filterLang.toLowerCase())
      const matches24 = !only24 || c.open24 || /24\/?7|круглосуточно|24 hours/i.test(c.hours || '')
      const matchesFree = !onlyFree || c.cost === 'free'
      return matchesText && matchesCountry && matchesCat && matchesLang && matches24 && matchesFree
    })
  }, [centers, query, filterCountry, filterCat, filterLang, only24, onlyFree])

  const languages = useMemo(() => {
    const set = new Set<string>()
    for (const c of centers) {
      ;(c.languages || '')
        .split(/[,;/]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((l) => set.add(l))
    }
    return Array.from(set).sort()
  }, [centers])

  const handleSelectCard = (c: AdminCenter) => {
    setSelectedId(c.id)
    if (typeof c.lat === 'number' && typeof c.lng === 'number') {
      setFlyTarget({ lat: c.lat, lng: c.lng, zoom: 14 })
      setTimeout(() => {
        markerRefs.current[c.id]?.openPopup()
      }, 900)
    }
  }

  const handleSelectMarker = (c: AdminCenter) => {
    setSelectedId(c.id)
    setTimeout(() => {
      cardRefs.current[c.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
  }

  const submitSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    // Try to match an existing centre first
    const hit = filtered.find(
      (c) => c.name.toLowerCase().includes(q.toLowerCase()) && typeof c.lat === 'number'
    )
    if (hit && typeof hit.lat === 'number' && typeof hit.lng === 'number') {
      handleSelectCard(hit)
      return
    }
    setSearching(true)
    const res = await geocodeAddress(q)
    setSearching(false)
    if (res) {
      setFlyTarget({ lat: res.lat, lng: res.lng, zoom: 13 })
      setSearchPin({ lat: res.lat, lng: res.lng, label: res.displayName })
    }
  }

  const clearFilters = () => {
    setFilterCountry('')
    setFilterCat('')
    setFilterLang('')
    setOnly24(false)
    setOnlyFree(false)
    setQuery('')
    setSearchPin(null)
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-3 md:px-5 py-4 w-full">
      {/* Search + filters */}
      <form
        onSubmit={submitSearch}
        className="safe-card bg-white p-3 md:p-4 mb-4 flex flex-col gap-3"
      >
        <div className="flex items-center gap-2">
          <Search size={18} className="text-slate-500 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Страна, город, адрес, улица или название организации…"
            className="flex-1 min-w-0 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-safe-teal"
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-safe-800 text-white text-sm rounded-md px-3 md:px-4 py-2 hover:opacity-90 disabled:opacity-60 shrink-0"
          >
            {searching ? '…' : 'Найти'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className="border border-slate-200 rounded-md px-2 py-1.5 bg-white min-w-0">
            <option value="">Все страны</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="border border-slate-200 rounded-md px-2 py-1.5 bg-white min-w-0">
            <option value="">Все категории</option>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <select value={filterLang} onChange={(e) => setFilterLang(e.target.value)} className="border border-slate-200 rounded-md px-2 py-1.5 bg-white min-w-0">
            <option value="">Все языки</option>
            {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <label className="flex items-center gap-2 border border-slate-200 rounded-md px-2 py-1.5 bg-white cursor-pointer">
            <input type="checkbox" checked={only24} onChange={(e) => setOnly24(e.target.checked)} />
            <span>Круглосуточно</span>
          </label>
          <label className="flex items-center gap-2 border border-slate-200 rounded-md px-2 py-1.5 bg-white cursor-pointer">
            <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} />
            <span>Бесплатно</span>
          </label>
        </div>

        {(filterCountry || filterCat || filterLang || only24 || onlyFree || query || searchPin) && (
          <button
            type="button"
            onClick={clearFilters}
            className="self-start text-xs text-safe-800 underline"
          >
            Сбросить фильтры
          </button>
        )}
      </form>

      {/* Map + list */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-4">
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100" style={{ height: 'min(70vh, 640px)' }}>
          <MapContainer center={[20, 10]} zoom={2} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyTo target={flyTarget} />

            {filtered
              .filter((c) => typeof c.lat === 'number' && typeof c.lng === 'number')
              .map((c) => (
                <Marker
                  key={c.id}
                  position={[c.lat as number, c.lng as number]}
                  icon={selectedId === c.id ? highlightIcon : new L.Icon.Default()}
                  ref={(ref) => {
                    markerRefs.current[c.id] = ref
                  }}
                  eventHandlers={{ click: () => handleSelectMarker(c) }}
                >
                  <Popup minWidth={240}>
                    <div className="text-sm">
                      {c.photo && (
                        <img src={c.photo} alt="" className="w-full h-28 object-cover rounded mb-2" />
                      )}
                      <div className="font-semibold text-safe-800 mb-1">{c.name}</div>
                      <div className="text-xs text-slate-500 mb-1">
                        {c.city}{c.country ? `, ${c.country}` : ''}
                      </div>
                      {c.address && (
                        <div className="text-xs text-slate-600 mb-1">{pickLocalized(c, 'address', lang) || c.address}</div>
                      )}
                      {c.contact && <div className="text-xs">📞 {c.contact}</div>}
                      {c.website && (
                        <a href={c.website} target="_blank" rel="noreferrer" className="text-xs text-teal-700 underline break-all">
                          {c.website}
                        </a>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}

            {searchPin && (
              <Marker position={[searchPin.lat, searchPin.lng]}>
                <Popup>{searchPin.label}</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* List */}
        <aside className="flex flex-col gap-3 lg:max-h-[min(70vh,640px)] lg:overflow-y-auto lg:pr-1">
          <div className="text-xs text-slate-500">
            {filtered.length === 0
              ? 'Данные пока отсутствуют — по этим фильтрам ничего не найдено.'
              : `Найдено организаций: ${filtered.length}`}
          </div>

          {filtered.map((c) => (
            <CenterCard
              key={c.id}
              c={c}
              lang={lang}
              selected={selectedId === c.id}
              onSelect={() => handleSelectCard(c)}
              cardRef={(el) => {
                cardRefs.current[c.id] = el
              }}
            />
          ))}

          {centers.length === 0 && (
            <div className="safe-card text-sm text-slate-500 bg-white">
              Данные пока отсутствуют. Добавьте организации в панели администратора.
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function CenterCard({
  c,
  lang,
  selected,
  onSelect,
  cardRef,
}: {
  c: AdminCenter
  lang: string
  selected: boolean
  onSelect: () => void
  cardRef: (el: HTMLDivElement | null) => void
}) {
  const description = pickLocalized(c, 'description', lang) || c.description
  const address = pickLocalized(c, 'address', lang) || c.address
  const city = pickLocalized(c, 'city', lang) || c.city
  const country = pickLocalized(c, 'country', lang) || c.country
  const cats = normalizeCategories(c)
  const catLabel = (k: string) => CATEGORIES.find((x) => x.key === k)?.label || k
  const costLabel =
    c.cost === 'free' ? 'Бесплатно' : c.cost === 'partial' ? 'Частично бесплатно' : c.cost === 'paid' ? 'Платно' : ''

  const routeUrl =
    typeof c.lat === 'number' && typeof c.lng === 'number'
      ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`
      : c.address
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            [c.address, c.city, c.country].filter(Boolean).join(', ')
          )}`
        : null

  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      className={`safe-card bg-white cursor-pointer transition ${
        selected ? 'border-safe-teal ring-2 ring-safe-teal/40 shadow' : 'hover:border-safe-teal'
      }`}
    >
      {c.photo && (
        <img src={c.photo} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
      )}
      <h3 className="font-semibold text-safe-800 leading-snug">{c.name}</h3>
      <div className="text-xs text-slate-500 mt-0.5">
        {[city, country].filter(Boolean).join(', ')}
      </div>
      {address && <div className="text-xs text-slate-600 mt-1">📍 {address}</div>}

      {cats.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {cats.map((k) => (
            <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-safe-100 text-safe-800 border border-safe-200">
              {catLabel(k)}
            </span>
          ))}
        </div>
      )}

      <dl className="mt-3 grid grid-cols-1 gap-1 text-xs text-slate-700">
        {c.languages && (
          <div><dt className="inline text-slate-500">Языки: </dt><dd className="inline">{c.languages}</dd></div>
        )}
        {(c.hours || c.open24) && (
          <div><dt className="inline text-slate-500">Режим: </dt><dd className="inline">{c.open24 ? 'Круглосуточно' : c.hours}</dd></div>
        )}
        {costLabel && (
          <div><dt className="inline text-slate-500">Стоимость: </dt><dd className="inline">{costLabel}</dd></div>
        )}
        {c.contact && (
          <div><dt className="inline text-slate-500">Телефон: </dt><dd className="inline"><a href={`tel:${c.contact}`} className="text-teal-700">{c.contact}</a></dd></div>
        )}
        {c.email && (
          <div className="min-w-0"><dt className="inline text-slate-500">Email: </dt><dd className="inline"><a href={`mailto:${c.email}`} className="text-teal-700 break-all">{c.email}</a></dd></div>
        )}
      </dl>

      {description && (
        <p className="text-sm text-slate-700 mt-3 leading-relaxed">{description}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        {routeUrl && (
          <a
            href={routeUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 bg-safe-800 text-white text-xs rounded-md px-3 py-1.5 hover:opacity-90"
          >
            <Navigation size={14} /> Построить маршрут
          </a>
        )}
        {c.website && (
          <a
            href={c.website}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 border border-safe-800 text-safe-800 text-xs rounded-md px-3 py-1.5 hover:bg-safe-800 hover:text-white transition"
          >
            <ExternalLink size={14} /> Официальный сайт
          </a>
        )}
      </div>
    </div>
  )
}

// Prevent unused import errors
void X
