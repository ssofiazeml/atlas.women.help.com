import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Search, Filter } from 'lucide-react'
import { MapLocation, getMapLocations } from '../../lib/demoData'
import {
  getCenters,
  subscribeContent,
  applySeedTransforms,
  type AdminCenter,
} from '../../lib/contentStore'

// Fix default marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const categoriesList = ['shelter', 'legal', 'psychological', 'crisis', 'medical'] as const

// Live locations load now using shared demo store.
// Seed locations are passed through the admin's hide/override filter so that
// editing or hiding a center in /secret-admin is reflected here without
// changing the original design or data file.
function getCurrentLocations(): MapLocation[] {
  const seeds = getMapLocations()
  const tagged = seeds.map((l) => ({ ...l, id: `seed-center-${l.id}` as any }))
  const transformed = applySeedTransforms('centers', tagged as any[]) as any[]
  return transformed.map((l) => {
    const numericId = typeof l.id === 'string'
      ? parseInt(String(l.id).replace('seed-center-', ''), 10) || 0
      : l.id
    // Admin overrides store plain strings for name/description; normalise
    // them back into the multilang shape this component expects.
    const name = typeof l.name === 'string' ? { en: l.name } : l.name
    const description = typeof l.description === 'string' ? { en: l.description } : l.description
    return { ...l, id: numericId, name, description }
  })
}


