import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addPendingSuggestion, addPendingCase } from '../../lib/demoData'

type Tab = 'center' | 'story'

// Same category list as the interactive help map — no free text input.
const CATEGORY_KEYS = [
  'shelter', 'domestic', 'sexual', 'legal', 'psychological',
  'migrant', 'children', 'emergency', 'medical', 'hotline', 'crisis',
] as const

export function SuggestPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('center')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const emptyCenter = { name: '', city: '', country: '', category: '', phone: '', web: '', desc: '' }
  const [centerForm, setCenterForm] = useState(emptyCenter)

  const emptyStory = { title: '', situation: '', actions: '', outcome: '' }
  const [storyForm, setStoryForm] = useState(emptyStory)

  const catLabel = (k: string) => t(`categories.${k}`, { defaultValue: k })

  async function submitCenter(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await addPendingSuggestion({
        proposedName: {
          en: centerForm.name,
          fr: centerForm.name,
          ru: centerForm.name,
          ar: centerForm.name,
        },
        category: centerForm.category ? [centerForm.category] : [],
        city: centerForm.city,
        country: centerForm.country,
        contactPhone: centerForm.phone || undefined,
        contactWeb: centerForm.web || undefined,
        message: centerForm.desc,
        lat: undefined,
        lng: undefined,
      })
    } catch {
      /* stored locally for moderation */
    }
    setMessage(t('suggest.thank_center'))
    setCenterForm(emptyCenter)
    setSubmitting(false)
    setTimeout(() => setMessage(null), 4000)
  }

  async function submitStory(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const all = (v: string) => ({ en: v, ru: v, fr: v, ar: v })
    try {
      await addPendingCase({
        title: all(storyForm.title || t('stories_page.default_title')),
        situation: all(storyForm.situation),
        actions: all(storyForm.actions),
        outcome: all(storyForm.outcome),
      })
    } catch {
      /* stored locally for moderation */
    }
    setMessage(t('stories_page.submitted'))
    setStoryForm(emptyStory)
    setSubmitting(false)
    setTimeout(() => setMessage(null), 4000)
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="text-3xl font-semibold mb-2">{t('suggest.title')}</h1>
      <p className="text-slate-600 mb-6 text-sm">{t('suggest.desc')}</p>

      <div className="mb-4 flex gap-px text-sm w-fit bg-slate-100 rounded">
        <button onClick={() => setActiveTab('center')} className={`px-4 py-1.5 rounded ${activeTab === 'center' ? 'bg-white shadow font-medium' : ''}`}>{t('suggest.tab_center')}</button>
        <button onClick={() => setActiveTab('story')} className={`px-4 py-1.5 rounded ${activeTab === 'story' ? 'bg-white shadow font-medium' : ''}`}>{t('suggest.tab_story')}</button>
      </div>

      {message && <div className="mb-4 text-sm bg-teal-50 border border-teal-200 px-4 py-2 rounded text-teal-800">{message}</div>}

      {activeTab === 'center' && (
        <form onSubmit={submitCenter} className="safe-card p-6 space-y-4">
          <p className="text-sm text-slate-600">{t('suggest.center_intro')}</p>

          <div>
            <label className="text-xs font-medium block mb-1">{t('suggest.f_name')} *</label>
            <input
              required
              value={centerForm.name}
              onChange={(e) => setCenterForm({ ...centerForm, name: e.target.value })}
              placeholder={t('suggest.f_name_ph')}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">{t('suggest.f_city')} *</label>
              <input
                required
                value={centerForm.city}
                onChange={(e) => setCenterForm({ ...centerForm, city: e.target.value })}
                placeholder={t('suggest.f_city_ph')}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">{t('suggest.f_country')} *</label>
              <input
                required
                value={centerForm.country}
                onChange={(e) => setCenterForm({ ...centerForm, country: e.target.value })}
                placeholder={t('suggest.f_country_ph')}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">{t('suggest.f_category')} *</label>
            <select
              required
              value={centerForm.category}
              onChange={(e) => setCenterForm({ ...centerForm, category: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm bg-white"
            >
              <option value="">{t('suggest.f_category_ph')}</option>
              {CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>{catLabel(k)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">{t('suggest.f_phone')}</label>
              <input
                value={centerForm.phone}
                onChange={(e) => setCenterForm({ ...centerForm, phone: e.target.value })}
                placeholder={t('suggest.f_phone_ph')}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">{t('suggest.f_website')}</label>
              <input
                value={centerForm.web}
                onChange={(e) => setCenterForm({ ...centerForm, web: e.target.value })}
                placeholder={t('suggest.f_website_ph')}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">{t('suggest.f_desc')}</label>
            <textarea
              rows={3}
              value={centerForm.desc}
              onChange={(e) => setCenterForm({ ...centerForm, desc: e.target.value })}
              placeholder={t('suggest.f_desc_ph')}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setCenterForm(emptyCenter)} className="text-sm px-4 py-1.5 border rounded">{t('stories_page.cancel')}</button>
            <button disabled={submitting} type="submit" className="text-sm px-4 py-1.5 rounded bg-teal-800 text-white disabled:opacity-60">{t('suggest.submit_center')}</button>
          </div>

          <div className="text-[10px] text-center mt-2 text-slate-400">{t('suggest.center_note')}</div>
        </form>
      )}

      {activeTab === 'story' && (
        <form onSubmit={submitStory} className="safe-card p-6">
          <h3 className="font-medium mb-1 text-xl">{t('stories_page.share_title')}</h3>
          <p className="text-sm text-slate-600 mb-4">{t('stories_page.share_desc')}</p>

          <div className="mb-3">
            <label className="text-xs font-medium block mb-1">{t('stories_page.f_title')}</label>
            <input
              value={storyForm.title}
              onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder={t('stories_page.f_title_ph')}
            />
          </div>
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1">{t('stories_page.f_what')}</label>
            <textarea
              required
              value={storyForm.situation}
              onChange={(e) => setStoryForm({ ...storyForm, situation: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm h-20"
              placeholder={t('stories_page.f_what_ph')}
            />
          </div>
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1">{t('stories_page.f_actions')}</label>
            <textarea
              required
              value={storyForm.actions}
              onChange={(e) => setStoryForm({ ...storyForm, actions: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm h-20"
              placeholder={t('stories_page.f_actions_ph')}
            />
          </div>
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1">{t('stories_page.f_now')}</label>
            <textarea
              value={storyForm.outcome}
              onChange={(e) => setStoryForm({ ...storyForm, outcome: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm h-16"
              placeholder={t('stories_page.f_now_ph')}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setStoryForm(emptyStory)} className="text-sm px-4 py-1.5 border rounded">{t('stories_page.cancel')}</button>
            <button disabled={submitting} type="submit" className="text-sm px-4 py-1.5 rounded bg-teal-800 text-white disabled:opacity-60">{t('stories_page.submit')}</button>
          </div>
          <div className="text-[10px] text-center mt-4 text-slate-400">{t('stories_page.confidential')}</div>
        </form>
      )}
    </div>
  )
}

export default SuggestPage
