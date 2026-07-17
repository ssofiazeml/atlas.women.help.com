import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAboutTexts, subscribeContent, type AboutTexts } from '../../lib/contentStore'
import { pickLocalized } from '../../lib/translate'

const DEFAULT_TITLE = 'Atlas Women'

const DEFAULT_INTRO = `Atlas Women — независимая цифровая платформа, созданная для того, чтобы сделать информацию о доступной помощи женщинам более понятной, доступной и удобной независимо от страны проживания.

Проект посвящен вопросам гендерной безопасности, международной миграции и роли цифровых технологий в обеспечении доступа к проверенной информации.

Atlas Women не является кризисным центром, государственным учреждением или международной организацией. Проект самостоятельно собирает, систематизирует и публикует информацию из открытых и проверяемых источников, помогая пользователям быстрее находить существующие службы поддержки в разных странах мира.

Помимо карты организаций помощи, платформа включает исследовательские материалы, анонимные истории женщин и возможность предложить новые организации для проверки и последующего добавления в каталог.`

const DEFAULT_MISSION = `Сделать проверенную информацию о помощи максимально доступной и показать, как цифровые технологии могут снижать информационные барьеры и способствовать безопасности женщин в условиях международной миграции.`

const DEFAULT_INCLUDES = `интерактивную мировую карту организаций помощи
каталог кризисных центров и служб поддержки
анонимные истории женщин
исследовательские материалы по вопросам миграции, цифровой дипломатии и гендерной безопасности
возможность предложить новую организацию
возможность поделиться собственной историей`

const DEFAULT_PRINCIPLES = `достоверность публикуемой информации
уважение конфиденциальности пользователей
открытость и доступность информации
независимость проекта
постоянное развитие и обновление базы данных`

function toList(v?: string): string[] {
  if (!v) return []
  return v
    .split(/\r?\n/)
    .map((s) => s.replace(/^[-•·\s]+/, '').trim())
    .filter(Boolean)
}

export function About() {
  const { i18n } = useTranslation()
  const lang = (i18n.language || 'en').split('-')[0]
  const [texts, setTexts] = useState<AboutTexts>(() => getAboutTexts())

  useEffect(() => subscribeContent(() => setTexts(getAboutTexts())), [])

  const title = pickLocalized(texts, 'title', lang) || texts.title || DEFAULT_TITLE
  const intro = pickLocalized(texts, 'intro', lang) || texts.intro || DEFAULT_INTRO
  const mission = pickLocalized(texts, 'mission', lang) || texts.mission || DEFAULT_MISSION
  const includes = toList(pickLocalized(texts, 'includes', lang) || texts.includes || DEFAULT_INCLUDES)
  const principles = toList(pickLocalized(texts, 'principles', lang) || texts.principles || DEFAULT_PRINCIPLES)

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">
      <header className="mb-10 md:mb-14">
        <div className="text-xs uppercase tracking-widest text-safe-teal font-medium mb-3">О проекте</div>
        <h1 className="text-4xl md:text-5xl font-semibold text-safe-800 tracking-tight leading-tight">
          {title}
        </h1>
      </header>

      {texts.photo && (
        <img
          src={texts.photo}
          alt=""
          className="w-full rounded-2xl border border-slate-200 mb-10 max-h-[380px] object-cover"
        />
      )}

      <section className="prose prose-slate max-w-none mb-12">
        {intro.split(/\n\n+/).map((p, i) => (
          <p key={i} className="text-base md:text-lg text-slate-700 leading-relaxed mb-4">{p}</p>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-safe-800 mb-4">Миссия</h2>
        <div className="safe-card bg-white">
          <p className="text-base md:text-lg text-slate-700 leading-relaxed">{mission}</p>
        </div>
      </section>

      {includes.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-safe-800 mb-4">Что включает платформа</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {includes.map((line, i) => (
              <li key={i} className="safe-card bg-white flex gap-3">
                <span className="text-safe-teal font-semibold shrink-0">0{i + 1}</span>
                <span className="text-slate-700">{line}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {principles.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-safe-800 mb-4">Принципы проекта</h2>
          <ul className="grid gap-3">
            {principles.map((line, i) => (
              <li key={i} className="safe-card bg-white flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-safe-teal shrink-0" />
                <span className="text-slate-700">{line}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}