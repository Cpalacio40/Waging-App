import { useEffect, useMemo, useRef, useState, type TransitionEvent } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Caregiver } from '../data/caregivers'
import { useDragScroll } from '../hooks/useDragScroll'
import { assetUrl } from '../utils/assetUrl'
import './screens.css'

const caregiverAsset = (name: string) => assetUrl(`caregiver/${name}`)
const calendarUnavailableAsset = assetUrl('caregiver/calendar-unavailable.svg')

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

const TIME_SLOTS = ['8:00', '9:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00'] as const
const SESSION_DURATION = '60 min'
const SESSION_PRICE = '29,99€'
const SESSION_SUBTITLE = 'Salidas por tu barrio o sesiones en casa'
const OCCUPIED_DAY_OFFSETS = [4, 7, 8] as const
const WHEEL_ITEM_HEIGHT = 44

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
  onBack: () => void
  onClosed: () => void
}

/** Session calendar booking — Figma 180:6825. */
export function CaregiverCalendarScreen({
  caregiver,
  open,
  onBack,
  onClosed,
}: CaregiverCalendarScreenProps) {
  const [today] = useState(() => startOfDay(new Date()))
  const [entered, setEntered] = useState(false)
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [time, setTime] = useState<string>(TIME_SLOTS[0])
  const [pendingTime, setPendingTime] = useState<string>(TIME_SLOTS[0])
  const [timeOpen, setTimeOpen] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)

  const dragScroll = useDragScroll({
    enabled: open && entered,
    ignoreSelector: 'button, a, select, .caregiver-calendar__time',
  })

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
  const occupiedKeys = useMemo(
    () => new Set(OCCUPIED_DAY_OFFSETS.map((offset) => dateKey(addDays(today, offset)))),
    [today],
  )
  const statusFor = (date: Date): DayStatus => {
    const normalized = startOfDay(date)
    if (normalized < today || normalized > lastVisibleDay) return 'default'
    if (occupiedKeys.has(dateKey(normalized))) return 'unavailable'
    return 'available'
  }
  const days = useMemo(
    () => buildMonthGrid(year, month, statusFor),
    // The calendar status is fixed for the lifetime of this screen instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [year, month, today, lastVisibleDay, occupiedKeys],
  )
  const cursorMonthIndex = monthIndex(cursor)
  const firstMonthIndex = monthIndex(firstMonth)
  const secondMonthIndex = monthIndex(secondMonth)
  const isFirstMonth = cursorMonthIndex === firstMonthIndex
  const isSecondMonth = cursorMonthIndex === secondMonthIndex

  useEffect(() => {
    if (!open) {
      setEntered(false)
      setTimeOpen(false)
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

  useEffect(() => {
    if (!timeOpen) return
    const frame = window.requestAnimationFrame(() => {
      const index = TIME_SLOTS.indexOf(time as (typeof TIME_SLOTS)[number])
      wheelRef.current?.scrollTo({ top: Math.max(0, index) * WHEEL_ITEM_HEIGHT })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [timeOpen, time])

  const onSheetTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    if (e.propertyName !== 'transform') return
    if (!open) onClosed()
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
    setTimeOpen(false)
  }

  const resolvedStatus = (cell: CalendarDay): DayStatus => {
    if (cell.outside && cell.status !== 'available' && cell.status !== 'unavailable') return 'outside'
    return cell.status
  }

  const canSelect = (cell: CalendarDay) => resolvedStatus(cell) === 'available'

  const onSelectDay = (cell: CalendarDay) => {
    if (!canSelect(cell)) return
    setSelectedKey(cell.key)
    if (cell.outside && monthIndex(cell.date) <= secondMonthIndex) {
      setCursor(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1))
    }
  }

  const openTimePicker = () => {
    if (!selectedKey) return
    setPendingTime(time)
    setTimeOpen(true)
  }

  const onWheelScroll = () => {
    const index = Math.round((wheelRef.current?.scrollTop ?? 0) / WHEEL_ITEM_HEIGHT)
    const slot = TIME_SLOTS[Math.max(0, Math.min(index, TIME_SLOTS.length - 1))]
    if (slot) setPendingTime(slot)
  }

  const selectWheelTime = (slot: string) => {
    if (slot === pendingTime) {
      setTime(slot)
      setTimeOpen(false)
      return
    }

    setPendingTime(slot)
    const index = TIME_SLOTS.indexOf(slot as (typeof TIME_SLOTS)[number])
    wheelRef.current?.scrollTo({
      top: index * WHEEL_ITEM_HEIGHT,
      behavior: 'smooth',
    })
  }

  return (
    <div
      className={sheetClass}
      role="dialog"
      aria-modal="true"
      aria-label="Calendario y disponibilidad"
      onTransitionEnd={onSheetTransitionEnd}
    >
      <header className="caregiver-calendar__header">
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
          <div className="caregiver-calendar__header-spacer" aria-hidden="true" />

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
                    <span>Disponible</span>
                  </div>
                  <div className="caregiver-calendar__legend-item">
                    <span className="caregiver-calendar__swatch caregiver-calendar__swatch--unavailable" />
                    <span>No disponible</span>
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
                            width={31.11}
                            height={31.11}
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
                  <label className="caregiver-calendar__time-label" id="calendar-time-label">
                    Disponibilidad
                  </label>
                  <button
                    type="button"
                    className={`caregiver-calendar__time-trigger${timeOpen ? ' is-open' : ''}`}
                    aria-haspopup="dialog"
                    aria-expanded={timeOpen}
                    aria-labelledby="calendar-time-label"
                    disabled={!selectedKey}
                    onClick={openTimePicker}
                  >
                    <span>{selectedKey ? time : 'Selecciona un día'}</span>
                    <ChevronDown size={16} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <hr className="caregiver-calendar__rule" />

              <section className="caregiver-calendar__policy">
                <div className="caregiver-calendar__policy-heading">
                  <h2 className="caregiver-calendar__policy-title">Política de cancelación</h2>
                  <button
                    type="button"
                    className="caregiver-calendar__policy-help"
                    aria-label="Más información sobre la política de cancelación"
                  >
                    ?
                  </button>
                </div>
                <p className="caregiver-calendar__policy-copy">
                  Puedes cancelar <span>gratis hasta 12 horas antes.</span>
                  <br />
                  Si cancelas después, puede aplicarse un{' '}
                  <span>cargo según el tiempo restante y si el cuidador ya ha iniciado el desplazamiento. </span>
                  <button type="button" className="caregiver-calendar__policy-more">
                    Leer más
                  </button>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      {timeOpen ? (
        <div
          className="caregiver-time-modal"
          role="presentation"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setTimeOpen(false)
          }}
        >
          <div
            className="caregiver-time-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="caregiver-time-modal-title"
          >
            <div className="caregiver-time-modal__header">
              <h2 id="caregiver-time-modal-title" className="caregiver-time-modal__title">
                Selecciona una hora
              </h2>
            </div>

            <div className="caregiver-time-modal__wheel-wrap">
              <div className="caregiver-time-modal__selection" aria-hidden="true" />
              <div
                ref={wheelRef}
                className="caregiver-time-modal__wheel"
                role="listbox"
                aria-label="Horas disponibles"
                onScroll={onWheelScroll}
              >
                <ul className="caregiver-time-modal__list">
                  {TIME_SLOTS.map((slot) => (
                    <li key={slot}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={slot === pendingTime}
                        className={`caregiver-time-modal__option${
                          slot === pendingTime ? ' is-selected' : ''
                        }`}
                        onClick={() => selectWheelTime(slot)}
                      >
                        {slot}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="caregiver-time-modal__actions">
              <button
                type="button"
                className="caregiver-time-modal__action"
                onClick={() => setTimeOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="caregiver-time-modal__action caregiver-time-modal__action--confirm"
                onClick={() => {
                  setTime(pendingTime)
                  setTimeOpen(false)
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="caregiver-calendar__footer">
        <div className="caregiver-calendar__checkout">
          <p className="caregiver-calendar__price">Valor {SESSION_PRICE}</p>
          <button type="button" className="caregiver-calendar__pay">
            Pagar y confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
