import { useEffect, useState } from 'react'
import type { HomeScenarioId } from '../data/homeScenarios'

/** Beat after the press, before the dissolve starts (splash also holds, then fades). */
export const SCENARIO_HOLD_MS = 280

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Lag `scenario` by a short hold so ok ↔ attention can breathe before the crossfade. */
export function useHeldScenario(scenario: HomeScenarioId) {
  const [shown, setShown] = useState(scenario)

  useEffect(() => {
    if (scenario === shown) return
    if (prefersReducedMotion()) {
      setShown(scenario)
      return
    }
    const id = window.setTimeout(() => setShown(scenario), SCENARIO_HOLD_MS)
    return () => window.clearTimeout(id)
  }, [scenario, shown])

  return shown
}
