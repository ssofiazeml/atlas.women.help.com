import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QuickExitButton } from './components/QuickExitButton'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { MapView } from './features/map/MapView'
import { Hotlines } from './features/hotlines/Hotlines'
import { Chatbot } from './features/chat/Chatbot'
import { Checklists } from './features/checklists/Checklists'
import { StoriesView } from './features/stories/StoriesView'
import { Admin } from './features/admin/Admin'
import { DisguisedModeToggle } from './components/DisguisedMode'
import { SuggestPage } from './features/suggest/SuggestPage'
import { ResearchLibrary } from './features/research/ResearchLibrary'
import { DigitalDiplomacy } from './features/diplomacy/DigitalDiplomacy'
import { SecretAdmin } from './features/secret-admin/SecretAdmin'
import { About } from './features/about/About'
import {
  getHomeCards,
  subscribeHomeCards,
  type HomeCard,
  getHomeTexts,
  subscribeContent,
  applySeedTransforms,
  getSectionVisibility,
  type SiteSectionKey,
} from './lib/contentStore'
import { pickLocalized } from './lib/translate'

// Live section visibility (admin controlled) — hidden sections disappear from
// the navigation, the home page and the router.
function useSectionVisibility() {
  const [vis, setVis] = useState(() => getSectionVisibility())
  useEffect(() => subscribeContent(() => setVis(getSectionVisibility())), [])
  return vis
}

function Header() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const vis = useSectionVisibility()

  // Sync RTL dir on header render / lang change
  React.useEffect(() => {
    const dir = i18n.language?.startsWith('ar') ? 'rtl' : 'ltr'
    document.documentElement.dir = dir
  }, [i18n.language])

  React.useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const navLinks = (
    [
      { key: 'map', to: '/map', label: t('nav.map') },
      { key: 'chat', to: '/chat', label: t('nav.chat') },
      { key: 'checklists', to: '/checklists', label: t('nav.checklists') },
      { key: 'stories', to: '/stories', label: t('nav.stories') },
      { key: 'suggest', to: '/suggest', label: t('nav.suggest') || 'Suggest' },
      { key: 'research', to: '/research', label: t('nav.research') },
      { key: 'diplomacy', to: '/diplomacy', label: t('nav.diplomacy') },
      { key: 'about', to: '/about', label: t('nav.about') || 'О проекте' },
    ] as { key: SiteSectionKey; to: string; label: string }[]
  ).filter((l) => vis[l.key] !== false)

  return (
    <header className="bg-white border-b border-slate-200 fixed inset-x-0 top-0 z-[1000]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/" className="font-semibold text-lg sm:text-xl tracking-tight text-safe-800 truncate">
            {t('app_name')}
          </Link>
          <span className="text-xs text-safe-700 hidden lg:inline">{t('tagline')}</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <LanguageSwitcher />
          <QuickExitButton />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t('nav.menu') || 'Menu'}
            className="inline-flex items-center justify-center w-9 h-9 rounded border border-slate-200 bg-white hover:bg-slate-50 text-safe-800"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[1010]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute top-0 right-0 h-full w-[85%] max-w-xs bg-white shadow-xl flex flex-col animate-in slide-in-from-right">
            <div className="h-16 px-4 flex items-center justify-between border-b">
              <span className="font-semibold text-safe-800">{t('app_name')}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-9 h-9 inline-flex items-center justify-center rounded hover:bg-slate-100"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              <Link to="/" className="block px-3 py-2.5 rounded hover:bg-slate-50 text-safe-800 font-medium">{t('nav.home') || t('app_name')}</Link>
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} className="block px-3 py-2.5 rounded hover:bg-slate-50 text-slate-700">
                  {l.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </header>
  )
}

