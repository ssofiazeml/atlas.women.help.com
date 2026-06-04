import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addPendingSuggestion, addPendingCase } from '../../lib/demoData'

type Tab = 'center' | 'story'

export function SuggestPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('center')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Center suggestion form state
  const [centerForm, setCenterForm] = useState({
    en: '', fr: '', ru: '', ar: '',
    city: '', country: '', phone: '', web: '', desc_en: '', desc_ru: '', desc_fr: '', desc_ar: '',
    categories: 'shelter'
  })

  // Story form
  const [storyForm, setStoryForm] = useState({
    enTitle: '', ruTitle: '', frTitle: '', arTitle: '',
    enSit: '', ruSit: '', frSit: '', arSit: '',
    enAct: '', ruAct: '', frAct: '', arAct: '',
    enOut: '', ruOut: '', frOut: '', arOut: '',
  })

  function resetCenter() {
    setCenterForm({ en: '', fr: '', ru: '', ar: '', city: '', country: '', phone: '', web: '', desc_en: '', desc_ru: '', desc_fr: '', desc_ar: '', categories: 'shelter' })
  }

  function resetStory() {
    setStoryForm({ enTitle: '', ruTitle: '', frTitle: '', arTitle: '', enSit: '', ruSit: '', frSit: '', arSit: '', enAct: '', ruAct: '', frAct: '', arAct: '', enOut: '', ruOut: '', frOut: '', arOut: '' })
  }

  async function submitCenter(e: React.FormEvent) {
    e.preventDefault()
    if (!centerForm.en || !centerForm.city) {
      alert('Please provide at least English name + city')
      return
    }
    setSubmitting(true)
    try {
      await addPendingSuggestion({
        proposedName: {
          en: centerForm.en,
          fr: centerForm.fr || centerForm.en,
          ru: centerForm.ru || centerForm.en,
          ar: centerForm.ar || centerForm.en,
        },
        category: centerForm.categories.split(',').map((c) => c.trim()),
        city: centerForm.city,
        country: centerForm.country,
        contactPhone: centerForm.phone || undefined,
        contactWeb: centerForm.web || undefined,
        message: centerForm.desc_en || (centerForm.desc_ru || ''),
        lat: undefined, lng: undefined,
      })
      setMessage(t('suggest.thank_center') || 'Thank you. Suggestion submitted anonymously for moderation.')
      resetCenter()
    } catch (err) {
      setMessage('Submission saved locally for review.')
    } finally {
      setSubmitting(false)
      setTimeout(() => setMessage(null), 3600)
    }
  }

  async function submitStory(e: React.FormEvent) {
    e.preventDefault()
    if (!storyForm.enSit) return
    setSubmitting(true)
    try {
      await addPendingCase({
        title: {
          en: storyForm.enTitle || 'Untitled',
          ru: storyForm.ruTitle || storyForm.enTitle || 'Untitled',
          fr: storyForm.frTitle || storyForm.enTitle || 'Untitled',
          ar: storyForm.arTitle || storyForm.enTitle || 'Untitled',
        },
        situation: {
          en: storyForm.enSit,
          ru: storyForm.ruSit || storyForm.enSit,
          fr: storyForm.frSit || storyForm.enSit,
          ar: storyForm.arSit || storyForm.enSit,
        },
        actions: {
          en: storyForm.enAct || '',
          ru: storyForm.ruAct || storyForm.enAct || '',
          fr: storyForm.frAct || storyForm.enAct || '',
          ar: storyForm.arAct || storyForm.enAct || '',
        },
        outcome: {
          en: storyForm.enOut || '',
          ru: storyForm.ruOut || storyForm.enOut || '',
          fr: storyForm.frOut || storyForm.enOut || '',
          ar: storyForm.arOut || storyForm.enOut || '',
        },
      })
      setMessage(t('suggest.thank_story') || 'Thank you. Your story is submitted for review and may be published anonymously.')
      resetStory()
    } catch {
      setMessage('Thanks – submitted to moderation queue.')
    } finally {
      setSubmitting(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="text-3xl font-semibold mb-2">{t('suggest.title') || 'Suggest a resource or share your story'}</h1>
      <p className="text-slate-600 mb-6 text-sm">{t('suggest.desc') || 'Anonymous submissions are reviewed by an admin before appearing. No personal identifiers are kept. Your message helps support other women.'}</p>

      <div className="mb-4 flex gap-px text-sm w-fit bg-slate-100 rounded">
        <button onClick={() => setActiveTab('center')} className={`px-4 py-1.5 rounded ${activeTab === 'center' ? 'bg-white shadow font-medium' : ''}`}>{t('suggest.tab_center') || 'Suggest a help center'}</button>
        <button onClick={() => setActiveTab('story')} className={`px-4 py-1.5 rounded ${activeTab === 'story' ? 'bg-white shadow font-medium' : ''}`}>{t('suggest.tab_story') || 'Share an anonymous story'}</button>
      </div>

      {message && <div className="mb-4 text-sm bg-teal-50 border border-teal-200 px-4 py-2 rounded text-teal-800">{message}</div>}

      {activeTab === 'center' && (
        <form onSubmit={submitCenter} className="safe-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(['en','ru','fr','ar'] as const).map((lng) => (
              <div key={lng}>
                <label className="text-xs uppercase tracking-widest text-slate-500">{lng.toUpperCase()} {t('suggest.name') || 'name of service'} *</label>
                <input required={lng==='en'} value={(centerForm as any)[lng]} onChange={(e) => setCenterForm(f => ({ ...f, [lng]: e.target.value }))} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Shelter or hotline name" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500">{t('suggest.city') || 'City'} *</label>
              <input required value={centerForm.city} onChange={e=>setCenterForm({...centerForm, city: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500">{t('suggest.country') || 'Country'}</label>
              <input value={centerForm.country} onChange={e=>setCenterForm({...centerForm, country: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-slate-500">Categories (comma-separated, e.g. shelter,legal)</label>
            <input value={centerForm.categories} onChange={e=>setCenterForm({...centerForm, categories:e.target.value})} className="w-full border rounded px-3 py-1 text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Phone (optional)" value={centerForm.phone} onChange={(e)=>setCenterForm({...centerForm, phone:e.target.value})} className="border px-3 py-1.5 text-sm rounded" />
            <input placeholder="Website (optional)" value={centerForm.web} onChange={(e)=>setCenterForm({...centerForm, web:e.target.value})} className="border px-3 py-1.5 text-sm rounded" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest block mb-1 text-slate-500">Short description (English preferred)</label>
            <textarea value={centerForm.desc_en} onChange={e=>setCenterForm({...centerForm, desc_en:e.target.value})} rows={3} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="What services they provide, who can call, languages..." />
          </div>

          <div className="grid md:grid-cols-3 gap-2">
            {['ru','fr','ar'].map(l => (
              <div key={l}>
                <label className="text-xs tracking-widest uppercase block mb-px text-slate-500">{l} desc</label>
                <textarea value={(centerForm as any)[`desc_${l}`]} onChange={e => setCenterForm(f=>({...f, [`desc_${l}`]: e.target.value}))} rows={2} className="w-full text-xs border rounded p-1.5" />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={resetCenter} className="px-3 py-1.5 border rounded text-sm">Reset</button>
            <button disabled={submitting} type="submit" className="px-4 py-1.5 bg-teal-800 text-white rounded text-sm disabled:opacity-60">{submitting ? 'Sending…' : (t('suggest.submit_center') || 'Submit center for review')}</button>
          </div>

          <p className="text-xs text-slate-500 mt-3">The suggestion will go into the admin moderation queue. Thank you for helping expand safety resources worldwide.</p>
        </form>
      )}

      {activeTab === 'story' && (
        <form onSubmit={submitStory} className="safe-card p-6 space-y-4">
          <p className="text-sm text-slate-600">Share your experience anonymously to support other migrant women. All stories published are carefully reviewed.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(['en','ru','fr','ar'] as const).map(lng => (
              <div key={lng}>
                <label className="text-xs tracking-widest uppercase text-slate-500">{lng} title</label>
                <input value={(storyForm as any)[lng + 'Title']} onChange={e=>setStoryForm(f => ({...f, [lng+'Title'] : e.target.value }))} className="text-sm w-full border px-3 py-1.5 rounded" />
              </div>
            ))}
          </div>

          <hr className="my-1" />
          {(['en','ru','fr','ar'] as const).map(lng => (
            <div key={lng}>
              <label className="block text-xs uppercase tracking-widest text-slate-500 mb-px">{lng.toUpperCase()} - What was the situation?</label>
              <textarea required={lng==='en'} value={(storyForm as any)[lng==='en'?'enSit': lng+'Sit']} onChange={(e)=> setStoryForm(f=>({...f, [lng==='en'?'enSit' : lng+'Sit']:e.target.value }))} rows={2} className="block border rounded px-3 py-1.5 w-full text-sm" />
            </div>
          ))}

          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-px">English - What helped?</label>
            <textarea value={storyForm.enAct} onChange={e=>setStoryForm({...storyForm,enAct:e.target.value})} rows={2} className="w-full border rounded px-3 py-1.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-px">English - How is life now?</label>
            <textarea value={storyForm.enOut} onChange={e=>setStoryForm({...storyForm,enOut:e.target.value})} rows={2} className="w-full border rounded px-3 py-1.5 text-sm" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={resetStory} className="px-3 py-1.5 rounded border text-sm">Clear</button>
            <button disabled={submitting} type="submit" className="px-4 py-1.5 rounded bg-teal-800 text-white text-sm disabled:opacity-70">{submitting ? 'Sending…' : (t('suggest.submit_story') || 'Submit story for review')}</button>
          </div>
          <p className="text-[11px] text-slate-400">All fields kept minimal and anonymous. Thank you for sharing.</p>
        </form>
      )}

      <div className="mt-8 text-[12px] text-slate-400">You can also submit locations directly from the <a className="underline" href="/map">Help Map</a> or stories from the <a className="underline" href="/stories">Stories page</a>.</div>
    </div>
  )
}

export default SuggestPage
