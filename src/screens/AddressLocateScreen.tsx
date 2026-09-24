import { useEffect, useRef, useState, type AnimationEvent } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  BUILDING_OPTIONS,
  buildingOption,
  type BuildingType,
  type SavedAddress,
} from '../data/savedAddress'
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
  /**
   * Glovo-style address book on the map (Figma / “¿Dónde pasamos por Luca?”).
   * When set, the map sheet lists saved addresses instead of the first-visit search field.
   */
  manageAddresses?: SavedAddress[] | null
  activeManageId?: string
  onSelectManageAddress?: (id: string) => void
  onEditManageAddress?: (address: SavedAddress) => void
  /** When adjusting a pin, center the map on this place (street zoom). */
  focusPlace?: LocatedPlace | null
  /** Building type for the pin glyph (edit / adjust flows). */
  pinBuildingType?: BuildingType
}

/** Screen Y ratio where the fixed pin tip sits. */
type PinLayout = AddressLocateMode | 'manage'

function pinScreenYRatio(layout: PinLayout) {
  if (layout === 'manage') return 0.24
  if (layout === 'building') return 0.32
  return 0.5
}

function pinScreenPoint(map: L.Map, layout: PinLayout) {
  const size = map.getSize()
  return L.point(size.x / 2, size.y * pinScreenYRatio(layout))
}

/** Pan so `latlng` sits under the fixed center pin. */
function panLatLngUnderPin(
  map: L.Map,
  lat: number,
  lng: number,
  layout: PinLayout,
  opts?: { animate?: boolean; zoom?: number },
) {
  const animate = opts?.animate !== false
  const zoom = opts?.zoom ?? map.getZoom()
  const latlng = L.latLng(lat, lng)
  map.setView(latlng, zoom, { animate: false })
  const desired = pinScreenPoint(map, layout)
  const current = map.latLngToContainerPoint(latlng)
  map.panBy([current.x - desired.x, current.y - desired.y], {
    animate,
    duration: animate ? 0.35 : 0,
  })
}

function latLngAtPin(map: L.Map, layout: PinLayout) {
  return map.containerPointToLatLng(pinScreenPoint(map, layout === 'building' ? 'building' : 'map'))
}

