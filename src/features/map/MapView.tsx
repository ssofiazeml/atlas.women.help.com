import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import { Search, Navigation, ExternalLink, Phone, X } from 'lucide-react'
import {
  getCenters,
  subscribeContent,
  applySeedTransforms,
  type AdminCenter,
} from '../../lib/contentStore'
import { geocodeAddress, pickLocalized } from '../../lib/translate'
import { getSeedCenters } from '../../lib/seeds'

// Fix default marker icons for Leaflet + Vite.
// The images are bundled from node_modules (instead of a CDN) so the pins
// always render, even when external requests are blocked.
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { CATEGORY_KEYS } from '../../lib/categories'
import { localizeSchedule, localizeLanguages } from '../../lib/humanize'

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})




// Best-effort "open now": true for anything explicitly 24/7, otherwise
// look for at least one HH:MM-HH:MM range in the hours string and check
// if the current local time falls within it.
function isOpenNow(c: AdminCenter): boolean {
  if (c.open24) return true
  const s = c.hours || ''
  if (/24\/?7|круглосуточно|24 hours|24h/i.test(s)) return true
  const ranges = Array.from(s.matchAll(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/g))
  if (ranges.length === 0) return false
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  for (const r of ranges) {
    const a = parseInt(r[1]) * 60 + parseInt(r[2])
    const b = parseInt(r[3]) * 60 + parseInt(r[4])
    if (a <= nowMin && nowMin <= b) return true
    if (b < a && (nowMin >= a || nowMin <= b)) return true // overnight
  }
  return false
}

function acceptsWithoutDocs(c: AdminCenter): boolean {
  const anyC = c as any
  if (anyC.noDocsNeeded === true || anyC.no_docs === true) return true
  const s = `${c.description || ''} ${c.languages || ''} ${anyC.access || ''}`.toLowerCase()
  return /без документ|no documents required|sans papiers|no id required|بدون وثائق|无证件|无需证件/.test(s)
}

const highlightIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,

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

// ---------- Internal routing (Leaflet Routing Machine, no Google) ----------
type RouteInfo = {
  from: { lat: number; lng: number }
  to: { lat: number; lng: number }
  distanceKm: number
  walkMin: number
  carMin: number
}

function RoutingLayer({
  from,
  to,
  onInfo,
}: {
  from: { lat: number; lng: number } | null
  to: { lat: number; lng: number } | null
  onInfo: (info: RouteInfo | null) => void
}) {
  const map = useMap()
  const ctrlRef = useRef<any>(null)

  useEffect(() => {
    if (!from || !to) {
      if (ctrlRef.current) {
        try { map.removeControl(ctrlRef.current) } catch { /* noop */ }
        ctrlRef.current = null
      }
      onInfo(null)
      return
    }
    // @ts-ignore - leaflet-routing-machine augments L at runtime
    const control = L.Routing.control({
      waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
      lineOptions: { styles: [{ color: '#0d9488', weight: 5, opacity: 0.85 }], extendToWaypoints: true, missingRouteTolerance: 0 },
      addWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      show: false, // hide the built-in text panel; we render our own summary
      routeWhileDragging: false,
      createMarker: () => null, // waypoint markers hidden; our markers already show endpoints
    } as any).addTo(map)

    control.on('routesfound', (e: any) => {
      const r = e.routes?.[0]
      if (!r) return
      const meters = r.summary?.totalDistance ?? 0
      const km = meters / 1000
      // Rough independent estimates (OSRM's totalTime is driving-only).
      // Walking ~5 km/h, driving ~40 km/h average in urban areas.
      const walkMin = Math.round((km / 5) * 60)
      const carMin = Math.round((km / 40) * 60)
      onInfo({ from, to, distanceKm: km, walkMin, carMin })
    })
    ctrlRef.current = control

    return () => {
      try { map.removeControl(control) } catch { /* noop */ }
      ctrlRef.current = null
    }
  }, [from, to, map])

  return null
}

// --------------------------------------------------------------------------

