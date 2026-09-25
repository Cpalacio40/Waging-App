import { ACTIVITY_ALERT_THRESHOLD } from './homeScenarios'

/** Hourly movement intensity for the activity chart. */
export type ActivityLevel = 'low' | 'medium' | 'high'

export type ActivityChartBar = {
  level: ActivityLevel
  /** Fill height as % of the chart column (0–100). */
  value: number
}

export type ActivityWalkBadge = 'Optimo' | 'Bueno' | 'Bajo'

export type ActivityWalk = {
  icon: 'sunrise' | 'sun' | 'moon-star'
  title: string
  detail: string
  badge: ActivityWalkBadge
}

export type ActivityDetail = {
  score: number
  badge: ActivityWalkBadge
  summaryLine: string
  steps: string
  heartRate: string
  distance: string
  resumen: string
  walks: ActivityWalk[]
  chartBars: ActivityChartBar[]
  chartTimes: string[]
}

const LEVEL_COLOR: Record<ActivityLevel, string> = {
  low: '#ffc8af',
  medium: '#ff905f',
  high: '#da6938',
}

export function activityLevelColor(level: ActivityLevel) {
  return LEVEL_COLOR[level]
}

/** Figma 352:9138 — normal day (home Actividad 80). */
const ACTIVITY_OK: ActivityDetail = {
  score: 80,
  badge: 'Optimo',
  summaryLine: 'Buen nivel de actividad hoy',
  steps: '16,800',
  heartRate: '74bpm',
  distance: '7.2Km',
  resumen:
    'Luca tuvo un día activo, con tres salidas repartidas entre la mañana, la tarde y la noche. El pico de actividad más alto fue en el paseo de la tarde, donde mantuvo un ritmo constante durante toda la hora. Su ritmo cardíaco se mantuvo dentro de lo normal en cada salida, sin señales de sobreesfuerzo.',
  walks: [
    {
      icon: 'sunrise',
      title: 'Paseo matutino',
      detail: '7:00am · 20 min · 1.2 km · 76 bpm',
      badge: 'Bueno',
    },
    {
      icon: 'sun',
      title: 'Paseo de la tarde',
      detail: '14:00 · 1h · 3 km · 76 bpm',
      badge: 'Optimo',
    },
    {
      icon: 'moon-star',
      title: 'Paseo  nocturno',
      detail: '21:00 · 1h · 3 km · 76 bpm',
      badge: 'Optimo',
    },
  ],
  chartBars: [
    { level: 'low', value: 39 },
    { level: 'low', value: 39 },
    { level: 'low', value: 39 },
    { level: 'medium', value: 73 },
    { level: 'high', value: 100 },
    { level: 'low', value: 39 },
    { level: 'low', value: 39 },
    { level: 'high', value: 100 },
    { level: 'low', value: 39 },
    { level: 'medium', value: 73 },
    { level: 'high', value: 100 },
    { level: 'low', value: 39 },
  ],
  chartTimes: ['12 am', '4 am', '8 am', '12pm', '4 pm', '8 pm', '12am'],
}

/** Low-activity day — aligns with attention home (Actividad ≤30). */
const ACTIVITY_LOW: ActivityDetail = {
  score: 30,
  badge: 'Bajo',
  summaryLine: 'Actividad por debajo de lo habitual',
  steps: '4,200',
  heartRate: '68bpm',
  distance: '1.1Km',
  resumen:
    'Luca se movió poco durante el día. Solo hubo una salida corta por la mañana y el resto del tiempo permaneció en casa. Su ritmo cardíaco se mantuvo bajo y estable, coherente con un día de poca actividad.',
  walks: [
    {
      icon: 'sunrise',
      title: 'Salida breve',
      detail: '8:30am · 15 min · 0.6 km · 70 bpm',
      badge: 'Bajo',
    },
    {
      icon: 'sun',
      title: 'Rato en el jardín',
      detail: '13:00 · 10 min · 0.3 km · 68 bpm',
      badge: 'Bajo',
    },
    {
      icon: 'moon-star',
      title: 'Sin paseo nocturno',
      detail: 'Permaneció en casa',
      badge: 'Bajo',
    },
  ],
  chartBars: [
    { level: 'low', value: 28 },
    { level: 'low', value: 25 },
    { level: 'low', value: 30 },
    { level: 'medium', value: 45 },
    { level: 'low', value: 32 },
    { level: 'low', value: 22 },
    { level: 'low', value: 20 },
    { level: 'medium', value: 40 },
    { level: 'low', value: 18 },
    { level: 'low', value: 24 },
    { level: 'low', value: 26 },
    { level: 'low', value: 20 },
  ],
  chartTimes: ['12 am', '4 am', '8 am', '12pm', '4 pm', '8 pm', '12am'],
}

export function activityDetailForScore(activity: number): ActivityDetail {
  const base = activity > ACTIVITY_ALERT_THRESHOLD ? ACTIVITY_OK : ACTIVITY_LOW
  if (base.score === activity) return base
  return { ...base, score: activity }
}
