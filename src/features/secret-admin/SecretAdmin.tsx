import React, { useEffect, useState } from 'react'
import {
  addHomeCard,
  deleteHomeCard,
  getHomeCards,
  readFileAsDataUrl,
  subscribeHomeCards,
  type HomeCard,
} from '../../lib/contentStore'

// Temporary access password. Change here to rotate.
const ADMIN_PASSWORD = 'Admin2026!'
const SESSION_KEY = 'atlas:secret-admin:authed'

export function SecretAdmin() {
  const [authed, setAuthed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.sessionStorage.getItem(SESSION_KEY) === '1'
  })

  if (!authed) {
    return <LoginGate onSuccess={() => {
      window.sessionStorage.setItem(SESSION_KEY, '1')
      setAuthed(true)
    }} />
  }

  return <AdminPanel onLogout={() => {
    window.sessionStorage.removeItem(SESSION_KEY)
    setAuthed(false)
  }} />
}

function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setError('')
      onSuccess()
    } else {
      setError('Неверный пароль. Попробуйте ещё раз.')
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-5 py-16">
      <form
        onSubmit={submit}
        className="safe-card w-full max-w-sm bg-white"
      >
        <h1 className="text-2xl font-semibold text-safe-800 mb-2">Admin access</h1>
        <p className="text-sm text-slate-600 mb-5">
          This page is private. Enter the password to continue.
        </p>
        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-safe-teal"
          placeholder="••••••••"
        />
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <button
          type="submit"
          className="mt-4 w-full bg-safe-800 text-white rounded-md py-2 text-sm font-medium hover:opacity-90 transition"
        >
          Enter
        </button>
      </form>
    </main>
  )
}

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [cards, setCards] = useState<HomeCard[]>(() => getHomeCards())
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [image, setImage] = useState<string | undefined>(undefined)
  const [saved, setSaved] = useState(false)

  useEffect(() => subscribeHomeCards(() => setCards(getHomeCards())), [])

  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image is too large. Please choose a file under 2 MB.')
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    setImage(dataUrl)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addHomeCard({
      title: title.trim(),
      description: description.trim(),
      link: link.trim() || undefined,
      image,
    })
    setTitle('')
    setDescription('')
    setLink('')
    setImage(undefined)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <main className="max-w-5xl mx-auto px-5 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-safe-800 tracking-tight">Content admin</h1>
          <p className="text-sm text-slate-600 mt-1">
            Add cards that will appear on the home page.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="text-sm text-slate-600 hover:text-safe-800 underline"
        >
          Sign out
        </button>
      </div>

      <form onSubmit={submit} className="safe-card bg-white grid gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-safe-teal"
            placeholder="Card title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-safe-teal"
            placeholder="Short text shown on the card"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Link (optional)
          </label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-safe-teal"
            placeholder="https://… or /map"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Image (optional)</label>
          <input type="file" accept="image/*" onChange={onImage} className="text-sm" />
          {image && (
            <img
              src={image}
              alt="Preview"
              className="mt-2 h-32 w-auto rounded border border-slate-200"
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="bg-safe-800 text-white rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            Add card
          </button>
          {saved && <span className="text-sm text-green-700">Saved ✓</span>}
        </div>
      </form>

      <h2 className="text-xl font-semibold text-safe-800 mt-12 mb-4">
        Your cards ({cards.length})
      </h2>
      {cards.length === 0 ? (
        <p className="text-sm text-slate-600">
          No cards yet. Add one above and it will show up on the home page.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {cards.map((c) => (
            <div key={c.id} className="safe-card bg-white">
              {c.image && (
                <img
                  src={c.image}
                  alt=""
                  className="h-32 w-full object-cover rounded mb-3"
                />
              )}
              <h3 className="font-semibold text-lg mb-1">{c.title}</h3>
              {c.description && (
                <p className="text-slate-600 text-sm">{c.description}</p>
              )}
              {c.link && (
                <p className="text-xs text-slate-500 mt-2 break-all">→ {c.link}</p>
              )}
              <button
                onClick={() => {
                  if (confirm('Delete this card?')) deleteHomeCard(c.id)
                }}
                className="mt-3 text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}