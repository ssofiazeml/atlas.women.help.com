import { useTranslation } from 'react-i18next'
import { performQuickExit } from '../lib/quickExit'

export function QuickExitButton({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  const label = t('quick_exit')
  const aria = t('quick_exit_aria') || label
  return (
    <button
      onClick={performQuickExit}
      className={`quick-exit-btn ${className}`}
      aria-label={aria}
      title={aria}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      <span className="quick-exit-label">{label}</span>
    </button>
  )
}
