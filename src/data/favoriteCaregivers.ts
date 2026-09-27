const STORAGE_KEY = 'waging.favoriteCaregivers'
const FAVORITE_EVENT = 'waging:favorites'

function notifyFavoritesChange() {
  window.dispatchEvent(new Event(FAVORITE_EVENT))
}

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
  } catch {
    return []
  }
}

function writeIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  notifyFavoritesChange()
}

export function loadFavoriteCaregiverIds(): string[] {
  return readIds()
}

export function isFavoriteCaregiver(id: string): boolean {
  return readIds().includes(id)
}

export function toggleFavoriteCaregiver(id: string): boolean {
  const ids = readIds()
  const index = ids.indexOf(id)
  if (index >= 0) {
    ids.splice(index, 1)
    writeIds(ids)
    return false
  }
  ids.push(id)
  writeIds(ids)
  return true
}

export function subscribeFavoritesChange(listener: () => void) {
  window.addEventListener(FAVORITE_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(FAVORITE_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

/** Stable sort: favorited caregivers first, preserving relative order within each group. */
export function sortCaregiversByFavorite<T extends { id: string }>(
  caregivers: readonly T[],
  favoriteIds: readonly string[],
): T[] {
  if (!favoriteIds.length) return [...caregivers]
  const favorites = new Set(favoriteIds)
  const favored: T[] = []
  const rest: T[] = []
  for (const caregiver of caregivers) {
    if (favorites.has(caregiver.id)) favored.push(caregiver)
    else rest.push(caregiver)
  }
  return [...favored, ...rest]
}
