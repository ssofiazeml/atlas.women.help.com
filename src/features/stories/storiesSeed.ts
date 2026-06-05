// Hardcoded seed stories exported so the admin can read & override them.
export interface SeedStoryRaw {
  id: number
  published: boolean
  title: Record<string, string>
  situation: Record<string, string>
  actions: Record<string, string>
  outcome: Record<string, string>
  tags?: string[]
}

export const PUBLISHED_STORIES: SeedStoryRaw[] = [
  {
    id: 1,
    published: true,
    title: {
      en: 'Escaping with small children',
      ru: 'Побег с маленькими детьми',
      fr: 'Fuir avec de jeunes enfants',
      ar: 'الهروب مع الأطفال الصغار',
    },
    situation: {
      en: 'My partner became violent after we moved abroad. I had no local friends or access to money and was afraid to leave with two toddlers.',
      ru: 'После переезда за границу партнёр стал агрессивным. Друзей не было, доступа к деньгам тоже, у меня было двое малышей.',
      fr: 'Mon partenaire est devenu violent après notre déménagement à l’étranger. J’avais peur de partir avec deux tout-petits sans amis ni argent local.',
      ar: 'أصبح شريكي عنيفاً بعد انتقالنا للخارج. لم يكن لدي أصدقاء محليون أو مال، وكان لدي طفلان صغيران.',
    },
    actions: {
      en: 'I contacted a shelter from a safe device at a library. It took weeks to arrange a safe exit plan. I copied important papers to a cloud account shared with no one else.',
      ru: 'Связалась с приютом с безопасного устройства в библиотеке. Несколько недель ушло на план побега. Скопировала важные документы в защищённое облако.',
      fr: 'J’ai contacté un refuge depuis un ordinateur de bibliothèque. Il m’a fallu des semaines pour organiser une sortie sûre. J’ai archivé les documents importants sur un cloud anonyme.',
      ar: 'اتصلت بمأوى من جهاز آمن في المكتبة. استغرق الأمر أسابيع لتنظيم خروج آمن. نسخت الوثائق المهمة إلى حساب سحابي آمن.',
    },
    outcome: {
      en: 'The women’s shelter in Paris provided immediate housing and helped me with legal aid. After six months I found work and stable housing for us.',
      ru: 'Приют в Париже дал жильё и помог с юристом. Через полгода я нашла работу и жильё для нас.',
      fr: 'Le refuge à Paris m’a offert un logement et de l’aide juridique. Six mois plus tard j’avais un emploi et un logement stable.',
      ar: 'قدم المأوى في باريس السكن الفوري والمساعدة القانونية. بعد ستة أشهر وجدت عملاً ومسكناً مستقراً.',
    },
    tags: ['shelter', 'legal', 'children'],
  },
  {
    id: 2,
    published: true,
    title: {
      en: 'Getting legal protection as an immigrant',
      ru: 'Получение судебной защиты как иммигрантка',
      fr: 'Obtenir une protection juridique en tant qu’immigrante',
      ar: 'الحصول على حماية قانونية كمهاجرة',
    },
    situation: {
      en: 'My husband controlled my immigration papers and threatened to have me deported if I reported the violence.',
      ru: 'Муж контролировал мои миграционные документы и угрожал депортацией, если я расскажу о насилии.',
      fr: 'Mon mari contrôlait mes papiers d’immigration et menaçait de me dénoncer si je parlais des violences.',
      ar: 'سيطر زوجي على أوراقي الهجرية وهدد بترحيلي إذا أبلغت عن العنف.',
    },
    actions: {
      en: 'I called a women’s legal help line anonymously from a cafe. They helped me apply for an emergency protection order and a special visa for victims of domestic violence.',
      ru: 'Анонимно позвонила с телефона в кафе в юридическую линию для женщин. Помогли подать на защитный ордер и визу для жертв насилия.',
      fr: 'J’ai appelé anonymement une permanence juridique féminine depuis un café. Ils m’ont aidée à obtenir une ordonnance d’urgence et un visa spécial.',
      ar: 'اتصلت بخط مساعدة قانونية للنساء من مقهى بشكل مجهول. ساعدوني في تقديم طلب أمر حماية طارئ وتأشيرة خاصة لضحايا العنف.',
    },
    outcome: {
      en: 'I obtained a protection order and independent residency status. With legal support I started divorce proceedings safely.',
      ru: 'Получила защитный ордер и самостоятельный статус резидента. С юридической помощью safely начала развод.',
      fr: 'J’ai obtenu une ordonnance de protection et un titre de séjour indépendant. J’ai pu engager la procédure de divorce.',
      ar: 'حصلت على أمر حماية وإقامة مستقلة. بدأت إجراءات الطلاق بأمان مع الدعم القانوني.',
    },
    tags: ['legal', 'immigration'],
  },
  {
    id: 3,
    published: true,
    title: {
      en: 'Finding safety when family becomes the threat',
      ru: 'Найти безопасность, когда угрожает семья',
      fr: 'Trouver la sécurité quand la famille devient une menace',
      ar: 'إيجاد الأمان عندما تتحول العائلة إلى تهديد',
    },
    situation: {
      en: 'After refusing an arranged marriage my brothers locked me at home and took my phone and passport.',
      ru: 'После отказа от навязанного брака братья заперли меня дома, забрали телефон и паспорт.',
      fr: 'Après avoir refusé un mariage arrangé mes frères m’ont enfermée et pris mon téléphone et mon passeport.',
      ar: 'بعد رفضي لزواج مرتّب، حبسني إخوتي في المنزل وأخذوا هاتفي وجواز سفري.',
    },
    actions: {
      en: 'I used a neighbour’s phone once to call a crisis line taught in school. They arranged a discreet pickup and temporary safe housing while working with social services and police.',
      ru: 'Однажды позвонила по телефону соседей на горячую линию. Организовали незаметный вывоз и временное безопасное жильё, работали с полицией.',
      fr: 'J’ai utilisé le téléphone d’une voisine pour appeler une ligne d’urgence vue à l’école. Ils ont organisé un ramassage discret et un logement sûr temporaire.',
      ar: 'استخدمت هاتف جارة للاتصال بخط أزمة تعلمته في المدرسة. رتبوا إخراجاً هادئاً وسكناً مؤقتاً آمناً وتعاونوا مع الخدمات الاجتماعية.',
    },
    outcome: {
      en: 'I was placed in a dedicated shelter for young women at risk and later received educational support and a new ID. Three years later I’m studying and living independently.',
      ru: 'Поместили в специальный приют для девушек в опасности. Получила поддержку в образовании и новые документы. Спустя три года учусь и живу самостоятельно.',
      fr: 'J’ai été placée dans un refuge spécialisé. J’ai reçu une aide éducative et de nouveaux papiers. Trois ans plus tard j’étudie et vis indépendamment.',
      ar: 'وُضعت في مأوى متخصص للشابات المعرضات للخطر. حصلت على دعم تعليمي ووثائق جديدة. بعد ثلاث سنوات أدرس وأعيش باستقلالية.',
    },
    tags: ['psychological', 'shelter'],
  },
]