export function AddressLocateScreen({
  mode: modeProp,
  onBack,
  onModeChange,
  onBuildingSelected,
  manageAddresses = null,
  activeManageId = '',
  onSelectManageAddress,
  onEditManageAddress,
  focusPlace = null,
  pinBuildingType = 'casa',
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
  /** After “Añadir una nueva dirección”, keep the pick flow (search/building) until manage ends. */
  const [startedAddFromManage, setStartedAddFromManage] = useState(false)
  const [listOverflow, setListOverflow] = useState({ top: false, bottom: false })

  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const reverseAbortRef = useRef<AbortController | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const manageListRef = useRef<HTMLDivElement | null>(null)
  const geoTriedRef = useRef(false)
  /** Programmatic pans may fire several moveends — skip that many reverse lookups. */
  const skipReverseCountRef = useRef(0)
  const modeRef = useRef<AddressLocateMode>('map')
  const manageActiveRef = useRef<SavedAddress | null>(null)
  const focusPlaceRef = useRef(focusPlace)
  focusPlaceRef.current = focusPlace

  const armSkipReverse = (count = 1) => {
    skipReverseCountRef.current += count
  }

  const mode = modeProp ?? internalMode
  modeRef.current = mode
  const showSearchSheet = mode === 'search' || searchLeaving
  const showMapChrome = mode === 'map' || mode === 'building'
  const managing = Boolean(manageAddresses)
  const activeManaged =
    manageAddresses?.find((item) => item.id === activeManageId) ?? manageAddresses?.[0] ?? null
  manageActiveRef.current = activeManaged
  const showManageSheet = managing && mode === 'map' && !startedAddFromManage
  const inCoverage = isInCoverage(coords.lat, coords.lng)
  /** In-coverage map uses the building pin + pickup tag (Figma map / building frames). */
  const pinKind = !inCoverage ? 'out' : 'building'
  const pinSrc =
    pinKind === 'out'
      ? 'pin-marker.svg'
      : buildingOption(
          showManageSheet
            ? (activeManaged?.buildingType ?? 'casa')
            : (previewBuilding ?? pinBuildingType),
        ).pin

  const place: LocatedPlace = {
    label: selected?.label || query.trim() || 'Ubicación seleccionada',
    secondary: selected?.secondary || '',
    lat: coords.lat,
    lng: coords.lng,
  }
  /** Dog pickup tag whenever the map pin is used to place / review an address. */
  const showPickupTooltip = inCoverage && showMapChrome
  const showOutTooltip = !inCoverage && showMapChrome

  const setMode = (next: AddressLocateMode) => {
    onModeChange?.(next)
    if (modeProp === undefined) setInternalMode(next)
  }

  const openSearch = () => {
    setSearchLeaving(false)
    setMode('search')
  }

  const startAddFromManage = () => {
    setStartedAddFromManage(true)
    openSearch()
  }

  const closeSearch = () => {
    if (searchLeaving) return
    setSearchLeaving(true)
  }

  const onSearchSheetAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    if (!searchLeaving) return
    setSearchLeaving(false)
    // Cancelled search while managing addresses → return to manage sheet.
    if (managing) setStartedAddFromManage(false)
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
    armSkipReverse()
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
    if (!managing) setStartedAddFromManage(false)
  }, [managing])

  // Center map on the active saved address while the manage sheet is visible.
  useEffect(() => {
    if (!showManageSheet || !activeManaged) return
    setCoords({ lat: activeManaged.lat, lng: activeManaged.lng })
    setSelected({
      id: `saved-${activeManaged.id}`,
      label: activeManaged.label,
      secondary: activeManaged.secondary,
      lat: activeManaged.lat,
      lng: activeManaged.lng,
    })
    setQuery(activeManaged.label)

    let cancelled = false
    const tryPan = () => {
      const map = mapRef.current
      if (!map) return false
      skipReverseCountRef.current += 1
      map.invalidateSize()
      panLatLngUnderPin(map, activeManaged.lat, activeManaged.lng, 'manage', {
        zoom: STREET_ZOOM,
        animate: true,
      })
      return true
    }
    if (tryPan()) return
    const id = window.setInterval(() => {
      if (cancelled) return
      if (tryPan()) window.clearInterval(id)
    }, 40)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [showManageSheet, activeManaged?.id, activeManaged?.lat, activeManaged?.lng])

  // Lock panning while reviewing the current address on the manage sheet.
  useEffect(() => {
    let cancelled = false
    const apply = () => {
      const map = mapRef.current
      if (!map) return false
      if (showManageSheet) {
        map.dragging.disable()
        map.touchZoom.disable()
        map.scrollWheelZoom.disable()
        map.doubleClickZoom.disable()
      } else {
        map.dragging.enable()
        map.touchZoom.enable()
        map.scrollWheelZoom.enable()
        map.doubleClickZoom.enable()
      }
      return true
    }
    if (apply()) return
    const id = window.setInterval(() => {
      if (cancelled) return
      if (apply()) window.clearInterval(id)
    }, 40)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [showManageSheet])

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
      if (skipReverseCountRef.current > 0) {
        skipReverseCountRef.current -= 1
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
      const saved = manageActiveRef.current
      const focused = focusPlaceRef.current
      if (saved) {
        skipReverseCountRef.current += 1
        panLatLngUnderPin(map, saved.lat, saved.lng, 'manage', {
          animate: false,
          zoom: STREET_ZOOM,
        })
        map.dragging.disable()
        map.touchZoom.disable()
        map.scrollWheelZoom.disable()
        map.doubleClickZoom.disable()
        return
      }
      if (focused) {
        skipReverseCountRef.current += 1
        panLatLngUnderPin(map, focused.lat, focused.lng, 'map', {
          animate: false,
          zoom: STREET_ZOOM,
        })
        return
      }
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

  // Geolocation: pan under pin + reverse (skip when opening on a saved / focused address).
  useEffect(() => {
    if (geoTriedRef.current || !navigator.geolocation) return
    if (managing || focusPlace) {
      geoTriedRef.current = true
      return
    }
    geoTriedRef.current = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Adjust-pin / saved focus arrived while the GPS request was in flight.
        if (focusPlaceRef.current || manageActiveRef.current) return
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })
        const map = mapRef.current
        if (map) {
          skipReverseCountRef.current += 1
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
  }, [managing, focusPlace])

  // When switching map ↔ building (or manage), re-align pin target and invalidate size
  useEffect(() => {
    if (mode !== 'building') setPreviewBuilding(null)
    const map = mapRef.current
    if (!map || !showMapChrome) return
    const layout: PinLayout = showManageSheet
      ? 'manage'
      : mode === 'building'
        ? 'building'
        : 'map'
    const targetLat = focusPlace?.lat ?? coords.lat
    const targetLng = focusPlace?.lng ?? coords.lng
    requestAnimationFrame(() => {
      map.invalidateSize()
      skipReverseCountRef.current += 1
      panLatLngUnderPin(map, targetLat, targetLng, layout, {
        // Building / manage / adjust = address already chosen → street level
        zoom:
          mode === 'building' || showManageSheet || focusPlace ? STREET_ZOOM : map.getZoom(),
      })
    })
  }, [showMapChrome, mode, showManageSheet, focusPlace?.lat, focusPlace?.lng])

  // Center map when adjusting an existing pin (not in the manage address book sheet).
  useEffect(() => {
    if (!focusPlace || showManageSheet || mode === 'search') return

    // Cancel any in-flight reverse that would overwrite the preloaded address.
    reverseAbortRef.current?.abort()
    setResolvingAddress(false)
    setCoords({ lat: focusPlace.lat, lng: focusPlace.lng })
    setSelected({
      id: `focus-${focusPlace.lat},${focusPlace.lng}`,
      label: focusPlace.label,
      secondary: focusPlace.secondary,
      lat: focusPlace.lat,
      lng: focusPlace.lng,
    })
    setQuery(focusPlace.label)

    let cancelled = false
    const tryPan = () => {
      const map = mapRef.current
      if (!map) return false
      skipReverseCountRef.current += 2
      map.invalidateSize()
      panLatLngUnderPin(map, focusPlace.lat, focusPlace.lng, mode === 'building' ? 'building' : 'map', {
        zoom: STREET_ZOOM,
        animate: false,
      })
      return true
    }
    if (tryPan()) return
    const id = window.setInterval(() => {
      if (cancelled) return
      if (tryPan()) window.clearInterval(id)
    }, 40)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [focusPlace?.lat, focusPlace?.lng, focusPlace?.label, focusPlace?.secondary, showManageSheet, mode])

  // Soft edge lines when the address list can scroll further.
  useEffect(() => {
    if (!showManageSheet) {
      setListOverflow({ top: false, bottom: false })
      return
    }
    const el = manageListRef.current
    if (!el) return

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      setListOverflow({
        top: scrollTop > 2,
        bottom: scrollTop + clientHeight < scrollHeight - 2,
      })
    }
    const id = requestAnimationFrame(update)
    el.addEventListener('scroll', update, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(el)
    return () => {
      cancelAnimationFrame(id)
      el.removeEventListener('scroll', update)
      ro?.disconnect()
    }
  }, [showManageSheet, manageAddresses?.length, activeManageId])

  // Pointer-drag scroll for the address list (scrollbar stays hidden).
  useEffect(() => {
    if (!showManageSheet) return
    const el = manageListRef.current
    if (!el) return

    let dragging = false
    let captured = false
    let pointerId: number | null = null
    let startY = 0
    let startScroll = 0
    let moved = false

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      // Let edit / pick buttons receive a normal click unless the user actually drags.
      if ((e.target as Element | null)?.closest?.('button')) {
        const isPick = (e.target as Element).closest('.address-locate__manage-pick')
        const isEdit = (e.target as Element).closest('.address-locate__manage-edit')
        if (isEdit) return
        // Allow drag to start from the pick row, but don't capture until we move.
        if (!isPick) return
      }
      dragging = true
      captured = false
      moved = false
      pointerId = e.pointerId
      startY = e.clientY
      startScroll = el.scrollTop
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pointerId) return
      const dy = e.clientY - startY
      if (Math.abs(dy) <= 8) return
      if (!moved) {
        moved = true
        try {
          el.setPointerCapture(e.pointerId)
          captured = true
        } catch {
          /* ignore */
        }
      }
      el.scrollTop = startScroll - dy
      e.preventDefault()
    }

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      dragging = false
      pointerId = null
      if (captured) {
        try {
          el.releasePointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
        captured = false
      }
      if (moved) {
        // Suppress the click that would select an address after a drag.
        const suppress = (ev: Event) => {
          ev.preventDefault()
          ev.stopPropagation()
          el.removeEventListener('click', suppress, true)
        }
        el.addEventListener('click', suppress, true)
      }
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
  }, [showManageSheet, manageAddresses?.length])

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
  const manageList = (() => {
    const items = manageAddresses ?? []
    if (!items.length) return items
    const current = items.find((item) => item.id === activeManageId) ?? items[0]!
    const rest = items.filter((item) => item.id !== current.id)
    return [current, ...rest]
  })()

  return (
    <div
      className={`screen address-locate address-locate--map${mode === 'search' && !searchLeaving ? ' is-searching' : ''}${mode === 'building' ? ' is-building' : ''}${showManageSheet ? ' is-manage' : ''}`}
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
          >
            {showOutTooltip ? (
              <div className="address-locate__tooltip" role="status">
                <img
                  src={addressAsset('pin-x.svg')}
                  alt=""
                  width={32}
                  height={32}
                  draggable={false}
                />
                <div className="address-locate__tooltip-copy">
                  <p className="address-locate__tooltip-title">¡Fuera de cobertura!</p>
                  <p className="address-locate__tooltip-sub">
                    No realizamos salida en esta zona por ahora
                  </p>
                </div>
              </div>
            ) : null}
            {showPickupTooltip ? (
              <div className="address-locate__tooltip address-locate__tooltip--pickup" role="status">
                <span className="address-locate__tooltip-icon">
                  <img
                    src={addressAsset('dog.svg')}
                    alt=""
                    width={18}
                    height={18}
                    draggable={false}
                  />
                </span>
                <div className="address-locate__tooltip-copy">
                  {resolvingAddress ? (
                    <span className="address-locate__tooltip-skeleton" aria-hidden="true" />
                  ) : (
                    <p className="address-locate__tooltip-addr">{place.label}</p>
                  )}
                  <p className="address-locate__tooltip-sub">Recogeremos a tu perro aquí</p>
                </div>
              </div>
            ) : null}
            <img
              className="address-locate__pin-glyph"
              src={addressAsset(pinSrc)}
              alt=""
              width={44}
              height={51}
              draggable={false}
              aria-hidden="true"
            />
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
          ) : showManageSheet ? (
            <div className="address-locate__sheet address-locate__sheet--manage">
              <div className="address-locate__sheet-handle" aria-hidden="true" />
              <div className="address-locate__manage-body">
                <h2 className="address-locate__manage-title display-title">
                  ¿Dónde pasamos por Luca?
                </h2>
                <div
                  className={`address-locate__manage-scroll${listOverflow.top ? ' has-top' : ''}${listOverflow.bottom ? ' has-bottom' : ''}`}
                >
                  <div ref={manageListRef} className="address-locate__manage-scroller">
                    <ul className="address-locate__manage-list" aria-label="Direcciones guardadas">
                      {manageList.map((item) => {
                        const isCurrent = item.id === activeManaged?.id
                        const detailParts = [item.floor.trim(), item.door.trim()].filter(Boolean)
                        const detail =
                          detailParts.length > 0
                            ? detailParts.join(', ')
                            : item.secondary.trim() || null
                        return (
                          <li key={item.id}>
                            <div
                              className={`address-locate__manage-row${isCurrent ? ' is-current' : ''}`}
                            >
                              <button
                                type="button"
                                className="address-locate__manage-pick"
                                onClick={() => onSelectManageAddress?.(item.id)}
                              >
                                <img
                                  src={addressAsset(buildingOption(item.buildingType).icon)}
                                  alt=""
                                  width={24}
                                  height={24}
                                  draggable={false}
                                />
                                <span className="address-locate__manage-copy">
                                  <span className="address-locate__manage-tag">
                                    {isCurrent ? `${item.tag} (Ubicación actual)` : item.tag}
                                  </span>
                                  <span className="address-locate__manage-addr">
                                    {item.label}
                                    {detail ? ` · ${detail}` : ''}
                                  </span>
                                </span>
                              </button>
                              <button
                                type="button"
                                className="address-locate__manage-edit"
                                aria-label={`Editar ${item.tag}`}
                                onClick={() => onEditManageAddress?.(item)}
                              >
                                <img
                                  src={addressAsset('square-pen.svg')}
                                  alt=""
                                  width={40}
                                  height={40}
                                  draggable={false}
                                />
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="address-locate__add-cta"
                onClick={startAddFromManage}
              >
                Añadir una nueva dirección
              </button>
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
