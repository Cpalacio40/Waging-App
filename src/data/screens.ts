export type ScreenId = 'ios-home' | 'splash' | 'app-home' | 'caregiver-intro' | 'caregiver-search'

export type ScreenMeta = {
  id: ScreenId
  label: string
  shortLabel: string
  description: string
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
]

export const DEFAULT_SCREEN: ScreenId = 'ios-home'
