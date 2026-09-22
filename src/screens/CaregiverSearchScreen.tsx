import { useEffect, useRef, useState } from 'react'
import { CAREGIVERS, findCaregiver, type Caregiver } from '../data/caregivers'
import type { SearchPhase } from '../data/screens'
import { useDragScroll } from '../hooks/useDragScroll'
import { assetUrl } from '../utils/assetUrl'
import { AddressLocateScreen } from './AddressLocateScreen'
import { CaregiverProfileScreen } from './CaregiverProfileScreen'
import './screens.css'

const caregiverAsset = (name: string) => assetUrl(`caregiver/${name}`)
const SEARCH_DELAY_MS = 2000
const SKELETON_COUNT = 3
/** Gap above a focused result card (clears the sticky nav banner). */
const CARD_TOP_INSET_PX = 128

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

/** Address search + caregiver cards — Figma 164:6857 / 120:6900. */
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
  const [internalPhase, setInternalPhase] = useState<SearchPhase>('locate')
  const [selected, setSelected] = useState<Caregiver | null>(() =>
    overlayProp === 'profile' || overlayProp === 'calendar' ? findCaregiver(caregiverId) : null,
  )
  const [profileOpen, setProfileOpen] = useState(
    () => overlayProp === 'profile' || overlayProp === 'calendar',
  )
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phase = phaseProp ?? internalPhase
  const overlay = overlayProp ?? (profileOpen ? 'profile' : 'none')
  const locating = phase === 'locate' || phase === 'map' || phase === 'idle'
  const showList = phase === 'loading' || phase === 'results'
  // Keep scroll enabled while the profile covers the list so opening doesn't
  // jump the list mid-slide (we re-align to the clicked card after open).
  const dragScroll = useDragScroll({
    enabled: showList,
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

  useEffect(() => {
    const wantsProfile = overlay === 'profile' || overlay === 'calendar'
    if (wantsProfile) {
      setSelected(findCaregiver(caregiverId))
      setProfileOpen(true)
      return
    }
    setProfileOpen(false)
  }, [overlay, caregiverId])

  const startCaregiverSearch = () => {
    if (phase === 'loading') return
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    setPhase('loading')
    searchTimerRef.current = setTimeout(() => {
      setPhase('results')
      searchTimerRef.current = null
    }, SEARCH_DELAY_MS)
  }

  const onAddressConfirmed = () => {
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
    // Last card stays at the bottom (shows previous ones); others pin near the top.
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

  if (locating) {
    return (
      <AddressLocateScreen
        mode={phase === 'map' ? 'map' : 'search'}
        onBack={() => {
          if (phase === 'map') setPhase('locate')
          else onBack?.()
        }}
        onModeChange={(next) => setPhase(next === 'map' ? 'map' : 'locate')}
        onConfirm={onAddressConfirmed}
      />
    )
  }

  return (
    <div className={`screen caregiver-search${showList ? ' is-scrollable' : ''}`}>
      <header className={`caregiver-nav${dragScroll.scrolled ? ' is-scrolled' : ''}`}>
        <button type="button" className="caregiver-back" aria-label="Volver" onClick={onBack}>
          <img src={caregiverAsset('arrow-left.svg')} alt="" width={32} height={32} draggable={false} />
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
              <ul className="caregiver-search__results" aria-busy="true" aria-label="Buscando cuidadores">
                {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                  <CaregiverCardSkeleton key={i} />
                ))}
              </ul>
            ) : null}

            {phase === 'results' ? (
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
  )
}
