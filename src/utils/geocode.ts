export type GeoResult = {
  id: string
  label: string
  secondary: string
  lat: number
  lng: number
}

/** Rough Spain bbox — prototype coverage for Waging TFM demos. */
const SPAIN = { minLat: 35.9, maxLat: 43.9, minLng: -9.4, maxLng: 4.4 }

export function isInCoverage(lat: number, lng: number) {
  return lat >= SPAIN.minLat && lat <= SPAIN.maxLat && lng >= SPAIN.minLng && lng <= SPAIN.maxLng
}

function splitDisplayName(displayName: string): { label: string; secondary: string } {
  const parts = displayName.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length <= 1) return { label: displayName, secondary: '' }
  return {
    label: parts[0] ?? displayName,
    secondary: parts.slice(1, 3).join(', '),
  }
}

type NominatimItem = {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

/** OpenStreetMap Nominatim — free, no API key. Keep requests light (TFM demo). */
export async function searchAddress(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '0')
  url.searchParams.set('limit', '5')
  url.searchParams.set('accept-language', 'es')

  const res = await fetch(url.toString(), {
    signal,
    headers: {
      Accept: 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Geocode failed (${res.status})`)

  const data = (await res.json()) as NominatimItem[]
  return data.map((item) => {
    const { label, secondary } = splitDisplayName(item.display_name)
    return {
      id: String(item.place_id),
      label,
      secondary,
      lat: Number(item.lat),
      lng: Number(item.lon),
    }
  })
}
