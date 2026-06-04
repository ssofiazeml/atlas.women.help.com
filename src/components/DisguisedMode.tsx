import { useEffect, useState } from 'react'

// Simple safe disguised mode. In disguise the site appears as generic "Resources" or city news/weather
// Minimal tracking surface - completely client-side only.

const NEUTRAL_TITLE = 'Local Resource Navigator'
const DEFAULT_TITLE = 'Atlas | Global Resource Directory'

export function DisguisedModeToggle() {
  const [enabled, setEnabled] = useState<boolean>(() => localStorage.getItem('atlas_disguise') === '1')

  useEffect(() => {
    const handler = () => {
      if (enabled) {
        document.title = NEUTRAL_TITLE
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
        if (link) link.href = '/vite.svg' // neutral vite icon used as fallback, or override later
      } else {
        document.title = DEFAULT_TITLE
      }
    }
    handler()
    localStorage.setItem('atlas_disguise', enabled ? '1' : '0')
  }, [enabled])

  // Also ensure on every mount we keep the state in sync
  useEffect(() => {
    const stored = localStorage.getItem('atlas_disguise')
    if (stored !== (enabled ? '1' : '0')) {
      setEnabled(stored === '1')
    }
  }, [])

  return (
    <button
      onClick={() => setEnabled(v => !v)}
      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
      title="Switch to a generic-looking page (for safety in public environments)"
    >
      {enabled ? 'Normal view' : 'Disguised view'}
    </button>
  )
}
