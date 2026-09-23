export type BuildingType = 'casa' | 'apartamento' | 'oficina' | 'otro'

/** Free-text label for the saved address (e.g. "Casa", "Trabajo"). */
export type AddressLabel = string

export type SavedAddress = {
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
  activeTag: string
  items: SavedAddress[]
}

const STORAGE_KEY = 'waging.savedAddress'
const ADDRESS_EVENT = 'waging:address'

function notifyAddressChange() {
  window.dispatchEvent(new Event(ADDRESS_EVENT))
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
  return { activeTag: '', items: [] }
}

function readBook(): AddressBook {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyBook()
    const parsed = JSON.parse(raw) as unknown

    // Legacy single-address payload.
    if (isSavedAddress(parsed)) {
      return { activeTag: parsed.tag, items: [parsed] }
    }

    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as AddressBook).items)
    ) {
      const items = (parsed as AddressBook).items.filter(isSavedAddress)
      if (!items.length) return emptyBook()
      const activeTag =
        typeof (parsed as AddressBook).activeTag === 'string' &&
        items.some((item) => item.tag === (parsed as AddressBook).activeTag)
          ? (parsed as AddressBook).activeTag
          : items[0].tag
      return { activeTag, items }
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
  return book.items.find((item) => item.tag === book.activeTag) ?? book.items[0]
}

export function saveAddress(address: SavedAddress) {
  const book = readBook()
  const idx = book.items.findIndex(
    (item) => item.tag.toLowerCase() === address.tag.toLowerCase(),
  )
  if (idx >= 0) book.items[idx] = address
  else book.items.push(address)
  book.activeTag = address.tag
  writeBook(book)
}

export function setActiveAddressTag(tag: string) {
  const book = readBook()
  if (!book.items.some((item) => item.tag === tag)) return
  book.activeTag = tag
  writeBook(book)
}

export function clearSavedAddress() {
  localStorage.removeItem(STORAGE_KEY)
  notifyAddressChange()
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
