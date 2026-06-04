import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Step {
  id: string
  questionKey: string
  options?: Array<{ labelKey: string; nextId: string }>
  adviceKey?: string
  showMapLink?: boolean
  showQuickExit?: boolean
  showChecklistsLink?: boolean
  final?: boolean
}

// Full predefined local decision tree matching the provided spec exactly.
// All data is static, all logic local, no AI or network calls.
const tree: Step[] = [
  // START
  {
    id: 'start',
    questionKey: 'chatbot.start.what_bothers',
    options: [
      { labelKey: 'chatbot.option.safety', nextId: 'safety_q' },
      { labelKey: 'chatbot.option.documents', nextId: 'docs_main' },
      { labelKey: 'chatbot.option.housing', nextId: 'housing_main' },
      { labelKey: 'chatbot.option.work', nextId: 'work_main' },
      { labelKey: 'chatbot.option.psych', nextId: 'psych_main' },
      { labelKey: 'chatbot.option.child', nextId: 'child_main' },
      { labelKey: 'chatbot.option.legal', nextId: 'legal_main' },
      { labelKey: 'chatbot.option.medical', nextId: 'medical_main' },
      { labelKey: 'chatbot.option.help_another', nextId: 'help_another_role' },
    ],
  },

  // 1. SAFETY
  {
    id: 'safety_q',
    questionKey: 'chatbot.safety.danger_now',
    options: [
      { labelKey: 'chatbot.yes', nextId: 'safety_danger_yes' },
      { labelKey: 'chatbot.no', nextId: 'safety_sub' },
      { labelKey: 'chatbot.unsure', nextId: 'safety_sub' },
    ],
  },
  {
    id: 'safety_danger_yes',
    questionKey: 'chatbot.safety.danger_actions',
    adviceKey: 'chatbot.safety.danger_advice',
    showMapLink: true,
    showQuickExit: true,
    showChecklistsLink: true,
    final: true,
  },
  {
    id: 'safety_sub',
    questionKey: 'chatbot.safety.what_bothers',
    options: [
      { labelKey: 'chatbot.safety.threats', nextId: 'safety_threats' },
      { labelKey: 'chatbot.safety.partner_control', nextId: 'safety_control' },
      { labelKey: 'chatbot.safety.stalking', nextId: 'safety_stalking' },
      { labelKey: 'chatbot.safety.digital', nextId: 'safety_digital' },
      { labelKey: 'chatbot.safety.financial', nextId: 'safety_financial' },
      { labelKey: 'chatbot.safety.docs_seized', nextId: 'safety_docs' },
    ],
  },
  { id: 'safety_threats', questionKey: 'chatbot.safety.threats_desc', adviceKey: 'chatbot.safety.threats_advice', final: true },
  { id: 'safety_control', questionKey: 'chatbot.safety.control_desc', adviceKey: 'chatbot.safety.control_advice', final: true },
  { id: 'safety_stalking', questionKey: 'chatbot.safety.stalking_desc', adviceKey: 'chatbot.safety.stalking_advice', final: true },
  { id: 'safety_digital', questionKey: 'chatbot.safety.digital_desc', adviceKey: 'chatbot.safety.digital_advice', final: true },
  { id: 'safety_financial', questionKey: 'chatbot.safety.financial_desc', adviceKey: 'chatbot.safety.financial_advice', final: true },
  { id: 'safety_docs', questionKey: 'chatbot.safety.docs_desc', adviceKey: 'chatbot.safety.docs_advice', final: true },

  // 2. DOCUMENTS
  {
    id: 'docs_main',
    questionKey: 'chatbot.docs.what_problem',
    options: [
      { labelKey: 'chatbot.docs.lost_passport', nextId: 'docs_lost_passport' },
      { labelKey: 'chatbot.docs.lost_child_docs', nextId: 'docs_lost_child' },
      { labelKey: 'chatbot.docs.held', nextId: 'docs_held' },
      { labelKey: 'chatbot.docs.expired', nextId: 'docs_expired' },
      { labelKey: 'chatbot.docs.status', nextId: 'docs_status' },
    ],
  },
  { id: 'docs_lost_passport', questionKey: 'chatbot.docs.lost_passport_desc', adviceKey: 'chatbot.docs.lost_passport_advice', final: true },
  { id: 'docs_lost_child', questionKey: 'chatbot.docs.lost_child_desc', adviceKey: 'chatbot.docs.lost_child_advice', final: true },
  { id: 'docs_held', questionKey: 'chatbot.docs.held_desc', adviceKey: 'chatbot.docs.held_advice', final: true },
  { id: 'docs_expired', questionKey: 'chatbot.docs.expired_desc', adviceKey: 'chatbot.docs.expired_advice', final: true },
  { id: 'docs_status', questionKey: 'chatbot.docs.status_desc', adviceKey: 'chatbot.docs.status_advice', final: true },

  // 3. HOUSING
  {
    id: 'housing_main',
    questionKey: 'chatbot.housing.what_happened',
    options: [
      { labelKey: 'chatbot.housing.no_where', nextId: 'housing_nowhere' },
      { labelKey: 'chatbot.housing.temp', nextId: 'housing_temp' },
      { labelKey: 'chatbot.housing.evicted', nextId: 'housing_evicted' },
      { labelKey: 'chatbot.housing.owner_conflict', nextId: 'housing_conflict' },
      { labelKey: 'chatbot.housing.crisis_center', nextId: 'housing_crisis' },
    ],
  },
  { id: 'housing_nowhere', questionKey: 'chatbot.housing.nowhere_desc', adviceKey: 'chatbot.housing.nowhere_advice', showMapLink: true, final: true },
  { id: 'housing_temp', questionKey: 'chatbot.housing.temp_desc', adviceKey: 'chatbot.housing.temp_advice', showMapLink: true, final: true },
  { id: 'housing_evicted', questionKey: 'chatbot.housing.evicted_desc', adviceKey: 'chatbot.housing.evicted_advice', showMapLink: true, final: true },
  { id: 'housing_conflict', questionKey: 'chatbot.housing.conflict_desc', adviceKey: 'chatbot.housing.conflict_advice', showMapLink: true, final: true },
  { id: 'housing_crisis', questionKey: 'chatbot.housing.crisis_desc', adviceKey: 'chatbot.housing.crisis_advice', showMapLink: true, final: true },

  // 4. WORK
  {
    id: 'work_main',
    questionKey: 'chatbot.work.what_issue',
    options: [
      { labelKey: 'chatbot.work.no_pay', nextId: 'work_no_pay' },
      { labelKey: 'chatbot.work.docs_held', nextId: 'work_docs_held' },
      { labelKey: 'chatbot.work.forced', nextId: 'work_forced' },
      { labelKey: 'chatbot.work.discrimination', nextId: 'work_discr' },
      { labelKey: 'chatbot.work.threat_fired', nextId: 'work_fired' },
      { labelKey: 'chatbot.work.unsafe', nextId: 'work_unsafe' },
    ],
  },
  { id: 'work_no_pay', questionKey: 'chatbot.work.no_pay_desc', adviceKey: 'chatbot.work.no_pay_advice', final: true },
  { id: 'work_docs_held', questionKey: 'chatbot.work.docs_held_desc', adviceKey: 'chatbot.work.docs_held_advice', final: true },
  { id: 'work_forced', questionKey: 'chatbot.work.forced_desc', adviceKey: 'chatbot.work.forced_advice', final: true },
  { id: 'work_discr', questionKey: 'chatbot.work.discr_desc', adviceKey: 'chatbot.work.discr_advice', final: true },
  { id: 'work_fired', questionKey: 'chatbot.work.fired_desc', adviceKey: 'chatbot.work.fired_advice', final: true },
  { id: 'work_unsafe', questionKey: 'chatbot.work.unsafe_desc', adviceKey: 'chatbot.work.unsafe_advice', final: true },

  // 5. PSYCH
  {
    id: 'psych_main',
    questionKey: 'chatbot.psych.feeling',
    options: [
      { labelKey: 'chatbot.psych.anxiety', nextId: 'psych_anx' },
      { labelKey: 'chatbot.psych.fear', nextId: 'psych_fear' },
      { labelKey: 'chatbot.psych.lonely', nextId: 'psych_lonely' },
      { labelKey: 'chatbot.psych.migration_stress', nextId: 'psych_stress' },
      { labelKey: 'chatbot.psych.burnout', nextId: 'psych_burn' },
    ],
  },
  { id: 'psych_anx', questionKey: 'chatbot.psych.anx_desc', adviceKey: 'chatbot.psych.anx_advice', final: true },
  { id: 'psych_fear', questionKey: 'chatbot.psych.fear_desc', adviceKey: 'chatbot.psych.fear_advice', final: true },
  { id: 'psych_lonely', questionKey: 'chatbot.psych.lonely_desc', adviceKey: 'chatbot.psych.lonely_advice', final: true },
  { id: 'psych_stress', questionKey: 'chatbot.psych.stress_desc', adviceKey: 'chatbot.psych.stress_advice', final: true },
  { id: 'psych_burn', questionKey: 'chatbot.psych.burn_desc', adviceKey: 'chatbot.psych.burn_advice', final: true },

  // 6. CHILD
  {
    id: 'child_main',
    questionKey: 'chatbot.child.what_worries',
    options: [
      { labelKey: 'chatbot.child.safety', nextId: 'child_safety' },
      { labelKey: 'chatbot.child.education', nextId: 'child_edu' },
      { labelKey: 'chatbot.child.medical', nextId: 'child_med' },
      { labelKey: 'chatbot.child.docs', nextId: 'child_docs' },
      { labelKey: 'chatbot.child.psych_support', nextId: 'child_psych' },
    ],
  },
  { id: 'child_safety', questionKey: 'chatbot.child.safety_desc', adviceKey: 'chatbot.child.safety_advice', final: true },
  { id: 'child_edu', questionKey: 'chatbot.child.edu_desc', adviceKey: 'chatbot.child.edu_note', showMapLink: true, final: true },
  { id: 'child_med', questionKey: 'chatbot.child.med_desc', adviceKey: 'chatbot.child.med_advice', final: true },
  { id: 'child_docs', questionKey: 'chatbot.child.docs_desc', adviceKey: 'chatbot.child.docs_advice', final: true },
  { id: 'child_psych', questionKey: 'chatbot.child.psych_desc', adviceKey: 'chatbot.child.psych_advice', final: true },

  // 7. LEGAL
  {
    id: 'legal_main',
    questionKey: 'chatbot.legal.which',
    options: [
      { labelKey: 'chatbot.legal.migration', nextId: 'legal_mig' },
      { labelKey: 'chatbot.legal.labor', nextId: 'legal_labor' },
      { labelKey: 'chatbot.legal.family', nextId: 'legal_fam' },
      { labelKey: 'chatbot.legal.discrim', nextId: 'legal_disc' },
      { labelKey: 'chatbot.legal.child_prot', nextId: 'legal_child' },
      { labelKey: 'chatbot.legal.restore_docs', nextId: 'legal_restore' },
    ],
  },
  { id: 'legal_mig', questionKey: 'chatbot.legal.mig_desc', adviceKey: 'chatbot.legal.mig_advice', final: true },
  { id: 'legal_labor', questionKey: 'chatbot.legal.labor_desc', adviceKey: 'chatbot.legal.labor_advice', final: true },
  { id: 'legal_fam', questionKey: 'chatbot.legal.fam_desc', adviceKey: 'chatbot.legal.fam_advice', final: true },
  { id: 'legal_disc', questionKey: 'chatbot.legal.disc_desc', adviceKey: 'chatbot.legal.disc_advice', final: true },
  { id: 'legal_child', questionKey: 'chatbot.legal.child_desc', adviceKey: 'chatbot.legal.child_advice', final: true },
  { id: 'legal_restore', questionKey: 'chatbot.legal.restore_desc', adviceKey: 'chatbot.legal.restore_advice', final: true },

  // 8. MEDICAL
  {
    id: 'medical_main',
    questionKey: 'chatbot.medical.needed',
    options: [
      { labelKey: 'chatbot.medical.emergency', nextId: 'med_emerg' },
      { labelKey: 'chatbot.medical.treatment', nextId: 'med_treat' },
      { labelKey: 'chatbot.medical.meds', nextId: 'med_meds' },
      { labelKey: 'chatbot.medical.child', nextId: 'med_child' },
      { labelKey: 'chatbot.medical.psych', nextId: 'med_psych' },
    ],
  },
  { id: 'med_emerg', questionKey: 'chatbot.medical.emerg_desc', adviceKey: 'chatbot.medical.emerg_advice', final: true },
  { id: 'med_treat', questionKey: 'chatbot.medical.treat_desc', adviceKey: 'chatbot.medical.treat_advice', final: true },
  { id: 'med_meds', questionKey: 'chatbot.medical.meds_desc', adviceKey: 'chatbot.medical.meds_advice', final: true },
  { id: 'med_child', questionKey: 'chatbot.medical.child_desc', adviceKey: 'chatbot.medical.child_advice', final: true },
  { id: 'med_psych', questionKey: 'chatbot.medical.psych_desc', adviceKey: 'chatbot.medical.psych_advice', final: true },

  // 9. HELP ANOTHER
  {
    id: 'help_another_role',
    questionKey: 'chatbot.help.who_are_you',
    options: [
      { labelKey: 'chatbot.help.relative', nextId: 'help_relative' },
      { labelKey: 'chatbot.help.friend', nextId: 'help_friend' },
      { labelKey: 'chatbot.help.neighbour', nextId: 'help_neighbour' },
      { labelKey: 'chatbot.help.volunteer', nextId: 'help_volunteer' },
      { labelKey: 'chatbot.help.teacher', nextId: 'help_teacher' },
      { labelKey: 'chatbot.help.employer', nextId: 'help_employer' },
    ],
  },
  { id: 'help_relative', questionKey: 'chatbot.help.relative_desc', adviceKey: 'chatbot.help.relative_advice', final: true },
  { id: 'help_friend', questionKey: 'chatbot.help.friend_desc', adviceKey: 'chatbot.help.friend_advice', final: true },
  { id: 'help_neighbour', questionKey: 'chatbot.help.neighbour_desc', adviceKey: 'chatbot.help.neighbour_advice', final: true },
  { id: 'help_volunteer', questionKey: 'chatbot.help.volunteer_desc', adviceKey: 'chatbot.help.volunteer_advice', final: true },
  { id: 'help_teacher', questionKey: 'chatbot.help.teacher_desc', adviceKey: 'chatbot.help.teacher_advice', final: true },
  { id: 'help_employer', questionKey: 'chatbot.help.employer_desc', adviceKey: 'chatbot.help.employer_advice', final: true },
]

