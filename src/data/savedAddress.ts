export type BuildingType = 'casa' | 'apartamento' | 'oficina' | 'otro'

/** Free-text label for the saved address (e.g. "Casa", "Trabajo"). */
export type AddressLabel = string

export type SavedAddress = {
  /** Stable identity — tag alone is not unique (multiple “Casa”, etc.). */
  id: string
  label: string
  secondary: string
  lat: number
  lng: number
  buildingType: BuildingType
  floor: string
  door: string
  notes: string
  tag: AddressLabel
  savedAt: string
}

type AddressBook = {
  activeId: string
  items: SavedAddress[]
}

const STORAGE_KEY = 'waging.savedAddress'
const ADDRESS_EVENT = 'waging:address'

function notifyAddressChange() {
  window.dispatchEvent(new Event(ADDRESS_EVENT))
}

export function createAddressId() {
  return `addr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function legacyAddressId(address: { savedAt?: string; lat: number; lng: number; tag: string }) {
  return `legacy-${address.savedAt ?? 'na'}-${address.lat.toFixed(5)}-${address.lng.toFixed(5)}-${address.tag.toLowerCase()}`
}

function ensureAddressId(address: Omit<SavedAddress, 'id'> & { id?: string }): SavedAddress {
  return {
    ...address,
    id:
      typeof address.id === 'string' && address.id.trim()
        ? address.id
        : legacyAddressId(address),
  }
}

function isSavedAddress(value: unknown): value is SavedAddress {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as SavedAddress).lat === 'number' &&
      typeof (value as SavedAddress).lng === 'number' &&
      typeof (value as SavedAddress).tag === 'string',
  )
}

function emptyBook(): AddressBook {
  return { activeId: '', items: [] }
}

function readBook(): AddressBook {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyBook()
    const parsed = JSON.parse(raw) as unknown

    // Legacy single-address payload.
    if (isSavedAddress(parsed)) {
      const item = ensureAddressId(parsed)
      return { activeId: item.id, items: [item] }
    }

    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { items?: unknown }).items)
    ) {
      const items = (parsed as { items: unknown[] }).items
        .filter(isSavedAddress)
        .map((item) => ensureAddressId(item))
      if (!items.length) return emptyBook()

      const legacy = parsed as { activeId?: unknown; activeTag?: unknown }
      const activeId =
        typeof legacy.activeId === 'string' && items.some((item) => item.id === legacy.activeId)
          ? legacy.activeId
          : typeof legacy.activeTag === 'string' &&
              items.some((item) => item.tag === legacy.activeTag)
            ? (items.find((item) => item.tag === legacy.activeTag)?.id ?? items[0]!.id)
            : items[0]!.id

      return { activeId, items }
    }

    return emptyBook()
  } catch {
    return emptyBook()
  }
}

function writeBook(book: AddressBook) {
  if (!book.items.length) {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(book))
  }
  notifyAddressChange()
}

export function loadSavedAddresses(): SavedAddress[] {
  return readBook().items
}

export function loadSavedAddress(): SavedAddress | null {
  const book = readBook()
  if (!book.items.length) return null
  return book.items.find((item) => item.id === book.activeId) ?? book.items[0] ?? null
}

/** Insert or update by `id`. Same tag can appear on many addresses. */
export function saveAddress(address: Omit<SavedAddress, 'id'> & { id?: string }) {
  const book = readBook()
  const next: SavedAddress = {
    ...address,
    id:
      typeof address.id === 'string' && address.id.trim()
        ? address.id
        : createAddressId(),
  }
  const idx = book.items.findIndex((item) => item.id === next.id)
  if (idx >= 0) book.items[idx] = next
  else book.items.push(next)
  book.activeId = next.id
  writeBook(book)
  return next
}

export function setActiveAddressId(id: string) {
  const book = readBook()
  if (!book.items.some((item) => item.id === id)) return
  book.activeId = id
  writeBook(book)
}

/** Remove one saved address by id. */
export function removeAddress(id: string) {
  const book = readBook()
  const nextItems = book.items.filter((item) => item.id !== id)
  if (nextItems.length === book.items.length) return
  writeBook({
    items: nextItems,
    activeId:
      book.activeId === id
        ? (nextItems[0]?.id ?? '')
        : nextItems.some((item) => item.id === book.activeId)
          ? book.activeId
          : (nextItems[0]?.id ?? ''),
  })
}

export function clearSavedAddress() {
  localStorage.removeItem(STORAGE_KEY)
  notifyAddressChange()
}

/** Demo onboarding address — Carrer de Petrarca 42, Barcelona (Nominatim). */
export const DEMO_ONBOARDING_ADDRESS = {
  label: 'Carrer de Petrarca, 42',
  secondary: 'Barcelona, España',
  lat: 41.42889,
  lng: 2.16445,
  buildingType: 'casa' as const,
  floor: '',
  door: '',
  notes: '',
  tag: 'Casa',
}

/** Return the active address, seeding the demo onboarding place if none exists. */
export function ensureDemoAddress(): SavedAddress {
  const existing = loadSavedAddress()
  if (existing) {
    const isDemoLabel = existing.label === DEMO_ONBOARDING_ADDRESS.label
    const coordsStale =
      existing.lat !== DEMO_ONBOARDING_ADDRESS.lat ||
      existing.lng !== DEMO_ONBOARDING_ADDRESS.lng
    if (isDemoLabel && coordsStale) {
      return saveAddress({
        ...existing,
        ...DEMO_ONBOARDING_ADDRESS,
        id: existing.id,
        savedAt: existing.savedAt,
      })
    }
    return existing
  }
  return saveAddress({
    ...DEMO_ONBOARDING_ADDRESS,
    savedAt: new Date().toISOString(),
  })
}

export function subscribeAddressChange(listener: () => void) {
  window.addEventListener(ADDRESS_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(ADDRESS_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export const BUILDING_OPTIONS: {
  id: BuildingType
  label: string
  icon: string
  pin: string
}[] = [
  { id: 'casa', label: 'Casa', icon: 'house.svg', pin: 'pin-house.svg' },
  { id: 'apartamento', label: 'Apartamento', icon: 'building.svg', pin: 'pin-building.svg' },
  { id: 'oficina', label: 'Oficina', icon: 'monitor.svg', pin: 'pin-monitor.svg' },
  { id: 'otro', label: 'Otro', icon: 'sofa.svg', pin: 'pin-sofa.svg' },
]

export function buildingOption(type: BuildingType) {
  return BUILDING_OPTIONS.find((opt) => opt.id === type) ?? BUILDING_OPTIONS[0]
}
