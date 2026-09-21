import type { CSSProperties } from 'react'
import { HOME_SCENARIOS, type HomeScenarioId } from '../data/homeScenarios'
import { useDragScroll } from '../hooks/useDragScroll'
import { useHeldScenario } from '../hooks/useHeldScenario'
import { assetUrl } from '../utils/assetUrl'
import './screens.css'

const inicioAsset = (name: string) => assetUrl(`app-inicio/${name}`)

/** Same cubic as Figma Ellipse 39 (track), left → right. */
const GAUGE = { width: 303.5, height: 63 } as const
const GAUGE_PATH =
  'M 0 63 C 27 32 83.88763427734375 0 152.39291381835938 0 C 220.898193359375 0 272.5 30 303.5 63'
/** ViewBox x of 0 / 20 / 40 / 60 / 80 / 100 (bone marks + track ends). */
const GAUGE_MARK_X = [0, 37, 106, 191, 259, 303.5]
const GAUGE_BONES = [
  { className: 'app-home__bone--1', mark: 20 },
  { className: 'app-home__bone--2', mark: 40 },
  { className: 'app-home__bone--3', mark: 60 },
  { className: 'app-home__bone--4', mark: 80 },
] as const

type GaugeSample = { x: number; y: number; d: number }

function cubicPoint(p0: number[], p1: number[], p2: number[], p3: number[], t: number) {
  const mt = 1 - t
  return {
    x: mt ** 3 * p0[0] + 3 * mt ** 2 * t * p1[0] + 3 * mt * t ** 2 * p2[0] + t ** 3 * p3[0],
    y: mt ** 3 * p0[1] + 3 * mt ** 2 * t * p1[1] + 3 * mt * t ** 2 * p2[1] + t ** 3 * p3[1],
  }
}

const GAUGE_SAMPLES: GaugeSample[] = (() => {
  const segments = [
    [
      [0, 63],
      [27, 32],
      [83.88763427734375, 0],
      [152.39291381835938, 0],
    ],
    [
      [152.39291381835938, 0],
      [220.898193359375, 0],
      [272.5, 30],
      [303.5, 63],
    ],
  ]
  const pts: GaugeSample[] = []
  let d = 0
  let prev: { x: number; y: number } | null = null
  for (const [p0, p1, p2, p3] of segments) {
    for (let i = 0; i <= 80; i++) {
      if (i === 0 && prev) continue
      const p = cubicPoint(p0, p1, p2, p3, i / 80)
      if (prev) d += Math.hypot(p.x - prev.x, p.y - prev.y)
      pts.push({ x: p.x, y: p.y, d })
      prev = p
    }
  }
  return pts
})()

const GAUGE_LENGTH = GAUGE_SAMPLES[GAUGE_SAMPLES.length - 1].d

function gaugePoint(value: number) {
  const v = Math.min(100, Math.max(0, value))
  const stepped = v / 20
  const i = Math.min(4, Math.floor(stepped))
  const x = GAUGE_MARK_X[i] + (stepped - i) * (GAUGE_MARK_X[i + 1] - GAUGE_MARK_X[i])
  let k = 1
  while (k < GAUGE_SAMPLES.length && GAUGE_SAMPLES[k].x < x) k++
  const a = GAUGE_SAMPLES[k - 1]
  const b = GAUGE_SAMPLES[Math.min(k, GAUGE_SAMPLES.length - 1)]
  const span = b.x - a.x
  const u = span === 0 ? 0 : (x - a.x) / span
  const y = a.y + u * (b.y - a.y)
  const dist = a.d + u * (b.d - a.d)
  return { x, y, progress: (dist / GAUGE_LENGTH) * 100 }
}

type AppHomeScreenProps = {
  scenario?: HomeScenarioId
  onAgendar?: () => void
}

