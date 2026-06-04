import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from 'react-i18next'

const demoCoords: Record<string, [number, number]> = {
  France: [46.6, 2.2],
  Germany: [51.1, 10.4],
  Spain: [40.4, -3.7],
  'United States': [37.1, -95.7],
  Canada: [60, -110],
  Morocco: [31.8, -7.1],
  Lebanon: [33.85, 35.9],
  Turkey: [39, 35],
  Kenya: [0.0, 37.9],
  Brazil: [-10, -55],
}

// Leaflet icon defaults fix
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface CountryInfo {
  name: string
  general: string
  support: string
  legal: string
  child: string
  resources: string
}

function CountrySelector({ countries, selected, onSelect }: { countries: string[]; selected: string | null; onSelect: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {countries.map((c) => (
        <button key={c} onClick={() => onSelect(c)} className={`text-xs px-3 py-1.5 rounded-full border ${selected === c ? 'bg-teal-700 text-white border-teal-700' : 'hover:bg-slate-50 border-slate-200'}`}>
          {c}
        </button>
      ))}
    </div>
  )
}

function MapPick({ onPick }: { onPick: (c: string) => void }) {
  function Events() {
    useMapEvents({
      click() {
        // No location picker, static demo
      },
    })
    return null
  }

  return (
    <MapContainer center={[20, 10]} zoom={1.6} className="h-80 w-full rounded border" style={{ zIndex: 1 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {Object.entries(demoCoords).map(([country, coords]) => (
        <Marker key={country} position={coords as [number, number]} eventHandlers={{ click: () => onPick(country) }}>
          <Popup>{country}</Popup>
        </Marker>
      ))}
      <Events />
    </MapContainer>
  )
}

function TemplatePanel({ info }: { info: CountryInfo | null }) {
  const { t } = useTranslation()

  if (!info) {
    return <div className="safe-card p-5 text-sm text-slate-500">{t('rightsmap.select')}</div>
  }

  return (
    <div className="safe-card p-5 space-y-4 text-sm">
      <div>
        <div className="uppercase tracking-widest text-teal-700 text-xs mb-1">{t('rightsmap.tpl.general')}</div>
        <div className="text-slate-700">{info.general}</div>
      </div>
      <div>
        <div className="uppercase tracking-widest text-teal-700 text-xs mb-1">{t('rightsmap.tpl.system')}</div>
        <div className="text-slate-700">{info.support}</div>
      </div>
      <div>
        <div className="uppercase tracking-widest text-teal-700 text-xs mb-1">{t('rightsmap.tpl.legal')}</div>
        <div className="text-slate-700">{info.legal}</div>
      </div>
      <div>
        <div className="uppercase tracking-widest text-teal-700 text-xs mb-1">{t('rightsmap.tpl.child')}</div>
        <div className="text-slate-700">{info.child}</div>
      </div>
      <div>
        <div className="uppercase tracking-widest text-teal-700 text-xs mb-1">{t('rightsmap.tpl.resources')}</div>
        <div className="text-slate-700">{info.resources}</div>
      </div>
      <div className="pt-2 text-[11px] text-slate-500 italic">{t('rightsmap.placeholder')}</div>
    </div>
  )
}

export function WorldRightsMap() {
  const { t } = useTranslation()

  const countries: string[] = (t('rightsmap.countries_demo', { returnObjects: true }) || []) as string[]
  const [selected, setSelected] = useState<string | null>(null)

  const info: CountryInfo | null = selected
    ? {
        name: selected,
        general: t('rightsmap.placeholder'),
        support: t('rightsmap.placeholder'),
        legal: t('rightsmap.placeholder'),
        child: t('rightsmap.placeholder'),
        resources: t('rightsmap.placeholder'),
      }
    : null

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="mb-6">
        <div className="text-sm uppercase tracking-widest text-teal-700 font-medium mb-1">{t('rightsmap.title')}</div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">{t('rightsmap.title')}</h1>
        <p className="text-slate-600 max-w-2xl mb-1">{t('rightsmap.intro')}</p>
      </div>

      <div className="grid lg:grid-cols-[1fr,360px] gap-6">
        <div>
          <CountrySelector countries={countries} selected={selected} onSelect={setSelected} />
          <MapPick onPick={setSelected} />
        </div>

        <div>
          <TemplatePanel info={info} />
        </div>
      </div>

      <div className="text-xs text-slate-500 mt-6">{t('rightsmap.select')}</div>
    </div>
  )
}
