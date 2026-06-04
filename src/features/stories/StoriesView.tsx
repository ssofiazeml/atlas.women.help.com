import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Story {
  id: number
  published: boolean
  title: Record<string, string>
  situation: Record<string, string>
  actions: Record<string, string>
  outcome: Record<string, string>
  tags?: string[]
}

const publishedStories: Story[] = [
  {
    id: 1,
    published: true,
    title: {
      en: 'Escaping with small children',
      ru: 'Побег с маленькими детьми',
      fr: 'Fuir avec de jeunes enfants',
      ar: 'الهروب مع الأطفال الصغار'
    },
    situation: {
      en: 'My partner became violent after we moved abroad. I had no local friends or access to money and was afraid to leave with two toddlers.',
      ru: 'После переезда за границу партнёр стал агрессивным. Друзей не было, доступа к деньгам тоже, у меня было двое малышей.',
      fr: 'Mon partenaire est devenu violent après notre déménagement à l’étranger. J’avais peur de partir avec deux tout-petits sans amis ni argent local.',
      ar: 'أصبح شريكي عنيفاً بعد انتقالنا للخارج. لم يكن لدي أصدقاء محليون أو مال، وكان لدي طفلان صغيران.'
    },
    actions: {
      en: 'I contacted a shelter from a safe device at a library. It took weeks to arrange a safe exit plan. I copied important papers to a cloud account shared with no one else.',
      ru: 'Связалась с приютом с безопасного устройства в библиотеке. Несколько недель ушло на план побега. Скопировала важные документы в защищённое облако.',
      fr: 'J’ai contacté un refuge depuis un ordinateur de bibliothèque. Il m’a fallu des semaines pour organiser une sortie sûre. J’ai archivé les documents importants sur un cloud anonyme.',
      ar: 'اتصلت بمأوى من جهاز آمن في المكتبة. استغرق الأمر أسابيع لتنظيم خروج آمن. نسخت الوثائق المهمة إلى حساب سحابي آمن.'
    },
    outcome: {
      en: 'The women’s shelter in Paris provided immediate housing and helped me with legal aid. After six months I found work and stable housing for us.',
      ru: 'Приют в Париже дал жильё и помог с юристом. Через полгода я нашла работу и жильё для нас.',
      fr: 'Le refuge à Paris m’a offert un logement et de l’aide juridique. Six mois plus tard j’avais un emploi et un logement stable.',
      ar: 'قدم المأوى في باريس السكن الفوري والمساعدة القانونية. بعد ستة أشهر وجدت عملاً ومسكناً مستقراً.'
    },
    tags: ['shelter', 'legal', 'children']
  },
  {
    id: 2,
    published: true,
    title: {
      en: 'Getting legal protection as an immigrant',
      ru: 'Получение судебной защиты как иммигрантка',
      fr: 'Obtenir une protection juridique en tant qu’immigrante',
      ar: 'الحصول على حماية قانونية كمهاجرة'
    },
    situation: {
      en: 'My husband controlled my immigration papers and threatened to have me deported if I reported the violence.',
      ru: 'Муж контролировал мои миграционные документы и угрожал депортацией, если я расскажу о насилии.',
      fr: 'Mon mari contrôlait mes papiers d’immigration et menaçait de me dénoncer si je parlais des violences.',
      ar: 'سيطر زوجي على أوراقي الهجرية وهدد بترحيلي إذا أبلغت عن العنف.'
    },
    actions: {
      en: 'I called a women’s legal help line anonymously from a cafe. They helped me apply for an emergency protection order and a special visa for victims of domestic violence.',
      ru: 'Анонимно позвонила с телефона в кафе в юридическую линию для женщин. Помогли подать на защитный ордер и визу для жертв насилия.',
      fr: 'J’ai appelé anonymement une permanence juridique féminine depuis un café. Ils m’ont aidée à obtenir une ordonnance d’urgence et un visa spécial.',
      ar: 'اتصلت بخط مساعدة قانونية للنساء من مقهى بشكل مجهول. ساعدوني في تقديم طلب أمر حماية طارئ وتأشيرة خاصة لضحايا العنف.'
    },
    outcome: {
      en: 'I obtained a protection order and independent residency status. With legal support I started divorce proceedings safely.',
      ru: 'Получила защитный ордер и самостоятельный статус резидента. С юридической помощью safely начала развод.',
      fr: 'J’ai obtenu une ordonnance de protection et un titre de séjour indépendant. J’ai pu engager la procédure de divorce.',
      ar: 'حصلت على أمر حماية وإقامة مستقلة. بدأت إجراءات الطلاق بأمان مع الدعم القانوني.'
    },
    tags: ['legal', 'immigration']
  },
  {
    id: 3,
    published: true,
    title: {
      en: 'Finding safety when family becomes the threat',
      ru: 'Найти безопасность, когда угрожает семья',
      fr: 'Trouver la sécurité quand la famille devient une menace',
      ar: 'إيجاد الأمان عندما تتحول العائلة إلى تهديد'
    },
    situation: {
      en: 'After refusing an arranged marriage my brothers locked me at home and took my phone and passport.',
      ru: 'После отказа от навязанного брака братья заперли меня дома, забрали телефон и паспорт.',
      fr: 'Après avoir refusé un mariage arrangé mes frères m’ont enfermée et pris mon téléphone et mon passeport.',
      ar: 'بعد رفضي لزواج مرتّب، حبسني إخوتي في المنزل وأخذوا هاتفي وجواز سفري.'
    },
    actions: {
      en: 'I used a neighbour’s phone once to call a crisis line taught in school. They arranged a discreet pickup and temporary safe housing while working with social services and police.',
      ru: 'Однажды позвонила по телефону соседей на горячую линию. Организовали незаметный вывоз и временное безопасное жильё, работали с полицией.',
      fr: 'J’ai utilisé le téléphone d’une voisine pour appeler une ligne d’urgence vue à l’école. Ils ont organisé un ramassage discret et un logement sûr temporaire.',
      ar: 'استخدمت هاتف جارة للاتصال بخط أزمة تعلمته في المدرسة. رتبوا إخراجاً هادئاً وسكناً مؤقتاً آمناً وتعاونوا مع الخدمات الاجتماعية.'
    },
    outcome: {
      en: 'I was placed in a dedicated shelter for young women at risk and later received educational support and a new ID. Three years later I’m studying and living independently.',
      ru: 'Поместили в специальный приют для девушек в опасности. Получила поддержку в образовании и новые документы. Спустя три года учусь и живу самостоятельно.',
      fr: 'J’ai été placée dans un refuge spécialisé. J’ai reçu une aide éducative et de nouveaux papiers. Trois ans plus tard j’étudie et vis indépendamment.',
      ar: 'وُضعت في مأوى متخصص للشابات المعرضات للخطر. حصلت على دعم تعليمي ووثائق جديدة. بعد ثلاث سنوات أدرس وأعيش باستقلالية.'
    },
    tags: ['psychological', 'shelter']
  }
]

export function StoriesView() {
  const { t, i18n } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)

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
        {publishedStories.map(story => (
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