export function MapView() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'en').split('-')[0]

  const buildAll = (): AdminCenter[] => {
    const seeds = getSeedCenters().map<AdminCenter>((s) => ({
      id: s.id,
      name: s.name,
      city: s.city || '',
      country: s.country || '',
      description: s.description,
      contact: s.contact_phone,
      website: s.contact_web,
      lat: s.lat,
      lng: s.lng,
      category: s.category,
      categories: s.category ? [s.category] : [],
      createdAt: 0,
    }))
    const withOverrides = applySeedTransforms<AdminCenter>('centers', seeds)
    return [...getCenters(), ...withOverrides]
  }
  const [centers, setCenters] = useState<AdminCenter[]>(() => buildAll())
  useEffect(() => subscribeContent(() => setCenters(buildAll())), [])
  useEffect(() => setCenters(buildAll()), [i18n.language])

  // ---- Search ----
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)
  const [searchPin, setSearchPin] = useState<{ lat: number; lng: number; label: string } | null>(null)

  // ---- Filters ----
  const [filterCountry, setFilterCountry] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [only24, setOnly24] = useState(false)
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [onlyFree, setOnlyFree] = useState(false)
  const [onlyNoDocs, setOnlyNoDocs] = useState(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const markerRefs = useRef<Record<string, L.Marker | null>>({})
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // ---- Routing state ----
  const [routeFrom, setRouteFrom] = useState<{ lat: number; lng: number } | null>(null)
  const [routeTo, setRouteTo] = useState<{ lat: number; lng: number } | null>(null)
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [routeStatus, setRouteStatus] = useState<string>('')

  // Countries come from the data itself: every newly added center brings its
  // country into the filter automatically (trimmed, case-insensitive unique).
  const countries = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of centers) {
      const raw = (c.country || '').trim()
      if (!raw) continue
      const key = raw.toLowerCase()
      if (!map.has(key)) map.set(key, raw)
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, lang))
  }, [centers, lang])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return centers.filter((c) => {
      const cats = normalizeCategories(c)
      const matchesText =
        !q ||
        [c.name, c.city, c.country, c.address, c.description]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      const matchesCountry =
        !filterCountry ||
        (c.country || '').trim().toLowerCase() === filterCountry.trim().toLowerCase()
      const matchesCat = !filterCat || cats.includes(filterCat)
      const matches24 = !only24 || c.open24 || /24\/?7|круглосуточно|24 hours/i.test(c.hours || '')
      const matchesOpen = !onlyOpen || isOpenNow(c)
      const matchesFree = !onlyFree || c.cost === 'free'
      const matchesNoDocs = !onlyNoDocs || acceptsWithoutDocs(c)
      return matchesText && matchesCountry && matchesCat &&
        matches24 && matchesOpen && matchesFree && matchesNoDocs
    })
  }, [centers, query, filterCountry, filterCat, only24, onlyOpen, onlyFree, onlyNoDocs])

  const catLabel = (k: string) => t(`categories.${k}`, { defaultValue: k })

  const handleSelectCard = (c: AdminCenter) => {
    setSelectedId(c.id)
    if (typeof c.lat === 'number' && typeof c.lng === 'number') {
      setFlyTarget({ lat: c.lat, lng: c.lng, zoom: 14 })
      setTimeout(() => {
        markerRefs.current[c.id]?.openPopup()
      }, 900)
    }
  }

  // Marker click: only select + open the small popup card next to the marker.
  // The page must NOT jump to the list yet.
  const handleSelectMarker = (c: AdminCenter) => {
    setSelectedId(c.id)
  }

  // Click on the small popup card: go to the full card in the list below,
  // scroll smoothly to it and highlight it briefly.
  const goToFullCard = (c: AdminCenter) => {
    setSelectedId(c.id)
    markerRefs.current[c.id]?.closePopup()
    setTimeout(() => {
      cardRefs.current[c.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setFlashId(c.id)
      setTimeout(() => setFlashId((cur) => (cur === c.id ? null : cur)), 1800)
    }, 60)
  }

  const submitSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
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
    setOnly24(false)
    setOnlyOpen(false)
    setOnlyFree(false)
    setOnlyNoDocs(false)
    setQuery('')
    setSearchPin(null)
  }

  const buildRouteTo = (c: AdminCenter) => {
    if (typeof c.lat !== 'number' || typeof c.lng !== 'number') {
      setRouteStatus(t('map.route_no_coords'))
      return
    }
    const dest = { lat: c.lat, lng: c.lng }
    setRouteTo(dest)
    setRouteInfo(null)
    setRouteStatus(t('map.route_locating'))
    if (!navigator.geolocation) {
      setRouteStatus(t('map.route_denied'))
      return
    }
    // Geolocation is only requested at this moment, on explicit user click.
    // The coordinates are kept in memory only (never persisted, never sent
    // to any third-party — routing runs against the public OSRM demo).
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRouteFrom({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setRouteStatus('')
      },
      () => {
        setRouteStatus(t('map.route_denied'))
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 }
    )
  }

  const closeRoute = () => {
    setRouteFrom(null)
    setRouteTo(null)
    setRouteInfo(null)
    setRouteStatus('')
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
          <label htmlFor="map-search" className="sr-only">{t('map.search')}</label>
          <input
            id="map-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('map.search_placeholder', { defaultValue: 'Country, city, address or organisation name…' })}
            className="flex-1 min-w-0 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-safe-teal"
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-safe-800 text-white text-sm rounded-md px-3 md:px-4 py-2 hover:opacity-90 disabled:opacity-60 shrink-0"
          >
            {searching ? '…' : t('map.search', { defaultValue: 'Search' })}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            aria-label={t('map.all_countries')}
            className="border border-slate-200 rounded-md px-2 py-1.5 bg-white min-w-0"
          >
            <option value="">{t('map.all_countries', { defaultValue: 'All countries' })}</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            aria-label={t('map.all_categories')}
            className="border border-slate-200 rounded-md px-2 py-1.5 bg-white min-w-0"
          >
            <option value="">{t('map.all_categories', { defaultValue: 'All categories' })}</option>
            {CATEGORY_KEYS.map((k) => <option key={k} value={k}>{catLabel(k)}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <label className="flex items-center gap-2 border border-slate-200 rounded-md px-2 py-1.5 bg-white cursor-pointer">
            <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
            <span>{t('map.only_open_now')}</span>
          </label>
          <label className="flex items-center gap-2 border border-slate-200 rounded-md px-2 py-1.5 bg-white cursor-pointer">
            <input type="checkbox" checked={only24} onChange={(e) => setOnly24(e.target.checked)} />
            <span>{t('map.only_24_7', { defaultValue: '24/7' })}</span>
          </label>
          <label className="flex items-center gap-2 border border-slate-200 rounded-md px-2 py-1.5 bg-white cursor-pointer">
            <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} />
            <span>{t('map.only_free', { defaultValue: 'Free' })}</span>
          </label>
          <label className="flex items-center gap-2 border border-slate-200 rounded-md px-2 py-1.5 bg-white cursor-pointer">
            <input type="checkbox" checked={onlyNoDocs} onChange={(e) => setOnlyNoDocs(e.target.checked)} />
            <span>{t('map.only_no_docs')}</span>
          </label>
        </div>

        {(filterCountry || filterCat || only24 || onlyOpen || onlyFree || onlyNoDocs || query || searchPin) && (
          <button
            type="button"
            onClick={clearFilters}
            className="self-start text-xs text-safe-800 underline"
          >
            {t('map.clear_filters', { defaultValue: 'Clear filters' })}
          </button>
        )}
      </form>

      {/* Route summary bar */}
      {(routeInfo || routeStatus) && (
        <div className="safe-card bg-white p-3 mb-4 flex flex-wrap items-center gap-4 text-sm">
          <div className="font-semibold text-safe-800 flex items-center gap-2">
            <Navigation size={16} /> {t('map.route_title')}
          </div>
          {routeInfo ? (
            <>
              <div><span className="text-slate-500">{t('map.route_distance')}:</span> <b>{routeInfo.distanceKm.toFixed(1)} km</b></div>
              <div><span className="text-slate-500">{t('map.route_time_walk')}:</span> <b>~{routeInfo.walkMin} min</b></div>
              <div><span className="text-slate-500">{t('map.route_time_car')}:</span> <b>~{routeInfo.carMin} min</b></div>
            </>
          ) : (
            <div className="text-slate-600">{routeStatus}</div>
          )}
          <button
            onClick={closeRoute}
            className="ml-auto inline-flex items-center gap-1 text-xs text-safe-800 hover:underline"
            aria-label={t('map.route_close')}
          >
            <X size={14} /> {t('map.route_close')}
          </button>
        </div>
      )}

      {/* Map + list */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-4">
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100" style={{ height: 'min(70vh, 640px)' }}>
          <MapContainer center={[20, 10]} zoom={2} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyTo target={flyTarget} />
            <RoutingLayer from={routeFrom} to={routeTo} onInfo={setRouteInfo} />

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
                  <Popup minWidth={250} maxWidth={280} autoPan closeButton>
                    <CenterCard
                      c={c}
                      lang={lang}
                      catLabel={catLabel}
                      selected={false}
                      compact
                      onSelect={() => goToFullCard(c)}
                      onRoute={() => buildRouteTo(c)}
                      cardRef={() => {}}
                    />
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
              ? t('map.empty', { defaultValue: 'No organisations match the current filters.' })
              : t('map.found', { count: filtered.length, defaultValue: `Found: ${filtered.length}` })}
          </div>

          {filtered.map((c) => (
            <CenterCard
              key={c.id}
              c={c}
              lang={lang}
              catLabel={catLabel}
              selected={selectedId === c.id}
              flash={flashId === c.id}
              onSelect={() => handleSelectCard(c)}
              onRoute={() => buildRouteTo(c)}
              cardRef={(el) => {
                cardRefs.current[c.id] = el
              }}
            />
          ))}

          {centers.length === 0 && (
            <div className="safe-card text-sm text-slate-500 bg-white">
              {t('map.empty_all', { defaultValue: 'No data yet. Add organisations from the admin panel.' })}
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
  catLabel,
  selected,
  flash,
  compact,
  onSelect,
  onRoute,
  cardRef,
}: {
  c: AdminCenter
  lang: string
  catLabel: (k: string) => string
  selected: boolean
  flash?: boolean
  compact?: boolean
  onSelect: () => void
  onRoute: () => void
  cardRef: (el: HTMLDivElement | null) => void
}) {
  const { t } = useTranslation()
  const description = pickLocalized(c, 'description', lang) || c.description
  const address = pickLocalized(c, 'address', lang) || c.address
  const city = pickLocalized(c, 'city', lang) || c.city
  const country = pickLocalized(c, 'country', lang) || c.country
  const cats = normalizeCategories(c)
  const costLabel =
    c.cost === 'free' ? t('card.cost_free')
      : c.cost === 'partial' ? t('card.cost_partial')
        : c.cost === 'paid' ? t('card.cost_paid')
          : ''
  const hoursLabel = c.open24
    ? t('sched.round_clock', { defaultValue: t('card.open_24_7') })
    : localizeSchedule(pickLocalized(c, 'hours', lang) || c.hours, t)
  const languagesLabel = localizeLanguages(pickLocalized(c, 'languages', lang) || c.languages, t)

  const canRoute = typeof c.lat === 'number' && typeof c.lng === 'number'

  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }}
      className={`safe-card bg-white cursor-pointer transition ${
        selected ? 'border-safe-teal ring-2 ring-safe-teal/40 shadow' : 'hover:border-safe-teal'
      } ${flash ? 'atlas-card-flash' : ''} ${compact ? 'atlas-popup-card' : ''}`}
      aria-label={c.name}
    >
      {c.photo && (
        <img
          src={c.photo}
          alt={c.name}
          loading="lazy"
          className={`w-full object-cover rounded-lg mb-3 ${compact ? 'h-24' : 'h-32'}`}
        />
      )}
      <h3 className="font-semibold text-safe-800 leading-snug">{c.name}</h3>
      <div className="text-xs text-slate-500 mt-0.5">
        {[city, country].filter(Boolean).join(', ')}
      </div>
      {/* Full address of the help point */}
      {(address || city || country) && (
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
            {t('card.full_address', { defaultValue: 'Полный адрес' })}
          </div>
          <div className="text-xs text-slate-700 leading-relaxed">
            {[address, city, country].filter(Boolean).join(', ')}
          </div>
          {!compact && typeof c.lat === 'number' && typeof c.lng === 'number' && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lng}#map=17/${c.lat}/${c.lng}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-teal-700 hover:underline mt-1 inline-block"
            >
              {t('card.open_in_osm', { defaultValue: 'Открыть на карте OpenStreetMap' })}
            </a>
          )}
        </div>
      )}


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
        {languagesLabel && (
          <div><dt className="inline text-slate-500">{t('card.languages')}: </dt><dd className="inline">{languagesLabel}</dd></div>
        )}
        {hoursLabel && (
          <div><dt className="inline text-slate-500">{t('card.hours')}: </dt><dd className="inline">{hoursLabel}</dd></div>
        )}
        {costLabel && (
          <div><dt className="inline text-slate-500">{t('card.cost')}: </dt><dd className="inline">{costLabel}</dd></div>
        )}
        {c.contact && (
          <div><dt className="inline text-slate-500">{t('card.phone')}: </dt><dd className="inline"><a href={`tel:${c.contact}`} className="text-teal-700" onClick={(e) => e.stopPropagation()}>{c.contact}</a></dd></div>
        )}
        {c.email && (
          <div className="min-w-0"><dt className="inline text-slate-500">{t('card.email')}: </dt><dd className="inline"><a href={`mailto:${c.email}`} className="text-teal-700 break-all" onClick={(e) => e.stopPropagation()}>{c.email}</a></dd></div>
        )}
        {acceptsWithoutDocs(c) && (
          <div className="text-safe-teal">{t('card.no_docs_needed')}</div>
        )}
      </dl>

      {description && (
        <p className={`text-sm text-slate-700 mt-3 leading-relaxed ${compact ? 'line-clamp-3' : ''}`}>{description}</p>
      )}

      {compact && (
        <div className="mt-3 text-xs text-safe-teal font-medium">
          {t('map.open_full_card', { defaultValue: 'Open full card' })} →
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        {canRoute && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRoute() }}
            className="inline-flex items-center gap-1.5 bg-safe-800 text-white text-xs rounded-md px-3 py-1.5 hover:opacity-90"
          >
            <Navigation size={14} /> {t('card.btn_route')}
          </button>
        )}
        {c.contact && (
          <a
            href={`tel:${c.contact}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 border border-safe-800 text-safe-800 text-xs rounded-md px-3 py-1.5 hover:bg-safe-800 hover:text-white transition"
          >
            <Phone size={14} /> {t('card.btn_call')}
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
            <ExternalLink size={14} /> {t('card.btn_website')}
          </a>
        )}
      </div>
    </div>
  )
}
