import {
  ACTIVITY_ALERT_THRESHOLD,
  ACTIVITY_OK_THRESHOLD,
} from './homeScenarios'

/** Hourly movement intensity for the activity chart. */
export type ActivityLevel = 'low' | 'medium' | 'high'

export type ActivityChartBar = {
  level: ActivityLevel
  /** Fill height as % of the chart column (0–100). */
  value: number
}

export type ActivityWalkBadge = 'Óptimo' | 'Bueno' | 'Regular' | 'Bajo'

export type ActivityWalk = {
  icon: 'sunrise' | 'sun' | 'moon-star' | 'id-card'
  title: string
  detail: string
  /** Omit for empty / pending walks (Figma “Sin datos aún”). */
  badge?: ActivityWalkBadge
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
  badge: 'Óptimo',
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
      badge: 'Óptimo',
    },
    {
      icon: 'moon-star',
      title: 'Paseo nocturno',
      detail: '21:00 · 1h · 3 km · 76 bpm',
      badge: 'Óptimo',
    },
  ],
  chartBars: [
    /* Heights match Figma 359:10472 fills (58 / 107 / 147.565 of 170px track). */
    { level: 'low', value: 34 },
    { level: 'low', value: 34 },
    { level: 'low', value: 34 },
    { level: 'medium', value: 63 },
    { level: 'high', value: 87 },
    { level: 'low', value: 34 },
    { level: 'low', value: 34 },
    { level: 'high', value: 87 },
    { level: 'low', value: 34 },
    { level: 'medium', value: 63 },
    { level: 'high', value: 87 },
    { level: 'low', value: 34 },
  ],
  chartTimes: ['12 am', '4 am', '8 am', '12pm', '4 pm', '8 pm', '12am'],
}

/** Mid day after a session — Figma 386:4320 (home Actividad ~55). */
const ACTIVITY_MID: ActivityDetail = {
  score: 55,
  badge: 'Regular',
  summaryLine: 'Mejorando, aún por debajo de lo normal',
  steps: '7,800',
  heartRate: '75bpm',
  distance: '4.8Km',
  resumen:
    'Luca tuvo dos salidas cortas por la mañana y el mediodía, de 15 minutos cada una, y María Camila lo sacó a pasear una hora completa a las 17:00. Esa combinación subió su actividad, aunque el día completo sigue por debajo de lo normal para él.',
  walks: [
    {
      icon: 'sunrise',
      title: 'Paseo matutino',
      detail: '8:30am · 15 min · 0.6 km · 70 bpm',
      badge: 'Bajo',
    },
    {
      icon: 'sun',
      title: 'Paseo de la tarde',
      detail: '13:00 · 10 min · 0.3 km · 68 bpm',
      badge: 'Bajo',
    },
    {
      icon: 'id-card',
      title: 'Sesión con María Camila',
      detail: '17:00 · 1h · 3 km · 78 bpm',
      badge: 'Óptimo',
    },
    {
      icon: 'moon-star',
      title: 'Paseo nocturno',
      detail: 'Sin datos aún',
    },
  ],
  chartBars: [
    /* Heights match Figma 386:4386 fills of the 170px track. */
    { level: 'low', value: 12 },
    { level: 'low', value: 15 },
    { level: 'low', value: 19 },
    { level: 'low', value: 24 },
    { level: 'medium', value: 43 },
    { level: 'low', value: 16 },
    { level: 'medium', value: 43 },
    { level: 'low', value: 21 },
    { level: 'high', value: 79 },
    { level: 'low', value: 12 },
    { level: 'low', value: 0 },
    { level: 'low', value: 0 },
  ],
  chartTimes: ['12 am', '4 am', '8 am', '12pm', '4 pm', '8 pm', '12am'],
}

/** Low-activity day — Figma 378:1420 (home Actividad ≤30). */
const ACTIVITY_LOW: ActivityDetail = {
  score: 30,
  badge: 'Bajo',
  summaryLine: 'Actividad por debajo de lo normal',
  steps: '3,000',
  heartRate: '72bpm',
  distance: '1.8Km',
  resumen:
    'Luca tuvo dos salidas cortas hoy, de 15 minutos cada una, y ha pasado el resto del día en casa. Su actividad sigue por debajo de lo normal para él.',
  walks: [
    {
      icon: 'sunrise',
      title: 'Paseo matutino',
      detail: '8:30am · 15 min · 0.6 km · 70 bpm',
      badge: 'Bajo',
    },
    {
      icon: 'sun',
      title: 'Paseo de la tarde',
      detail: '13:00 · 10 min · 0.3 km · 68 bpm',
      badge: 'Bajo',
    },
    {
      icon: 'moon-star',
      title: 'Paseo nocturno',
      detail: 'Sin datos aún',
    },
  ],
  chartBars: [
    /* Heights match Figma 378:1493 fills of the 170px track. */
    { level: 'low', value: 12 },
    { level: 'low', value: 15 },
    { level: 'low', value: 19 },
    { level: 'low', value: 24 },
    { level: 'medium', value: 43 },
    { level: 'low', value: 16 },
    { level: 'medium', value: 43 },
    { level: 'low', value: 21 },
    { level: 'low', value: 12 },
    { level: 'low', value: 0 },
    { level: 'low', value: 0 },
    { level: 'low', value: 0 },
  ],
  chartTimes: ['12 am', '4 am', '8 am', '12pm', '4 pm', '8 pm', '12am'],
}

/** First + second token — keeps “María Camila” / “Andrés Eduardo” like the recap. */
function shortCaregiverName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'María Camila'
  if (parts.length === 1) return parts[0]!
  return `${parts[0]} ${parts[1]}`
}

function withSessionCaregiver(detail: ActivityDetail, caregiverName: string): ActivityDetail {
  const name = shortCaregiverName(caregiverName)
  return {
    ...detail,
    resumen: detail.resumen.replace(/María Camila/g, name),
    walks: detail.walks.map((walk) =>
      walk.icon === 'id-card'
        ? { ...walk, title: `Sesión con ${name}` }
        : walk,
    ),
  }
}

export function activityDetailForScore(
  activity: number,
  sessionCaregiverName?: string | null,
): ActivityDetail {
  const base =
    activity <= ACTIVITY_ALERT_THRESHOLD
      ? ACTIVITY_LOW
      : activity < ACTIVITY_OK_THRESHOLD
        ? ACTIVITY_MID
        : ACTIVITY_OK
  const scored = base.score === activity ? base : { ...base, score: activity }
  if (sessionCaregiverName && scored.walks.some((w) => w.icon === 'id-card')) {
    return withSessionCaregiver(scored, sessionCaregiverName)
  }
  return scored
}