// Note for education: requirements vary. No specific lists of documents/events for schools.

export function Chatbot() {
  const { t } = useTranslation()
  const [currentId, setCurrentId] = useState('start')
  const [history, setHistory] = useState<Array<{ q: string; a?: string }>>([])

  const current = tree.find((s) => s.id === currentId) || tree[0]

  const select = (labelKey: string, nextId: string) => {
    setHistory((h) => [...h, { q: t(current.questionKey), a: t(labelKey) }])
    setCurrentId(nextId)
  }

  const restart = () => {
    setCurrentId('start')
    setHistory([])
  }

  const currentAdvice = current.adviceKey ? t(current.adviceKey) : null

  return (
    <div className="max-w-2xl mx-auto p-5">
      <div className="safe-card mb-4 p-5">
        <div className="flex justify-between items-center mb-3">
          <div className="font-semibold">{t('nav.chat')}</div>
          <button onClick={restart} className="text-xs underline">Restart</button>
        </div>

        <div className="min-h-[180px]">
          {history.length > 0 && (
            <div className="space-y-2 mb-4 text-sm">
              {history.map((h, idx) => (
                <div key={idx}>
                  <div className="text-slate-500 text-xs">{h.q}</div>
                  <div className="bg-teal-800 text-white rounded px-3 py-1 inline-block">{h.a}</div>
                </div>
              ))}
            </div>
          )}

          <div className="text-lg font-medium mb-3">{t(current.questionKey)}</div>

          {currentAdvice && (
            <div className="bg-slate-100 p-3 rounded mb-3 text-sm whitespace-pre-line">{currentAdvice}</div>
          )}

          {current.showMapLink && (
            <div className="mb-2"><a href="/map" className="underline text-sm text-teal-800">Go to the Help Map →</a></div>
          )}
          {current.showQuickExit && (
            <div className="mb-2 text-xs text-rose-600">Use the Quick Exit button in the top right at any time.</div>
          )}
          {current.showChecklistsLink && (
            <div className="mb-2"><a href="/checklists" className="underline text-sm">Open Safety Checklists →</a></div>
          )}

          {current.options && current.options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {current.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => select(opt.labelKey, opt.nextId)}
                  className="px-3 py-1.5 border rounded-full hover:bg-slate-50 text-sm"
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-[11px] text-slate-500">
        This is a completely local, non-AI decision tree. All branches and advice are pre-written. Nothing is stored or sent.
      </div>
    </div>
  )
}
