/** Shared mock scenarios for iOS widget + in-app home (activity ≤30 → attention). */

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

export const HOME_SCENARIOS: Record<HomeScenarioId, HomeScenario> = {
  ok: {
    id: 'ok',
    activity: 62,
    rest: 78,
    headline: 'Un buen día de movimiento',
    body: 'Entre el paseo, los ratos de juego y sus vueltas por casa, Luca se ha movido justo como suele. Un día tranquilo y activo a la vez.',
    widgetTitle: 'Todo en orden',
  },
  attention: {
    id: 'attention',
    activity: 30,
    rest: 60,
    headline: 'Actividad por debajo de lo normal',
    body: 'Normalmente a estas horas ya lleva más actividad. Quizá le vendría bien salir un rato.',
    widgetTitle: 'Actividad',
    widgetValue: '30/100',
    widgetStatus: 'Por debajo de lo normal',
  },
}

export const DEFAULT_SCENARIO: HomeScenarioId = 'ok'
