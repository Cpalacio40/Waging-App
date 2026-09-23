import { useEffect, useRef, useState, type AnimationEvent } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BUILDING_OPTIONS, buildingOption, type BuildingType } from '../data/savedAddress'
import { assetUrl } from '../utils/assetUrl'
import { isInCoverage, reverseGeocode, searchAddress, type GeoResult } from '../utils/geocode'
import './screens.css'

const addressAsset = (name: string) => assetUrl(`address/${name}`)

const DEFAULT_LAT = 41.3874
const DEFAULT_LNG = 2.1686
/** First visit: city / country overview. */
const OVERVIEW_ZOOM = 11
/** After an address is set: streets + labels visible. */
const STREET_ZOOM = 16
const SEARCH_DEBOUNCE_MS = 450
const REVERSE_DEBOUNCE_MS = 380

/** map = first view · search = sheet expanded · building = tipo edificio */
export type AddressLocateMode = 'map' | 'search' | 'building'

export type LocatedPlace = {
  label: string
  secondary: string
  lat: number
  lng: number
}

type AddressLocateScreenProps = {
  mode?: AddressLocateMode
  onBack?: () => void
  onModeChange?: (mode: AddressLocateMode) => void
  onBuildingSelected?: (place: LocatedPlace, buildingType: BuildingType) => void
}

/** Screen Y ratio where the fixed pin tip sits (map = screen center). */
function pinScreenYRatio(mode: AddressLocateMode) {
  return mode === 'building' ? 0.32 : 0.5
}

function pinScreenPoint(map: L.Map, mode: AddressLocateMode) {
  const size = map.getSize()
  return L.point(size.x / 2, size.y * pinScreenYRatio(mode))
}

/** Pan so `latlng` sits under the fixed center pin. */
function panLatLngUnderPin(
  map: L.Map,
  lat: number,
  lng: number,
  mode: AddressLocateMode,
  opts?: { animate?: boolean; zoom?: number },
) {
  const animate = opts?.animate !== false
  const zoom = opts?.zoom ?? map.getZoom()
  const latlng = L.latLng(lat, lng)
  map.setView(latlng, zoom, { animate: false })
  const desired = pinScreenPoint(map, mode)
  const current = map.latLngToContainerPoint(latlng)
  map.panBy([current.x - desired.x, current.y - desired.y], {
    animate,
    duration: animate ? 0.35 : 0,
  })
}

function latLngAtPin(map: L.Map, mode: AddressLocateMode) {
  return map.containerPointToLatLng(pinScreenPoint(map, mode === 'building' ? 'building' : 'map'))
}

