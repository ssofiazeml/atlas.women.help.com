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
      { labelKey: 'chatbot.option.safety_now', nextId: 'safety_q' },
      { labelKey: 'chatbot.option.housing', nextId: 'housing_main' },
      { labelKey: 'chatbot.option.documents', nextId: 'docs_main' },
      { labelKey: 'chatbot.option.work', nextId: 'work_main' },
      { labelKey: 'chatbot.option.child', nextId: 'child_main' },
      { labelKey: 'chatbot.option.legal', nextId: 'legal_main' },
      { labelKey: 'chatbot.option.medical', nextId: 'medical_main' },
      { labelKey: 'chatbot.option.psych', nextId: 'psych_main' },
      { labelKey: 'chatbot.option.digital_safety', nextId: 'digital_main' },
      { labelKey: 'chatbot.option.help_another', nextId: 'help_another_role' },
    ],
  },

  // 1. SAFETY (Мне сейчас угрожает опасность)
  {
    id: 'safety_q',
    questionKey: 'chatbot.s2.start',
    options: [
      { labelKey: 'chatbot.yes', nextId: 's2_why' },
      { labelKey: 'chatbot.no', nextId: 'safety_danger_yes' },
    ],
  },
  { id: 'safety_danger_yes', questionKey: 'chatbot.safety.danger_actions', adviceKey: 'chatbot.safety.danger_advice', showMapLink: true, showQuickExit: true, showChecklistsLink: true, final: true },

  { id: 's2_why', questionKey: 'chatbot.s2.why', options: [
    { labelKey: 'chatbot.s2.why_repeat', nextId: 's2_who' },
  ]},
  { id: 's2_who', questionKey: 'chatbot.s2.who', options: [
    { labelKey: 'chatbot.s2.who_partner', nextId: 's2_live' },
    { labelKey: 'chatbot.s2.who_ex', nextId: 's2_who_generic' },
    { labelKey: 'chatbot.s2.who_relative', nextId: 's2_who_generic' },
    { labelKey: 'chatbot.s2.who_stranger', nextId: 's2_who_generic' },
    { labelKey: 'chatbot.s2.who_other', nextId: 's2_who_generic' },
  ]},
  { id: 's2_who_generic', questionKey: 'chatbot.s2.who_generic_q', adviceKey: 'chatbot.s2.adv_general_safety', showMapLink: true, showChecklistsLink: true, final: true },

  { id: 's2_live', questionKey: 'chatbot.s2.live', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_home' },
    { labelKey: 'chatbot.no', nextId: 's2_who_generic' },
  ]},
  { id: 's2_home', questionKey: 'chatbot.s2.home', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_see' },
    { labelKey: 'chatbot.no', nextId: 's2_prepare' },
  ]},
  { id: 's2_prepare', questionKey: 'chatbot.s2.prepare_q', adviceKey: 'chatbot.s2.adv_prepare', showChecklistsLink: true, showMapLink: true, final: true },

  { id: 's2_see', questionKey: 'chatbot.s2.see', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_close' },
    { labelKey: 'chatbot.no', nextId: 's2_kids' },
  ]},
  { id: 's2_close', questionKey: 'chatbot.s2.close', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_kids' },
    { labelKey: 'chatbot.no', nextId: 's2_close_no' },
  ]},
  { id: 's2_close_no', questionKey: 'chatbot.s2.close_no_q', adviceKey: 'chatbot.s2.adv_close_no', showQuickExit: true, showChecklistsLink: true, final: true },

  { id: 's2_kids', questionKey: 'chatbot.s2.kids', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_kids_with' },
    { labelKey: 'chatbot.no', nextId: 's2_no_kids' },
  ]},
  { id: 's2_no_kids', questionKey: 'chatbot.s2.no_kids_q', adviceKey: 'chatbot.s2.adv_general_safety', showMapLink: true, showChecklistsLink: true, final: true },

  { id: 's2_kids_with', questionKey: 'chatbot.s2.kids_with', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_safe_place' },
    { labelKey: 'chatbot.no', nextId: 's2_threat_kids' },
  ]},

  { id: 's2_safe_place', questionKey: 'chatbot.s2.safe_place', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_place_where' },
    { labelKey: 'chatbot.no', nextId: 's2_why_not' },
    { labelKey: 'chatbot.s2.dont_know', nextId: 's2_who_helps' },
  ]},
  { id: 's2_place_where', questionKey: 'chatbot.s2.place_where', options: [
    { labelKey: 'chatbot.s2.pw_relatives', nextId: 's2_pw_relatives' },
    { labelKey: 'chatbot.s2.pw_friends', nextId: 's2_pw_friends' },
    { labelKey: 'chatbot.s2.pw_crisis', nextId: 's2_pw_crisis' },
    { labelKey: 'chatbot.s2.pw_shelter', nextId: 's2_pw_shelter' },
    { labelKey: 'chatbot.s2.pw_other', nextId: 's2_pw_other' },
  ]},
  { id: 's2_pw_relatives', questionKey: 'chatbot.s2.pw_relatives_q', adviceKey: 'chatbot.s2.adv_pw_relatives', final: true },
  { id: 's2_pw_friends', questionKey: 'chatbot.s2.pw_friends_q', adviceKey: 'chatbot.s2.adv_pw_friends', final: true },
  { id: 's2_pw_crisis', questionKey: 'chatbot.s2.pw_crisis_q', adviceKey: 'chatbot.s2.adv_pw_crisis', showMapLink: true, final: true },
  { id: 's2_pw_shelter', questionKey: 'chatbot.s2.pw_shelter_q', adviceKey: 'chatbot.s2.adv_pw_shelter', showMapLink: true, final: true },
  { id: 's2_pw_other', questionKey: 'chatbot.s2.pw_other_q', adviceKey: 'chatbot.s2.adv_pw_other', final: true },

  { id: 's2_why_not', questionKey: 'chatbot.s2.why_not', options: [
    { labelKey: 'chatbot.s2.wn_no_rel', nextId: 's2_wn_out' },
    { labelKey: 'chatbot.s2.wn_no_friends', nextId: 's2_wn_out' },
    { labelKey: 'chatbot.s2.wn_no_money', nextId: 's2_wn_out' },
    { labelKey: 'chatbot.s2.wn_afraid', nextId: 's2_wn_afraid_out' },
    { labelKey: 'chatbot.s2.wn_dont_know', nextId: 's2_wn_out' },
    { labelKey: 'chatbot.s2.wn_other', nextId: 's2_wn_out' },
  ]},
  { id: 's2_wn_out', questionKey: 'chatbot.s2.wn_out_q', adviceKey: 'chatbot.s2.adv_no_place', showMapLink: true, showChecklistsLink: true, final: true },
  { id: 's2_wn_afraid_out', questionKey: 'chatbot.s2.wn_afraid_q', adviceKey: 'chatbot.s2.adv_afraid', showMapLink: true, showChecklistsLink: true, final: true },

  { id: 's2_who_helps', questionKey: 'chatbot.s2.who_helps', options: [
    { labelKey: 'chatbot.s2.wh_relative', nextId: 's2_wh_out' },
    { labelKey: 'chatbot.s2.wh_friend', nextId: 's2_wh_out' },
    { labelKey: 'chatbot.s2.wh_nobody', nextId: 's2_wh_nobody' },
  ]},
  { id: 's2_wh_out', questionKey: 'chatbot.s2.wh_out_q', adviceKey: 'chatbot.s2.adv_wh_out', showChecklistsLink: true, final: true },
  { id: 's2_wh_nobody', questionKey: 'chatbot.s2.wh_nobody_q', adviceKey: 'chatbot.s2.adv_wh_nobody', showMapLink: true, showChecklistsLink: true, final: true },

  // Immediate threat to kids
  { id: 's2_threat_kids', questionKey: 'chatbot.s2.threat_kids', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_tk_where' },
    { labelKey: 'chatbot.no', nextId: 's2_tk_risk' },
    { labelKey: 'chatbot.s2.dont_know', nextId: 's2_tk_doubts' },
  ]},
  { id: 's2_tk_where', questionKey: 'chatbot.s2.tk_where', options: [
    { labelKey: 'chatbot.s2.tk_with_me', nextId: 's2_tk_aggr' },
    { labelKey: 'chatbot.s2.tk_other_parent', nextId: 's2_tk_op' },
    { labelKey: 'chatbot.s2.tk_relatives', nextId: 's2_tk_rel' },
    { labelKey: 'chatbot.s2.tk_unknown', nextId: 's2_tk_unk' },
  ]},
  { id: 's2_tk_aggr', questionKey: 'chatbot.s2.tk_aggr', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_tk_hear' },
    { labelKey: 'chatbot.no', nextId: 's2_tk_leave' },
    { labelKey: 'chatbot.s2.dont_know', nextId: 's2_tk_signs' },
  ]},
  { id: 's2_tk_hear', questionKey: 'chatbot.s2.tk_hear', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_tk_hear_yes' },
    { labelKey: 'chatbot.no', nextId: 's2_tk_leave' },
    { labelKey: 'chatbot.s2.dont_know', nextId: 's2_tk_signs' },
  ]},
  { id: 's2_tk_hear_yes', questionKey: 'chatbot.s2.tk_hear_yes_q', adviceKey: 'chatbot.s2.adv_tk_hear', showQuickExit: true, showChecklistsLink: true, final: true },

  { id: 's2_tk_leave', questionKey: 'chatbot.s2.tk_leave', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_tk_safe' },
    { labelKey: 'chatbot.no', nextId: 's2_tk_lock' },
    { labelKey: 'chatbot.s2.dont_know', nextId: 's2_tk_adult' },
  ]},
  { id: 's2_tk_safe', questionKey: 'chatbot.s2.tk_safe', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_tk_safe_yes' },
    { labelKey: 'chatbot.no', nextId: 's2_tk_safe_no' },
    { labelKey: 'chatbot.s2.dont_know', nextId: 's2_tk_safe_dk' },
  ]},
  { id: 's2_tk_safe_yes', questionKey: 'chatbot.s2.tk_safe_yes_q', adviceKey: 'chatbot.s2.adv_leave_now', final: true },
  { id: 's2_tk_safe_no', questionKey: 'chatbot.s2.tk_safe_no_q', adviceKey: 'chatbot.s2.adv_no_place', showMapLink: true, final: true },
  { id: 's2_tk_safe_dk', questionKey: 'chatbot.s2.tk_safe_dk_q', adviceKey: 'chatbot.s2.adv_call_hotline', showMapLink: true, final: true },

  { id: 's2_tk_lock', questionKey: 'chatbot.s2.tk_lock', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_tk_lock_yes' },
    { labelKey: 'chatbot.no', nextId: 's2_tk_lock_no' },
    { labelKey: 'chatbot.s2.dont_know', nextId: 's2_tk_lock_dk' },
  ]},
  { id: 's2_tk_lock_yes', questionKey: 'chatbot.s2.tk_lock_yes_q', adviceKey: 'chatbot.s2.adv_lock_room', final: true },
  { id: 's2_tk_lock_no', questionKey: 'chatbot.s2.tk_lock_no_q', adviceKey: 'chatbot.s2.adv_call_hotline', showMapLink: true, final: true },
  { id: 's2_tk_lock_dk', questionKey: 'chatbot.s2.tk_lock_dk_q', adviceKey: 'chatbot.s2.adv_call_hotline', showMapLink: true, final: true },

  { id: 's2_tk_adult', questionKey: 'chatbot.s2.tk_adult', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_tk_adult_yes' },
    { labelKey: 'chatbot.no', nextId: 's2_tk_adult_no' },
    { labelKey: 'chatbot.s2.dont_know', nextId: 's2_tk_adult_dk' },
  ]},
  { id: 's2_tk_adult_yes', questionKey: 'chatbot.s2.tk_adult_yes_q', adviceKey: 'chatbot.s2.adv_trust_adult', final: true },
  { id: 's2_tk_adult_no', questionKey: 'chatbot.s2.tk_adult_no_q', adviceKey: 'chatbot.s2.adv_call_hotline', showMapLink: true, final: true },
  { id: 's2_tk_adult_dk', questionKey: 'chatbot.s2.tk_adult_dk_q', adviceKey: 'chatbot.s2.adv_call_hotline', showMapLink: true, final: true },

  { id: 's2_tk_signs', questionKey: 'chatbot.s2.tk_signs', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_tk_signs_yes' },
    { labelKey: 'chatbot.no', nextId: 's2_tk_signs_no' },
    { labelKey: 'chatbot.s2.dont_know', nextId: 's2_tk_signs_dk' },
  ]},
  { id: 's2_tk_signs_yes', questionKey: 'chatbot.s2.tk_signs_yes_q', adviceKey: 'chatbot.s2.adv_leave_now', showQuickExit: true, final: true },
  { id: 's2_tk_signs_no', questionKey: 'chatbot.s2.tk_signs_no_q', adviceKey: 'chatbot.s2.adv_plan_kids', showChecklistsLink: true, final: true },
  { id: 's2_tk_signs_dk', questionKey: 'chatbot.s2.tk_signs_dk_q', adviceKey: 'chatbot.s2.adv_call_hotline', showMapLink: true, final: true },

  { id: 's2_tk_op', questionKey: 'chatbot.s2.tk_op', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_tk_op_yes' },
    { labelKey: 'chatbot.no', nextId: 's2_tk_op_no' },
    { labelKey: 'chatbot.s2.dont_know', nextId: 's2_tk_op_dk' },
  ]},
  { id: 's2_tk_op_yes', questionKey: 'chatbot.s2.tk_op_yes_q', adviceKey: 'chatbot.s2.adv_check_kids', final: true },
  { id: 's2_tk_op_no', questionKey: 'chatbot.s2.tk_op_no_q', adviceKey: 'chatbot.s2.adv_leave_now', showMapLink: true, final: true },
  { id: 's2_tk_op_dk', questionKey: 'chatbot.s2.tk_op_dk_q', adviceKey: 'chatbot.s2.adv_check_kids', final: true },

  { id: 's2_tk_rel', questionKey: 'chatbot.s2.tk_rel', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_tk_rel_yes' },
    { labelKey: 'chatbot.no', nextId: 's2_tk_rel_no' },
    { labelKey: 'chatbot.s2.dont_know', nextId: 's2_tk_rel_dk' },
  ]},
  { id: 's2_tk_rel_yes', questionKey: 'chatbot.s2.tk_rel_yes_q', adviceKey: 'chatbot.s2.adv_check_kids', final: true },
  { id: 's2_tk_rel_no', questionKey: 'chatbot.s2.tk_rel_no_q', adviceKey: 'chatbot.s2.adv_leave_now', showMapLink: true, final: true },
  { id: 's2_tk_rel_dk', questionKey: 'chatbot.s2.tk_rel_dk_q', adviceKey: 'chatbot.s2.adv_check_kids', final: true },

  { id: 's2_tk_unk', questionKey: 'chatbot.s2.tk_unk', options: [
    { labelKey: 'chatbot.s2.tk_unk_hour', nextId: 's2_tk_unk_hour' },
    { labelKey: 'chatbot.s2.tk_unk_today', nextId: 's2_tk_unk_today' },
    { labelKey: 'chatbot.s2.tk_unk_yesterday', nextId: 's2_tk_unk_yesterday' },
    { labelKey: 'chatbot.s2.tk_unk_more', nextId: 's2_tk_unk_more' },
  ]},
  { id: 's2_tk_unk_hour', questionKey: 'chatbot.s2.tk_unk_hour_q', adviceKey: 'chatbot.s2.adv_check_kids', final: true },
  { id: 's2_tk_unk_today', questionKey: 'chatbot.s2.tk_unk_today_q', adviceKey: 'chatbot.s2.adv_check_kids', final: true },
  { id: 's2_tk_unk_yesterday', questionKey: 'chatbot.s2.tk_unk_yesterday_q', adviceKey: 'chatbot.s2.adv_check_kids_urgent', showMapLink: true, final: true },
  { id: 's2_tk_unk_more', questionKey: 'chatbot.s2.tk_unk_more_q', adviceKey: 'chatbot.s2.adv_check_kids_urgent', showMapLink: true, final: true },

  { id: 's2_tk_risk', questionKey: 'chatbot.s2.tk_risk', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_tk_risk_why' },
    { labelKey: 'chatbot.no', nextId: 's2_tk_risk_no' },
    { labelKey: 'chatbot.s2.dont_know', nextId: 's2_tk_risk_plan' },
  ]},
  { id: 's2_tk_risk_why', questionKey: 'chatbot.s2.tk_risk_why', options: [
    { labelKey: 'chatbot.s2.rw_threatened', nextId: 's2_rw_out' },
    { labelKey: 'chatbot.s2.rw_take_kids', nextId: 's2_rw_out' },
    { labelKey: 'chatbot.s2.rw_near', nextId: 's2_rw_out' },
    { labelKey: 'chatbot.s2.rw_other', nextId: 's2_rw_out' },
  ]},
  { id: 's2_rw_out', questionKey: 'chatbot.s2.rw_out_q', adviceKey: 'chatbot.s2.adv_plan_kids', showChecklistsLink: true, showMapLink: true, final: true },
  { id: 's2_tk_risk_no', questionKey: 'chatbot.s2.tk_risk_no_q', adviceKey: 'chatbot.s2.adv_general_safety', showChecklistsLink: true, final: true },
  { id: 's2_tk_risk_plan', questionKey: 'chatbot.s2.tk_risk_plan', options: [
    { labelKey: 'chatbot.yes', nextId: 's2_plan_yes' },
    { labelKey: 'chatbot.no', nextId: 's2_plan_no' },
  ]},
  { id: 's2_plan_yes', questionKey: 'chatbot.s2.plan_yes_q', adviceKey: 'chatbot.s2.adv_plan_kids', showChecklistsLink: true, final: true },
  { id: 's2_plan_no', questionKey: 'chatbot.s2.plan_no_q', adviceKey: 'chatbot.s2.adv_general_safety', showChecklistsLink: true, final: true },

  { id: 's2_tk_doubts', questionKey: 'chatbot.s2.tk_doubts', options: [
    { labelKey: 'chatbot.s2.td_reach', nextId: 's2_td_reach' },
    { labelKey: 'chatbot.s2.td_where_aggr', nextId: 's2_td_aggr' },
    { labelKey: 'chatbot.s2.td_not_sure', nextId: 's2_td_not_sure' },
  ]},
  { id: 's2_td_reach', questionKey: 'chatbot.s2.td_reach_q', adviceKey: 'chatbot.s2.adv_check_kids', final: true },
  { id: 's2_td_aggr', questionKey: 'chatbot.s2.td_aggr_q', adviceKey: 'chatbot.s2.adv_call_hotline', showMapLink: true, final: true },
  { id: 's2_td_not_sure', questionKey: 'chatbot.s2.td_not_sure_q', adviceKey: 'chatbot.s2.adv_call_hotline', showMapLink: true, final: true },

  // Digital safety (top-level)
  { id: 'digital_main', questionKey: 'chatbot.safety.digital_desc', adviceKey: 'chatbot.safety.digital_advice', showChecklistsLink: true, final: true },

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
      { labelKey: 'chatbot.docs.escape_no_docs', nextId: 'docs_escape_no_docs' },
    ],
  },
  { id: 'docs_lost_passport', questionKey: 'chatbot.docs.lost_passport_desc', adviceKey: 'chatbot.docs.lost_passport_advice', final: true },
  { id: 'docs_lost_child', questionKey: 'chatbot.docs.lost_child_desc', adviceKey: 'chatbot.docs.lost_child_advice', final: true },
  { id: 'docs_held', questionKey: 'chatbot.docs.held_desc', adviceKey: 'chatbot.docs.held_advice', final: true },
  { id: 'docs_expired', questionKey: 'chatbot.docs.expired_desc', adviceKey: 'chatbot.docs.expired_advice', final: true },
  { id: 'docs_status', questionKey: 'chatbot.docs.status_desc', adviceKey: 'chatbot.docs.status_advice', final: true },
  { id: 'docs_escape_no_docs', questionKey: 'chatbot.docs.escape_no_docs_desc', adviceKey: 'chatbot.docs.escape_no_docs_advice', showMapLink: true, showQuickExit: true, showChecklistsLink: true, final: true },

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