function LocationFilters({ active, onToggle }: { active: string[]; onToggle: (cat: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {categoriesList.map(cat => {
        const selected = active.includes(cat)
        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            className={`px-3 py-1 text-xs rounded-full border transition ${selected ? 'bg-teal-700 text-white border-teal-700' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}

function useLocationFilter(locations: MapLocation[], search: string, catFilters: string[]) {
  return locations.filter(l => {
    const matchesSearch = !search ||
      Object.values(l.name).some(v => v.toLowerCase().includes(search.toLowerCase())) ||
      (l.city && l.city.toLowerCase().includes(search.toLowerCase())) ||
      (l.country && l.country.toLowerCase().includes(search.toLowerCase()))

    const matchesCat = catFilters.length === 0 || l.category.some(c => catFilters.includes(c))
    return matchesSearch && matchesCat
  })
}

function centerToLocation(c: AdminCenter, idx: number): MapLocation {
  // Descriptions were translated to every supported language when the
  // admin saved the centre. Expose them on the shared MapLocation shape
  // so the sidebar/popup can pick the current UI language transparently.
  const descByLang = c.translations?.description || {}
  return {
    id: 1_000_000 + idx,
    lat: typeof c.lat === 'number' ? c.lat : 0,
    lng: typeof c.lng === 'number' ? c.lng : 0,
    category: [c.category || 'shelter'],
    // Name is intentionally kept as the admin typed it (proper noun).
    name: { en: c.name, ru: c.name, es: c.name, fr: c.name, ar: c.name, zh: c.name },
    description: {
      en: descByLang.en || c.description || '',
      ru: descByLang.ru || c.description || '',
      es: descByLang.es || c.description || '',
      fr: descByLang.fr || c.description || '',
      ar: descByLang.ar || c.description || '',
      zh: descByLang.zh || c.description || '',
    },
    city: c.city,
    country: c.country,
    contact_phone: c.contact,
    contact_web: c.website,
  }
}

export function MapView() {
  const { i18n } = useTranslation()
  const lang = (i18n.language || 'en').split('-')[0]
  const [locations, setLocations] = useState<MapLocation[]>(() => getCurrentLocations())
  const [admin, setAdmin] = useState<AdminCenter[]>(() => getCenters())
  useEffect(
    () =>
      subscribeContent(() => {
        setAdmin(getCenters())
        setLocations(getCurrentLocations())
      }),
    []
  )
  const allLocations = [
    ...admin.map((c, i) => centerToLocation(c, i)),
    ...locations,
  ]
  const [search, setSearch] = useState('')
  const [activeCats, setActiveCats] = useState<string[]>([])

  const filtered = useLocationFilter(allLocations, search, activeCats)

  const toggleCat = (cat: string) => {
    setActiveCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  // Suggestion stub
  const [showSuggest, setShowSuggest] = useState(false)

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row max-w-screen-2xl mx-auto">
      {/* Sidebar filters */}
      <div className="w-full md:w-80 border-r border-slate-200 bg-white p-5 flex-shrink-0 overflow-auto">
        <div className="mb-4 flex items-center gap-2">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search city or name..."
            className="flex-1 border border-slate-200 px-3 py-2 rounded text-sm outline-none focus:ring-1 focus:ring-teal-700"
          />
        </div>

        <div className="text-xs font-medium uppercase mb-2 text-slate-500 tracking-widest">Filter by type of service</div>
        <LocationFilters active={activeCats} onToggle={toggleCat} />

        <div className="mt-4 mb-2">
          <button
            onClick={() => setShowSuggest(true)}
            className="w-full flex justify-center items-center gap-2 text-sm bg-white border px-3 py-1.5 rounded hover:bg-slate-50"
          >
            <Filter size={15} /> Suggest a new location (moderated)
          </button>
        </div>

        <div className="mt-4 text-[10px] text-slate-500">Showing {filtered.length} of {allLocations.length}. Data is public + anonymous.</div>

        <div className="mt-6 space-y-2 text-sm overflow-y-auto max-h-[55vh]">
          {filtered.length === 0 && <p className="text-slate-400">No results. Try clearing filters.</p>}
          {filtered.map(loc => (
            <div key={loc.id} className="border bg-safe-50 p-3 rounded text-sm">
              <div className="font-semibold">{(loc.name as any)[lang] || loc.name.en || loc.name.ru}</div>
              <div className="text-slate-500 text-xs mb-1">{loc.city}, {loc.country}</div>
              <div className="text-xs mb-1 text-slate-700">{(loc.description as any)[lang] || loc.description.en}</div>
              <div className="flex flex-wrap gap-1 text-[10px]">
                {loc.category.map(c => <span key={c} className="px-1 border border-slate-300 rounded">{c}</span>)}
              </div>
              {loc.contact_phone && <div className="text-teal-700 mt-1 text-xs">{loc.contact_phone}</div>}
              {loc.contact_web && <a href={loc.contact_web} target="_blank" rel="noreferrer" className="text-teal-700 text-xs break-all">{loc.contact_web}</a>}
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[20, 18]}
          zoom={2}
          className="h-full w-full"
          style={{ background: '#f1f5f9' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filtered.map(loc => (loc.lat || loc.lng) && (
            <Marker key={loc.id} position={[loc.lat, loc.lng]}>
              <Popup>
                <div>
                  <div className="font-semibold text-base mb-1">{(loc.name as any)[lang] || (loc.name as any).en || Object.values(loc.name)[0]}</div>
                  <p className="text-sm text-slate-600 mb-2">{(loc.description as any)[lang] || (loc.description as any).en}</p>
                  {loc.contact_phone && <div className="text-xs mb-0.5">📞 {loc.contact_phone}</div>}
                  {loc.contact_web && <a href={loc.contact_web} target="_blank" className="text-xs text-teal-700 underline break-all">🌐 Visit website</a>}
                  <div className="text-[10px] text-slate-400 mt-1">{loc.city}{loc.country ? `, ${loc.country}` : ''}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          <MapClickLogger />
        </MapContainer>

        {/* Map tip */}
        <div className="absolute bottom-4 right-4 px-3 py-1 bg-white/90 text-xs border rounded pointer-events-none">
          Tip: Click pins for details. Use filter on left for specific aid types.
        </div>
      </div>

      {/* Suggestion modal */}
      {showSuggest && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-start justify-center pt-24">
          <div className="bg-white w-full max-w-md mx-3 rounded-xl p-6 safe-card">
            <h3 className="font-semibold text-base mb-2">Suggest a location</h3>
            <p className="text-sm text-slate-600">Submissions are reviewed before being visible on the map. Thank you.</p>
            <form className="mt-4 space-y-3" onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget as HTMLFormElement)
              const suggested: any = {
                proposedName: { en: fd.get('name') as string },
                city: fd.get('city') as string,
                country: fd.get('country') as string,
                category: ['shelter'],
                contactPhone: (fd.get('phone') as string) || undefined,
                contactWeb: (fd.get('web') as string) || undefined,
                message: fd.get('desc') as string,
              }
              try {
                import('../../lib/demoData').then((m) => {
                  m.addPendingSuggestion(suggested)
                })
              } catch {}
              alert('Thank you — your suggestion will be reviewed by the admin.')
              setShowSuggest(false)
            }}>
              <input name="name" required placeholder="Name of support service" className="w-full border px-3 py-2 rounded text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input name="city" required type="text" placeholder="City" className="border px-3 py-2 rounded text-sm" />
                <input name="country" required type="text" placeholder="Country" className="border px-3 py-2 rounded text-sm" />
              </div>
              <input name="phone" type="text" placeholder="Contact phone or website (optional)" className="border px-3 py-2 rounded text-sm w-full" />
              <input name="web" type="text" placeholder="Website URL (optional)" className="border px-3 py-2 rounded text-sm w-full mb-1" />
              <textarea name="desc" rows={3} placeholder="Brief description of services and who they help" className="border px-3 py-2 w-full rounded text-sm"></textarea>
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setShowSuggest(false)} className="px-4 py-1 text-sm rounded border">Cancel</button>
                <button type="submit" className="px-4 py-1 text-sm rounded bg-teal-700 text-white">Submit for review</button>
              </div>
            </form>
            <p className="text-[10px] text-center mt-2 text-slate-400">Your submission is confidential. No tracking attached.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Small helper that can be expanded to allow admin clicks on map
function MapClickLogger() {
  useMapEvents({
    click(_e) {
      // Can later forward click lat/lng for admin mode
      // console.log('[MapClick]', _e.latlng)
    }
  })
  return null
}
