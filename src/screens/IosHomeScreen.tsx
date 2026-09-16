import { useState, type CSSProperties } from 'react'
import './screens.css'

const ASSET = (name: string) => `${import.meta.env.BASE_URL}ios-home/${name}`

type WidgetSlide = {
  id: string
  title: string
  value?: string
  gradient: string
  /** Chevron stroke — matches widget fill so arrows read as “cut out” */
  chevron: string
  decor: 'gauge' | 'paw' | 'moon'
}

const SLIDES: WidgetSlide[] = [
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

type IosHomeScreenProps = {
  onOpenApp: () => void
}

/**
 * Home iOS from Figma: full-frame base art + interactive Waging widget + app icon hit target.
 */
export function IosHomeScreen({ onOpenApp }: IosHomeScreenProps) {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]

  const prev = () => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)
  const next = () => setIndex((i) => (i + 1) % SLIDES.length)

  return (
    <div className="screen ios-home">
      <img
        className="ios-home__base"
        src={ASSET('home-base.png')}
        alt=""
        draggable={false}
      />

      <div className="ios-home__widget-slot">
        <div
          className="ios-home__widget"
          style={
            {
              background: slide.gradient,
              '--widget-chevron': slide.chevron,
              '--chevron-left': `url(${ASSET('chevron-left.svg')})`,
              '--chevron-right': `url(${ASSET('chevron-right.svg')})`,
            } as CSSProperties
          }
        >
          {/* Background decor (opacity baked into Figma SVG ≈ 0.19) */}
          {slide.decor === 'gauge' && (
            <img
              className="ios-home__decor ios-home__decor--waypoints"
              src={ASSET('waypoints.svg')}
              alt=""
              draggable={false}
            />
          )}
          {slide.decor === 'paw' && (
            <img
              className="ios-home__decor ios-home__decor--paw"
              src={ASSET('paw.svg')}
              alt=""
              draggable={false}
            />
          )}
          {slide.decor === 'moon' && (
            <img
              className="ios-home__decor ios-home__decor--moon"
              src={ASSET('moon.svg')}
              alt=""
              draggable={false}
            />
          )}

          {slide.decor === 'gauge' && (
            <div className="ios-home__gauge" aria-hidden="true">
              <img src={ASSET('gauge.svg')} alt="" draggable={false} />
            </div>
          )}

          <div className="ios-home__widget-body">
            <div className="ios-home__widget-copy">
              <div className="ios-home__widget-head">
                <img src={ASSET('bone.svg')} alt="" width={14} height={14} />
                <span>Luca</span>
              </div>
              <p className="ios-home__widget-title">{slide.title}</p>
            </div>
            <div className="ios-home__widget-metric">
              {slide.value ? <span>{slide.value}</span> : null}
            </div>
          </div>

          <div className="ios-home__widget-nav">
            <button type="button" aria-label="Anterior" onClick={prev}>
              <span className="ios-home__chevron ios-home__chevron--left" />
            </button>
            <button type="button" aria-label="Siguiente" className="is-next" onClick={next}>
              <span className="ios-home__chevron ios-home__chevron--right" />
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="ios-home__waging-hit"
        aria-label="Abrir Waging"
        onClick={onOpenApp}
      />
    </div>
  )
}
