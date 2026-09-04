// Adaptive localisation of short, free-typed values such as opening hours
// ("пн-пт 9:00-18:00") and language lists ("рус, eng, ar").
//
// Admins type these fields in whatever language and with whatever
// abbreviations they like. Before showing them to a visitor we:
//   1. expand every abbreviation to its full meaning (пн -> Monday / Понедельник)
//   2. translate every recognised word into the current interface language
// Anything not recognised is left exactly as typed.

type T = (key: string, opts?: any) => string

// ---- dictionaries ---------------------------------------------------------
// token (lower-case, letters/digits only) -> i18n key suffix
const SCHEDULE_TOKENS: Record<string, string> = {}
const addTokens = (target: Record<string, string>, key: string, words: string[]) => {
  for (const w of words) target[w.toLowerCase()] = key
}

addTokens(SCHEDULE_TOKENS, 'mon', ['пн', 'пон', 'понедельник', 'mon', 'monday', 'lun', 'lunes', 'lundi', 'الاثنين', '周一', '星期一'])
addTokens(SCHEDULE_TOKENS, 'tue', ['вт', 'втор', 'вторник', 'tue', 'tues', 'tuesday', 'mar', 'martes', 'mardi', 'الثلاثاء', '周二', '星期二'])
addTokens(SCHEDULE_TOKENS, 'wed', ['ср', 'сре', 'среда', 'wed', 'wednesday', 'mie', 'miercoles', 'mercredi', 'الأربعاء', '周三', '星期三'])
addTokens(SCHEDULE_TOKENS, 'thu', ['чт', 'четв', 'четверг', 'thu', 'thur', 'thurs', 'thursday', 'jue', 'jueves', 'jeudi', 'الخميس', '周四', '星期四'])
addTokens(SCHEDULE_TOKENS, 'fri', ['пт', 'пятн', 'пятница', 'fri', 'friday', 'vie', 'viernes', 'vendredi', 'الجمعة', '周五', '星期五'])
addTokens(SCHEDULE_TOKENS, 'sat', ['сб', 'суб', 'суббота', 'sat', 'saturday', 'sab', 'sabado', 'samedi', 'السبت', '周六', '星期六'])
addTokens(SCHEDULE_TOKENS, 'sun', ['вс', 'вск', 'воскресенье', 'sun', 'sunday', 'dom', 'domingo', 'dimanche', 'الأحد', '周日', '星期日'])
addTokens(SCHEDULE_TOKENS, 'daily', ['ежедневно', 'каждый', 'daily', 'everyday', 'diario', 'diariamente', 'quotidien', 'يوميا', '每天'])
addTokens(SCHEDULE_TOKENS, 'weekdays', ['будни', 'буднидни', 'рабочие', 'weekdays', 'weekday', 'laborables', 'semaine'])
addTokens(SCHEDULE_TOKENS, 'weekend', ['выходные', 'weekend', 'weekends', 'finde', 'weekende'])
addTokens(SCHEDULE_TOKENS, 'round_clock', ['круглосуточно', 'круглосуточная', '24h', '24hours', '24часа', 'nonstop', 'siempre'])
addTokens(SCHEDULE_TOKENS, 'by_appointment', ['записи', 'предзаписи', 'appointment', 'appointments', 'cita', 'rendezvous'])
addTokens(SCHEDULE_TOKENS, 'closed', ['закрыто', 'выходной', 'closed', 'cerrado', 'ferme'])
addTokens(SCHEDULE_TOKENS, 'hour_short', ['ч', 'час', 'часов', 'hrs', 'hr'])

