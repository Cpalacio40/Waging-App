/** Deterministic caregiver availability for the booking calendar mock. */

/** Minimum notice before a slot can be booked (covers past hours + lead time). */
export const MIN_BOOKING_LEAD_MINUTES = 60

export type ShiftType = 'early' | 'standard' | 'late'

export type CaregiverSchedule = {
  id: string
  workingDays: number[]
  shift: ShiftType | 'alternating'
  seed: number
}

export type TimeSlot = {
  time: string
  available: boolean
}

export type DayAvailability = {
  date: string
  isWorkingDay: boolean
  isFullyBooked: boolean
  availableSlots: string[]
  allSlots: TimeSlot[]
}

/**
 * Relative demo overrides — `fromToday` is resolved to the next working day
 * for that caregiver (skipping rest days and dates already claimed by earlier
 * overrides). `freeIndexes` are indexes into that day's shift slots.
 */
type RelativeDemoOverride = {
  fromToday: number
  freeIndexes: number[]
}

export const SHIFT_SLOTS: Record<ShiftType, string[]> = {
  early: ['08:30', '10:00', '11:30', '14:30', '16:00'],
  standard: ['09:30', '11:00', '12:30', '16:00', '17:30'],
  late: ['11:00', '12:30', '15:30', '17:00', '18:30'],
}

export const CAREGIVER_SCHEDULES: CaregiverSchedule[] = [
  {
    id: 'maria',
    workingDays: [1, 2, 3, 4, 5], // Monday–Friday
    shift: 'early',
    seed: 11,
  },
  {
    id: 'andres',
    workingDays: [2, 3, 4, 5, 6], // Tuesday–Saturday
    shift: 'standard',
    seed: 23,
  },
  {
    id: 'javier',
    workingDays: [3, 4, 5, 6, 0], // Wednesday–Sunday
    shift: 'late',
    seed: 37,
  },
  {
    id: 'sofia',
    workingDays: [0, 1, 2, 3, 4], // Sunday–Thursday
    shift: 'alternating',
    seed: 51,
  },
]

/** Varied demo cases per caregiver: full / light / medium / almost full / empty. */
const DEMO_OVERRIDES: Record<string, RelativeDemoOverride[]> = {
  maria: [
    { fromToday: 0, freeIndexes: [0, 1, 2, 3, 4] },
    { fromToday: 1, freeIndexes: [1, 3, 4] },
    { fromToday: 4, freeIndexes: [] },
    { fromToday: 5, freeIndexes: [0, 4] },
    { fromToday: 6, freeIndexes: [0, 1, 3, 4] },
  ],
  andres: [
    { fromToday: 0, freeIndexes: [0, 1, 3] },
    { fromToday: 2, freeIndexes: [0, 1, 2, 3, 4] },
    { fromToday: 3, freeIndexes: [] },
    { fromToday: 5, freeIndexes: [2] },
    { fromToday: 7, freeIndexes: [0, 2, 4] },
  ],
  javier: [
    { fromToday: 0, freeIndexes: [1, 2, 3, 4] },
    { fromToday: 1, freeIndexes: [] },
    { fromToday: 3, freeIndexes: [0, 4] },
    { fromToday: 4, freeIndexes: [0, 1, 2, 3, 4] },
    { fromToday: 6, freeIndexes: [3] },
  ],
  sofia: [
    { fromToday: 0, freeIndexes: [0, 2] },
    { fromToday: 1, freeIndexes: [0, 1, 2, 3, 4] },
    { fromToday: 2, freeIndexes: [] },
    { fromToday: 4, freeIndexes: [1, 2, 3] },
    { fromToday: 5, freeIndexes: [4] },
  ],
}

function getSchedule(caregiverId: string): CaregiverSchedule {
  return (
    CAREGIVER_SCHEDULES.find((schedule) => schedule.id === caregiverId) ??
    CAREGIVER_SCHEDULES[0]
  )
}

export function formatAvailabilityDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const elapsedDays = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((elapsedDays + firstDayOfYear.getDay() + 1) / 7)
}

export function getShiftForDate(caregiver: CaregiverSchedule, date: Date): ShiftType {
  if (caregiver.shift !== 'alternating') return caregiver.shift
  return getWeekNumber(date) % 2 === 0 ? 'early' : 'standard'
}

function getDailyOccupancy(caregiver: CaregiverSchedule, date: Date): number {
  const value = date.getDate() * 13 + (date.getMonth() + 1) * 17 + caregiver.seed
  const bucket = value % 10

  if (bucket === 0) return 5 // Fully booked
  if (bucket <= 2) return 4 // Almost full
  if (bucket <= 5) return 3 // Medium
  if (bucket <= 7) return 2 // Light
  return 0 // Completely available
}

