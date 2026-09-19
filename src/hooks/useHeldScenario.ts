import { useEffect, useState } from 'react'
import type { HomeScenarioId } from '../data/homeScenarios'

/** Beat after the press, before the dissolve starts (splash also holds, then fades). */
export const SCENARIO_HOLD_MS = 280

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Lag `value` by a short hold so view A ↔ B can breathe before the crossfade. */
export function useHeldValue<T>(value: T, holdMs = SCENARIO_HOLD_MS) {
  const [shown, setShown] = useState(value)

  useEffect(() => {
    if (Object.is(value, shown)) return
    if (prefersReducedMotion()) {
      setShown(value)
      return
    }
    const id = window.setTimeout(() => setShown(value), holdMs)
    return () => window.clearTimeout(id)
  }, [value, shown, holdMs])

  return shown
}

/** Lag `scenario` by a short hold so ok ↔ attention can breathe before the crossfade. */
export function useHeldScenario(scenario: HomeScenarioId) {
  return useHeldValue(scenario)
}
