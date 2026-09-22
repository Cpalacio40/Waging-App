export type GeoResult = {
  id: string
  label: string
  secondary: string
  lat: number
  lng: number
}

/**
 * Waging TFM coverage: major Spanish cities / towns only.
 * Point is covered if within `radiusKm` of any entry (haversine).
 */
type CoverageCity = { name: string; lat: number; lng: number; radiusKm: number }

const COVERAGE_CITIES: CoverageCity[] = [
  // Large metros
  { name: 'Madrid', lat: 40.4168, lng: -3.7038, radiusKm: 14 },
  { name: 'Barcelona', lat: 41.3874, lng: 2.1686, radiusKm: 12 },
  { name: 'Valencia', lat: 39.4699, lng: -0.3763, radiusKm: 10 },
  { name: 'Sevilla', lat: 37.3891, lng: -5.9845, radiusKm: 10 },
  { name: 'Zaragoza', lat: 41.6488, lng: -0.8891, radiusKm: 8 },
  { name: 'Málaga', lat: 36.7213, lng: -4.4214, radiusKm: 8 },
  { name: 'Murcia', lat: 37.9922, lng: -1.1307, radiusKm: 7 },
  { name: 'Bilbao', lat: 43.263, lng: -2.935, radiusKm: 7 },
  { name: 'Palma', lat: 39.5696, lng: 2.6502, radiusKm: 7 },
  { name: 'Las Palmas', lat: 28.1235, lng: -15.4363, radiusKm: 7 },
  { name: 'Santa Cruz de Tenerife', lat: 28.4636, lng: -16.2518, radiusKm: 7 },
  // Provincial / regional capitals and other large towns
  { name: 'A Coruña', lat: 43.3623, lng: -8.4115, radiusKm: 6 },
  { name: 'Vigo', lat: 42.2406, lng: -8.7207, radiusKm: 6 },
  { name: 'Gijón', lat: 43.5322, lng: -5.6611, radiusKm: 6 },
  { name: 'Oviedo', lat: 43.3614, lng: -5.8593, radiusKm: 6 },
  { name: 'Alicante', lat: 38.3452, lng: -0.4815, radiusKm: 6 },
  { name: 'Elche', lat: 38.2669, lng: -0.6983, radiusKm: 5 },
  { name: 'Córdoba', lat: 37.8882, lng: -4.7794, radiusKm: 6 },
  { name: 'Valladolid', lat: 41.6523, lng: -4.7245, radiusKm: 6 },
  { name: 'Vitoria-Gasteiz', lat: 42.8467, lng: -2.6716, radiusKm: 6 },
  { name: 'Granada', lat: 37.1773, lng: -3.5986, radiusKm: 6 },
  { name: 'Donostia', lat: 43.3183, lng: -1.9812, radiusKm: 6 },
  { name: 'Pamplona', lat: 42.8125, lng: -1.6458, radiusKm: 6 },
  { name: 'Santander', lat: 43.4623, lng: -3.81, radiusKm: 6 },
  { name: 'Castellón', lat: 39.9864, lng: -0.0513, radiusKm: 5 },
  { name: 'Burgos', lat: 42.3439, lng: -3.697, radiusKm: 5 },
  { name: 'Albacete', lat: 38.9942, lng: -1.8785, radiusKm: 5 },
  { name: 'Almería', lat: 36.834, lng: -2.4637, radiusKm: 5 },
  { name: 'Salamanca', lat: 40.9701, lng: -5.6635, radiusKm: 5 },
  { name: 'Logroño', lat: 42.4627, lng: -2.4449, radiusKm: 5 },
  { name: 'Badajoz', lat: 38.8794, lng: -6.9707, radiusKm: 5 },
  { name: 'Huelva', lat: 37.2614, lng: -6.9447, radiusKm: 5 },
  { name: 'Tarragona', lat: 41.1189, lng: 1.2445, radiusKm: 5 },
  { name: 'Lleida', lat: 41.6176, lng: 0.62, radiusKm: 5 },
  { name: 'Girona', lat: 41.9794, lng: 2.8214, radiusKm: 5 },
  { name: 'León', lat: 42.5987, lng: -5.5671, radiusKm: 5 },
  { name: 'Cádiz', lat: 36.5271, lng: -6.2886, radiusKm: 5 },
  { name: 'Jerez', lat: 36.685, lng: -6.1261, radiusKm: 5 },
  { name: 'Jaén', lat: 37.7796, lng: -3.7849, radiusKm: 5 },
  { name: 'Ourense', lat: 42.3358, lng: -7.8639, radiusKm: 5 },
  { name: 'Lugo', lat: 43.0097, lng: -7.5567, radiusKm: 5 },
  { name: 'Pontevedra', lat: 42.431, lng: -8.6444, radiusKm: 5 },
  { name: 'Toledo', lat: 39.8628, lng: -4.0273, radiusKm: 5 },
  { name: 'Cáceres', lat: 39.4753, lng: -6.3724, radiusKm: 5 },
  { name: 'Ciudad Real', lat: 38.9848, lng: -3.9274, radiusKm: 5 },
  { name: 'Guadalajara', lat: 40.6333, lng: -3.1669, radiusKm: 5 },
  { name: 'Cuenca', lat: 40.0704, lng: -2.1374, radiusKm: 5 },
  { name: 'Ávila', lat: 40.6567, lng: -4.6815, radiusKm: 5 },
  { name: 'Segovia', lat: 40.9429, lng: -4.1088, radiusKm: 5 },
  { name: 'Soria', lat: 41.7636, lng: -2.4649, radiusKm: 5 },
  { name: 'Zamora', lat: 41.5034, lng: -5.746, radiusKm: 5 },
  { name: 'Palencia', lat: 42.0096, lng: -4.5288, radiusKm: 5 },
  { name: 'Huesca', lat: 42.1401, lng: -0.4087, radiusKm: 5 },
  { name: 'Teruel', lat: 40.3456, lng: -1.1065, radiusKm: 5 },
  { name: 'Cartagena', lat: 37.6057, lng: -0.9911, radiusKm: 5 },
  { name: 'Ceuta', lat: 35.8894, lng: -5.3213, radiusKm: 4 },
  { name: 'Melilla', lat: 35.2923, lng: -2.9381, radiusKm: 4 },
]

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** True only near listed Spanish cities / large towns — not all of Spain. */
export function isInCoverage(lat: number, lng: number) {
  return COVERAGE_CITIES.some(
    (city) => distanceKm(lat, lng, city.lat, city.lng) <= city.radiusKm,
  )
}

