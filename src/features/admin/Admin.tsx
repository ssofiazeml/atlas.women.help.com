import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import { MapLocation, getMapLocations, saveMapLocations, getPendingSuggestions, getPendingCases, LocationSuggestion, CaseSubmission } from '../../lib/demoData'
import { supabase } from '../../lib/supabase'

// SECURITY: Only this predefined email may log in to OWNER role.
// Create this user ONE TIME manually in Supabase Auth dashboard (auth.users) .
const OWNER_EMAIL = (import.meta.env.VITE_OWNER_EMAIL || 'owner@atlas-project.org').toLowerCase()

/**
 * Admin panel is OWNER ONLY.
 * - No registration UI, no self-service accounts
 * - Uses Supabase Auth with signInWithPassword
 * - Registration, Google, FB disabled at Supabase project level (env + dashboard)
 */

type Tab = 'locations' | 'moderation'

function PointPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  function PickControl() {
    useMapEvents({
      click(e) {
        onPick(e.latlng.lat, e.latlng.lng)
      }
    })
    return null
  }
  return (
    <MapContainer center={[35, 18]} zoom={2} className="h-56 w-full rounded border" style={{zIndex:1}}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <PickControl />
    </MapContainer>
  )
}

export function Admin() {
  const [_user, setUser] = useState<any>(null) // supabase user (unused in render but needed for session state)
  const [authed, setAuthed] = useState(false)
  const [email, setEmail] = useState(OWNER_EMAIL)
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('locations')

  // Live editable locations
  const [locations, setLocations] = useState<MapLocation[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<MapLocation>>({})
  const [pickedPoint, setPickedPoint] = useState<{lat:number,lng:number} | null>(null)

  // Moderation
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [pendingCases, setPendingCases] = useState<CaseSubmission[]>([])

  // Secure gate: sync auth state with Supabase
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const isOwner = session.user.email?.toLowerCase() === OWNER_EMAIL
        setUser(session.user)
        setAuthed(isOwner)
        if (!isOwner) {
          await supabase.auth.signOut()
          setUser(null)
          setAuthed(false)
          setError('Access denied: this account is not the designated owner.')
        }
      }
    }
    checkSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const isOwner = session.user.email?.toLowerCase() === OWNER_EMAIL
        setUser(session.user)
        setAuthed(isOwner)
        if (!isOwner) {
          supabase.auth.signOut()
          setUser(null)
          setAuthed(false)
        }
      } else {
        setUser(null)
        setAuthed(false)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // Load data when authenticated as owner
  useEffect(() => {
    if (!authed) return
    setLocations(getMapLocations())
    setSuggestions(getPendingSuggestions())
    setPendingCases(getPendingCases())
  }, [authed])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoginLoading(true)
    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      })

      if (signInErr || !data?.user) {
        setError('Login failed. Check credentials or ensure the owner account was created in Supabase Auth.')
        setLoginLoading(false)
        return
      }

      const loggedEmail = data.user.email?.toLowerCase() || ''
      if (loggedEmail !== OWNER_EMAIL) {
        await supabase.auth.signOut()
        setError('Access denied. Only the pre-configured owner email may log in.')
        setLoginLoading(false)
        return
      }

      setUser(data.user)
      setAuthed(true)
      setPassword('')
    } catch (err: any) {
      setError(err?.message || 'Unexpected login error.')
    } finally {
      setLoginLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setAuthed(false)
    setPassword('')
    setError('')
  }

  // Locations CRUD helpers demo only
  function startNewLocation() {
    setEditingId(null)
    setPickedPoint(null)
    setForm({ name: {en:'',ru:'',fr:'',ar:'',es:''}, description:{en:'',ru:'',fr:'',ar:'',es:''}, category: ['shelter'], city:'', country:'' })
  }

  function startEdit(loc: MapLocation) {
    setEditingId(loc.id)
    setPickedPoint({lat: loc.lat, lng: loc.lng})
    setForm({ ...loc })
  }

  function pickLocation(lat: number, lng: number) {
    setPickedPoint({lat, lng})
    setForm(f => ({ ...f, lat, lng }))
  }

  function saveLocation() {
    if (!form.name || !form.lat || !form.lng) {
      alert('Name + coordinates required')
      return
    }
    const isNew = editingId === null
    let nextList: MapLocation[]
    if (isNew) {
      const newItem: MapLocation = {
        id: Math.max(0, ...locations.map(l=>l.id)) + 1,
        lat: Number(form.lat),
        lng: Number(form.lng),
        category: Array.isArray(form.category) ? form.category : ['shelter'],
        name: form.name as any,
        description: (form.description || {}) as any,
        city: form.city,
        country: form.country,
        contact_phone: form.contact_phone,
        contact_web: form.contact_web,
      }
      nextList = [...locations, newItem]
    } else {
      nextList = locations.map(l => l.id === editingId ? {
        ...l,
        lat: Number(form.lat), lng: Number(form.lng),
        name: form.name as any, description: (form.description || {}) as any,
        category: form.category as any, city: form.city, country: form.country,
        contact_phone: form.contact_phone, contact_web: form.contact_web,
      } : l)
    }
    saveMapLocations(nextList)
    setLocations(nextList)
    setEditingId(null)
    setForm({})
    setPickedPoint(null)
  }

  function deleteLocation(id: number) {
    if (!confirm('Delete this location permanently in this demo?')) return
    const next = locations.filter(l => l.id !== id)
    saveMapLocations(next)
    setLocations(next)
  }

  function addSuggestionToLocations(sug: LocationSuggestion) {
    if (confirm('Publish this suggested location to the live map?')) {
      const nextId = Math.max(0,...locations.map(l=>l.id)) + 1
      const newLoc: MapLocation = {
        id: nextId,
        lat: sug.lat || 35,
        lng: sug.lng || 15,
        category: sug.category,
        name: sug.proposedName,
        description: { en: sug.message || 'Suggested location' },
        city: sug.city,
        country: sug.country,
        contact_phone: sug.contactPhone,
        contact_web: sug.contactWeb,
      }
      const updated = [...locations, newLoc]
      saveMapLocations(updated)
      setLocations(updated)

      // mark reviewed
      // note: we would call remove or mark reviewed in real but simple clear it
      import('../../lib/demoData').then(m => {
        m.markPendingSuggestionReviewed(sug.id)
      })
      setSuggestions(getPendingSuggestions())
    }
  }

  function approveStorySubmission(item: CaseSubmission) {
    if (!confirm('Approve and publish this story immediately?')) return
    // For demo we just mark as reviewed locally (no actual new static entry). Later swap for full DB
    import('../../lib/demoData').then(m => {
      m.approvePendingCase(item.id)
    })
    setPendingCases(getPendingCases())
    alert('Story marked approved in this demo session. In live use it would be written to the cases table.')
  }

  function rejectSuggestion(id: number) {
    if (!confirm('Reject / remove this suggestion?')) return
    import('../../lib/demoData').then(m => m.removePendingSuggestion(id))
    setSuggestions(getPendingSuggestions())
  }

  // Suggestion mock submit (used by map earlier, reachable from here also)
  function forceAddDummySuggestion() {
    const dum: any = { proposedName:{en:'New demo shelter in Berlin'}, category:['shelter'], city:'Berlin', country:'Germany', message:'Demo submitted suggestion for test moderation' }
    import('../../lib/demoData').then(m => m.addPendingSuggestion(dum))
    setSuggestions(getPendingSuggestions())
  }

  if (!authed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-5 bg-[var(--safe-bg)]">
        <div className="w-full max-w-sm safe-card">
          <h1 className="font-semibold text-2xl mb-1">Owner-only Admin</h1>
          <p className="text-sm text-slate-600 mb-4">
            This area is restricted to the single designated project owner.
            Created manually once in Supabase Auth. No public sign-ups, no social auth, no new accounts.
          </p>
          <p className="text-xs text-slate-500 mb-6">Login only works for the exact pre-configured owner email.</p>

          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="text-xs block mb-1">Owner Email</label>
              <input
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                required
                className="w-full border px-3 py-2 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs block mb-1">Password</label>
              <input
                type="password"
                value={password}
                required
                onChange={e=>setPassword(e.target.value)}
                className="w-full border px-3 py-2 rounded text-sm"
                placeholder="Owner password"
              />
            </div>
            {error && <div className="text-rose-600 text-sm">{error}</div>}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2 bg-slate-900 text-white rounded text-sm font-semibold disabled:opacity-60"
            >
              {loginLoading ? 'Signing in…' : 'Sign in as Owner'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-yellow-50 border text-yellow-800 text-[11px] rounded leading-snug">
            The owner account must be created <strong>once</strong> inside your Supabase dashboard → Authentication → Users.
            Then set <code>VITE_OWNER_EMAIL</code> to match (or default used).
            All other registration is disabled by project settings in Supabase.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-sm uppercase tracking-widest font-medium text-teal-700">Administrative area</div>
          <h1 className="text-2xl font-semibold">Atlas — Content & Locations Control</h1>
        </div>
        <div className="text-right">
          <button onClick={logout} className="text-sm underline text-slate-600">Sign out</button>
          <div className="text-[10px] text-rose-600">Demo session — real deployment must enforce proper authentication</div>
        </div>
      </div>

      <div className="mb-4 flex gap-px text-sm bg-slate-100 rounded w-fit">
        <button onClick={() => setActiveTab('locations')} className={`px-4 py-1.5 rounded ${activeTab==='locations' ? 'bg-white shadow' : ''}`}>Locations (Map data)</button>
        <button onClick={() => setActiveTab('moderation')} className={`px-4 py-1.5 rounded ${activeTab==='moderation' ? 'bg-white shadow' : ''}`}>Moderation queue</button>
      </div>

      {/* LOCATIONS TAB */}
      {activeTab === 'locations' && (
        <div>
          <div className="flex gap-3 mb-3 justify-between items-center">
            <button onClick={startNewLocation} className="px-3 py-1 border rounded text-sm">+ Add new location</button>
            <div className="text-xs text-slate-500">Changes are stored in your browser session for this demo. Connect Supabase for production persistence.</div>
          </div>

          <div className="grid md:grid-cols-[1fr,380px] gap-5">
            {/* Table */}
            <div className="safe-card overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left"><th className="py-1.5">Name (EN)</th><th>City, Country</th><th>Categories</th><th></th></tr>
                </thead>
                <tbody>
                  {locations.map(loc => (
                    <tr key={loc.id} className="border-b last:border-none">
                      <td className="py-2 pr-2 font-medium">{loc.name.en}</td>
                      <td className="py-2 text-slate-500">{[loc.city, loc.country].filter(Boolean).join(', ')}</td>
                      <td><span className="text-xs px-1.5 bg-slate-100 rounded">{loc.category.join(', ')}</span></td>
                      <td className="text-right space-x-2">
                        <button className="underline text-xs" onClick={() => startEdit(loc)}>Edit</button>
                        <button className="underline text-xs text-rose-600" onClick={() => deleteLocation(loc.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                  {locations.length === 0 && <tr><td className="text-center p-4 text-slate-500">No locations</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Edit / Create form */}
            <div className="safe-card">
              <div className="font-semibold mb-2">{editingId ? 'Edit location' : 'Add location'}</div>

              <div className="mb-3">
                <div className="text-xs mb-1">Click a point on the picker below to set lat/long</div>
                <PointPicker onPick={pickLocation} />
                <div className="text-xs mt-1">{pickedPoint ? `Picked: ${pickedPoint.lat.toFixed(4)}, ${pickedPoint.lng.toFixed(4)}` : 'No point selected yet'}</div>
              </div>

              <label className="block text-xs mb-1">Categories (comma separated)</label>
              <input value={(form.category||[]).join(',')} onChange={e=>setForm(f=>({...f, category: e.target.value.split(',').map(x=>x.trim())}))} className="border px-2 py-1 w-full text-sm rounded mb-2" />

              {(['en','ru','fr','ar','es'] as const).map(lng => (
                <div key={lng} className="mb-2">
                  <label className="text-[10px] uppercase tracking-widest block mb-px text-slate-500">{lng.toUpperCase()} name</label>
                  <input value={(form.name as any)?.[lng]||''} onChange={e => setForm(f => ({...f, name: {...(f.name||{}), [lng]: e.target.value }}))} className="w-full border rounded px-2 py-1 text-sm" />
                  <label className="text-[10px] uppercase tracking-widest block mb-px mt-1 text-slate-500">Description ({lng})</label>
                  <textarea value={(form.description as any)?.[lng]||''} onChange={e=>setForm(f=>({...f, description:{...(f.description||{}), [lng]:e.target.value}}))} className="w-full border rounded px-2 py-1 text-sm h-12" />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs">City</label>
                  <input className="w-full border px-2 py-1 text-xs rounded" value={form.city||''} onChange={e=>setForm(f=>({...f, city:e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs">Country</label>
                  <input className="w-full border px-2 py-1 text-xs rounded" value={form.country||''} onChange={e=>setForm(f=>({...f, country:e.target.value}))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <input placeholder="Phone" className="border px-2 py-1 rounded text-xs" value={form.contact_phone||''} onChange={e=>setForm(f=>({...f, contact_phone:e.target.value}))} />
                <input placeholder="Website URL" className="border px-2 py-1 rounded text-xs" value={form.contact_web||''} onChange={e=>setForm(f=>({...f, contact_web:e.target.value}))} />
              </div>

              <div className="flex gap-2 mt-4 text-sm justify-end">
                {editingId !== null && <button onClick={()=>{setEditingId(null);setForm({});setPickedPoint(null)}} className="px-3 py-1 border rounded text-xs">Cancel edit</button>}
                <button onClick={saveLocation} className="px-4 py-1 bg-teal-800 text-white rounded text-xs">Save location</button>
              </div>
              <div className="mt-4 text-[10px] text-slate-400">Note: live demo data uses browser storage only. Hook into your Supabase Postgres table later via the service client.</div>
            </div>
          </div>
        </div>
      )}

      {/* MODERATION TAB */}
      {activeTab === 'moderation' && (
        <div>
          <button onClick={forceAddDummySuggestion} className="mb-3 text-xs underline text-slate-600">Add demo pending suggestion for test</button>

          <h3 className="font-semibold mb-2">Location Suggestions (anonymous)</h3>
          <div className="safe-card mb-6">
            {suggestions.length === 0 && <div className="text-sm py-3 text-slate-500">No suggestions yet.</div>}
            {suggestions.map(s => (
              <div key={s.id} className="border-b py-2 flex flex-col md:flex-row md:items-center md:justify-between text-sm last:border-0">
                <div>
                  <div className="font-medium">{(s.proposedName as any).en || Object.values(s.proposedName)[0]}</div>
                  <div className="text-slate-600 text-xs">{s.city} {s.country} • {s.category.join(', ')}</div>
                  {s.message && <div className="text-xs text-slate-500 italic">{s.message}</div>}
                </div>
                <div className="flex gap-2 flex-shrink-0 text-xs mt-1 md:mt-0">
                  <button onClick={() => addSuggestionToLocations(s)} className="underline">Publish to map</button>
                  <button onClick={() => rejectSuggestion(s.id)} className="underline text-rose-700">Reject</button>
                </div>
              </div>
            ))}
          </div>

          <h3 className="font-semibold mb-2">Story submissions queue</h3>
          <div className="safe-card">
            {pendingCases.length === 0 && <div className="py-3 text-sm text-slate-500">No pending anonymous stories.</div>}
            {pendingCases.map(item => (
              <div key={item.id} className="flex flex-col md:flex-row items-start md:items-center gap-2 border-b py-3 text-sm last:border-b-0">
                <div className="flex-1">
                  <div>{(item.title as any).en}</div>
                  <div className="text-xs text-slate-500 line-clamp-1">{(item.situation as any).en}</div>
                </div>
                <div className="text-xs space-x-2">
                  <button onClick={() => approveStorySubmission(item)} className="px-3 border py-px rounded bg-green-50 text-green-800">Approve & publish</button>
                  <button onClick={() => import('../../lib/demoData').then(m => { m.rejectPendingCase(item.id); setPendingCases(getPendingCases()) })} className="px-2 underline">Reject</button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-500 mt-2">In a connected Supabase environment this page would run the same logic against your pending_* tables and use RLS-authenticated admin updates.</div>
        </div>
      )}
    </div>
  )
}
