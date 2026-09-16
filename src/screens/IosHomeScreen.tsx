import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent,
} from 'react'
import './screens.css'

const ASSET = (name: string) => `${import.meta.env.BASE_URL}ios-home/${name}`

const SWIPE_THRESHOLD_PX = 40
const RUBBER_BAND = 0.32

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

function rubberBand(overflow: number, dimension: number) {
  const abs = Math.abs(overflow)
  const resisted = (abs * RUBBER_BAND * dimension) / (dimension + abs * RUBBER_BAND)
  return overflow < 0 ? -resisted : resisted
}

/**
 * Home iOS from Figma: full-frame base art + interactive Waging widget + app icon hit target.
 * Linear pages (1→3), fixed nav, drag/swipe with rubber-band at edges.
 */
export function IosHomeScreen({ onOpenApp }: IosHomeScreenProps) {
  const [index, setIndex] = useState(0)
  /** Slot backdrop stays on the outgoing card until the slide finishes. */
  const [backdropIndex, setBackdropIndex] = useState(0)
  const [dragPx, setDragPx] = useState(0)
  const [dragging, setDragging] = useState(false)

  const slotRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const pointerId = useRef<number | null>(null)
  const indexRef = useRef(index)
  indexRef.current = index

  const canPrev = index > 0
  const canNext = index < SLIDES.length - 1
  const slide = SLIDES[index]
  const backdrop = SLIDES[backdropIndex]

  const goTo = useCallback((next: number) => {
    setIndex((current) => {
      const clamped = Math.max(0, Math.min(SLIDES.length - 1, next))
      if (clamped === current) return current
      setBackdropIndex(current)
      return clamped
    })
    setDragPx(0)
  }, [])

  const goPrev = useCallback(() => {
    goTo(indexRef.current - 1)
  }, [goTo])

  const goNext = useCallback(() => {
    goTo(indexRef.current + 1)
  }, [goTo])

  const finishDrag = (clientX: number) => {
    if (pointerId.current == null) return

    const raw = clientX - startX.current
    const atStart = indexRef.current === 0
    const atEnd = indexRef.current === SLIDES.length - 1

    pointerId.current = null
    setDragging(false)

    // Edge rubber-band: always spring back, never change page
    if ((atStart && raw > 0) || (atEnd && raw < 0)) {
      setDragPx(0)
      return
    }

    if (Math.abs(raw) >= SWIPE_THRESHOLD_PX) {
      if (raw < 0) goNext()
      else goPrev()
    } else {
      setDragPx(0)
    }
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.ios-home__widget-nav')) return
    pointerId.current = e.pointerId
    startX.current = e.clientX
    setDragging(true)
    setDragPx(0)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return

    const width = slotRef.current?.offsetWidth ?? 152
    const raw = e.clientX - startX.current
    const atStart = indexRef.current === 0
    const atEnd = indexRef.current === SLIDES.length - 1

    if ((atStart && raw > 0) || (atEnd && raw < 0)) {
      setDragPx(rubberBand(raw, width))
      return
    }

    setDragPx(raw)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return
    finishDrag(e.clientX)
  }

  const onPointerCancel = () => {
    pointerId.current = null
    setDragging(false)
    setDragPx(0)
  }

  const onTrackTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== 'transform') return
    setBackdropIndex(index)
  }

  const trackStyle: CSSProperties = {
    transform: `translate3d(calc(-${index * 100}% + ${dragPx}px), 0, 0)`,
    transition: dragging ? 'none' : undefined,
  }

  return (
    <div className="screen ios-home">
      <img
        className="ios-home__base"
        src={ASSET('home-base.png')}
        alt=""
        draggable={false}
      />

      <div
        ref={slotRef}
        className={`ios-home__widget-slot${dragging ? ' is-dragging' : ''}`}
        style={
          {
            background: backdrop.gradient,
            '--widget-chevron': slide.chevron,
            '--chevron-left': `url(${ASSET('chevron-left.svg')})`,
            '--chevron-right': `url(${ASSET('chevron-right.svg')})`,
          } as CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div
          className="ios-home__widget-track"
          style={trackStyle}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {SLIDES.map((item) => (
            <div
              key={item.id}
              className="ios-home__widget"
              style={{ background: item.gradient }}
            >
              {item.decor === 'gauge' && (
                <img
                  className="ios-home__decor ios-home__decor--waypoints"
                  src={ASSET('waypoints.svg')}
                  alt=""
                  draggable={false}
                />
              )}
              {item.decor === 'paw' && (
                <img
                  className="ios-home__decor ios-home__decor--paw"
                  src={ASSET('paw.svg')}
                  alt=""
                  draggable={false}
                />
              )}
              {item.decor === 'moon' && (
                <img
                  className="ios-home__decor ios-home__decor--moon"
                  src={ASSET('moon.svg')}
                  alt=""
                  draggable={false}
                />
              )}

              {item.decor === 'gauge' && (
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
                  <p className="ios-home__widget-title">{item.title}</p>
                </div>
                <div className="ios-home__widget-metric">
                  {item.value ? <span>{item.value}</span> : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="ios-home__widget-nav" role="group" aria-label="Navegación del widget">
          <button
            type="button"
            aria-label="Anterior"
            aria-disabled={!canPrev}
            disabled={!canPrev}
            className={canPrev ? undefined : 'is-disabled'}
            onClick={goPrev}
          >
            <span className="ios-home__chevron ios-home__chevron--left" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            aria-disabled={!canNext}
            disabled={!canNext}
            className={canNext ? undefined : 'is-disabled'}
            onClick={goNext}
          >
            <span className="ios-home__chevron ios-home__chevron--right" />
          </button>
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