function getBookedSlotIndexes(
  slotCount: number,
  bookedCount: number,
  caregiverSeed: number,
  date: Date,
): Set<number> {
  const indexes = Array.from({ length: slotCount }, (_, index) => index)
  const dateSeed = caregiverSeed + date.getDate() * 7 + date.getMonth() * 19

  indexes.sort((a, b) => {
    const scoreA = (a * 31 + dateSeed) % 17
    const scoreB = (b * 31 + dateSeed) % 17
    return scoreA - scoreB
  })

  return new Set(indexes.slice(0, bookedCount))
}

/** Resolve relative offsets onto working days only; skip already-claimed dates. */
function resolveDemoOverrides(
  caregiver: CaregiverSchedule,
  today: Date,
): Map<string, string[]> {
  const overrides = DEMO_OVERRIDES[caregiver.id] ?? []
  const claimed = new Set<string>()
  const resolved = new Map<string, string[]>()
  const horizon = addDays(today, 60)

  for (const override of overrides) {
    let candidate = addDays(today, override.fromToday)

    for (let step = 0; step < 21; step += 1) {
      if (candidate > horizon) break

      const key = formatAvailabilityDate(candidate)
      const isWorking = caregiver.workingDays.includes(candidate.getDay())

      if (isWorking && !claimed.has(key)) {
        claimed.add(key)
        const shift = getShiftForDate(caregiver, candidate)
        const slots = SHIFT_SLOTS[shift]
        const available = override.freeIndexes
          .filter((index) => index >= 0 && index < slots.length)
          .map((index) => slots[index])
        resolved.set(key, available)
        break
      }

      candidate = addDays(candidate, 1)
    }
  }

  return resolved
}

const demoOverrideCache = new Map<string, Map<string, string[]>>()

function getDemoOverrides(caregiver: CaregiverSchedule, today: Date) {
  const cacheKey = `${caregiver.id}:${formatAvailabilityDate(today)}`
  const cached = demoOverrideCache.get(cacheKey)
  if (cached) return cached
  const resolved = resolveDemoOverrides(caregiver, today)
  demoOverrideCache.set(cacheKey, resolved)
  return resolved
}

function emptyDay(date: Date): DayAvailability {
  return {
    date: formatAvailabilityDate(date),
    isWorkingDay: false,
    isFullyBooked: true,
    availableSlots: [],
    allSlots: [],
  }
}

function slotStartDate(date: Date, time: string): Date {
  const [hourPart, minutePart = '0'] = time.split(':')
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Number(hourPart) || 0,
    Number(minutePart) || 0,
    0,
    0,
  )
}

/**
 * A slot is bookable only when it starts at least {@link MIN_BOOKING_LEAD_MINUTES}
 * after `now` — past hours and same-day slots with insufficient lead time are excluded.
 */
export function isSlotBookableAt(
  date: Date,
  time: string,
  now: Date = new Date(),
  leadMinutes: number = MIN_BOOKING_LEAD_MINUTES,
): boolean {
  const slotStart = slotStartDate(startOfDay(date), time)
  const earliest = new Date(now.getTime() + leadMinutes * 60_000)
  return slotStart.getTime() >= earliest.getTime()
}

export function getDayAvailability(
  caregiverId: string,
  date: Date,
  today: Date = startOfDay(new Date()),
  now: Date = new Date(),
): DayAvailability {
  const caregiver = getSchedule(caregiverId)
  const normalized = startOfDay(date)
  const dayOfWeek = normalized.getDay()

  if (!caregiver.workingDays.includes(dayOfWeek)) {
    return emptyDay(normalized)
  }

  const shift = getShiftForDate(caregiver, normalized)
  const slots = SHIFT_SLOTS[shift]
  const dateKey = formatAvailabilityDate(normalized)
  const demoOverrides = getDemoOverrides(caregiver, startOfDay(today))
  const overrideSlots = demoOverrides.get(dateKey)

  let allSlots: TimeSlot[]

  if (overrideSlots !== undefined) {
    const free = new Set(overrideSlots)
    allSlots = slots.map((time) => ({
      time,
      available: free.has(time),
    }))
  } else {
    const bookedCount = getDailyOccupancy(caregiver, normalized)
    const bookedIndexes = getBookedSlotIndexes(
      slots.length,
      bookedCount,
      caregiver.seed,
      normalized,
    )
    allSlots = slots.map((time, index) => ({
      time,
      available: !bookedIndexes.has(index),
    }))
  }

  // Drop past / too-soon slots so the day can flip to unavailable when none remain.
  allSlots = allSlots.map((slot) => ({
    ...slot,
    available: slot.available && isSlotBookableAt(normalized, slot.time, now),
  }))

  const availableSlots = allSlots.filter((slot) => slot.available).map((slot) => slot.time)

  return {
    date: dateKey,
    isWorkingDay: true,
    isFullyBooked: availableSlots.length === 0,
    availableSlots,
    allSlots,
  }
}

/** True when the day has at least one bookable slot (working + not fully booked). */
export function hasAvailability(
  caregiverId: string,
  date: Date,
  today: Date = startOfDay(new Date()),
  now: Date = new Date(),
): boolean {
  const day = getDayAvailability(caregiverId, date, today, now)
  return day.isWorkingDay && !day.isFullyBooked
}
