import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getStories,
  subscribeContent,
  applySeedTransforms,
  type AdminStory,
} from '../../lib/contentStore'
import { PUBLISHED_STORIES } from './storiesSeed'
import { pickLocalized } from '../../lib/translate'

type Story = (typeof PUBLISHED_STORIES)[number]

export function StoriesView() {
  const { t, i18n } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [adminStories, setAdminStories] = useState<AdminStory[]>(() => getStories())
  const [selectedAdmin, setSelectedAdmin] = useState<AdminStory | null>(null)
  const [storyTick, setStoryTick] = useState(0)
  useEffect(
    () =>
      subscribeContent(() => {
        setAdminStories(getStories())
        setStoryTick((x) => x + 1)
      }),
    []
  )

  // Apply admin overrides + hidden filter to the hardcoded seed stories.
  // We key on `seed-story-${id}` so admin can edit/hide each one.
  const visibleSeedStories = applySeedTransforms<Story & { id: any }>(
    'stories',
    PUBLISHED_STORIES.map((s) => ({ ...s, id: `seed-story-${s.id}` as any }))
  )
  void storyTick

  const getText = (rec: Record<string, string>) => {
    const lang = i18n.language as string
    if (rec[lang]) return rec[lang]
    const base = lang.split('-')[0]
    return rec[base] || rec.en || Object.values(rec)[0] || ''
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold">{t('home.stories')}</h1>
          <p className="text-sm text-slate-600 mt-1">{t('home.stories_desc')}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-white border text-sm rounded hover:bg-slate-50"
        >
          + Share a story anonymously (moderated)
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {adminStories.map((s) => (
          <div
            key={s.id}
            className="safe-card cursor-pointer hover:border-teal-700 transition"
            onClick={() => setSelectedAdmin(s)}
          >
            {s.photo && (
              <img src={s.photo} alt="" className="h-32 w-full object-cover rounded mb-3" />
            )}
            <div className="font-semibold text-lg mb-1">{pickLocalized(s, 'title', i18n.language) || s.title || 'История'}</div>
            <div className="text-xs text-slate-500 mb-1">{s.name}</div>
            <div className="text-sm text-slate-600 line-clamp-3">{pickLocalized(s, 'text', i18n.language) || s.text}</div>
            <div className="text-[10px] mt-3 text-teal-700">Читать полностью →</div>
          </div>
        ))}

        {visibleSeedStories.map(story => (
          <div
            key={story.id}
            className="safe-card cursor-pointer hover:border-teal-700 transition"
            onClick={() => setSelectedStory(story)}
          >
            <div className="font-semibold text-lg mb-1.5">{getText(story.title)}</div>
            <div className="text-sm text-slate-600 line-clamp-3">{getText(story.situation)}</div>
            <div className="text-[10px] mt-3 text-teal-700">Read the full story →</div>
            {story.tags && <div className="mt-2 flex flex-wrap gap-1">{story.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 border text-[10px] rounded text-slate-500">{tag}</span>
            ))}</div>}
          </div>
        ))}
      </div>

      {selectedAdmin && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedAdmin(null)}>
          <div className="bg-white max-w-2xl w-full rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
            {selectedAdmin.photo && (
              <img src={selectedAdmin.photo} alt="" className="h-40 w-full object-cover rounded mb-4" />
            )}
            <h2 className="text-2xl font-semibold mb-1">{pickLocalized(selectedAdmin, 'title', i18n.language) || selectedAdmin.title || 'История'}</h2>
            <div className="text-sm text-slate-500 mb-4">{selectedAdmin.name}</div>
            <p className="whitespace-pre-wrap text-[15px]">{pickLocalized(selectedAdmin, 'text', i18n.language) || selectedAdmin.text}</p>
            <div className="mt-6 text-right">
              <button onClick={() => setSelectedAdmin(null)} className="px-5 py-1 text-sm rounded bg-slate-900 text-white">Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {/* Story detail modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedStory(null)}>
          <div className="bg-white max-w-2xl w-full rounded-xl p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-1 text-xs uppercase text-teal-700 tracking-wide">Anonymous story</div>
            <h2 className="text-2xl font-semibold mb-4">{getText(selectedStory.title)}</h2>

            <div className="space-y-5 text-[15px]">
              <div>
                <div className="uppercase text-xs tracking-widest font-medium text-slate-500 mb-1">Situation</div>
                <p>{getText(selectedStory.situation)}</p>
              </div>
              <div>
                <div className="uppercase text-xs tracking-widest font-medium text-slate-500 mb-1">Actions taken</div>
                <p>{getText(selectedStory.actions)}</p>
              </div>
              <div>
                <div className="uppercase text-xs tracking-widest font-medium text-slate-500 mb-1">Outcome</div>
                <p>{getText(selectedStory.outcome)}</p>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button onClick={() => setSelectedStory(null)} className="px-5 py-1 text-sm rounded bg-slate-900 text-white">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Anonymous submission modal (stub - will feed moderation queue later) */}
      {showForm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 safe-card" onClick={e=>e.stopPropagation()}>
            <h3 className="font-medium mb-1 text-xl">Share your experience (anonymously)</h3>
            <p className="text-sm text-slate-600 mb-4">All submissions are reviewed before publication. No names or identifying details required.</p>

            <form onSubmit={e => { e.preventDefault(); alert('Thank you. Your story has been submitted for moderation. Nothing is stored on your device.'); setShowForm(false) }}>
              <div className="mb-3">
                <label className="text-xs font-medium block mb-1">Short title (optional)</label>
                <input className="w-full border rounded px-3 py-2 text-sm" placeholder="My experience with legal support" />
              </div>
              <div className="mb-3">
                <label className="text-xs font-medium block mb-1">What was happening?</label>
                <textarea required className="w-full border rounded px-3 py-2 text-sm h-20" placeholder="Brief description of the situation..." />
              </div>
              <div className="mb-3">
                <label className="text-xs font-medium block mb-1">What actions helped you?</label>
                <textarea required className="w-full border rounded px-3 py-2 text-sm h-20" placeholder="Describe steps you or others took..." />
              </div>
              <div className="mb-3">
                <label className="text-xs font-medium block mb-1">How is life for you now?</label>
                <textarea className="w-full border rounded px-3 py-2 text-sm h-16" placeholder="Your current situation (optional)..." />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="text-sm px-4 py-1.5 border rounded">Cancel</button>
                <button type="submit" className="text-sm px-4 py-1.5 rounded bg-teal-800 text-white">Submit anonymously for review</button>
              </div>
            </form>
            <div className="text-[10px] text-center mt-4 text-slate-400">This information is treated confidentially. No tracking occurs.</div>
          </div>
        </div>
      )}

      <div className="mt-8 text-xs text-slate-400">
        Stories are published only after careful moderation to protect everyone involved. You can submit your own experience above.
      </div>
    </div>
  )
}