function AppHomeView({ scenario, onAgendar }: { scenario: HomeScenarioId; onAgendar?: () => void }) {
  const data = HOME_SCENARIOS[scenario]
  const needsAttention = scenario === 'attention'
  const dragScroll = useDragScroll({
    enabled: needsAttention,
    ignoreSelector: 'button, a, input, textarea, [role="button"]',
  })
  const gauge = gaugePoint(data.activity)

  return (
    <div className={`screen app-home${needsAttention ? ' is-alert' : ''}`}>
      <div
        ref={dragScroll.ref}
        className={`app-home__scroller${dragScroll.dragging ? ' is-dragging' : ''}`}
        {...dragScroll.scrollerProps}
      >
        <div ref={dragScroll.contentRef} className="app-home__scroll-content">
          <div className="app-home__scroll-extent" aria-hidden="true" />

          <div className="app-home__bg" aria-hidden="true">
            <img className="app-home__bg-photo" src={inicioAsset('bg-dog.jpg')} alt="" draggable={false} />
            <div className="app-home__bg-blur">
              <img className="app-home__bg-photo" src={inicioAsset('bg-dog.jpg')} alt="" draggable={false} />
            </div>
            <div className="app-home__bg-scrim app-home__bg-scrim--top" />
            <div className="app-home__bg-scrim app-home__bg-scrim--mid" />
            <div className="app-home__bg-scrim app-home__bg-scrim--tint" />
          </div>

          <header className="app-home__header">
            <div className="app-home__identity">
              <div className="app-home__name-row">
                <h1 className="app-home__name">Luca</h1>
                <img
                  className="app-home__chevron"
                  src={inicioAsset('icon-chevron-down.svg')}
                  alt=""
                  width={24}
                  height={24}
                  draggable={false}
                />
              </div>
              <p className="app-home__breed">Raza: Mixto</p>
            </div>
            <div className="app-home__actions">
              <button type="button" className="app-home__icon-btn" aria-label="Calendario">
                <img
                  src={inicioAsset('icon-calendar.svg')}
                  alt=""
                  width={24}
                  height={24}
                  draggable={false}
                />
              </button>
              <button type="button" className="app-home__icon-btn" aria-label="Notificaciones">
                <img src={inicioAsset('icon-bell.svg')} alt="" width={24} height={24} draggable={false} />
              </button>
              <span className="app-home__battery" aria-label="Estado del collar">
                <img
                  src={inicioAsset('icon-battery.svg')}
                  alt=""
                  width={31}
                  height={31}
                  draggable={false}
                />
              </span>
            </div>
          </header>

          <div className="app-home__metrics">
            <div className="app-home__metric">
              <div className="app-home__metric-icon">
                <img
                  src={inicioAsset('metric-todo.svg')}
                  alt=""
                  width={70}
                  height={70}
                  draggable={false}
                />
              </div>
              <p>Todo</p>
            </div>

            <div className="app-home__metric">
              <div className="app-home__metric-icon">
                <img
                  src={inicioAsset('metric-ring.svg')}
                  alt=""
                  width={70}
                  height={70}
                  draggable={false}
                />
                <div className="app-home__metric-paw">
                  <img src={inicioAsset('icon-paw.svg')} alt="" width={18} height={18} draggable={false} />
                </div>
                <span className="app-home__metric-value">{data.activity}</span>
              </div>
              <p>Actividad</p>
            </div>

            <div className="app-home__metric">
              <div className="app-home__metric-icon">
                <img
                  src={inicioAsset('metric-ring.svg')}
                  alt=""
                  width={70}
                  height={70}
                  draggable={false}
                />
                <img
                  className="app-home__metric-moon"
                  src={inicioAsset('icon-moon.svg')}
                  alt=""
                  width={18}
                  height={18}
                  draggable={false}
                />
                <span className="app-home__metric-value">{data.rest}</span>
              </div>
              <p>Descanso</p>
            </div>
          </div>

          {needsAttention ? (
            <aside className="app-home__alert" aria-label="Aviso de inactividad">
              <div className="app-home__alert-top">
                <div className="app-home__alert-badge">
                  <img src={inicioAsset('icon-info.svg')} alt="" width={14} height={14} draggable={false} />
                  <span>Inactividad acumulada: Alta</span>
                </div>
                <button type="button" className="app-home__alert-close" aria-label="Cerrar aviso">
                  <img src={inicioAsset('icon-close.svg')} alt="" width={22} height={22} draggable={false} />
                </button>
              </div>
              <p className="app-home__alert-body">
                Luca necesita atención, lleva <strong>quieto más de lo habitual</strong>. ¿Le agendamos una
                salida?
              </p>
              <div className="app-home__alert-actions">
                <button
                  type="button"
                  className="app-home__alert-btn app-home__alert-btn--primary"
                  onClick={onAgendar}
                >
                  <span>Agendar</span>
                </button>
                <button type="button" className="app-home__alert-btn app-home__alert-btn--ghost">
                  <span>Yo me ocupo</span>
                </button>
              </div>
            </aside>
          ) : null}

          <div className="app-home__stage">
            <div className="app-home__veil" aria-hidden="true" />

            <div className="app-home__gauge" aria-hidden="true">
              <div className="app-home__gauge-plot">
                <div className="app-home__gauge-track">
                  <img src={inicioAsset('gauge-track.svg')} alt="" draggable={false} />
                </div>
                <svg
                  className="app-home__gauge-fill"
                  viewBox={`0 0 ${GAUGE.width} ${GAUGE.height}`}
                  fill="none"
                  overflow="visible"
                >
                  {data.activity > 0 ? (
                    <path
                      d={GAUGE_PATH}
                      pathLength={100}
                      strokeDasharray={`${gauge.progress} 100`}
                      stroke="var(--yellow)"
                      strokeWidth={6}
                      strokeLinecap="round"
                    />
                  ) : null}
                </svg>
                <div
                  className="app-home__knob"
                  style={{ left: gauge.x, top: gauge.y } as CSSProperties}
                >
                  <img src={inicioAsset('gauge-knob.svg')} alt="" width={15} height={15} draggable={false} />
                </div>
              </div>

              {GAUGE_BONES.map((bone) => (
                <img
                  key={bone.mark}
                  className={`app-home__bone ${bone.className}`}
                  src={inicioAsset(data.activity >= bone.mark ? 'bone.svg' : 'bone-outline.svg')}
                  alt=""
                  width={22}
                  height={9}
                  draggable={false}
                />
              ))}

              <div className="app-home__paw-bubble">
                <div className="app-home__paw-bubble-icon">
                  <img src={inicioAsset('icon-paw.svg')} alt="" width={18} height={18} draggable={false} />
                </div>
              </div>
            </div>

            <p className="app-home__scale app-home__scale--0">0</p>
            <p className="app-home__scale app-home__scale--100">100</p>
            <p className="app-home__kpi-label">Actividad</p>
            <p className="app-home__kpi">{data.activity}</p>

            <section className="app-home__copy">
              <div className="app-home__copy-text">
                <h2 className="app-home__headline">{data.headline}</h2>
                <p className="app-home__body">{data.body}</p>
              </div>
              <button type="button" className="app-home__cta">
                <span>Leer más</span>
              </button>
            </section>
          </div>
        </div>
      </div>

      <div className="app-home__bottom-fade" aria-hidden="true" />

      <nav className="app-home__tabbar" aria-label="Navegación principal">
        <button type="button" className="is-active">
          <img src={inicioAsset('nav-sun.svg')} alt="" width={24} height={24} draggable={false} />
          Hoy
        </button>
        <button type="button">
          <img src={inicioAsset('nav-heart.svg')} alt="" width={24} height={24} draggable={false} />
          Salud
        </button>
        <button type="button">
          <img src={inicioAsset('nav-handshake.svg')} alt="" width={24} height={24} draggable={false} />
          Cuidador
        </button>
        <button type="button">
          <img
            className="app-home__tab-avatar"
            src={inicioAsset('bg-dog.jpg')}
            alt=""
            width={24}
            height={24}
            draggable={false}
          />
          Perfil
        </button>
      </nav>
    </div>
  )
}

/** In-app home — Figma iPhone 13 & 14 - 54 (ok, 48:3198) / 58 (attention, 116:4672). */
export function AppHomeScreen({ scenario = 'ok', onAgendar }: AppHomeScreenProps) {
  const shown = useHeldScenario(scenario)

  return (
    <div className="app-home-stack">
      <div
        className={`app-home-stack__layer${shown === 'ok' ? ' is-visible' : ''}`}
        aria-hidden={shown !== 'ok'}
        inert={shown !== 'ok' ? true : undefined}
      >
        <AppHomeView scenario="ok" onAgendar={onAgendar} />
      </div>
      <div
        className={`app-home-stack__layer${shown === 'attention' ? ' is-visible' : ''}`}
        aria-hidden={shown !== 'attention'}
        inert={shown !== 'attention' ? true : undefined}
      >
        <AppHomeView scenario="attention" onAgendar={onAgendar} />
      </div>
    </div>
  )
}
