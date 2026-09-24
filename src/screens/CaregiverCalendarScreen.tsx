import { useEffect, useMemo, useRef, useState, type AnimationEvent, type TransitionEvent } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Caregiver } from '../data/caregivers'
import { getDayAvailability, hasAvailability } from '../data/caregiverAvailability'
import type { BookingPhase } from '../data/screens'
import { buildingOption, loadSavedAddress, subscribeAddressChange } from '../data/savedAddress'
import { useDragScroll } from '../hooks/useDragScroll'
import { assetUrl } from '../utils/assetUrl'
import { BookingSuccessScreen } from './BookingSuccessScreen'
import './screens.css'

const caregiverAsset = (name: string) => assetUrl(`caregiver/${name}`)
const addressAsset = (name: string) => assetUrl(`address/${name}`)
const calendarUnavailableAsset = assetUrl('caregiver/calendar-unavailable.svg')
const applePayScreenAsset = assetUrl('caregiver/booking/apple-pay-screen.png')

/** Hold Apple Pay image before fading to success. */
const APPLE_PAY_HOLD_MS = 1800

const WEEKDAY_LONG = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const
const MONTH_SHORT = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const

function endTimeSlot(slot: string) {
  const [hourPart, minutePart = '0'] = slot.split(':')
  const total = (Number(hourPart) || 0) * 60 + (Number(minutePart) || 0) + 60
  const endHour = Math.floor(total / 60) % 24
  const endMinute = total % 60
  return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
}

function formatSessionLine(date: Date, start: string) {
  const weekday = WEEKDAY_LONG[date.getDay()]
  const month = MONTH_SHORT[date.getMonth()]
  return `${start} - ${endTimeSlot(start)}, ${weekday}, ${month}  ${date.getDate()}, ${date.getFullYear()}`
}

function formatAddressLine(place: {
  label: string
  floor?: string
  door?: string
}) {
  const parts = [place.label]
  if (place.floor?.trim()) parts.push(place.floor.trim())
  if (place.door?.trim()) parts.push(place.door.trim())
  return parts.join(', ')
}

const FALLBACK_MEET = {
  tag: 'Casa',
  label: 'Carrer de Petraca, 42',
  lat: 41.3924,
  lng: 2.1468,
  buildingType: 'casa' as const,
}

const CANCEL_TIERS = [
  { icon: 'cancel-clock-12.svg', label: '+12 horas', fee: 'Sin cargo' },
  { icon: 'cancel-clock-25.svg', label: '12 - 2 horas', fee: '7.50€', percent: '25%' },
  { icon: 'cancel-clock-50.svg', label: '-2 horas', fee: '14.95€', percent: '50%' },
  {
    icon: 'cancel-clock-100.svg',
    label: 'Cuidador ha llegado',
    fee: '29,90 €',
    percent: '100%',
    wrap: true,
  },
] as const

const WEEKDAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'] as const
const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

const SESSION_DURATION = '60 min'
const SESSION_PRICE = '29,99€'
const SESSION_SUBTITLE = 'Salidas por tu barrio o sesiones en casa'

type DayStatus = 'default' | 'available' | 'unavailable' | 'outside'

