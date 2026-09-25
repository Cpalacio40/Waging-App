import { useEffect, useState, type CSSProperties, type TransitionEvent } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { CAREGIVERS, DEFAULT_CAREGIVER_ID } from '../data/caregivers'
import { HOME_SCENARIOS, type HomeScenarioId } from '../data/homeScenarios'
import { restDetailForScore } from '../data/restDetail'
import { useDragScroll } from '../hooks/useDragScroll'
import { useHeldScenario } from '../hooks/useHeldScenario'
import { assetUrl } from '../utils/assetUrl'
import type { BookingSuccessDetails } from './BookingSuccessScreen'
import './screens.css'

const inicioAsset = (name: string) => assetUrl(`app-inicio/${name}`)
const bookingAsset = (name: string) => assetUrl(`caregiver/booking/${name}`)

const SESSION_CAREGIVER_NAME =
  (CAREGIVERS.find((c) => c.id === DEFAULT_CAREGIVER_ID)?.name ?? 'María Camila Rodríguez')
    .split(' ')
    .slice(0, 2)
    .join(' ')

function shortCaregiverName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 2) return fullName
  return `${parts[0]} ${parts[parts.length - 1]}`
}

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
  /** Live collar activity (may differ from scenario presets, e.g. 52 after a walk). */
  activity?: number
  /** Show the post-walk “Sesión terminada” card. */
  sessionDone?: boolean
  /** Caregiver shown on the sesión terminada card (from the completed booking). */
  sessionCaregiverName?: string
  onOpenSessionRecap?: () => void
  onDismissSessionDone?: () => void
  onAgendar?: () => void
  /** Open the Descanso detail screen (bubble or rest card). */
  onOpenRestDetail?: () => void
  /** Open the Actividad detail screen (bubble or “Leer más”). */
  onOpenActivityDetail?: () => void
  /** Alert minimized to the bell (persists across leaving the app). */
  alertDismissed?: boolean
  /** “Yo me ocupo” — no card, no bell until activity rises again. */
  alertResolved?: boolean
  onMinimizeAlert?: () => void
  onResolveAlert?: () => void
  onRestoreAlert?: () => void
  /** Scheduled booking after Accept — home banner + calendar badge. */
  booking?: BookingSuccessDetails | null
  /** Compact strip (true) vs full details (false). Figma 349:7465 / 349:7708. */
  bookingCollapsed?: boolean
  onToggleBooking?: () => void
  onExpandBooking?: () => void
}

