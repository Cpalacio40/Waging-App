import { useEffect, useRef, useState, type AnimationEvent } from 'react'
import { CAREGIVERS, findCaregiver, type Caregiver } from '../data/caregivers'
import {
  loadSavedAddress,
  saveAddress,
  type BuildingType,
  type SavedAddress,
} from '../data/savedAddress'
import type { SearchPhase } from '../data/screens'
import { useDragScroll } from '../hooks/useDragScroll'
import { assetUrl } from '../utils/assetUrl'
import { AddressDetailsScreen } from './AddressDetailsScreen'
import { AddressLocateScreen, type LocatedPlace } from './AddressLocateScreen'
import { CaregiverProfileScreen } from './CaregiverProfileScreen'
import './screens.css'

const caregiverAsset = (name: string) => assetUrl(`caregiver/${name}`)
const SEARCH_DELAY_MS = 2000
const SKELETON_COUNT = 3
/** Gap above a focused result card (clears the sticky nav banner). */
const CARD_TOP_INSET_PX = 128

const DEMO_PLACE: LocatedPlace = {
  label: 'Carrer Petrarca 42',
  secondary: 'Barcelona, España',
  lat: 41.4036,
  lng: 2.1744,
}

type CaregiverSearchOverlay = 'none' | 'profile' | 'calendar'

type CaregiverSearchScreenProps = {
  onBack?: () => void
  phase?: SearchPhase
  overlay?: CaregiverSearchOverlay
  caregiverId?: string
  onPhaseChange?: (phase: SearchPhase) => void
  onOpenProfile?: (caregiverId: string) => void
  onCloseProfile?: () => void
  onOpenCalendar?: () => void
  onCloseCalendar?: () => void
}

function CaregiverCardSkeleton() {
  return (
    <li className="caregiver-card caregiver-card--skeleton" aria-hidden="true">
      <div className="caregiver-card__hero caregiver-card__hero--skeleton">
        <span className="caregiver-skeleton caregiver-skeleton--badge" />
        <div className="caregiver-card__copy caregiver-card__copy--skeleton">
          <span className="caregiver-skeleton caregiver-skeleton--name" />
          <span className="caregiver-skeleton caregiver-skeleton--specialty" />
        </div>
      </div>
      <div className="caregiver-card__bio caregiver-card__bio--skeleton">
        <span className="caregiver-skeleton caregiver-skeleton--line" />
        <span className="caregiver-skeleton caregiver-skeleton--line caregiver-skeleton--line-short" />
      </div>
    </li>
  )
}

function locateModeFromPhase(phase: SearchPhase) {
  if (phase === 'building') return 'building' as const
  if (phase === 'locate' || phase === 'idle') return 'search' as const
  return 'map' as const
}

function isLocatePhase(phase: SearchPhase) {
  return phase === 'locate' || phase === 'map' || phase === 'building' || phase === 'idle'
}

