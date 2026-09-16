export type WidgetSlide = {
  id: string
  title: string
  value?: string
  gradient: string
  /** Chevron stroke — matches widget fill so arrows read as “cut out” */
  chevron: string
  decor: 'gauge' | 'paw' | 'moon'
}

export const WIDGET_SLIDES: WidgetSlide[] = [
  {
    id: 'ok',
    title: 'Todo en orden',
    gradient: 'linear-gradient(180deg, #f2733b 0%, #ff905f 100%)',
    chevron: '#FF905F',
    decor: 'gauge',
  },
  {
    id: 'activity',
    title: 'Actividad',
    value: '62/100',
    gradient: 'linear-gradient(169deg, #d3a333 20%, #ffdd55 92%)',
    chevron: '#F5E139',
    decor: 'paw',
  },
  {
    id: 'rest',
    title: 'Descanso',
    value: '78/100',
    gradient: 'linear-gradient(180deg, #6dd5f3 0%, #53aecf 100%)',
    chevron: '#6DD7F5',
    decor: 'moon',
  },
]