function AppHomeView({
  scenario,
  activity: activityProp,
  sessionDone = false,
  sessionCaregiverName,
  onOpenSessionRecap,
  onDismissSessionDone,
  onAgendar,
  onOpenRestDetail,
  onOpenActivityDetail,
  alertOpen,
  alertResolved = false,
  onCloseAlert,
  onOwnerHandles,
  onBellClick,
  booking = null,
  bookingCollapsed = false,
  onToggleBooking,
  onExpandBooking,
}: {
  scenario: HomeScenarioId
  activity?: number
  sessionDone?: boolean
  sessionCaregiverName?: string
  onOpenSessionRecap?: () => void
  onDismissSessionDone?: () => void
  onAgendar?: () => void
  onOpenRestDetail?: () => void
  onOpenActivityDetail?: () => void
  alertOpen: boolean
  /** Owner chose “Yo me ocupo” — no card, no bell until activity rises again. */
  alertResolved?: boolean
  onCloseAlert?: () => void
  onOwnerHandles?: () => void
  onBellClick?: () => void
  booking?: BookingSuccessDetails | null
  bookingCollapsed?: boolean
  onToggleBooking?: () => void
  onExpandBooking?: () => void
}) {
  const data = HOME_SCENARIOS[scenario]
  const activity = activityProp ?? data.activity
  const rest = restDetailForScore(data.rest)
  const needsAttention = scenario === 'attention'
  const showBellBadge = needsAttention && !alertOpen && !alertResolved
  const attentionCardOpen = alertOpen && !alertResolved
  const bookingCardOpen = Boolean(booking)
  const showCalendarBadge = Boolean(booking)
  const [alertMounted, setAlertMounted] = useState(attentionCardOpen)
  const [alertShown, setAlertShown] = useState(attentionCardOpen)
  const [bookingMounted, setBookingMounted] = useState(bookingCardOpen)
  const [bookingShown, setBookingShown] = useState(bookingCardOpen)
  const layoutOpen = alertShown || bookingShown
  const doneCaregiver = shortCaregiverName(sessionCaregiverName ?? SESSION_CAREGIVER_NAME)
  const bookingName = booking ? shortCaregiverName(booking.caregiverName) : ''
  const dragScroll = useDragScroll({
    /** Rest card is sticky over the lower stage — always allow scroll to reveal copy. */
    enabled: true,
    ignoreSelector: 'button, a, input, textarea, [role="button"]',
  })
  const { resetScroll } = dragScroll
  const gauge = gaugePoint(activity)

  useEffect(() => {
    if (attentionCardOpen) {
      setAlertMounted(true)
      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setAlertShown(true))
      })
      return () => window.cancelAnimationFrame(frame)
    }
    setAlertShown(false)
  }, [attentionCardOpen])

  useEffect(() => {
    if (bookingCardOpen) {
      setBookingMounted(true)
      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setBookingShown(true))
      })
      return () => window.cancelAnimationFrame(frame)
    }
    setBookingShown(false)
  }, [bookingCardOpen])

  useEffect(() => {
    if (!layoutOpen) resetScroll()
  }, [layoutOpen, resetScroll])

  const onAlertTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.propertyName !== 'opacity') return
    if (!attentionCardOpen) setAlertMounted(false)
  }

  const onBookingTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.propertyName !== 'opacity') return
    if (!bookingCardOpen) setBookingMounted(false)
  }

  return (
    <div
      className={[
        'screen app-home',
        needsAttention ? 'is-attention' : '',
        layoutOpen ? 'is-alert-open' : '',
        bookingShown && !alertShown
          ? bookingCollapsed
            ? 'is-booking-collapsed'
            : 'is-booking-open'
          : '',
        sessionDone ? 'is-session-done' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
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
              <button
                type="button"
                className="app-home__icon-btn"
                aria-label={showCalendarBadge ? 'Calendario (1 cita)' : 'Calendario'}
                onClick={onExpandBooking}
              >
                <img
                  src={inicioAsset('icon-calendar.svg')}
                  alt=""
                  width={24}
                  height={24}
                  draggable={false}
                />
                {showCalendarBadge ? <span className="app-home__notif-dot" aria-hidden="true" /> : null}
              </button>
              <button
                type="button"
                className="app-home__icon-btn"
                aria-label={showBellBadge ? 'Notificaciones (1 nueva)' : 'Notificaciones'}
                onClick={onBellClick}
              >
                <img src={inicioAsset('icon-bell.svg')} alt="" width={24} height={24} draggable={false} />
                {showBellBadge ? <span className="app-home__notif-dot" aria-hidden="true" /> : null}
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

            <button
              type="button"
              className="app-home__metric app-home__metric--button"
              aria-label={`Actividad ${activity} — ver detalle`}
              onClick={onOpenActivityDetail}
            >
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
                <span className="app-home__metric-value">{activity}</span>
              </div>
              <p>Actividad</p>
            </button>

            <button
              type="button"
              className="app-home__metric app-home__metric--button"
              aria-label={`Descanso ${data.rest} — ver detalle`}
              onClick={onOpenRestDetail}
            >
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
            </button>
          </div>

          {alertMounted ? (
            <aside
              className={`app-home__alert${alertShown ? ' is-open' : ''}`}
              aria-label="Aviso de inactividad"
              aria-hidden={!alertShown}
              onTransitionEnd={onAlertTransitionEnd}
            >
              <div className="app-home__alert-top">
                <div className="app-home__alert-badge">
                  <img src={inicioAsset('icon-info.svg')} alt="" width={14} height={14} draggable={false} />
                  <span>Inactividad acumulada: Alta</span>
                </div>
                <button
                  type="button"
                  className="app-home__alert-close"
                  aria-label="Cerrar aviso"
                  onClick={onCloseAlert}
                >
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
                <button
                  type="button"
                  className="app-home__alert-btn app-home__alert-btn--ghost"
                  onClick={onOwnerHandles}
                >
                  <span>Yo me ocupo</span>
                </button>
              </div>
            </aside>
          ) : null}

          {bookingMounted && booking ? (
            <aside
              className={[
                'app-home__booking',
                bookingShown ? 'is-open' : '',
                bookingCollapsed ? 'is-collapsed' : 'is-expanded',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={`Sesión con ${bookingName}`}
              aria-hidden={!bookingShown}
              onTransitionEnd={onBookingTransitionEnd}
            >
              <div className="app-home__booking-header">
                <img
                  className="app-home__booking-icon"
                  src={bookingAsset('icon-id-card.svg')}
                  alt=""
                  width={20}
                  height={20}
                  draggable={false}
                />
                <p className="app-home__booking-title">Sesión con {bookingName}</p>
                <button
                  type="button"
                  className="app-home__booking-toggle"
                  aria-expanded={!bookingCollapsed}
                  aria-label={bookingCollapsed ? 'Expandir sesión' : 'Contraer sesión'}
                  onClick={onToggleBooking}
                >
                  <ChevronDown size={28} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
              <div className="app-home__booking-details" aria-hidden={bookingCollapsed}>
                <div className="app-home__booking-details-inner">
                  <div className="app-home__booking-row">
                    <img
                      src={inicioAsset('icon-calendar-check.svg')}
                      alt=""
                      width={20}
                      height={20}
                      draggable={false}
                    />
                    <span className="app-home__booking-when">{booking.sessionLine}</span>
                  </div>
                  <div className="app-home__booking-row">
                    <img
                      src={inicioAsset('icon-map-pin.svg')}
                      alt=""
                      width={20}
                      height={20}
                      draggable={false}
                    />
                    <span>{booking.addressLine}</span>
                  </div>
                </div>
              </div>
            </aside>
          ) : null}

          {sessionDone ? (
            <div className="app-home__session-done">
              <img
                className="app-home__session-done-swirl"
                src={inicioAsset('session-done-swirl.svg')}
                alt=""
                draggable={false}
                aria-hidden="true"
              />
              <div className="app-home__session-done-top">
                <span className="app-home__session-done-pill">
                  <img
                    src={inicioAsset('icon-circle-check.svg')}
                    alt=""
                    width={14}
                    height={14}
                    draggable={false}
                  />
                  Sesión terminada
                </span>
                <button
                  type="button"
                  className="app-home__session-done-close"
                  aria-label="Cerrar"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDismissSessionDone?.()
                  }}
                >
                  <X size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                className="app-home__session-done-body"
                aria-label={`Sesión terminada con ${doneCaregiver} — ver fotos y resumen`}
                onClick={onOpenSessionRecap}
              >
                <p className="app-home__session-done-title">Luca ya está de vuelta</p>
                <span className="app-home__session-done-meta">Fotos y resumen de cómo le fue</span>
              </button>
            </div>
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
                  {activity > 0 ? (
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
                  src={inicioAsset(activity >= bone.mark ? 'bone.svg' : 'bone-outline.svg')}
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
            <p className="app-home__kpi">{activity}</p>

            <section className="app-home__copy">
              <div className="app-home__copy-text">
                <h2 className="app-home__headline">{data.headline}</h2>
                <p className="app-home__body">{data.body}</p>
              </div>
              <button
                type="button"
                className="app-home__cta"
                aria-label="Leer más sobre la actividad"
                onClick={onOpenActivityDetail}
              >
                <span>Leer más</span>
              </button>
            </section>
          </div>

          {/* Rest card — Figma 350:8293; below home copy in the scroll flow (y=731). */}
          <button
            type="button"
            className="app-home__rest"
            aria-label={`Descanso ${rest.score} — ver detalle`}
            onClick={onOpenRestDetail}
          >
            <div className="app-home__rest-header">
              <div className="app-home__rest-identity">
                <div className="app-home__rest-icon" aria-hidden="true">
                  <img
                    src={inicioAsset('icon-moon-rest.svg')}
                    alt=""
                    width={22}
                    height={22}
                    draggable={false}
                  />
                </div>
                <div className="app-home__rest-title-block">
                  <p className="app-home__rest-title">Descanso</p>
                  <span className={`app-home__rest-badge${rest.badge !== 'Optimo' ? ' is-muted' : ''}`}>
                    <img
                      src={inicioAsset('icon-star-optimo.svg')}
                      alt=""
                      width={16}
                      height={16}
                      draggable={false}
                    />
                    <span>{rest.badge}</span>
                  </span>
                </div>
              </div>
              <img
                className="app-home__rest-chevron"
                src={inicioAsset('icon-chevron-right-white.svg')}
                alt=""
                width={24}
                height={24}
                draggable={false}
                aria-hidden="true"
              />
            </div>

            <div className="app-home__rest-score">
              <p className="app-home__rest-value">{rest.score}</p>
              <p className="app-home__rest-summary">{rest.summaryLine}</p>
            </div>

            <div className="app-home__rest-timeline">
              <img
                className="app-home__rest-bar"
                src={inicioAsset('rest-sleep-bar.svg')}
                alt=""
                draggable={false}
                aria-hidden="true"
              />
              <div className="app-home__rest-times">
                <span>{rest.sleepStart}</span>
                <span>{rest.sleepEnd}</span>
              </div>
            </div>

            <div className="app-home__rest-meta">
              <div className="app-home__rest-meta-item">
                <img
                  src={inicioAsset('icon-cloud-moon.svg')}
                  alt=""
                  width={16}
                  height={16}
                  draggable={false}
                />
                <span>{rest.sleepTotal}</span>
              </div>
              <div className="app-home__rest-meta-item">
                <img
                  src={inicioAsset('icon-heart-rest.svg')}
                  alt=""
                  width={16}
                  height={16}
                  draggable={false}
                />
                <span>{rest.homeBpm}</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

/** In-app home — Figma iPhone 13 & 14 - 54 (ok, 48:3198) / 58 (attention, 116:4672). */
export function AppHomeScreen({
  scenario = 'ok',
  activity,
  sessionDone = false,
  sessionCaregiverName,
  onOpenSessionRecap,
  onDismissSessionDone,
  onAgendar,
  onOpenRestDetail,
  onOpenActivityDetail,
  alertDismissed = false,
  alertResolved = false,
  onMinimizeAlert,
  onResolveAlert,
  onRestoreAlert,
  booking = null,
  bookingCollapsed = false,
  onToggleBooking,
  onExpandBooking,
}: AppHomeScreenProps) {
  const shown = useHeldScenario(scenario)
  const alertOpen = scenario === 'attention' && !alertDismissed && !alertResolved

  return (
    <div className="app-home-stack">
      <div
        className={`app-home-stack__layer${shown === 'ok' ? ' is-visible' : ''}`}
        aria-hidden={shown !== 'ok'}
        inert={shown !== 'ok' ? true : undefined}
      >
        <AppHomeView
          scenario="ok"
          activity={activity}
          sessionDone={sessionDone}
          sessionCaregiverName={sessionCaregiverName}
          onOpenSessionRecap={onOpenSessionRecap}
          onDismissSessionDone={onDismissSessionDone}
          alertOpen={false}
          onAgendar={onAgendar}
          onOpenRestDetail={onOpenRestDetail}
          onOpenActivityDetail={onOpenActivityDetail}
          booking={booking}
          bookingCollapsed={bookingCollapsed}
          onToggleBooking={onToggleBooking}
          onExpandBooking={onExpandBooking}
        />
      </div>
      <div
        className={`app-home-stack__layer${shown === 'attention' ? ' is-visible' : ''}`}
        aria-hidden={shown !== 'attention'}
        inert={shown !== 'attention' ? true : undefined}
      >
        <AppHomeView
          scenario="attention"
          activity={activity}
          sessionDone={sessionDone}
          sessionCaregiverName={sessionCaregiverName}
          onOpenSessionRecap={onOpenSessionRecap}
          onDismissSessionDone={onDismissSessionDone}
          alertOpen={alertOpen}
          alertResolved={alertResolved}
          onAgendar={onAgendar}
          onOpenRestDetail={onOpenRestDetail}
          onOpenActivityDetail={onOpenActivityDetail}
          onCloseAlert={onMinimizeAlert}
          onOwnerHandles={onResolveAlert}
          onBellClick={onRestoreAlert}
          booking={booking}
          bookingCollapsed={bookingCollapsed}
          onToggleBooking={onToggleBooking}
          onExpandBooking={onExpandBooking}
        />
      </div>
    </div>
  )
}
