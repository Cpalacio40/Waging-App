import type { HomeScenarioId } from './homeScenarios'
import { CAREGIVERS } from './caregivers'

export type ScreenId =
  | 'ios-home'
  | 'splash'
  | 'app-home'
  | 'caregiver-intro'
  | 'caregiver-search'
  | 'caregiver-profile'
  | 'caregiver-calendar'

export type SearchPhase = 'locate' | 'map' | 'idle' | 'loading' | 'results'

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
      { id: 'app-home-ok', label: 'Día normal', screen: 'app-home', scenario: 'ok' },
      { id: 'app-home-alert', label: 'Alerta de actividad', screen: 'app-home', scenario: 'attention' },
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
      { id: 'search-locate', label: 'Dirección', screen: 'caregiver-search', searchPhase: 'locate' },
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
    label: 'App · Calendario',
    items: [{ id: 'calendar', label: 'Disponibilidad', screen: 'caregiver-calendar', searchPhase: 'results' }],
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
  searchPhase: SearchPhase
  caregiverId: string
}

export function activeNavId({
  screen,
  scenario,
  searchPhase,
  caregiverId,
}: NavMatchInput): string {
  if (screen === 'ios-home') return 'ios-home'
  if (screen === 'app-home') {
    return scenario === 'attention' ? 'app-home-alert' : 'app-home-ok'
  }
  if (screen === 'caregiver-search') {
    if (searchPhase === 'results' || searchPhase === 'loading') return 'search-results'
    if (searchPhase === 'map') return 'search-map'
    return 'search-locate'
  }
  if (screen === 'caregiver-profile') return `profile-${caregiverId}`
  if (screen === 'caregiver-calendar') return 'calendar'
  return screen
}

export function navLabelFor(id: string): string {
  const item = navItemById(id)
  if (!item) return id
  const group = NAV_GROUPS.find((g) => g.items.some((entry) => entry.id === id))
  if (!group || group.items.length === 1) return group?.label ?? item.label
  return `${group.label} · ${item.label}`
}
