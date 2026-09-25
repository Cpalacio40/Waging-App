import type { HomeScenarioId } from './homeScenarios'
import {
  DEMO_ACTIVITY_LOW,
  DEMO_ACTIVITY_OK,
  DEMO_ACTIVITY_WALK_DONE,
  isLowActivity,
} from './homeScenarios'
import { CAREGIVERS } from './caregivers'

export type ScreenId =
  | 'ios-home'
  | 'splash'
  | 'app-home'
  | 'caregiver-intro'
  | 'caregiver-search'
  | 'caregiver-profile'
  | 'caregiver-calendar'
  | 'caregiver-pay'
  | 'caregiver-success'

/** Booking overlay on top of the calendar sheet. */
export type BookingPhase = 'idle' | 'apple-pay' | 'success'

export type SearchPhase =
  | 'locate'
  | 'map'
  | 'building'
  | 'details'
  | 'idle'
  | 'loading'
  | 'results'

export type ScreenMeta = {
  id: ScreenId
  label: string
  shortLabel: string
  description: string
}

export type NavItem = {
  id: string
  label: string
  screen: ScreenId
  widgetIndex?: number
  searchPhase?: SearchPhase
  caregiverId?: string
  scenario?: HomeScenarioId
  /** Collar activity for home demos (overrides scenario presets). */
  activity?: number
  bookingPhase?: BookingPhase
}

export type NavGroup = {
  id: string
  label: string
  items: NavItem[]
}

/** Screens available in the prototype navigator (outside the phone). */
export const SCREENS: ScreenMeta[] = [
  {
    id: 'ios-home',
    label: 'Home iOS',
    shortLabel: 'Home',
    description: 'Pantalla de inicio del móvil con widget Waging',
  },
  {
    id: 'splash',
    label: 'Splash',
    shortLabel: 'Splash',
    description: 'Arranque de la app',
  },
  {
    id: 'app-home',
    label: 'App · Inicio',
    shortLabel: 'Inicio',
    description: 'Inicio de Waging (Luca)',
  },
  {
    id: 'caregiver-intro',
    label: 'App · Cuidador intro',
    shortLabel: 'Intro',
    description: 'Más que un paseo — valor del cuidador',
  },
  {
    id: 'caregiver-search',
    label: 'App · Buscar cuidador',
    shortLabel: 'Buscar',
    description: 'Buscador y fichas de cuidadores cerca',
  },
  {
    id: 'caregiver-profile',
    label: 'App · Perfil cuidador',
    shortLabel: 'Perfil',
    description: 'Ficha del cuidador, reseñas y especialidad',
  },
  {
    id: 'caregiver-calendar',
    label: 'App · Calendario',
    shortLabel: 'Calendario',
    description: 'Disponibilidad y reserva de sesión',
  },
  {
    id: 'caregiver-pay',
    label: 'App · Apple Pay',
    shortLabel: 'Pago',
    description: 'Confirmación Apple Pay antes del éxito',
  },
  {
    id: 'caregiver-success',
    label: 'App · Reserva OK',
    shortLabel: 'Éxito',
    description: 'Confirmación de reserva — ¡Todo listo!',
  },
]

const CAREGIVER_OPTION_HINT: Record<string, string> = {
  maria: 'ansiedad',
  andres: 'reactivos',
  javier: 'activos',
  sofia: 'especiales',
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'ios-home',
    label: 'Home iOS',
    items: [{ id: 'ios-home', label: 'Home iOS', screen: 'ios-home' }],
  },
  {
    id: 'splash',
    label: 'Splash',
    items: [{ id: 'splash', label: 'Splash', screen: 'splash' }],
  },
  {
    id: 'app-home',
    label: 'App · Inicio',
    items: [
      {
        id: 'app-home-ok',
        label: `Actividad ${DEMO_ACTIVITY_OK}`,
        screen: 'app-home',
        scenario: 'ok',
        activity: DEMO_ACTIVITY_OK,
      },
      {
        id: 'app-home-alert',
        label: `Actividad ${DEMO_ACTIVITY_LOW}`,
        screen: 'app-home',
        scenario: 'attention',
        activity: DEMO_ACTIVITY_LOW,
      },
    ],
  },
  {
    id: 'salida-terminada',
    label: 'Salida terminada',
    items: [
      {
        id: 'app-home-walk-done',
        label: 'Tras salida',
        screen: 'app-home',
        scenario: 'ok',
        activity: DEMO_ACTIVITY_WALK_DONE,
      },
    ],
  },
  {
    id: 'caregiver-intro',
    label: 'App · Cuidador intro',
    items: [{ id: 'caregiver-intro', label: 'Más que un paseo', screen: 'caregiver-intro' }],
  },
  {
    id: 'caregiver-search',
    label: 'App · Buscar cuidador',
    items: [
      { id: 'search-map', label: 'Mapa', screen: 'caregiver-search', searchPhase: 'map' },
      { id: 'search-results', label: 'Con cuidadores', screen: 'caregiver-search', searchPhase: 'results' },
    ],
  },
  {
    id: 'caregiver-profile',
    label: 'App · Perfil',
    items: CAREGIVERS.map((caregiver) => ({
      id: `profile-${caregiver.id}`,
      label: `${caregiver.name.split(' ')[0]} · ${CAREGIVER_OPTION_HINT[caregiver.id] ?? caregiver.id}`,
      screen: 'caregiver-profile' as const,
      caregiverId: caregiver.id,
      searchPhase: 'results' as const,
    })),
  },
  {
    id: 'caregiver-calendar',
    label: 'App · Reserva',
    items: [
      {
        id: 'calendar',
        label: 'Disponibilidad',
        screen: 'caregiver-calendar',
        searchPhase: 'results',
        bookingPhase: 'idle',
      },
      {
        id: 'calendar-success',
        label: '¡Todo listo!',
        screen: 'caregiver-success',
        searchPhase: 'results',
        bookingPhase: 'success',
      },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items)

export const DEFAULT_SCREEN: ScreenId = 'ios-home'
export const DEFAULT_NAV_ID = 'ios-home'

export function navItemById(id: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.id === id)
}

type NavMatchInput = {
  screen: ScreenId
  scenario: HomeScenarioId
  activity: number
  searchPhase: SearchPhase
  caregiverId: string
}

export function activeNavId({
  screen,
  scenario,
  activity,
  searchPhase,
  caregiverId,
}: NavMatchInput): string {
  if (screen === 'ios-home') return 'ios-home'
  if (screen === 'app-home') {
    if (activity === DEMO_ACTIVITY_WALK_DONE) return 'app-home-walk-done'
    if (isLowActivity(activity) || scenario === 'attention') return 'app-home-alert'
    return 'app-home-ok'
  }
  if (screen === 'caregiver-search') {
    if (searchPhase === 'results' || searchPhase === 'loading') return 'search-results'
    return 'search-map'
  }
  if (screen === 'caregiver-profile') return `profile-${caregiverId}`
  if (screen === 'caregiver-calendar' || screen === 'caregiver-pay') return 'calendar'
  if (screen === 'caregiver-success') return 'calendar-success'
  return screen
}

export function navLabelFor(id: string): string {
  const item = navItemById(id)
  if (!item) return id
  const group = NAV_GROUPS.find((g) => g.items.some((entry) => entry.id === id))
  if (!group || group.items.length === 1) return group?.label ?? item.label
  return `${group.label} · ${item.label}`
}
