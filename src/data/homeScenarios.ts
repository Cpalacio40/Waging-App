/** Shared mock content for iOS widget + in-app home.

 * Activity is the source of truth: ≤30 → low-activity copy + alert;
 * above that → normal-day copy. Booking a walk does not change points.
 */

export type HomeScenarioId = 'ok' | 'attention'

export type HomeScenario = {
  id: HomeScenarioId
  activity: number
  rest: number
  headline: string
  body: string
  /** Widget title / status line */
  widgetTitle: string
  widgetValue?: string
  widgetStatus?: string
}

/** Collar demo: alert + low-activity copy when activity is at or below this. */
export const ACTIVITY_ALERT_THRESHOLD = 30

/** Demo presets for the side panel / navigator. */
export const DEMO_ACTIVITY_OK = 80
export const DEMO_ACTIVITY_LOW = 30

export const DEFAULT_ACTIVITY = DEMO_ACTIVITY_OK

export const HOME_SCENARIOS: Record<HomeScenarioId, HomeScenario> = {
  ok: {
    id: 'ok',
    activity: DEMO_ACTIVITY_OK,
    rest: 78,
    headline: 'Un buen día de movimiento',
    body: 'Entre el paseo, los ratos de juego y sus vueltas por casa, Luca se ha movido justo como suele. Un día tranquilo y activo a la vez.',
    widgetTitle: 'Todo en orden',
  },
  attention: {
    id: 'attention',
    activity: DEMO_ACTIVITY_LOW,
    rest: 60,
    headline: 'Actividad por debajo\nde lo normal',
    body: 'Normalmente a estas horas ya lleva más actividad. Quizá le vendría bien salir un rato.',
    widgetTitle: 'Actividad',
    widgetValue: '30/100',
    widgetStatus: 'Por debajo de lo normal',
  },
}

export function isLowActivity(activity: number) {
  return activity <= ACTIVITY_ALERT_THRESHOLD
}

export function scenarioFromActivity(activity: number): HomeScenarioId {
  return isLowActivity(activity) ? 'attention' : 'ok'
}

/** @deprecated Prefer DEFAULT_ACTIVITY + scenarioFromActivity */
export const DEFAULT_SCENARIO: HomeScenarioId = 'ok'
