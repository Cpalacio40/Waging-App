import { useEffect, useRef, useState, type FormEvent } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { assetUrl } from '../utils/assetUrl'
import { isInCoverage, searchAddress, type GeoResult } from '../utils/geocode'
import './screens.css'

const addressAsset = (name: string) => assetUrl(`address/${name}`)

const DEFAULT_LAT = 41.3874
const DEFAULT_LNG = 2.1686
const DEFAULT_ZOOM = 13
const SEARCH_DEBOUNCE_MS = 450

export type AddressLocateMode = 'search' | 'map'

type AddressLocateScreenProps = {
  mode?: AddressLocateMode
  onBack?: () => void
  onModeChange?: (mode: AddressLocateMode) => void
  onConfirm?: (place: { label: string; lat: number; lng: number }) => void
}

function pinIcon(inCoverage: boolean) {
  return L.icon({
    iconUrl: addressAsset(inCoverage ? 'pin-ok.svg' : 'pin-marker.svg'),
    iconSize: [44, 51],
    iconAnchor: [22, 51],
    popupAnchor: [0, -46],
  })
}

export function AddressLocateScreen({
  mode: modeProp,
  onBack,
  onModeChange,
  onConfirm,
}: AddressLocateScreenProps) {
  const [internalMode, setInternalMode] = useState<AddressLocateMode>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<GeoResult | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(() =>
    modeProp === 'map' ? { lat: DEFAULT_LAT, lng: DEFAULT_LNG } : null,
  )

  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const mode = modeProp ?? internalMode
  const point =
    coords ??
    (selected ? { lat: selected.lat, lng: selected.lng } : null) ??
    (mode === 'map' ? { lat: DEFAULT_LAT, lng: DEFAULT_LNG } : null)
  const inCoverage = point ? isInCoverage(point.lat, point.lng) : true

  const setMode = (next: AddressLocateMode) => {
    onModeChange?.(next)
    if (modeProp === undefined) setInternalMode(next)
  }

  const openMapAt = (lat: number, lng: number, place?: GeoResult) => {
    setCoords({ lat, lng })
    if (place) setSelected(place)
    setMode('map')
  }

  const runSearch = async (value: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setSearching(true)
    setError(null)
    try {
      const hits = await searchAddress(value, controller.signal)
      if (!controller.signal.aborted) setResults(hits)
      return hits
    } catch (err) {
      if ((err as Error).name === 'AbortError') return []
      setResults([])
      setError('No se pudo buscar la dirección. Prueba de nuevo.')
      return []
    } finally {
      if (!controller.signal.aborted) setSearching(false)
    }
  }

  useEffect(() => {
    const q = query.trim()
    if (mode !== 'search' || q.length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    const timer = window.setTimeout(() => {
      void runSearch(q)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query, mode])

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    if (mode !== 'map' || !mapHostRef.current || mapRef.current) return

    const map = L.map(mapHostRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([DEFAULT_LAT, DEFAULT_LNG], DEFAULT_ZOOM)

    // Cleaner street style than default OSM (closer to Google Maps look). No API key.
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, OpenStreetMap',
        maxZoom: 19,
      },
    ).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [mode])

  useEffect(() => {
    const map = mapRef.current
    if (!map || mode !== 'map') return

    const lat = point?.lat ?? DEFAULT_LAT
    const lng = point?.lng ?? DEFAULT_LNG
    const covered = isInCoverage(lat, lng)
    const icon = pinIcon(covered)

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map)
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current?.getLatLng()
        if (!pos) return
        setCoords({ lat: pos.lat, lng: pos.lng })
        setSelected((prev) =>
          prev
            ? { ...prev, lat: pos.lat, lng: pos.lng }
            : {
                id: 'drag',
                label: 'Ubicación seleccionada',
                secondary: `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`,
                lat: pos.lat,
                lng: pos.lng,
              },
        )
      })
    } else {
      markerRef.current.setLatLng([lat, lng])
      markerRef.current.setIcon(icon)
    }

    map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true })
    requestAnimationFrame(() => map.invalidateSize())
  }, [mode, point?.lat, point?.lng])

  const goToFirstHitOrDefault = async (q: string) => {
    const hits = await runSearch(q)
    if (hits[0]) {
      setQuery(hits[0].label)
      openMapAt(hits[0].lat, hits[0].lng, hits[0])
      return
    }
    openMapAt(DEFAULT_LAT, DEFAULT_LNG)
  }

  const onSubmitSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    void goToFirstHitOrDefault(q)
  }

  const onSubmitMapSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    void (async () => {
      const hits = await runSearch(q)
      if (hits[0]) {
        setSelected(hits[0])
        setCoords({ lat: hits[0].lat, lng: hits[0].lng })
        setQuery(hits[0].label)
      }
    })()
  }

  const pickResult = (item: GeoResult) => {
    setQuery(item.label)
    openMapAt(item.lat, item.lng, item)
  }

  const useMapInstead = () => {
    if (!navigator.geolocation) {
      openMapAt(DEFAULT_LAT, DEFAULT_LNG)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => openMapAt(pos.coords.latitude, pos.coords.longitude),
      () => openMapAt(DEFAULT_LAT, DEFAULT_LNG),
      { enableHighAccuracy: false, timeout: 5000 },
    )
  }

  const confirm = () => {
    if (!point || !inCoverage) return
    onConfirm?.({
      label: selected?.label || query.trim() || 'Dirección seleccionada',
      lat: point.lat,
      lng: point.lng,
    })
  }

  const showSuggestions = mode === 'search' && query.trim().length >= 2

  if (mode === 'map') {
    return (
      <div className="screen address-locate address-locate--map">
        <div ref={mapHostRef} className="address-locate__map" role="presentation" />

        <header className="address-locate__map-nav">
          <button
            type="button"
            className="caregiver-back address-locate__back-chip"
            aria-label="Volver"
            onClick={onBack}
          >
            <img
              src={assetUrl('caregiver/arrow-left.svg')}
              alt=""
              width={32}
              height={32}
              draggable={false}
            />
          </button>
        </header>

        {point && !inCoverage ? (
          <div className="address-locate__tooltip" role="status">
            <img src={addressAsset('pin-x.svg')} alt="" width={32} height={32} draggable={false} />
            <div className="address-locate__tooltip-copy">
              <p className="address-locate__tooltip-title">¡Fuera de cobertura!</p>
              <p className="address-locate__tooltip-sub">No realizamos salida en esta zona por ahora</p>
            </div>
          </div>
        ) : null}

        <div className="address-locate__sheet">
          <p className="address-locate__sheet-hint">
            ¿Tienes problemas para encontrar tu ubicación?{' '}
            <span>Intenta utilizar la búsqueda.</span>
          </p>
          <form className="address-locate__map-form" onSubmit={onSubmitMapSearch}>
            <label className="address-locate__field address-locate__field--map">
              <img src={addressAsset('search.svg')} alt="" width={18} height={18} draggable={false} />
              <input
                className="address-locate__input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar calle, ciudad o distrito..."
                enterKeyHint="search"
              />
            </label>
          </form>
          {inCoverage && point ? (
            <button type="button" className="caregiver-cta address-locate__confirm" onClick={confirm}>
              Confirmar dirección
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="screen address-locate">
      <form className="address-locate__top" onSubmit={onSubmitSearch}>
        <button type="button" className="caregiver-back" aria-label="Volver" onClick={onBack}>
          <img
            src={assetUrl('caregiver/arrow-left.svg')}
            alt=""
            width={32}
            height={32}
            draggable={false}
          />
        </button>
        <label className="address-locate__field">
          <img src={addressAsset('search.svg')} alt="" width={18} height={18} draggable={false} />
          <input
            className="address-locate__input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar calle, ciudad o distrito..."
            autoComplete="street-address"
            enterKeyHint="search"
            autoFocus
          />
        </label>
      </form>

      <div className="address-locate__body">
        {error ? <p className="address-locate__error">{error}</p> : null}
        {searching ? <p className="address-locate__status">Buscando…</p> : null}

        {showSuggestions ? (
          <ul className="address-locate__results">
            {results.map((item) => (
              <li key={item.id}>
                <button type="button" className="address-locate__result" onClick={() => pickResult(item)}>
                  <img src={addressAsset('map-pin.svg')} alt="" width={24} height={24} draggable={false} />
                  <span className="address-locate__result-copy">
                    <span className="address-locate__result-label">{item.label}</span>
                    {item.secondary ? (
                      <span className="address-locate__result-secondary">{item.secondary}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <button type="button" className="address-locate__map-cta" onClick={useMapInstead}>
          <img src={addressAsset('map-icon.svg')} alt="" width={24} height={24} draggable={false} />
          <span className="address-locate__map-cta-copy">
            <span className="address-locate__map-cta-title">¿No encuentras tu dirección?</span>
            <span className="address-locate__map-cta-link">Usa el mapa en su lugar</span>
          </span>
        </button>
      </div>
    </div>
  )
}