function Home() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const vis = useSectionVisibility()
  const [customCards, setCustomCards] = useState<HomeCard[]>(() => getHomeCards())
  const [texts, setTexts] = useState(() => getHomeTexts())
  const [, setTick] = useState(0)

  useEffect(() => subscribeHomeCards(() => setCustomCards(getHomeCards())), [])
  useEffect(
    () =>
      subscribeContent(() => {
        setTexts(getHomeTexts())
        setTick((x) => x + 1)
      }),
    []
  )

  // Built-in navigation cards with stable ids — admin can override or hide.
  const seedNavCardsAll = applySeedTransforms<{
    id: string
    title: string
    description: string
    link: string
  }>('home-cards', [
    { id: 'seed-card-map', title: t('home.map'), description: t('home.map_desc'), link: '/map' },
    { id: 'seed-card-chat', title: t('home.chat'), description: t('home.chat_desc'), link: '/chat' },
    { id: 'seed-card-checklists', title: t('home.checklists'), description: t('home.checklists_desc'), link: '/checklists' },
    { id: 'seed-card-stories', title: t('home.stories'), description: t('home.stories_desc'), link: '/stories' },
    { id: 'seed-card-research', title: t('nav.research'), description: t('research.intro'), link: '/research' },
    { id: 'seed-card-diplomacy', title: t('nav.diplomacy'), description: t('diplomacy.intro'), link: '/diplomacy' },
  ])

  // Drop cards whose section is hidden by the admin.
  const CARD_SECTION: Record<string, SiteSectionKey> = {
    'seed-card-map': 'map',
    'seed-card-chat': 'chat',
    'seed-card-checklists': 'checklists',
    'seed-card-stories': 'stories',
    'seed-card-research': 'research',
    'seed-card-diplomacy': 'diplomacy',
  }
  const seedNavCards = seedNavCardsAll.filter((c) => {
    const key = CARD_SECTION[c.id]
    return !key || vis[key] !== false
  })

  return (
    <main className="max-w-4xl mx-auto px-5 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-semibold text-safe-800 tracking-tight mb-4">
          {pickLocalized(texts, 'title', lang) || texts.title || t('home.title')}
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          {pickLocalized(texts, 'intro', lang) || texts.intro || t('home.intro')}
        </p>
        {(pickLocalized(texts, 'contact', lang) || texts.contact) && (
          <p className="text-sm text-safe-800 mt-3 font-medium">{pickLocalized(texts, 'contact', lang) || texts.contact}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {seedNavCards.map((c) => (
          <Link key={c.id} to={c.link} className="safe-card hover:border-safe-teal hover:shadow transition-all">
            <h3 className="font-semibold text-lg mb-1">{c.title}</h3>
            <p className="text-slate-600 text-sm">{c.description}</p>
          </Link>
        ))}
      </div>

      {customCards.length > 0 && (
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {customCards.map((c) => {
            const inner = (
              <>
                {c.image && (
                  <img
                    src={c.image}
                    alt=""
                    className="h-40 w-full object-cover rounded mb-3"
                  />
                )}
                <h3 className="font-semibold text-lg mb-1">{pickLocalized(c, 'title', lang) || c.title}</h3>
                {(pickLocalized(c, 'description', lang) || c.description) && (
                  <p className="text-slate-600 text-sm">{pickLocalized(c, 'description', lang) || c.description}</p>
                )}
              </>
            )
            if (c.link) {
              const isExternal = /^https?:\/\//i.test(c.link)
              if (isExternal) {
                return (
                  <a
                    key={c.id}
                    href={c.link}
                    target="_blank"
                    rel="noreferrer"
                    className="safe-card hover:border-safe-teal hover:shadow transition-all"
                  >
                    {inner}
                  </a>
                )
              }
              return (
                <Link
                  key={c.id}
                  to={c.link}
                  className="safe-card hover:border-safe-teal hover:shadow transition-all"
                >
                  {inner}
                </Link>
              )
            }
            return (
              <div key={c.id} className="safe-card">
                {inner}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-16 pt-8 border-t text-center text-xs text-slate-500">
        This platform is designed with safety first. We collect no personal data.
      </div>
    </main>
  )
}

function App() {
  const { t } = useTranslation()
  const vis = useSectionVisibility()
  const hiddenNotice = (
    <div className="p-14 text-center text-slate-600">
      {t('section_hidden', { defaultValue: 'This section is temporarily unavailable.' })}{' '}
      <Link to="/" className="underline">{t('nav.home', { defaultValue: 'Home' })}</Link>
    </div>
  )
  const gate = (key: SiteSectionKey, el: React.ReactNode) =>
    vis[key] === false ? hiddenNotice : el

  return (
    <div className="min-h-screen flex flex-col bg-[var(--safe-bg)]">
      <Header />
      <div className="flex-1 pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={gate('map', <MapView />)} />
          <Route path="/chat" element={gate('chat', <Chatbot />)} />
          <Route path="/checklists" element={gate('checklists', <Checklists />)} />
          <Route path="/stories" element={gate('stories', <StoriesView />)} />
          <Route path="/suggest" element={gate('suggest', <SuggestPage />)} />
          <Route path="/research" element={gate('research', <ResearchLibrary />)} />
          <Route path="/diplomacy" element={gate('diplomacy', <DigitalDiplomacy />)} />
          <Route path="/about" element={gate('about', <About />)} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/secret-admin" element={<SecretAdmin />} />
          <Route path="*" element={<div className="p-14 text-center">Not found. <Link to="/" className="underline">Return home</Link></div>} />
        </Routes>
      </div>
      <footer className="py-6 text-center text-xs text-slate-500 border-t bg-white mt-auto flex flex-col items-center gap-1">
        {t('footer')}
        <DisguisedModeToggle />
      </footer>
    </div>
  )
}

export default App
