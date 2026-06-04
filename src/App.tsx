import React, { useEffect, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QuickExitButton } from './components/QuickExitButton'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { MapView } from './features/map/MapView'
import { Chatbot } from './features/chat/Chatbot'
import { Checklists } from './features/checklists/Checklists'
import { StoriesView } from './features/stories/StoriesView'
import { Admin } from './features/admin/Admin'
import { DisguisedModeToggle } from './components/DisguisedMode'
import { SuggestPage } from './features/suggest/SuggestPage'
import { ResearchLibrary } from './features/research/ResearchLibrary'
import { DigitalDiplomacy } from './features/diplomacy/DigitalDiplomacy'
import { SafeBridgeIndex } from './features/index/SafeBridgeIndex'
import { WorldRightsMap } from './features/rights/WorldRightsMap'
import { SecretAdmin } from './features/secret-admin/SecretAdmin'
import { getHomeCards, subscribeHomeCards, type HomeCard, getHomeTexts, subscribeContent } from './lib/contentStore'

function Header() {
  const { t, i18n } = useTranslation()

  // Sync RTL dir on header render / lang change
  React.useEffect(() => {
    const dir = i18n.language?.startsWith('ar') ? 'rtl' : 'ltr'
    document.documentElement.dir = dir
  }, [i18n.language])

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-semibold text-xl tracking-tight text-safe-800">
            {t('app_name')}
          </Link>
          <span className="text-xs text-safe-700 hidden sm:inline">{t('tagline')}</span>
        </div>

        <nav className="flex items-center gap-4 text-sm flex-wrap">
          <Link to="/map" className="hover:underline">{t('nav.map')}</Link>
          <Link to="/chat" className="hover:underline">{t('nav.chat')}</Link>
          <Link to="/checklists" className="hover:underline">{t('nav.checklists')}</Link>
          <Link to="/stories" className="hover:underline">{t('nav.stories')}</Link>
          <Link to="/suggest" className="hover:underline">{t('nav.suggest') || 'Suggest'}</Link>
          <span className="text-slate-300">|</span>
          <Link to="/research" className="hover:underline">{t('nav.research')}</Link>
          <Link to="/diplomacy" className="hover:underline">{t('nav.diplomacy')}</Link>
          <Link to="/index" className="hover:underline">{t('nav.index')}</Link>
          <Link to="/rightsmap" className="hover:underline">{t('nav.rightsmap')}</Link>
        </nav>

        <div className="flex items-center gap-2.5">
          <LanguageSwitcher />
          <QuickExitButton />
        </div>
      </div>
    </header>
  )
}

function Home() {
  const { t } = useTranslation()
  const [customCards, setCustomCards] = useState<HomeCard[]>(() => getHomeCards())
  const [texts, setTexts] = useState(() => getHomeTexts())

  useEffect(() => subscribeHomeCards(() => setCustomCards(getHomeCards())), [])
  useEffect(() => subscribeContent(() => setTexts(getHomeTexts())), [])

  return (
    <main className="max-w-4xl mx-auto px-5 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-semibold text-safe-800 tracking-tight mb-4">
          {texts.title || t('home.title')}
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          {texts.intro || t('home.intro')}
        </p>
        {texts.contact && (
          <p className="text-sm text-safe-800 mt-3 font-medium">{texts.contact}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/map" className="safe-card hover:border-safe-teal hover:shadow transition-all">
          <h3 className="font-semibold text-lg mb-1">{t('home.map')}</h3>
          <p className="text-slate-600 text-sm">{t('home.map_desc')}</p>
        </Link>

        <Link to="/chat" className="safe-card hover:border-safe-teal hover:shadow transition-all">
          <h3 className="font-semibold text-lg mb-1">{t('home.chat')}</h3>
          <p className="text-slate-600 text-sm">{t('home.chat_desc')}</p>
        </Link>

        <Link to="/checklists" className="safe-card hover:border-safe-teal hover:shadow transition-all">
          <h3 className="font-semibold text-lg mb-1">{t('home.checklists')}</h3>
          <p className="text-slate-600 text-sm">{t('home.checklists_desc')}</p>
        </Link>

        <Link to="/stories" className="safe-card hover:border-safe-teal hover:shadow transition-all">
          <h3 className="font-semibold text-lg mb-1">{t('home.stories')}</h3>
          <p className="text-slate-600 text-sm">{t('home.stories_desc')}</p>
        </Link>

        <Link to="/research" className="safe-card hover:border-safe-teal hover:shadow transition-all">
          <h3 className="font-semibold text-lg mb-1">{t('nav.research')}</h3>
          <p className="text-slate-600 text-sm">{t('research.intro')}</p>
        </Link>

        <Link to="/diplomacy" className="safe-card hover:border-safe-teal hover:shadow transition-all">
          <h3 className="font-semibold text-lg mb-1">{t('nav.diplomacy')}</h3>
          <p className="text-slate-600 text-sm">{t('diplomacy.intro')}</p>
        </Link>

        <Link to="/index" className="safe-card hover:border-safe-teal hover:shadow transition-all">
          <h3 className="font-semibold text-lg mb-1">{t('nav.index')}</h3>
          <p className="text-slate-600 text-sm">{t('safebridge.intro')}</p>
        </Link>

        <Link to="/rightsmap" className="safe-card hover:border-safe-teal hover:shadow transition-all">
          <h3 className="font-semibold text-lg mb-1">{t('nav.rightsmap')}</h3>
          <p className="text-slate-600 text-sm">{t('rightsmap.intro')}</p>
        </Link>
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
                <h3 className="font-semibold text-lg mb-1">{c.title}</h3>
                {c.description && (
                  <p className="text-slate-600 text-sm">{c.description}</p>
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

  return (
    <div className="min-h-screen flex flex-col bg-[var(--safe-bg)]">
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/chat" element={<Chatbot />} />
          <Route path="/checklists" element={<Checklists />} />
          <Route path="/stories" element={<StoriesView />} />
          <Route path="/suggest" element={<SuggestPage />} />
          <Route path="/research" element={<ResearchLibrary />} />
          <Route path="/diplomacy" element={<DigitalDiplomacy />} />
          <Route path="/index" element={<SafeBridgeIndex />} />
          <Route path="/rightsmap" element={<WorldRightsMap />} />
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
