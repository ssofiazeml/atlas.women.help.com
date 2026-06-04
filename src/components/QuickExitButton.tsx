import { performQuickExit } from '../lib/quickExit'

export function QuickExitButton({ className = '' }: { className?: string }) {
  return (
    <button
      onClick={performQuickExit}
      className={`quick-exit ${className}`}
      aria-label="Quickly leave this site and go to a neutral page"
    >
      Leave this site quickly
    </button>
  )
}
