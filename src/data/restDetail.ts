import type { HomeScenarioId } from './homeScenarios'
import { HOME_SCENARIOS } from './homeScenarios'

/** Sleep stage for the “Etapas del descanso” bar chart. */
export type SleepStage = 'deep' | 'light' | 'awake'

export type RestChartBar = {
  stage: SleepStage
  /** Fill height as % of the chart column (0–100). */
  value: number
}

export type RestEvent = {
  icon: 'moon-star' | 'audio-lines' | 'house'
  title: string
  detail: string
}

export type RestDetail = {
  score: number
  badge: string
  /** Home card + detail hero line. */
  summaryLine: string
  sleepStart: string
  sleepEnd: string
  sleepTotal: string
  /** Shown on the home rest card. */
  homeBpm: string
  /** Shown on the detail “Ritmo cardiaco” chip. */
  detailBpm: string
  interruptions: number
  resumen: string
  events: RestEvent[]
  chartBars: RestChartBar[]
  chartTimes: [string, string, string, string]
}

const STAGE_COLOR: Record<SleepStage, string> = {
  deep: '#0fa6d0',
  light: '#2fc7f0',
  awake: '#aae8f9',
}

export function sleepStageColor(stage: SleepStage) {
  return STAGE_COLOR[stage]
}

/** Figma 359:10645 — normal / good rest night (home Actividad 80). */
const REST_OK: RestDetail = {
  score: 78,
  badge: 'Optimo',
  summaryLine: 'Durmió bien casi toda la noche',
  sleepStart: '11:03 pm',
  sleepEnd: '6:30 am',
  sleepTotal: '7h 27m',
  homeBpm: '82 bpm',
  detailBpm: '58bpm',
  interruptions: 1,
  resumen:
    'Luca se durmió sobre las 11:03 pm y descansó profundo la mayor parte de la noche. Se despertó brevemente cerca de la 1 am, probablemente por ruido en la calle, y volvió a dormirse en pocos minutos. Su ritmo cardíaco se mantuvo estable durante toda la noche.',
  events: [
    {
      icon: 'moon-star',
      title: 'Paseo nocturno antes de dormir',
      detail: '21:00  · 22:00',
    },
    {
      icon: 'audio-lines',
      title: 'Ruido en la calle',
      detail: '1 am, interrupción breve',
    },
    {
      icon: 'house',
      title: 'Ambiente en casa',
      detail: 'Tranquilo',
    },
  ],
  chartBars: [
    { stage: 'light', value: 60 },
    { stage: 'deep', value: 94 },
    { stage: 'awake', value: 36 },
    { stage: 'deep', value: 100 },
    { stage: 'deep', value: 92 },
    { stage: 'light', value: 68 },
    { stage: 'deep', value: 97 },
    { stage: 'light', value: 68 },
  ],
  chartTimes: ['10:45 pm', '1 am', '3 am', '6:15am'],
}

/** Weaker rest night — aligns with low-activity / attention home (rest 60). */
const REST_LOW: RestDetail = {
  score: 60,
  badge: 'Regular',
  summaryLine: 'Descansó, pero con varios despertares',
  sleepStart: '12:10 am',
  sleepEnd: '5:45 am',
  sleepTotal: '5h 12m',
  homeBpm: '94 bpm',
  detailBpm: '72bpm',
  interruptions: 3,
  resumen:
    'Luca tardó en conciliar el sueño y se despertó varias veces durante la madrugada. El descanso fue más ligero de lo habitual y su ritmo cardíaco se mantuvo algo más alto. Una salida corta por la mañana le vendría bien para recuperar el ritmo.',
  events: [
    {
      icon: 'moon-star',
      title: 'Poco movimiento antes de dormir',
      detail: '20:30  · 21:15',
    },
    {
      icon: 'audio-lines',
      title: 'Varias interrupciones',
      detail: '1:20 am, 3:10 am y 4:40 am',
    },
    {
      icon: 'house',
      title: 'Ambiente en casa',
      detail: 'Con algo de ruido',
    },
  ],
  chartBars: [
    { stage: 'awake', value: 42 },
    { stage: 'light', value: 55 },
    { stage: 'awake', value: 48 },
    { stage: 'light', value: 62 },
    { stage: 'deep', value: 58 },
    { stage: 'awake', value: 40 },
    { stage: 'light', value: 50 },
    { stage: 'awake', value: 35 },
  ],
  chartTimes: ['12:00 am', '2 am', '4 am', '5:45am'],
}

export function restDetailForScenario(scenario: HomeScenarioId): RestDetail {
  const score = HOME_SCENARIOS[scenario].rest
  return restDetailForScore(score)
}

export function restDetailForScore(rest: number): RestDetail {
  const base = rest >= 70 ? REST_OK : REST_LOW
  if (base.score === rest) return base
  return { ...base, score: rest }
}
