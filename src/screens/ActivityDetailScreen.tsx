import { useEffect, useState } from 'react'
import {
  activityDetailForScore,
  activityLevelColor,
  type ActivityDetail,
  type ActivityWalkBadge,
} from '../data/activityDetail'
import { useDragScroll } from '../hooks/useDragScroll'
import { assetUrl } from '../utils/assetUrl'
import './screens.css'

const activityAsset = (name: string) => assetUrl(`app-activity/${name}`)
const restAsset = (name: string) => assetUrl(`app-rest/${name}`)
const inicioAsset = (name: string) => assetUrl(`app-inicio/${name}`)

const WALK_ICON: Record<ActivityDetail['walks'][number]['icon'], string> = {
  sunrise: 'icon-sunrise.svg',
  sun: 'icon-sun.svg',
  'moon-star': 'icon-moon-star.svg',
}

function badgeClass(badge: ActivityWalkBadge) {
  if (badge === 'Optimo') return ''
  if (badge === 'Bueno') return ' is-bueno'
  return ' is-muted'
}

function badgeStar(badge: ActivityWalkBadge) {
  if (badge === 'Bueno') return activityAsset('icon-star-bueno.svg')
  return inicioAsset('icon-star-optimo.svg')
}

type ActivityDetailScreenProps = {
  open: boolean
  activityScore: number
  onClose?: () => void
}

/** Actividad detail — Figma 352:9138. Values follow the configured activity score. */
export function ActivityDetailScreen({
  open,
  activityScore,
  onClose,
}: ActivityDetailScreenProps) {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)
  const data = activityDetailForScore(activityScore)
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

  return (
    <div
      className={`activity-detail${shown ? ' is-open' : ''}`}
      aria-hidden={!shown}
      onTransitionEnd={onTransitionEnd}
    >
      <div
        ref={dragScroll.ref}
        className={`activity-detail__scroller${dragScroll.dragging ? ' is-dragging' : ''}`}
        {...dragScroll.scrollerProps}
      >
        <div ref={dragScroll.contentRef} className="activity-detail__content">
          <header className="activity-detail__nav">
            <button
              type="button"
              className="activity-detail__back"
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
            <h1 className="activity-detail__nav-title">Actividad</h1>
            <span className="activity-detail__nav-spacer" aria-hidden="true" />
          </header>

          <div className="activity-detail__hero">
            <p className="activity-detail__score">{data.score}</p>
            <div className="activity-detail__hero-copy">
              <span className={`activity-detail__badge${badgeClass(data.badge)}`}>
                <img
                  src={badgeStar(data.badge)}
                  alt=""
                  width={16}
                  height={16}
                  draggable={false}
                />
                <span>{data.badge}</span>
              </span>
              <p className="activity-detail__hero-line">{data.summaryLine}</p>
            </div>
          </div>

          <div className="activity-detail__chips">
            <div className="activity-detail__chip">
              <p className="activity-detail__chip-value">{data.steps}</p>
              <p className="activity-detail__chip-label">Pasos</p>
            </div>
            <div className="activity-detail__chip">
              <p className="activity-detail__chip-value">{data.heartRate}</p>
              <p className="activity-detail__chip-label">Ritmo cardiaco</p>
            </div>
            <div className="activity-detail__chip">
              <p className="activity-detail__chip-value">{data.distance}</p>
              <p className="activity-detail__chip-label">Total</p>
            </div>
          </div>

          <section className="activity-detail__resumen">
            <h2>Resumen</h2>
            <p>{data.resumen}</p>
          </section>

          <div className="activity-detail__lower">
            <section className="activity-detail__walks">
              <h2>Actividades del día</h2>
              <ul className="activity-detail__walk-list">
                {data.walks.map((walk) => (
                  <li key={walk.title} className="activity-detail__walk">
                    <img
                      src={activityAsset(WALK_ICON[walk.icon])}
                      alt=""
                      width={24}
                      height={24}
                      draggable={false}
                    />
                    <div className="activity-detail__walk-body">
                      <div className="activity-detail__walk-top">
                        <p className="activity-detail__walk-title">{walk.title}</p>
                        <span className={`activity-detail__badge${badgeClass(walk.badge)}`}>
                          <img
                            src={badgeStar(walk.badge)}
                            alt=""
                            width={16}
                            height={16}
                            draggable={false}
                          />
                          <span>{walk.badge}</span>
                        </span>
                      </div>
                      <p className="activity-detail__walk-detail">{walk.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="activity-detail__chart-card" aria-label="Movimiento por hora">
              <div className="activity-detail__chart-header">
                <div className="activity-detail__chart-icon" aria-hidden="true">
                  <img
                    src={activityAsset('icon-paw.svg')}
                    alt=""
                    width={22}
                    height={22}
                    draggable={false}
                  />
                </div>
                <div className="activity-detail__chart-titles">
                  <p className="activity-detail__chart-title">Movimiento por hora</p>
                  <span className={`activity-detail__badge${badgeClass(data.badge)}`}>
                    <img
                      src={badgeStar(data.badge)}
                      alt=""
                      width={16}
                      height={16}
                      draggable={false}
                    />
                    <span>{data.badge}</span>
                  </span>
                </div>
              </div>

              <div className="activity-detail__chart" aria-hidden="true">
                <div className="activity-detail__chart-y">
                  <span>Alto</span>
                  <span>Medio</span>
                  <span>Bajo</span>
                </div>
                <div className="activity-detail__chart-plot">
                  <div className="activity-detail__chart-grid">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="activity-detail__chart-bars">
                    {data.chartBars.map((bar, index) => (
                      <div key={index} className="activity-detail__chart-col">
                        <div className="activity-detail__chart-track">
                          <div className="activity-detail__chart-empty" />
                          <div
                            className="activity-detail__chart-fill"
                            style={{
                              height: `${bar.value}%`,
                              background: activityLevelColor(bar.level),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="activity-detail__chart-baseline" />
                  <div className="activity-detail__chart-times">
                    {data.chartTimes.map((time) => (
                      <span key={time}>{time}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="activity-detail__bottom-pad" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
}