const LANGUAGE_TOKENS: Record<string, string> = {}
addTokens(LANGUAGE_TOKENS, 'ru', ['ru', 'rus', 'рус', 'русский', 'россия', 'russian', 'ruso', 'russe', 'الروسية', '俄语'])
addTokens(LANGUAGE_TOKENS, 'en', ['en', 'eng', 'англ', 'английский', 'english', 'ingles', 'anglais', 'الإنجليزية', '英语'])
addTokens(LANGUAGE_TOKENS, 'es', ['es', 'spa', 'исп', 'испанский', 'spanish', 'espanol', 'espagnol', 'الإسبانية', '西班牙语'])
addTokens(LANGUAGE_TOKENS, 'fr', ['fr', 'fra', 'фр', 'французский', 'french', 'francais', 'frances', 'الفرنسية', '法语'])
addTokens(LANGUAGE_TOKENS, 'ar', ['ar', 'ara', 'араб', 'арабский', 'arabic', 'arabe', 'العربية', '阿拉伯语'])
addTokens(LANGUAGE_TOKENS, 'zh', ['zh', 'chi', 'кит', 'китайский', 'chinese', 'chino', 'chinois', 'الصينية', '中文', '汉语'])
addTokens(LANGUAGE_TOKENS, 'de', ['de', 'ger', 'нем', 'немецкий', 'german', 'deutsch', 'aleman', 'allemand', 'الألمانية', '德语'])
addTokens(LANGUAGE_TOKENS, 'uk', ['uk', 'ukr', 'укр', 'украинский', 'ukrainian', 'ucraniano', 'ukrainien', 'الأوكرانية', '乌克兰语'])
addTokens(LANGUAGE_TOKENS, 'tr', ['tr', 'tur', 'тур', 'турецкий', 'turkish', 'turco', 'turc', 'التركية', '土耳其语'])
addTokens(LANGUAGE_TOKENS, 'fa', ['fa', 'far', 'перс', 'персидский', 'фарси', 'persian', 'farsi', 'الفارسية', '波斯语'])
addTokens(LANGUAGE_TOKENS, 'pl', ['pl', 'pol', 'пол', 'польский', 'polish', 'polaco', 'polonais', 'البولندية', '波兰语'])
addTokens(LANGUAGE_TOKENS, 'pt', ['pt', 'por', 'порт', 'португальский', 'portuguese', 'portugues', 'portugais', 'البرتغالية', '葡萄牙语'])
addTokens(LANGUAGE_TOKENS, 'hi', ['hi', 'hin', 'хинди', 'hindi', 'الهندية', '印地语'])
addTokens(LANGUAGE_TOKENS, 'ur', ['ur', 'urd', 'урду', 'urdu', 'الأردية', '乌尔都语'])
addTokens(LANGUAGE_TOKENS, 'ky', ['кырг', 'киргизский', 'кыргызский', 'kyrgyz'])
addTokens(LANGUAGE_TOKENS, 'uz', ['уз', 'узб', 'узбекский', 'uzbek', 'ozbek'])
addTokens(LANGUAGE_TOKENS, 'tg', ['тадж', 'таджикский', 'tajik'])
addTokens(LANGUAGE_TOKENS, 'hy', ['арм', 'армянский', 'armenian'])
addTokens(LANGUAGE_TOKENS, 'ka', ['груз', 'грузинский', 'georgian'])
addTokens(LANGUAGE_TOKENS, 'az', ['азерб', 'азербайджанский', 'azerbaijani'])
addTokens(LANGUAGE_TOKENS, 'kk', ['каз', 'казахский', 'kazakh'])
addTokens(LANGUAGE_TOKENS, 'sign', ['жестовый', 'жестового', 'sign', 'signes'])

const SEPARATOR = /([^\p{L}\p{N}]+)/u

function localizeTokens(
  text: string,
  dict: Record<string, string>,
  prefix: string,
  t: T
): string {
  if (!text) return ''
  // "24/7" and similar are handled first, they are not a single word token.
  let src = text.replace(/24\s*[\/\\x-]\s*7/gi, '\u0000ROUND\u0000')
  const parts = src.split(SEPARATOR)
  const out = parts.map((part) => {
    if (part === '\u0000ROUND\u0000') return t(`${prefix}.round_clock`, { defaultValue: '24/7' })
    if (!part || SEPARATOR.test(part)) return part
    const key = dict[part.toLowerCase()]
    if (!key) return part
    const translated = t(`${prefix}.${key}`, { defaultValue: '' })
    return translated || part
  })
  return out.join('').replace(/\u0000/g, '').trim()
}

/** "пн-пт 9:00-18:00" -> "Monday – Friday 9:00-18:00" (in the active language) */
export function localizeSchedule(text: string | undefined, t: T): string {
  return localizeTokens(text || '', SCHEDULE_TOKENS, 'sched', t)
}

/** "рус, eng, ar" -> "Русский, Английский, Арабский" (in the active language) */
export function localizeLanguages(text: string | undefined, t: T): string {
  return localizeTokens(text || '', LANGUAGE_TOKENS, 'langs', t)
}
