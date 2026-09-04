// Single source of truth for help-centre categories.
// The public map (MapView) and the admin panel both read this list, so the
// visitor and the admin always see exactly the same options.

export const CATEGORY_KEYS = [
  'shelter',
  'domestic',
  'sexual',
  'legal',
  'psychological',
  'migrant',
  'children',
  'emergency',
  'medical',
  'hotline',
  'crisis',
] as const

export type CategoryKey = (typeof CATEGORY_KEYS)[number]

// Russian labels used inside the admin panel (the panel itself is in Russian).
export const CATEGORY_LABELS_RU: Record<CategoryKey, string> = {
  shelter: 'Убежище / шелтер',
  domestic: 'Домашнее насилие',
  sexual: 'Сексуализированное насилие',
  legal: 'Юридическая помощь',
  psychological: 'Психологическая помощь',
  migrant: 'Поддержка мигранток',
  children: 'Помощь детям',
  emergency: 'Экстренная помощь',
  medical: 'Медицинская помощь',
  hotline: 'Горячая линия',
  crisis: 'Кризисный центр',
}