type NominatimAddress = {
  house_number?: string
  road?: string
  pedestrian?: string
  footway?: string
  path?: string
  cycleway?: string
  residential?: string
  neighbourhood?: string
  suburb?: string
  city_district?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  state?: string
  postcode?: string
}

type NominatimItem = {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: NominatimAddress
}

function streetFromAddress(a: NominatimAddress) {
  return a.road || a.pedestrian || a.footway || a.path || a.cycleway || a.residential || ''
}

function localityFromAddress(a: NominatimAddress) {
  return a.city || a.town || a.village || a.municipality || a.suburb || a.city_district || ''
}

/** Prefer "Calle X, 12" over a bare house number as the primary label. */
function formatPlace(item: Pick<NominatimItem, 'display_name' | 'address'>): {
  label: string
  secondary: string
} {
  const a = item.address
  if (a) {
    const street = streetFromAddress(a)
    const number = a.house_number?.trim()
    if (street) {
      const label = number ? `${street}, ${number}` : street
      const secondary = [localityFromAddress(a), a.state].filter(Boolean).join(', ')
      return { label, secondary }
    }
    const locality = localityFromAddress(a)
    if (locality) {
      return { label: locality, secondary: a.state || '' }
    }
  }

  const parts = item.display_name.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length <= 1) return { label: item.display_name, secondary: '' }
  const looksLikeNumber = (p: string) => /^\d[\d\s\-./ªº]*$/.test(p)
  let i = 0
  while (i < parts.length - 1 && looksLikeNumber(parts[i]!)) i += 1
  return {
    label: parts[i] ?? item.display_name,
    secondary: parts.slice(i + 1, i + 3).join(', '),
  }
}

/** OpenStreetMap Nominatim — free, no API key. Keep requests light (TFM demo). */
export async function searchAddress(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
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
    const { label, secondary } = formatPlace(item)
    return {
      id: String(item.place_id),
      label,
      secondary,
      lat: Number(item.lat),
      lng: Number(item.lon),
    }
  })
}

/** Reverse geocode lat/lng → nearest address label. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<GeoResult | null> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('format', 'json')
  url.searchParams.set('zoom', '18')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('accept-language', 'es')

  const res = await fetch(url.toString(), {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Reverse geocode failed (${res.status})`)

  const data = (await res.json()) as NominatimItem & { error?: string }
  if (data.error || !data.display_name) return null

  const { label, secondary } = formatPlace(data)
  return {
    id: String(data.place_id ?? `${lat},${lng}`),
    label,
    secondary,
    lat,
    lng,
  }
}