/** First-run address gate + caregiver cards — Figma 3.1 address workflow. */
export function CaregiverSearchScreen({
  onBack,
  phase: phaseProp,
  overlay: overlayProp,
  caregiverId,
  onPhaseChange,
  onOpenProfile,
  onCloseProfile,
  onOpenCalendar,
  onCloseCalendar,
}: CaregiverSearchScreenProps) {
  const [internalPhase, setInternalPhase] = useState<SearchPhase>(() =>
    loadSavedAddress() ? 'results' : 'map',
  )
  const [draftPlace, setDraftPlace] = useState<LocatedPlace | null>(null)
  const [buildingType, setBuildingType] = useState<BuildingType>('casa')
  const [selected, setSelected] = useState<Caregiver | null>(() =>
    overlayProp === 'profile' || overlayProp === 'calendar' ? findCaregiver(caregiverId) : null,
  )
  const [profileOpen, setProfileOpen] = useState(
    () => overlayProp === 'profile' || overlayProp === 'calendar',
  )
  /** Panel sliding out to the right before the phase actually changes. */
  const [leavingPanel, setLeavingPanel] = useState<'details' | 'list' | null>(null)
  /** Where details should land after its leave animation. */
  const [leavingDetailsTo, setLeavingDetailsTo] = useState<'building' | 'map'>('building')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phase = phaseProp ?? internalPhase
  const overlay = overlayProp ?? (profileOpen ? 'profile' : 'none')
  const locating = isLocatePhase(phase)
  const showList = phase === 'loading' || phase === 'results' || leavingPanel === 'list'
  const showDetails =
    phase === 'details' || leavingPanel === 'details' || (showList && Boolean(draftPlace))
  const showLocate = locating || phase === 'details' || leavingPanel === 'details'
  const dragScroll = useDragScroll({
    enabled: (phase === 'loading' || phase === 'results') && leavingPanel !== 'list',
    ignoreSelector: 'a, input, textarea, .caregiver-back, .caregiver-cta',
  })

  const setPhase = (next: SearchPhase) => {
    onPhaseChange?.(next)
    if (phaseProp === undefined) setInternalPhase(next)
  }

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'loading' && searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
      searchTimerRef.current = null
    }
  }, [phase])

  // Navigator shortcuts: seed demo place for building/details jumps.
  useEffect(() => {
    if ((phase === 'building' || phase === 'details') && !draftPlace) {
      setDraftPlace(DEMO_PLACE)
    }
  }, [phase, draftPlace])

  useEffect(() => {
    const wantsProfile = overlay === 'profile' || overlay === 'calendar'
    if (wantsProfile) {
      setSelected(findCaregiver(caregiverId))
      setProfileOpen(true)
      return
    }
    setProfileOpen(false)
  }, [overlay, caregiverId])

  // Clear leave flag if phase jumps via navigator.
  useEffect(() => {
    if (phase === 'details' && leavingPanel === 'details') setLeavingPanel(null)
    if ((phase === 'loading' || phase === 'results') && leavingPanel === 'list') setLeavingPanel(null)
    if (isLocatePhase(phase) && leavingPanel === 'list') setLeavingPanel(null)
  }, [phase, leavingPanel])

  const startCaregiverSearch = () => {
    if (phase === 'loading') return
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    setLeavingPanel(null)
    setPhase('loading')
    searchTimerRef.current = setTimeout(() => {
      setPhase('results')
      searchTimerRef.current = null
    }, SEARCH_DELAY_MS)
  }

  const onBuildingSelected = (place: LocatedPlace, type: BuildingType) => {
    setDraftPlace(place)
    setBuildingType(type)
    setLeavingPanel(null)
    setPhase('details')
  }

  const onSaveAddress = (address: SavedAddress) => {
    saveAddress(address)
    startCaregiverSearch()
  }

  const openProfile = (caregiver: Caregiver) => {
    if (dragScroll.consumeClickSuppression()) return
    setSelected(caregiver)
    setProfileOpen(true)
    onOpenProfile?.(caregiver.id)
  }

  const alignToSelectedCard = () => {
    if (!selected) return
    const card = dragScroll.contentRef.current?.querySelector<HTMLElement>(
      `[data-caregiver-id="${selected.id}"]`,
    )
    if (!card) return
    const isLast = selected.id === CAREGIVERS[CAREGIVERS.length - 1]?.id
    if (isLast) {
      dragScroll.scrollToElement(card, 'end')
    } else {
      dragScroll.scrollToElement(card, 'start', CARD_TOP_INSET_PX)
    }
  }

  const closeProfile = () => {
    alignToSelectedCard()
    setProfileOpen(false)
    onCloseProfile?.()
  }

  const onProfileOpened = () => {
    alignToSelectedCard()
  }

  const onProfileClosed = () => {
    setSelected(null)
  }

  const requestDetailsBack = () => {
    if (leavingPanel) return
    setLeavingDetailsTo('building')
    setLeavingPanel('details')
  }

  const requestAdjustPin = () => {
    if (leavingPanel) return
    setLeavingDetailsTo('map')
    setLeavingPanel('details')
  }

  const requestListBack = () => {
    if (leavingPanel) return
    if (loadSavedAddress()) {
      onBack?.()
      return
    }
    setLeavingPanel('list')
  }

  const onPushPanelAnimationEnd = (panel: 'details' | 'list', e: AnimationEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return
    if (leavingPanel !== panel) return
    if (!e.animationName.includes('flow-out-right')) return
    setLeavingPanel(null)
    if (panel === 'details') setPhase(leavingDetailsTo)
    else setPhase('map')
  }

  const place = draftPlace ?? DEMO_PLACE
  const listActive = phase === 'loading' || phase === 'results'

  return (
    <div className="caregiver-flow">
      {showLocate ? (
        <div
          className={`caregiver-flow__base${showDetails ? ' is-covered' : ''}`}
          aria-hidden={showDetails || undefined}
          inert={showDetails ? true : undefined}
        >
          <AddressLocateScreen
            mode={locateModeFromPhase(isLocatePhase(phase) ? phase : 'building')}
            onBack={() => {
              if (phase === 'building') setPhase('map')
              else if (phase === 'locate') setPhase('map')
              else onBack?.()
            }}
            onModeChange={(next) => {
              if (next === 'search') setPhase('locate')
              else setPhase(next)
            }}
            onBuildingSelected={onBuildingSelected}
          />
        </div>
      ) : null}

      {showDetails ? (
        <div
          className={`caregiver-flow__push${leavingPanel === 'details' ? ' is-leaving' : ''}`}
          onAnimationEnd={(e) => onPushPanelAnimationEnd('details', e)}
        >
          <AddressDetailsScreen
            place={place}
            buildingType={buildingType}
            onBack={requestDetailsBack}
            onAdjustPin={requestAdjustPin}
            onSave={onSaveAddress}
          />
        </div>
      ) : null}

      {showList ? (
        <div
          className={`caregiver-flow__push${leavingPanel === 'list' ? ' is-leaving' : ''}`}
          onAnimationEnd={(e) => onPushPanelAnimationEnd('list', e)}
        >
          <div className={`screen caregiver-search${listActive ? ' is-scrollable' : ''}`}>
            <header className={`caregiver-nav${dragScroll.scrolled ? ' is-scrolled' : ''}`}>
              <button
                type="button"
                className="caregiver-back"
                aria-label="Volver"
                onClick={requestListBack}
              >
                <img
                  src={caregiverAsset('arrow-left.svg')}
                  alt=""
                  width={32}
                  height={32}
                  draggable={false}
                />
              </button>
            </header>

            <div
              ref={dragScroll.ref}
              className={`caregiver-search__scroller${dragScroll.dragging ? ' is-dragging' : ''}`}
              {...dragScroll.scrollerProps}
              aria-hidden={Boolean(selected) || undefined}
              inert={selected ? true : undefined}
            >
              <div ref={dragScroll.contentRef} className="caregiver-search__scroll-content">
                <div className="caregiver-nav-spacer" aria-hidden="true" />

                <div className="caregiver-search__content">
                  <p className="caregiver-search__lead">
                    El cuidador correcto hace la diferencia entre un paseo y una salida que enriquece
                  </p>

                  {phase === 'loading' ? (
                    <ul
                      className="caregiver-search__results"
                      aria-busy="true"
                      aria-label="Buscando cuidadores"
                    >
                      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                        <CaregiverCardSkeleton key={i} />
                      ))}
                    </ul>
                  ) : null}

                  {phase === 'results' || leavingPanel === 'list' ? (
                    <ul className="caregiver-search__results">
                      {CAREGIVERS.map((caregiver) => (
                        <li key={caregiver.id}>
                          <button
                            type="button"
                            className="caregiver-card caregiver-card--button"
                            data-caregiver-id={caregiver.id}
                            onClick={() => openProfile(caregiver)}
                          >
                            <div className="caregiver-card__hero">
                              <img
                                className={`caregiver-card__photo caregiver-card__photo--${caregiver.id}`}
                                src={caregiverAsset(caregiver.photo)}
                                alt=""
                                draggable={false}
                              />
                              <div className="caregiver-card__scrim" aria-hidden="true" />
                              <span className="caregiver-card__badge">{caregiver.badge}</span>
                              <div className="caregiver-card__copy">
                                <h2 className="caregiver-card__name display-title">{caregiver.name}</h2>
                                <p className="caregiver-card__specialty">{caregiver.specialty}</p>
                              </div>
                            </div>
                            <p className="caregiver-card__bio">{caregiver.bio}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>

            {selected ? (
              <CaregiverProfileScreen
                caregiver={selected}
                open={profileOpen}
                showCalendar={overlay === 'calendar'}
                onBack={closeProfile}
                onOpened={onProfileOpened}
                onClosed={onProfileClosed}
                onShowCalendar={onOpenCalendar}
                onHideCalendar={onCloseCalendar}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
