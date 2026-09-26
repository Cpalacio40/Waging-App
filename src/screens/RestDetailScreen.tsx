import { useEffect, useState } from 'react'
import {
  restDetailForScore,
  sleepStageColor,
  type RestDetail,
} from '../data/restDetail'
import { useDragScroll } from '../hooks/useDragScroll'
import { assetUrl } from '../utils/assetUrl'
import './screens.css'

const restAsset = (name: string) => assetUrl(`app-rest/${name}`)
const inicioAsset = (name: string) => assetUrl(`app-inicio/${name}`)

const EVENT_ICON: Record<RestDetail['events'][number]['icon'], string> = {
  'moon-star': 'icon-moon-star.svg',
  'audio-lines': 'icon-audio-lines.svg',
  house: 'icon-house.svg',
}

type RestDetailScreenProps = {
  open: boolean
  restScore: number
  onClose?: () => void
}

/** Descanso detail — Figma 359:10645. Values follow the configured rest score. */
export function RestDetailScreen({ open, restScore, onClose }: RestDetailScreenProps) {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)
  const data = restDetailForScore(restScore)
  const dragScroll = useDragScroll({
    enabled: shown,
    ignoreSelector: 'button, a, input, textarea, [role="button"]',
  })
  const { resetScroll } = dragScroll

  useEffect(() => {
    if (open) {
      setMounted(true)
      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setShown(true))
      })
      return () => window.cancelAnimationFrame(frame)
    }
    setShown(false)
  }, [open])

  useEffect(() => {
    if (!open) resetScroll()
  }, [open, resetScroll])

  const onTransitionEnd = () => {
    if (!open) setMounted(false)
  }

  if (!mounted) return null

  const interruptLabel = data.interruptions === 1 ? 'Interrupción' : 'Interrupciones'

  return (
    <div
      className={`rest-detail${shown ? ' is-open' : ''}`}
      aria-hidden={!shown}
      onTransitionEnd={onTransitionEnd}
    >
      <div
        ref={dragScroll.ref}
        className={`rest-detail__scroller${dragScroll.dragging ? ' is-dragging' : ''}`}
        {...dragScroll.scrollerProps}
      >
        <div ref={dragScroll.contentRef} className="rest-detail__content">
          <header className="rest-detail__nav">
            <button
              type="button"
              className="rest-detail__back"
              aria-label="Volver"
              onClick={onClose}
            >
              <img
                src={restAsset('icon-chevron-left.svg')}
                alt=""
                width={32}
                height={32}
                draggable={false}
              />
            </button>
            <h1 className="rest-detail__nav-title">Descanso</h1>
            <span className="rest-detail__nav-spacer" aria-hidden="true" />
          </header>

          <div className="rest-detail__hero">
            <p className="rest-detail__score">{data.score}</p>
            <div className="rest-detail__hero-copy">
              <span
                className={`rest-detail__badge${data.badge !== 'Optimo' ? ' is-muted' : ''}`}
              >
                <img
                  src={inicioAsset('icon-star-optimo.svg')}
                  alt=""
                  width={16}
                  height={16}
                  draggable={false}
                />
                <span>{data.badge}</span>
              </span>
              <p className="rest-detail__hero-line">{data.summaryLine}</p>
            </div>
          </div>

          <div className="rest-detail__chips">
            <div className="rest-detail__chip">
              <p className="rest-detail__chip-value">{data.sleepTotal}</p>
              <p className="rest-detail__chip-label">Total de sueño</p>
            </div>
            <div className="rest-detail__chip">
              <p className="rest-detail__chip-value">{data.detailBpm}</p>
              <p className="rest-detail__chip-label">Ritmo cardiaco</p>
            </div>
            <div className="rest-detail__chip">
              <p className="rest-detail__chip-value">{data.interruptions}</p>
              <p className="rest-detail__chip-label">{interruptLabel}</p>
            </div>
          </div>

          <section className="rest-detail__resumen">
            <h2>Resumen</h2>
            <p>{data.resumen}</p>
          </section>

          <div className="rest-detail__lower">
            <section className="rest-detail__events">
              <h2>Antes y durante el descanso</h2>
              <ul className="rest-detail__event-list">
                {data.events.map((event) => (
                  <li key={event.title} className="rest-detail__event">
                    <img
                      src={restAsset(EVENT_ICON[event.icon])}
                      alt=""
                      width={24}
                      height={24}
                      draggable={false}
                    />
                    <div>
                      <p className="rest-detail__event-title">{event.title}</p>
                      <p className="rest-detail__event-detail">{event.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rest-detail__stages" aria-label="Etapas del descanso">
              <div className="rest-detail__stages-header">
                <div className="rest-detail__stages-icon" aria-hidden="true">
                  <img
                    src={restAsset('icon-moon.svg')}
                    alt=""
                    width={22}
                    height={22}
                    draggable={false}
                  />
                </div>
                <div className="rest-detail__stages-titles">
                  <p className="rest-detail__stages-title">Etapas del descanso</p>
                  <span
                    className={`rest-detail__badge${data.badge !== 'Optimo' ? ' is-muted' : ''}`}
                  >
                    <img
                      src={inicioAsset('icon-star-optimo.svg')}
                      alt=""
                      width={16}
                      height={16}
                      draggable={false}
                    />
                    <span>{data.badge}</span>
                  </span>
                </div>
              </div>

              <div className="rest-detail__chart" aria-hidden="true">
                <div className="rest-detail__chart-grid">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="rest-detail__chart-bars">
                  {data.chartBars.map((bar, index) => (
                    <div key={index} className="rest-detail__chart-col">
                      <div className="rest-detail__chart-track">
                        <div className="rest-detail__chart-empty" />
                        <div
                          className="rest-detail__chart-fill"
                          style={{
                            height: `${bar.value}%`,
                            background: sleepStageColor(bar.stage),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rest-detail__chart-baseline" />
                <div className="rest-detail__chart-times">
                  {data.chartTimes.map((time) => (
                    <span key={time}>{time}</span>
                  ))}
                </div>
              </div>

              <div className="rest-detail__legend">
                <div className="rest-detail__legend-item">
                  <span className="rest-detail__legend-swatch rest-detail__legend-swatch--deep" />
                  Profundo
                </div>
                <div className="rest-detail__legend-item">
                  <span className="rest-detail__legend-swatch rest-detail__legend-swatch--light" />
                  Leve
                </div>
                <div className="rest-detail__legend-item">
                  <span className="rest-detail__legend-swatch rest-detail__legend-swatch--awake" />
                  Despierto
                </div>
              </div>
            </section>

            <div className="rest-detail__bottom-pad" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
}
