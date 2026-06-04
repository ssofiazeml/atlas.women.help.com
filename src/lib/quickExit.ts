// Robust quick exit for high stress / risk situations.
// Follows best known practices from GOV.UK Exit this page pattern + TechSafety recommendations.
export function performQuickExit() {
  // Neutral generic website with no sensitive associations
  const neutral = 'https://www.bbc.com/weather'

  // Clear local traces of our site
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch (e) {
    // silently continue
  }

  // Open neutral in new tab first (often friendlier than navigation for browser history)
  let opened: Window | null = null
  try {
    opened = window.open(neutral, '_blank')
  } catch {}

  // Attempt to focus the new tab
  if (opened) {
    try { opened.focus() } catch {}
  }

  // Replace current history with neutral so Back key cannot easily return to our content
  window.location.replace(neutral)
}
