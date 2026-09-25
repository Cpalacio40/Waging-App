import type { BookingSuccessDetails } from '../screens/BookingSuccessScreen'

const STORAGE_KEY = 'waging.scheduledOuting'

export type ScheduledOutingState = {
  booking: BookingSuccessDetails | null
  /** Post-walk home card is available (after “Salida terminada”). */
  sessionDone: boolean
  /** Caregiver name for the session-done card / recap. */
  sessionCaregiverName: string | null
  /** User dismissed the orange session-done card (recap still completed). */
  sessionCardDismissed: boolean
}

const EMPTY: ScheduledOutingState = {
  booking: null,
  sessionDone: false,
  sessionCaregiverName: null,
  sessionCardDismissed: false,
}

function isBooking(value: unknown): value is BookingSuccessDetails {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as BookingSuccessDetails).caregiverName === 'string' &&
      typeof (value as BookingSuccessDetails).sessionLine === 'string' &&
      typeof (value as BookingSuccessDetails).addressLine === 'string',
  )
}

export function loadScheduledOuting(): ScheduledOutingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw) as Partial<ScheduledOutingState>
    return {
      booking: isBooking(parsed.booking) ? parsed.booking : null,
      sessionDone: Boolean(parsed.sessionDone),
      sessionCaregiverName:
        typeof parsed.sessionCaregiverName === 'string' ? parsed.sessionCaregiverName : null,
      sessionCardDismissed: Boolean(parsed.sessionCardDismissed),
    }
  } catch {
    return { ...EMPTY }
  }
}

export function saveScheduledOuting(state: ScheduledOutingState) {
  const hasSomething =
    state.booking || state.sessionDone || state.sessionCaregiverName || state.sessionCardDismissed
  if (!hasSomething) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearScheduledOuting() {
  localStorage.removeItem(STORAGE_KEY)
}
