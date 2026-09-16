import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import './screens.css'

const ASSET = (name: string) => `${import.meta.env.BASE_URL}ios-home/${name}`

type WidgetSlide = {
  id: string
  title: string
  value?: string
  gradient: string
  decor: 'gauge' | 'paw' | 'moon'
}

const SLIDES: WidgetSlide[] = [
  {
    id: 'ok',
    title: 'Todo en orden',
    gradient: 'linear-gradient(180deg, #f2733b 0%, #ff905f 100%)',
    decor: 'gauge',
  },
  {
    id: 'activity',
    title: 'Actividad',
    value: '62/100',
    gradient: 'linear-gradient(169deg, #d3a333 20%, #ffdd55 92%)',
    decor: 'paw',
  },
  {
    id: 'rest',
    title: 'Descanso',
    value: '78/100',
    gradient: 'linear-gradient(180deg, #6dd5f3 0%, #53aecf 100%)',
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

  const decorSrc =
    slide.decor === 'gauge'
      ? ASSET('gauge.svg')
      : slide.decor === 'paw'
        ? ASSET('paw.svg')
        : ASSET('moon.svg')

  return (
    <div className="screen ios-home">
      <img
        className="ios-home__base"
        src={ASSET('home-base.png')}
        alt=""
        draggable={false}
      />

      {/* Covers the static widget baked into the Figma export */}
      <div className="ios-home__widget-slot">
        <div className="ios-home__widget" style={{ background: slide.gradient }}>
          <div className="ios-home__widget-top">
            <div className="ios-home__widget-head">
              <img src={ASSET('bone.svg')} alt="" width={13} height={13} />
              <span>Luca</span>
            </div>
            <p className="ios-home__widget-title">{slide.title}</p>
            {slide.value ? <p className="ios-home__widget-value">{slide.value}</p> : null}
          </div>

          {slide.decor === 'gauge' ? (
            <>
              <img
                className="ios-home__widget-decor ios-home__widget-decor--waypoints"
                src={ASSET('waypoints.svg')}
                alt=""
                draggable={false}
              />
              <img
                className="ios-home__widget-decor ios-home__widget-decor--gauge"
                src={ASSET('gauge.svg')}
                alt=""
                draggable={false}
              />
            </>
          ) : (
            <img
              className={`ios-home__widget-decor ios-home__widget-decor--${slide.decor}`}
              src={decorSrc}
              alt=""
              draggable={false}
            />
          )}

          <div className="ios-home__widget-nav">
            <button type="button" aria-label="Anterior" onClick={prev}>
              <ChevronLeft size={20} strokeWidth={2.4} />
            </button>
            <button type="button" aria-label="Siguiente" onClick={next}>
              <ChevronRight size={20} strokeWidth={2.4} />
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
