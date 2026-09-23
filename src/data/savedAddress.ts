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

export const DEFAULT_ADDRESS_TAGS = ['Casa'] as const

const STORAGE_KEY = 'waging.savedAddress'
const ADDRESS_EVENT = 'waging:address'

function notifyAddressChange() {
  window.dispatchEvent(new Event(ADDRESS_EVENT))
}

export function loadSavedAddress(): SavedAddress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedAddress
  } catch {
    return null
  }
}

export function saveAddress(address: SavedAddress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(address))
  notifyAddressChange()
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

export const BUILDING_OPTIONS: { id: BuildingType; label: string; icon: string }[] = [
  { id: 'casa', label: 'Casa', icon: 'house.svg' },
  { id: 'apartamento', label: 'Apartamento', icon: 'building.svg' },
  { id: 'oficina', label: 'Oficina', icon: 'monitor.svg' },
  { id: 'otro', label: 'Otro', icon: 'sofa.svg' },
]