type CalendarDay = {
  key: string
  date: Date
  day: number
  status: DayStatus
  outside: boolean
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function monthIndex(date: Date) {
  return date.getFullYear() * 12 + date.getMonth()
}

function buildMonthGrid(
  year: number,
  month: number,
  statusFor: (date: Date) => DayStatus,
): CalendarDay[] {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7 // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: CalendarDay[] = []

  for (let i = 0; i < startOffset; i += 1) {
    const date = new Date(year, month, 1 - (startOffset - i))
    cells.push({
      key: dateKey(date),
      date,
      day: date.getDate(),
      status: 'outside',
      outside: true,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    cells.push({
      key: dateKey(date),
      date,
      day,
      status: statusFor(date),
      outside: false,
    })
  }

  // Only show next-month overflow through Friday of the last partial week
  // (Figma shows Oct 1–2, not Sat/Sun fillers).
  const remainder = cells.length % 7
  if (remainder !== 0) {
    const needed = 7 - remainder
    for (let i = 1; i <= needed; i += 1) {
      const date = new Date(year, month + 1, i)
      const weekday = (date.getDay() + 6) % 7
      if (weekday >= 5) break
      cells.push({
        key: dateKey(date),
        date,
        day: date.getDate(),
        status: statusFor(date),
        outside: true,
      })
    }
  }

  return cells
}

type CaregiverCalendarScreenProps = {
  caregiver: Caregiver
  open: boolean
  /** Jump target from the side navigator (Apple Pay / success). */
  bookingPhase?: BookingPhase
  onBack: () => void
  onOpened?: () => void
  onClosed: () => void
  /** After booking success “Aceptar” — typically return to app home. */
  onBookingComplete?: (details: import('./BookingSuccessScreen').BookingSuccessDetails) => void
  /** True while the Apple Pay capture overlay is showing (dark scrim → white status icons). */
  onApplePayChange?: (active: boolean) => void
}

type PayPhase = BookingPhase

/** Session calendar booking — Figma 180:6825. */
export function CaregiverCalendarScreen({
  caregiver,
  open,
  bookingPhase = 'idle',
  onBack,
  onOpened,
  onClosed,
  onBookingComplete,
  onApplePayChange,
}: CaregiverCalendarScreenProps) {
  const [today] = useState(() => startOfDay(new Date()))
  const [entered, setEntered] = useState(false)
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [policyOpen, setPolicyOpen] = useState(false)
  const [policyClosing, setPolicyClosing] = useState(false)
  const [payPhase, setPayPhase] = useState<PayPhase>('idle')
  const [paySheetOpen, setPaySheetOpen] = useState(false)
  const [successVisible, setSuccessVisible] = useState(false)
  /** false when jumped here from the side navigator (hold Apple Pay). */
  const [payAutoAdvance, setPayAutoAdvance] = useState(true)
  const meetMapRef = useRef<HTMLDivElement>(null)
  const meetMapInstance = useRef<L.Map | null>(null)
  const [meetPlace, setMeetPlace] = useState(() => loadSavedAddress() ?? FALLBACK_MEET)

  const payBusy = payPhase !== 'idle'
  const dragScroll = useDragScroll({
    enabled: open && entered && !policyOpen && !policyClosing && !payBusy,
    ignoreSelector: 'button, a, select, .caregiver-calendar__time',
  })
  const showPolicyModal = policyOpen || policyClosing

  const openPolicyModal = () => {
    setPolicyClosing(false)
    setPolicyOpen(true)
  }

  const closePolicyModal = () => {
    if (!policyOpen || policyClosing) return
    setPolicyClosing(true)
  }

  const onPolicyModalAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (!policyClosing) return
    setPolicyClosing(false)
    setPolicyOpen(false)
  }

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today],
  )
  const secondMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + 1, 1),
    [today],
  )
  const lastVisibleDay = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + 2, 0),
    [today],
  )
  const statusFor = (date: Date): DayStatus => {
    const normalized = startOfDay(date)
    if (normalized < today || normalized > lastVisibleDay) return 'default'
    return hasAvailability(caregiver.id, normalized, today) ? 'available' : 'unavailable'
  }
  const days = useMemo(
    () => buildMonthGrid(year, month, statusFor),
    // Availability is deterministic for caregiver + today window.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [year, month, today, lastVisibleDay, caregiver.id],
  )
  const cursorMonthIndex = monthIndex(cursor)
  const firstMonthIndex = monthIndex(firstMonth)
  const secondMonthIndex = monthIndex(secondMonth)
  const isFirstMonth = cursorMonthIndex === firstMonthIndex
  const isSecondMonth = cursorMonthIndex === secondMonthIndex

  useEffect(() => {
    setSelectedKey(null)
    setTime(null)
  }, [caregiver.id])

  useEffect(() => subscribeAddressChange(() => setMeetPlace(loadSavedAddress() ?? FALLBACK_MEET)), [])

  useEffect(() => {
    if (!open || !entered || !meetMapRef.current || meetMapInstance.current) return
    const map = L.map(meetMapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    }).setView([meetPlace.lat, meetPlace.lng], 16)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 },
    ).addTo(map)
    L.marker([meetPlace.lat, meetPlace.lng], {
      icon: L.icon({
        iconUrl: addressAsset(buildingOption(meetPlace.buildingType).pin),
        iconSize: [44, 52],
        iconAnchor: [22, 52],
      }),
    }).addTo(map)
    meetMapInstance.current = map
    // Pin tip sits at the map center; shift view so the head isn't clipped by overflow.
    requestAnimationFrame(() => {
      map.invalidateSize()
      map.panBy([0, -18], { animate: false })
    })
    return () => {
      map.remove()
      meetMapInstance.current = null
    }
  }, [open, entered, meetPlace.lat, meetPlace.lng, meetPlace.buildingType])

  useEffect(() => {
    if (!open) {
      setPayPhase('idle')
      setPaySheetOpen(false)
      setSuccessVisible(false)
      setPayAutoAdvance(true)
      setEntered(false)
      setPolicyOpen(false)
      setPolicyClosing(false)
      return
    }
    let inner = 0
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setEntered(true))
    })
    return () => {
      window.cancelAnimationFrame(outer)
      window.cancelAnimationFrame(inner)
    }
  }, [open])

  /** Side-nav shortcuts: Apple Pay / ¡Todo listo! */
  const prevBookingPhaseRef = useRef(bookingPhase)
  useEffect(() => {
    if (!open || !entered) return

    const prev = prevBookingPhaseRef.current
    prevBookingPhaseRef.current = bookingPhase

    if (bookingPhase === 'idle') {
      // Clear pay overlays only when leaving a nav jump (pay/success → calendar).
      if (prev !== 'idle') {
        setPayPhase('idle')
        setPaySheetOpen(false)
        setSuccessVisible(false)
        setPayAutoAdvance(true)
      }
      return
    }

    let seed = today
    while (seed <= lastVisibleDay && !hasAvailability(caregiver.id, seed, today)) {
      seed = addDays(seed, 1)
    }
    if (seed > lastVisibleDay) seed = today
    const seedSlots = getDayAvailability(caregiver.id, seed, today).availableSlots
    setSelectedKey(dateKey(seed))
    setCursor(new Date(seed.getFullYear(), seed.getMonth(), 1))
    setTime(seedSlots[0] ?? null)
    setPolicyOpen(false)
    setPolicyClosing(false)

    if (bookingPhase === 'apple-pay') {
      setPayAutoAdvance(false)
      setSuccessVisible(false)
      setPaySheetOpen(false)
      setPayPhase('apple-pay')
      return
    }

    setPayAutoAdvance(false)
    setPaySheetOpen(false)
    setPayPhase('success')
    setSuccessVisible(false)
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setSuccessVisible(true))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open, entered, bookingPhase, today, lastVisibleDay, caregiver.id])

  const selectedDate = useMemo(() => {
    if (!selectedKey) return today
    const match = days.find((d) => d.key === selectedKey)
    if (match) return match.date
    const [yearPart, monthPart, dayPart] = selectedKey.split('-').map(Number)
    if (
      Number.isFinite(yearPart) &&
      Number.isFinite(monthPart) &&
      Number.isFinite(dayPart)
    ) {
      return new Date(yearPart, monthPart, dayPart)
    }
    return today
  }, [selectedKey, days, today])

  const availableTimeSlots = useMemo(() => {
    if (!selectedKey) return [] as string[]
    return getDayAvailability(caregiver.id, selectedDate, today).availableSlots
  }, [selectedKey, selectedDate, caregiver.id, today])

  useEffect(() => {
    if (!selectedKey) return
    if (time && !availableTimeSlots.includes(time)) {
      setTime(null)
    }
  }, [selectedKey, availableTimeSlots, time])

  const onSheetTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    if (e.propertyName !== 'transform') return
    if (!open) {
      onClosed()
      return
    }
    if (entered) onOpened?.()
  }

  const sheetClass = [
    'caregiver-calendar-sheet',
    open && entered ? 'is-open' : '',
    !open ? 'is-closing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const shiftMonth = (delta: number) => {
    setCursor((prev) => {
      const candidate = new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
      const candidateIndex = monthIndex(candidate)
      if (candidateIndex < firstMonthIndex) return firstMonth
      if (candidateIndex > secondMonthIndex) return secondMonth
      return candidate
    })
  }

  const resolvedStatus = (cell: CalendarDay): DayStatus => {
    if (cell.outside && cell.status !== 'available' && cell.status !== 'unavailable') return 'outside'
    return cell.status
  }

  const canSelect = (cell: CalendarDay) => resolvedStatus(cell) === 'available'

  const onSelectDay = (cell: CalendarDay) => {
    if (!canSelect(cell)) return
    const daySlots = getDayAvailability(caregiver.id, cell.date, today).availableSlots
    setSelectedKey(cell.key)
    setTime((prev) => (prev && daySlots.includes(prev) ? prev : null))
    if (cell.outside && monthIndex(cell.date) <= secondMonthIndex) {
      setCursor(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1))
    }
  }

  const successDetails = useMemo(
    () => ({
      caregiverName: caregiver.name,
      sessionLine: formatSessionLine(
        selectedDate,
        time ?? availableTimeSlots[0] ?? '08:30',
      ),
      addressLine: formatAddressLine(meetPlace),
    }),
    [caregiver.name, selectedDate, time, availableTimeSlots, meetPlace],
  )

  const canPay = Boolean(selectedKey && time) && !payBusy

  useEffect(() => {
    if (payPhase !== 'apple-pay') return
    let inner = 0
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setPaySheetOpen(true))
    })
    if (!payAutoAdvance) {
      return () => {
        window.cancelAnimationFrame(outer)
        window.cancelAnimationFrame(inner)
      }
    }
    const hold = window.setTimeout(() => {
      setPayPhase('success')
      setSuccessVisible(false)
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setSuccessVisible(true))
      })
    }, APPLE_PAY_HOLD_MS)
    return () => {
      window.cancelAnimationFrame(outer)
      window.cancelAnimationFrame(inner)
      window.clearTimeout(hold)
    }
  }, [payPhase, payAutoAdvance])

  useEffect(() => {
    onApplePayChange?.(payPhase === 'apple-pay')
    return () => onApplePayChange?.(false)
  }, [payPhase, onApplePayChange])

  const startPayment = () => {
    if (!canPay) return
    setPolicyOpen(false)
    setPolicyClosing(false)
    setPaySheetOpen(false)
    setSuccessVisible(false)
    setPayAutoAdvance(true)
    setPayPhase('apple-pay')
  }

  const finishBooking = () => {
    onBookingComplete?.(successDetails)
  }

  return (
    <div
      className={sheetClass}
      role="dialog"
      aria-modal="true"
      aria-label="Calendario y disponibilidad"
      onTransitionEnd={onSheetTransitionEnd}
    >
      <header className={`caregiver-nav${dragScroll.scrolled ? ' is-scrolled' : ''}`}>
        <button type="button" className="caregiver-back" aria-label="Volver" onClick={onBack}>
          <img src={caregiverAsset('arrow-left.svg')} alt="" width={32} height={32} draggable={false} />
        </button>
      </header>

      <div
        ref={dragScroll.ref}
        className={`caregiver-calendar__scroller${dragScroll.dragging ? ' is-dragging' : ''}`}
        {...dragScroll.scrollerProps}
      >
        <div ref={dragScroll.contentRef} className="caregiver-calendar__scroll-content">
          <div className="caregiver-nav-spacer" aria-hidden="true" />

          <div className="caregiver-calendar__content">
            <h1 className="caregiver-calendar__title display-title">Calendario y disponibilidad</h1>

            <div className="caregiver-calendar__body">
              <div className="caregiver-calendar__main">
                <div className="caregiver-calendar__meta">
                  <p className="caregiver-calendar__session">
                    {caregiver.name} - {SESSION_DURATION}
                  </p>
                  <p className="caregiver-calendar__subtitle">{SESSION_SUBTITLE}</p>
                </div>

                <div className="caregiver-calendar__legend" aria-hidden="true">
                  <div className="caregiver-calendar__legend-item">
                    <span className="caregiver-calendar__swatch caregiver-calendar__swatch--available" />
                    <span>Con disponibilidad</span>
                  </div>
                  <div className="caregiver-calendar__legend-item">
                    <span className="caregiver-calendar__swatch caregiver-calendar__swatch--unavailable" />
                    <span>Sin disponibilidad</span>
                  </div>
                </div>

                <div className="caregiver-calendar__card">
                  <div className="caregiver-calendar__month-row">
                    <button
                      type="button"
                      className="caregiver-calendar__nav caregiver-calendar__nav--prev"
                      aria-label="Mes anterior"
                      disabled={isFirstMonth}
                      onClick={() => shiftMonth(-1)}
                    >
                      <ChevronLeft size={18} strokeWidth={2.2} aria-hidden="true" />
                    </button>
                    <p className="caregiver-calendar__month-label">
                      {MONTHS[month]} {year}
                    </p>
                    <button
                      type="button"
                      className="caregiver-calendar__nav caregiver-calendar__nav--next"
                      aria-label="Mes siguiente"
                      disabled={isSecondMonth}
                      onClick={() => shiftMonth(1)}
                    >
                      <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="caregiver-calendar__weekdays">
                    {WEEKDAYS.map((label) => (
                      <span key={label} className="caregiver-calendar__weekday">
                        {label}
                      </span>
                    ))}
                  </div>

                  <div className="caregiver-calendar__grid" role="grid" aria-label={`${MONTHS[month]} ${year}`}>
                    {days.map((cell) => {
                      const status = resolvedStatus(cell)
                      const selected = cell.key === selectedKey
                      const selectable = canSelect(cell)
                      const className = [
                        'caregiver-calendar__day',
                        `caregiver-calendar__day--${status}`,
                        selected ? 'is-selected' : '',
                        cell.outside && status !== 'available' ? 'is-empty' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')

                      if (cell.outside && status !== 'available' && status !== 'unavailable') {
                        return <div key={cell.key} className="caregiver-calendar__day is-empty" aria-hidden="true" />
                      }

                      return (
                        <button
                          key={cell.key}
                          type="button"
                          className={className}
                          disabled={!selectable}
                          aria-pressed={selected}
                          aria-label={`${cell.day} de ${MONTHS[cell.date.getMonth()]}`}
                          onClick={() => onSelectDay(cell)}
                        >
                        {status === 'unavailable' ? (
                          <img
                            className="caregiver-calendar__day-pattern"
                            src={calendarUnavailableAsset}
                            alt=""
                            width={36}
                            height={36}
                            draggable={false}
                          />
                        ) : null}
                        <span className="caregiver-calendar__day-number">{cell.day}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="caregiver-calendar__time">
                  <p className="caregiver-calendar__time-label" id="calendar-time-label">
                    Disponibilidad
                  </p>
                  {selectedKey && availableTimeSlots.length > 0 ? (
                    <div
                      className="caregiver-calendar__slots"
                      role="listbox"
                      aria-labelledby="calendar-time-label"
                      aria-label="Horas disponibles"
                    >
                      {availableTimeSlots.map((slot) => {
                        const selected = slot === time
                        return (
                          <button
                            key={slot}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            className={`caregiver-calendar__slot${selected ? ' is-selected' : ''}`}
                            onClick={() => setTime(slot)}
                          >
                            {slot}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="caregiver-calendar__slots-empty">
                      {selectedKey ? 'Sin horas disponibles' : 'Selecciona un día'}
                    </p>
                  )}
                </div>

                <section className="caregiver-calendar__meet" aria-label="Punto de encuentro">
                  <h2 className="caregiver-calendar__meet-title">Punto de encuentro</h2>
                  <div className="caregiver-calendar__meet-map">
                    <div ref={meetMapRef} />
                  </div>
                  <div className="caregiver-calendar__meet-row">
                    <img className="caregiver-calendar__meet-pin" src={addressAsset('map-pin.svg')} alt="" width={24} height={24} />
                    <div className="caregiver-calendar__meet-copy">
                      <p className="caregiver-calendar__meet-label">{meetPlace.tag}</p>
                      <p className="caregiver-calendar__meet-address">{meetPlace.label}</p>
                    </div>
                  </div>
                </section>
              </div>

              <hr className="caregiver-calendar__rule" />

              <section className="caregiver-calendar__policy">
                <div className="caregiver-calendar__policy-heading">
                  <h2 className="caregiver-calendar__policy-title">Política de cancelación</h2>
                  <button
                    type="button"
                    className="caregiver-calendar__policy-help"
                    aria-label="Más información sobre la política de cancelación"
                    onClick={openPolicyModal}
                  >
                    ?
                  </button>
                </div>
                <p className="caregiver-calendar__policy-copy">
                  Puedes cancelar <span>sin cargo hasta 12 horas antes.</span>
                  <br />
                  Si cancelas después, puede aplicarse un{' '}
                  <span>cargo según el tiempo restante y si el cuidador ya ha iniciado el desplazamiento. </span>
                  <button
                    type="button"
                    className="caregiver-calendar__policy-more"
                    onClick={openPolicyModal}
                  >
                    Leer más
                  </button>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      {showPolicyModal ? (
        <div className={`caregiver-policy-modal${policyClosing ? ' is-closing' : ''}`}>
          <button
            type="button"
            className="caregiver-policy-modal__backdrop"
            aria-label="Cerrar"
            onClick={closePolicyModal}
          />
          <div
            className="caregiver-policy-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="caregiver-policy-modal-title"
            onAnimationEnd={onPolicyModalAnimationEnd}
          >
            <div className="caregiver-policy-modal__toolbar">
              <button
                type="button"
                className="caregiver-policy-modal__close"
                aria-label="Cerrar"
                onClick={closePolicyModal}
              >
                <img
                  src={caregiverAsset('cancel-close.svg')}
                  alt=""
                  width={32}
                  height={32}
                  draggable={false}
                />
              </button>
            </div>
            <div className="caregiver-policy-modal__body">
              <h2 id="caregiver-policy-modal-title" className="caregiver-policy-modal__title display-title">
                Margen de cancelación
              </h2>
              <ul className="caregiver-policy-modal__tiers">
                {CANCEL_TIERS.map((tier) => (
                  <li
                    key={tier.label}
                    className={`caregiver-policy-modal__tier${'wrap' in tier && tier.wrap ? ' is-wrap' : ''}`}
                  >
                    <img
                      className="caregiver-policy-modal__icon"
                      src={caregiverAsset(tier.icon)}
                      alt=""
                      width={20}
                      height={20}
                      draggable={false}
                    />
                    <p className="caregiver-policy-modal__label">{tier.label}</p>
                    <div className="caregiver-policy-modal__fee">
                      {'percent' in tier && tier.percent ? (
                        <span className="caregiver-policy-modal__percent">{tier.percent}</span>
                      ) : null}
                      <span className="caregiver-policy-modal__amount">{tier.fee}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="caregiver-policy-modal__note">
                <span>Excepción:</span> enfermedad o emergencia veterinaria → sin penalización, previa
                justificación.
              </p>
              <hr className="caregiver-policy-modal__rule" />
              <button
                type="button"
                className="caregiver-policy-modal__confirm"
                onClick={closePolicyModal}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="caregiver-calendar__footer">
        <div className="caregiver-calendar__checkout">
          <p className="caregiver-calendar__price">Valor {SESSION_PRICE}</p>
          <button
            type="button"
            className="caregiver-calendar__pay"
            onClick={startPayment}
            disabled={!canPay}
          >
            Pagar y confirmar
          </button>
        </div>
      </div>

      {payPhase === 'apple-pay' || payPhase === 'success' ? (
        <div
          className={`booking-pay${paySheetOpen ? ' is-open' : ''}`}
          aria-hidden={payPhase !== 'apple-pay'}
        >
          <div className="booking-pay__backdrop" aria-hidden="true" />
          <img
            className="booking-pay__image"
            src={applePayScreenAsset}
            alt=""
            width={390}
            height={847}
            draggable={false}
          />
        </div>
      ) : null}

      {payPhase === 'success' ? (
        <BookingSuccessScreen
          details={successDetails}
          visible={successVisible}
          onAccept={finishBooking}
        />
      ) : null}
    </div>
  )
}