export function AddressLocateScreen({
  mode: modeProp,
  onBack,
  onModeChange,
  onBuildingSelected,
}: AddressLocateScreenProps) {
  const [internalMode, setInternalMode] = useState<AddressLocateMode>('map')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<GeoResult | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
  })
  const [searchLeaving, setSearchLeaving] = useState(false)
  const [mapMoving, setMapMoving] = useState(false)
  const [resolvingAddress, setResolvingAddress] = useState(false)
  const [previewBuilding, setPreviewBuilding] = useState<BuildingType | null>(null)

  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const reverseAbortRef = useRef<AbortController | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const geoTriedRef = useRef(false)
  const skipNextReverseRef = useRef(false)
  const modeRef = useRef<AddressLocateMode>('map')

  const mode = modeProp ?? internalMode
  modeRef.current = mode
  const showSearchSheet = mode === 'search' || searchLeaving
  const showMapChrome = mode === 'map' || mode === 'building'
  const inCoverage = isInCoverage(coords.lat, coords.lng)
  const pinKind = !inCoverage ? 'out' : mode === 'building' ? 'building' : 'ok'
  const pinSrc =
    pinKind === 'out'
      ? 'pin-marker.svg'
      : pinKind === 'building'
        ? buildingOption(previewBuilding ?? 'casa').pin
        : 'pin-ok.svg'

  const place: LocatedPlace = {
    label: selected?.label || query.trim() || 'Ubicación seleccionada',
    secondary: selected?.secondary || '',
    lat: coords.lat,
    lng: coords.lng,
  }

  const setMode = (next: AddressLocateMode) => {
    onModeChange?.(next)
    if (modeProp === undefined) setInternalMode(next)
  }

  const openSearch = () => {
    setSearchLeaving(false)
    setMode('search')
  }

  const closeSearch = () => {
    if (searchLeaving) return
    setSearchLeaving(true)
  }

  const onSearchSheetAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    if (!searchLeaving) return
    setSearchLeaving(false)
    setMode('map')
  }

  const resolveFromMapCenter = async (lat: number, lng: number) => {
    reverseAbortRef.current?.abort()
    const controller = new AbortController()
    reverseAbortRef.current = controller
    setResolvingAddress(true)
    setCoords({ lat, lng })
    try {
      const hit = await reverseGeocode(lat, lng, controller.signal)
      if (controller.signal.aborted) return
      if (hit) {
        setSelected(hit)
        setQuery(hit.label)
      } else {
        setSelected({
          id: `rev-${lat},${lng}`,
          label: 'Ubicación en el mapa',
          secondary: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          lat,
          lng,
        })
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setSelected({
        id: `rev-${lat},${lng}`,
        label: 'Ubicación en el mapa',
        secondary: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng,
      })
    } finally {
      if (!controller.signal.aborted) setResolvingAddress(false)
    }
  }

  const applyLocation = (lat: number, lng: number, hit?: GeoResult) => {
    setSearchLeaving(false)
    setCoords({ lat, lng })
    if (hit) {
      setSelected(hit)
      setQuery(hit.label)
    } else {
      setSelected({
        id: 'map-pick',
        label: query.trim() || 'Ubicación en el mapa',
        secondary: '',
        lat,
        lng,
      })
    }
    const covered = isInCoverage(lat, lng)
    skipNextReverseRef.current = true
    setMode(covered ? 'building' : 'map')
    const map = mapRef.current
    if (map) {
      requestAnimationFrame(() => {
        map.invalidateSize()
        panLatLngUnderPin(map, lat, lng, covered ? 'building' : 'map', {
          zoom: STREET_ZOOM,
        })
      })
    }
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

  useEffect(
    () => () => {
      abortRef.current?.abort()
      reverseAbortRef.current?.abort()
    },
    [],
  )

  useEffect(() => {
    if (mode !== 'search') return
    const id = window.requestAnimationFrame(() => searchInputRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [mode])

  // Init map once
  useEffect(() => {
    if (!mapHostRef.current || mapRef.current) return

    const map = L.map(mapHostRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([DEFAULT_LAT, DEFAULT_LNG], OVERVIEW_ZOOM)

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, OpenStreetMap',
        maxZoom: 19,
      },
    ).addTo(map)

    mapRef.current = map

    let reverseTimer: number | null = null

    const onMoveStart = () => setMapMoving(true)
    const onMoveEnd = () => {
      setMapMoving(false)
      if (skipNextReverseRef.current) {
        skipNextReverseRef.current = false
        return
      }
      const currentMode = modeRef.current
      if (currentMode === 'search') return
      const atPin = latLngAtPin(map, currentMode)
      if (reverseTimer != null) window.clearTimeout(reverseTimer)
      reverseTimer = window.setTimeout(() => {
        void resolveFromMapCenter(atPin.lat, atPin.lng)
      }, REVERSE_DEBOUNCE_MS)
    }

    map.on('movestart', onMoveStart)
    map.on('moveend', onMoveEnd)
    map.on('zoomstart', onMoveStart)
    map.on('zoomend', onMoveEnd)

    // Align default overview under the pin + first reverse geocode
    requestAnimationFrame(() => {
      map.invalidateSize()
      panLatLngUnderPin(map, DEFAULT_LAT, DEFAULT_LNG, 'map', {
        animate: false,
        zoom: OVERVIEW_ZOOM,
      })
      void resolveFromMapCenter(DEFAULT_LAT, DEFAULT_LNG)
    })

    return () => {
      if (reverseTimer != null) window.clearTimeout(reverseTimer)
      map.off('movestart', onMoveStart)
      map.off('moveend', onMoveEnd)
      map.off('zoomstart', onMoveStart)
      map.off('zoomend', onMoveEnd)
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Geolocation: pan under pin + reverse
  useEffect(() => {
    if (geoTriedRef.current || !navigator.geolocation) return
    geoTriedRef.current = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })
        const map = mapRef.current
        if (map) {
          skipNextReverseRef.current = true
          // Still first visit — keep city overview until the user picks an address
          panLatLngUnderPin(map, lat, lng, modeRef.current === 'building' ? 'building' : 'map', {
            zoom: OVERVIEW_ZOOM,
          })
          void resolveFromMapCenter(lat, lng)
        }
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 5000 },
    )
  }, [])

  // When switching map ↔ building, re-align pin target and invalidate size
  useEffect(() => {
    if (mode !== 'building') setPreviewBuilding(null)
    const map = mapRef.current
    if (!map || !showMapChrome) return
    requestAnimationFrame(() => {
      map.invalidateSize()
      skipNextReverseRef.current = true
      panLatLngUnderPin(map, coords.lat, coords.lng, mode === 'building' ? 'building' : 'map', {
        // Building step = address already chosen → street level
        zoom: mode === 'building' ? STREET_ZOOM : map.getZoom(),
      })
    })
  }, [showMapChrome, mode])

  const pickResult = (item: GeoResult) => {
    applyLocation(item.lat, item.lng, item)
  }

  const useMapInstead = () => {
    const map = mapRef.current
    if (map) {
      const atPin = latLngAtPin(map, 'map')
      applyLocation(atPin.lat, atPin.lng, selected ?? undefined)
      return
    }
    applyLocation(coords.lat, coords.lng, selected ?? undefined)
  }

  const pickBuilding = (type: BuildingType) => {
    if (!inCoverage) return
    onBuildingSelected?.(place, type)
  }

  const showSuggestions = mode === 'search' && query.trim().length >= 2

  return (
    <div
      className={`screen address-locate address-locate--map${mode === 'search' && !searchLeaving ? ' is-searching' : ''}${mode === 'building' ? ' is-building' : ''}`}
    >
      <div
        ref={mapHostRef}
        className="address-locate__map"
        role="presentation"
        aria-hidden={(mode === 'search' && !searchLeaving) || undefined}
      />

      {showMapChrome ? (
        <>
          <div
            className={`address-locate__pin${mapMoving ? ' is-lifting' : ''}`}
            aria-hidden="true"
          >
            <img src={addressAsset(pinSrc)} alt="" width={44} height={51} draggable={false} />
          </div>

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

          {!inCoverage ? (
            <div className="address-locate__tooltip" role="status">
              <img src={addressAsset('pin-x.svg')} alt="" width={32} height={32} draggable={false} />
              <div className="address-locate__tooltip-copy">
                <p className="address-locate__tooltip-title">¡Fuera de cobertura!</p>
                <p className="address-locate__tooltip-sub">No realizamos salida en esta zona por ahora</p>
              </div>
            </div>
          ) : null}

          {mode === 'building' && inCoverage ? (
            <div className="address-locate__tooltip address-locate__tooltip--pickup" role="status">
              <span className="address-locate__tooltip-icon">
                <img src={addressAsset('dog.svg')} alt="" width={18} height={18} draggable={false} />
              </span>
              <div className="address-locate__tooltip-copy">
                <p className="address-locate__tooltip-addr">
                  {resolvingAddress ? 'Buscando dirección…' : place.label}
                </p>
                <p className="address-locate__tooltip-sub">Recogeremos a tu perro aquí</p>
              </div>
            </div>
          ) : null}

          {mode === 'building' && inCoverage ? (
            <div className="address-locate__sheet address-locate__sheet--building">
              <div className="address-locate__sheet-handle" aria-hidden="true" />
              <h2 className="address-locate__building-title display-title">Elige el tipo de edificio</h2>
              <p className="address-locate__building-lead">
                Esto permite que nuestros cuidadores sepan exactamente dónde ir a por tu perro
              </p>
              <div className="address-locate__building-grid">
                {BUILDING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`address-locate__building-card${
                      previewBuilding === opt.id ? ' is-preview' : ''
                    }`}
                    onPointerEnter={() => setPreviewBuilding(opt.id)}
                    onPointerLeave={() => setPreviewBuilding(null)}
                    onFocus={() => setPreviewBuilding(opt.id)}
                    onBlur={() => setPreviewBuilding(null)}
                    onClick={() => pickBuilding(opt.id)}
                  >
                    <img src={addressAsset(opt.icon)} alt="" width={24} height={24} draggable={false} />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : mode === 'map' ? (
            <div className="address-locate__sheet">
              <p className="address-locate__sheet-hint">
                ¿Tienes problemas para encontrar tu ubicación?{' '}
                <span>Intenta utilizar la búsqueda.</span>
              </p>
              <button
                type="button"
                className="address-locate__field address-locate__field--map address-locate__field--button"
                data-has-query={query.trim() ? 'true' : undefined}
                onClick={openSearch}
              >
                <img src={addressAsset('search.svg')} alt="" width={18} height={18} draggable={false} />
                <span className="address-locate__input address-locate__input--fake">
                  {resolvingAddress
                    ? 'Buscando dirección…'
                    : query.trim() || 'Buscar calle, ciudad o distrito...'}
                </span>
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {showSearchSheet ? (
        <div
          className={`address-locate__search-sheet${searchLeaving ? ' is-leaving' : ''}`}
          onAnimationEnd={onSearchSheetAnimationEnd}
        >
          <div className="address-locate__top">
            <button type="button" className="caregiver-back" aria-label="Volver" onClick={closeSearch}>
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
                ref={searchInputRef}
                className="address-locate__input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar calle, ciudad o distrito..."
                autoComplete="street-address"
                enterKeyHint="search"
              />
            </label>
          </div>

          <div className="address-locate__body">
            {error ? <p className="address-locate__error">{error}</p> : null}
            {searching ? <p className="address-locate__status">Buscando…</p> : null}

            {showSuggestions ? (
              <ul className="address-locate__results">
                {results.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="address-locate__result"
                      onClick={() => pickResult(item)}
                    >
                      <img
                        src={addressAsset('map-pin.svg')}
                        alt=""
                        width={24}
                        height={24}
                        draggable={false}
                      />
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
      ) : null}
    </div>
  )
}
