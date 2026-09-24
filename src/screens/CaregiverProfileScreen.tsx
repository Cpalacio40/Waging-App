import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type TransitionEvent,
} from 'react'
import { Play } from 'lucide-react'
import type { Caregiver, CaregiverReview } from '../data/caregivers'
import { useDragScroll } from '../hooks/useDragScroll'
import { useHorizontalDragScroll } from '../hooks/useHorizontalDragScroll'
import { assetUrl } from '../utils/assetUrl'
import { CaregiverCalendarScreen } from './CaregiverCalendarScreen'
import './screens.css'

const caregiverAsset = (name: string) => assetUrl(`caregiver/${name}`)
const profileAsset = (name: string) => assetUrl(`caregiver/profile/${name}`)

/** Matches .caregiver-profile__top / default caregiver-nav surfaces. */
const NAV_SURFACE_MUTED = '#f3f3f3'
const NAV_SURFACE_DEFAULT = '#fcfcfc'

const SESSION_ICON: Record<Caregiver['sessions'][number]['icon'], string> = {
  clipboard: 'icon-clipboard.svg',
  chart: 'icon-chart.svg',
  hourglass: 'icon-hourglass.svg',
}

function shuffleReviews<T>(items: readonly T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function reviewKey(review: CaregiverReview) {
  return `${review.owner}-${review.date}`
}

/** Matches .caregiver-review__text line-height × 4 lines. */
const REVIEW_TEXT_COLLAPSED_PX = 56

type ReviewTextProps = {
  text: string
  /** Bump to snap every card back to the clamped state. */
  resetKey: number
}

function ReviewText({ text, resetKey }: ReviewTextProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  /** Inline height while animating; null lets CSS classes own max-height. */
  const [maxHeight, setMaxHeight] = useState<number | null>(null)
  /** Line-clamp/ellipsis only when fully collapsed (not mid-animation). */
  const [ellipsis, setEllipsis] = useState(true)

  const measureFullHeight = useCallback(() => {
    const el = ref.current
    if (!el) return REVIEW_TEXT_COLLAPSED_PX
    const prevMax = el.style.maxHeight
    const prevClamp = el.style.webkitLineClamp
    const prevDisplay = el.style.display
    el.style.maxHeight = 'none'
    el.style.webkitLineClamp = 'unset'
    el.style.display = 'block'
    const full = el.scrollHeight
    el.style.maxHeight = prevMax
    el.style.webkitLineClamp = prevClamp
    el.style.display = prevDisplay
    return full
  }, [])

  useLayoutEffect(() => {
    setExpanded(false)
    setEllipsis(true)
    setMaxHeight(null)
    const full = measureFullHeight()
    setOverflows(full > REVIEW_TEXT_COLLAPSED_PX + 1)
  }, [text, resetKey, measureFullHeight])

  const toggle = () => {
    if (!overflows) return
    const el = ref.current
    if (!el) return

    if (expanded) {
      // Collapse: lock current height, then ease down to 4 lines.
      const full = el.scrollHeight
      setEllipsis(false)
      setMaxHeight(full)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setExpanded(false)
          setMaxHeight(REVIEW_TEXT_COLLAPSED_PX)
        })
      })
      return
    }

    // Expand: drop ellipsis at collapsed height, then ease up to full.
    setEllipsis(false)
    setMaxHeight(REVIEW_TEXT_COLLAPSED_PX)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setExpanded(true)
        setMaxHeight(measureFullHeight())
      })
    })
  }

  const onTransitionEnd = (event: TransitionEvent<HTMLParagraphElement>) => {
    if (event.propertyName !== 'max-height') return
    if (expanded) return
    setEllipsis(true)
    setMaxHeight(null)
  }

  return (
    <p
      ref={ref}
      className={[
        'caregiver-review__text',
        overflows ? 'is-toggleable' : '',
        overflows && ellipsis && !expanded ? 'is-clamped' : '',
        expanded ? 'is-expanded' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={maxHeight != null ? { maxHeight } : undefined}
      onClick={toggle}
      onTransitionEnd={onTransitionEnd}
      onKeyDown={
        overflows
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                toggle()
              }
            }
          : undefined
      }
      role={overflows ? 'button' : undefined}
      tabIndex={overflows ? 0 : undefined}
      aria-expanded={overflows ? expanded : undefined}
    >
      {text}
    </p>
  )
}

type ReviewMediaProps = {
  review: CaregiverReview
  playing: boolean
  onPlay: () => void
  onPause: () => void
  videoRef: (el: HTMLVideoElement | null) => void
}

function ReviewMedia({ review, playing, onPlay, onPause, videoRef }: ReviewMediaProps) {
  const [showCover, setShowCover] = useState(true)
  const [activated, setActivated] = useState(false)
  const [wantPlay, setWantPlay] = useState(false)

  useEffect(() => {
    if (!activated || !wantPlay) return
    setWantPlay(false)
    onPlay()
  }, [activated, wantPlay, onPlay])

  if (!review.video) {
    return (
      <div className="caregiver-review__photo">
        <img src={profileAsset(review.photo)} alt="" draggable={false} />
      </div>
    )
  }

  return (
    <div
      className={[
        'caregiver-review__photo',
        'caregiver-review__photo--video',
        playing ? 'is-playing' : '',
        showCover ? '' : 'has-frame',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {activated ? (
        <video
          ref={videoRef}
          className="caregiver-review__media"
          src={profileAsset(review.video)}
          style={{ objectPosition: review.objectPosition }}
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden
          onPlaying={() => setShowCover(false)}
          onClick={() => {
            if (playing) onPause()
          }}
        />
      ) : null}
      {showCover ? (
        <img
          className="caregiver-review__media caregiver-review__cover"
          src={profileAsset(review.photo)}
          alt=""
          draggable={false}
        />
      ) : null}
      {!playing ? (
        <button
          type="button"
          className="caregiver-review__play"
          aria-label="Reproducir vídeo"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            setActivated(true)
            setWantPlay(true)
          }}
        >
          <Play size={22} strokeWidth={2.25} fill="currentColor" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}

type CaregiverProfileScreenProps = {
  caregiver: Caregiver
  open: boolean
  showCalendar?: boolean
  onBack: () => void
  onOpened?: () => void
  onClosed: () => void
  onShowCalendar?: () => void
  onHideCalendar?: () => void
}

/** Profile sheet — Figma 160:4038 / 180:5520 / 180:5599 / 180:5678. */
export function CaregiverProfileScreen({
  caregiver,
  open,
  showCalendar = false,
  onBack,
  onOpened,
  onClosed,
  onShowCalendar,
  onHideCalendar,
}: CaregiverProfileScreenProps) {
  const [entered, setEntered] = useState(false)
  const [reviews, setReviews] = useState(() => shuffleReviews(caregiver.reviews))
  const [reviewResetKey, setReviewResetKey] = useState(0)
  const [calendarMounted, setCalendarMounted] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [playingKey, setPlayingKey] = useState<string | null>(null)
  const videoEls = useRef(new Map<string, HTMLVideoElement>())
  const navRef = useRef<HTMLElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLHeadingElement>(null)
  const mutedSurfaceRef = useRef(true)
  const titlePinnedRef = useRef(false)
  const titleSettledRef = useRef(false)

  // Keep nav/photo classes in sync via the DOM so a transparent header never
  // reveals the photo. Re-applied after React renders (className would wipe
  // imperative classList changes when is-scrolled etc. update).
  const applyTitleChromeClasses = useCallback((show: boolean, pinned: boolean) => {
    const nav = navRef.current
    const name = nameRef.current
    const photo = topRef.current?.querySelector('.caregiver-profile__photo-wrap')
    if (!nav || !name) return

    name.classList.toggle('is-sticky', show)
    name.classList.toggle('is-pinned', pinned)

    if (show) {
      photo?.classList.add('is-under-header')
      nav.classList.add('has-title')
      nav.classList.toggle('is-title-pinned', pinned)
    } else {
      // Opaque first (no bg transition on profile nav), then reveal photo.
      nav.classList.remove('has-title', 'is-title-pinned')
      photo?.classList.remove('is-under-header')
    }
  }, [])

  useLayoutEffect(() => {
    applyTitleChromeClasses(titlePinnedRef.current, titleSettledRef.current)
  })

  const syncNavChrome = useCallback((offset: number) => {
    const nav = navRef.current
    const top = topRef.current
    const name = nameRef.current

    if (nav && top) {
      // Sample the content row sitting under the nav bottom edge.
      const underNavY = offset + nav.offsetHeight
      const muted = underNavY < top.offsetHeight
      mutedSurfaceRef.current = muted
      const nextSurface = muted ? NAV_SURFACE_MUTED : NAV_SURFACE_DEFAULT
      nav.style.setProperty('--caregiver-nav-bg', nextSurface)
      name?.style.setProperty('--caregiver-nav-bg', nextSurface)
    }

    if (!nav || !name) return

    const content = name.closest('.caregiver-profile__scroll-content') as HTMLElement | null
    if (!content) return

    let nameTop = 0
    let node: HTMLElement | null = name
    while (node && node !== content) {
      nameTop += node.offsetTop
      node = node.offsetParent as HTMLElement | null
    }
    if (!node) {
      nameTop =
        name.getBoundingClientRect().top -
        content.getBoundingClientRect().top +
        offset
    }

    const navBottom = nav.offsetHeight
    // Park the title in the nav band (aligned with the back control).
    const stickPoint = Math.max(0, navBottom - 12 - name.offsetHeight)
    const nameViewportTop = nameTop - offset
    // While the title crosses the nav, keep it on top (nav goes transparent)
    // instead of letting it slide underneath and disappear.
    const crossingNav = nameViewportTop < navBottom
    const pin = Math.max(0, offset - (nameTop - stickPoint))
    const pinned = pin > 0.5
    const showTitleChrome = crossingNav || pinned

    name.style.transform = pinned ? `translate3d(0, ${pin}px, 0)` : ''
    // Stretch the title surface up to the top of the nav so the photo
    // never flashes through the transparent header.
    const visualTop = pinned ? stickPoint : Math.max(0, nameViewportTop)
    const coverTop = showTitleChrome ? -visualTop : 14
    name.style.setProperty('--sticky-cover-top', `${coverTop}px`)

    titlePinnedRef.current = showTitleChrome
    titleSettledRef.current = pinned
    applyTitleChromeClasses(showTitleChrome, pinned)
  }, [applyTitleChromeClasses])

  const dragScroll = useDragScroll({
    enabled: open && entered && !calendarOpen,
    ignoreSelector: 'button, a, input, textarea, .caregiver-profile__reviews',
    onOffsetChange: syncNavChrome,
  })
  const reviewsScroll = useHorizontalDragScroll({ enabled: open && entered && !calendarOpen })

  useEffect(() => {
    if (!open || !entered) return
    mutedSurfaceRef.current = true
    titlePinnedRef.current = false
    titleSettledRef.current = false
    const name = nameRef.current
    if (name) {
      name.style.transform = ''
      name.style.removeProperty('--sticky-cover-top')
      name.classList.remove('is-sticky', 'is-pinned')
    }
    topRef.current
      ?.querySelector('.caregiver-profile__photo-wrap')
      ?.classList.remove('is-under-header')
    navRef.current?.classList.remove('has-title', 'is-title-pinned')
    navRef.current?.style.setProperty('--caregiver-nav-bg', NAV_SURFACE_MUTED)
    nameRef.current?.style.setProperty('--caregiver-nav-bg', NAV_SURFACE_MUTED)
    syncNavChrome(0)
  }, [open, entered, caregiver.id, syncNavChrome])

  const pausePlaying = () => {
    if (!playingKey) return
    const el = videoEls.current.get(playingKey)
    el?.pause()
    setPlayingKey(null)
  }

  const playReview = (key: string) => {
    if (playingKey && playingKey !== key) {
      videoEls.current.get(playingKey)?.pause()
    }
    const el = videoEls.current.get(key)
    if (!el) return
    el.muted = true
    const start = () => {
      void el.play().then(() => setPlayingKey(key)).catch(() => setPlayingKey(null))
    }
    if (el.readyState >= 2) start()
    else el.addEventListener('loadeddata', start, { once: true })
  }

  useEffect(() => {
    if (!open) {
      setEntered(false)
      setCalendarOpen(false)
      setCalendarMounted(false)
      videoEls.current.forEach((el) => el.pause())
      setPlayingKey(null)
      return
    }
    dragScroll.resetScroll()
    setReviews(shuffleReviews(caregiver.reviews))
    setReviewResetKey((key) => key + 1)
    videoEls.current.forEach((el) => el.pause())
    setPlayingKey(null)
    // Double rAF so the sheet paints off-screen before sliding in.
    let inner = 0
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setEntered(true))
    })
    return () => {
      window.cancelAnimationFrame(outer)
      window.cancelAnimationFrame(inner)
    }
    // resetScroll is stable; omit dragScroll object to avoid re-running on scroll state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, caregiver.id, caregiver.reviews])

  useEffect(() => {
    if (showCalendar) {
      setCalendarMounted(true)
      setCalendarOpen(true)
      return
    }
    setCalendarOpen(false)
  }, [showCalendar])

  useEffect(() => {
    if (!calendarOpen) return
    setReviewResetKey((key) => key + 1)
    videoEls.current.forEach((el) => el.pause())
    setPlayingKey(null)
  }, [calendarOpen])

  useEffect(() => {
    if (!playingKey) return
    const el = videoEls.current.get(playingKey)
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || entry.intersectionRatio >= 0.35) return
        el.pause()
        setPlayingKey(null)
      },
      { threshold: [0, 0.35, 0.5, 1] },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [playingKey])

  const openCalendar = () => {
    if (onShowCalendar) {
      onShowCalendar()
      return
    }
    setCalendarMounted(true)
    setCalendarOpen(true)
  }

  const closeCalendar = () => {
    if (onHideCalendar) {
      onHideCalendar()
      return
    }
    setCalendarOpen(false)
  }

  const onCalendarClosed = () => {
    setCalendarMounted(false)
  }

  const onCalendarOpened = () => {
    // Reset profile scroll only once the calendar fully covers the sheet.
    dragScroll.resetScroll()
    mutedSurfaceRef.current = true
    titlePinnedRef.current = false
    titleSettledRef.current = false
    const name = nameRef.current
    if (name) {
      name.style.transform = ''
      name.style.removeProperty('--sticky-cover-top')
      name.classList.remove('is-sticky', 'is-pinned')
    }
    topRef.current
      ?.querySelector('.caregiver-profile__photo-wrap')
      ?.classList.remove('is-under-header')
    navRef.current?.classList.remove('has-title', 'is-title-pinned')
    navRef.current?.style.setProperty('--caregiver-nav-bg', NAV_SURFACE_MUTED)
    name?.style.setProperty('--caregiver-nav-bg', NAV_SURFACE_MUTED)
  }

  const onSheetTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    if (e.propertyName !== 'transform') return
    if (!open) {
      onClosed()
      return
    }
    if (entered) onOpened?.()
  }

  const sheetClass = [
    'caregiver-profile-sheet',
    open && entered ? 'is-open' : '',
    !open ? 'is-closing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={sheetClass}
      role="dialog"
      aria-modal="true"
      aria-label={caregiver.name}
      onTransitionEnd={onSheetTransitionEnd}
    >
      <header
        ref={navRef}
        className={`caregiver-nav caregiver-nav--muted caregiver-nav--profile${
          dragScroll.scrolled ? ' is-scrolled' : ''
        }`}
      >
        <button type="button" className="caregiver-back" aria-label="Volver" onClick={onBack}>
          <img src={caregiverAsset('arrow-left.svg')} alt="" width={32} height={32} draggable={false} />
        </button>
      </header>

      <div
        ref={dragScroll.ref}
        className={`caregiver-profile__scroller${dragScroll.dragging ? ' is-dragging' : ''}`}
        {...dragScroll.scrollerProps}
      >
        <div ref={dragScroll.contentRef} className="caregiver-profile__scroll-content">
          <div ref={topRef} className="caregiver-profile__top">
            <div className="caregiver-nav-spacer" aria-hidden="true" />

            <div className="caregiver-profile__photo-wrap">
              <img
                className={`caregiver-profile__photo caregiver-profile__photo--${caregiver.id}`}
                src={caregiverAsset(caregiver.photo)}
                alt=""
                draggable={false}
              />
            </div>

            <div className="caregiver-profile__intro">
              <h1 ref={nameRef} className="caregiver-profile__name display-title">
                {caregiver.name}
              </h1>
              <p className="caregiver-profile__tagline">{caregiver.tagline}</p>
              <p className="caregiver-profile__stats">
                <img src={profileAsset('icon-repeat.svg')} alt="" width={10} height={10} draggable={false} />
                <span>
                  {caregiver.badge} · {caregiver.reviewsCount} reviews
                </span>
              </p>
            </div>
          </div>

          <div className="caregiver-profile__body">
            <section className="caregiver-profile__section">
              <h2 className="caregiver-profile__heading">Sobre mí</h2>
              <p className="caregiver-profile__copy">{caregiver.about}</p>
            </section>

            <hr className="caregiver-profile__rule" />

            <section className="caregiver-profile__section">
              <h2 className="caregiver-profile__heading">Lo que más me importa:</h2>
              <p className="caregiver-profile__copy">{caregiver.priority}</p>
            </section>

            <hr className="caregiver-profile__rule" />

            <section className="caregiver-profile__section">
              <h2 className="caregiver-profile__heading">Qué haremos en cada sesión</h2>
              <ul className="caregiver-profile__sessions">
                {caregiver.sessions.map((step) => (
                  <li key={step.title} className="caregiver-profile__session">
                    <div
                      className={`caregiver-profile__session-icon caregiver-profile__session-icon--${step.icon}`}
                    >
                      <img
                        src={profileAsset(SESSION_ICON[step.icon])}
                        alt=""
                        width={step.icon === 'clipboard' ? 84 : 46}
                        height={step.icon === 'clipboard' ? 84 : 46}
                        draggable={false}
                      />
                    </div>
                    <div className="caregiver-profile__session-copy">
                      <p className="caregiver-profile__session-title">{step.title}</p>
                      <p className="caregiver-profile__session-body">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <hr className="caregiver-profile__rule" />

            <section className="caregiver-profile__section caregiver-profile__section--reviews">
              <h2 className="caregiver-profile__heading">{caregiver.reviewsHeading}</h2>
              <ul
                ref={reviewsScroll.ref}
                className={`caregiver-profile__reviews${reviewsScroll.dragging ? ' is-dragging' : ''}`}
                {...reviewsScroll.scrollerProps}
              >
                {reviews.map((review) => {
                  const key = reviewKey(review)
                  return (
                    <li key={key} className="caregiver-review">
                      <div className="caregiver-review__top">
                        <div className="caregiver-review__owner-row">
                          <img
                            className="caregiver-review__avatar"
                            src={profileAsset(`avatar-${review.avatar}.svg`)}
                            alt=""
                            width={32}
                            height={32}
                            draggable={false}
                          />
                          <div className="caregiver-review__owner-meta">
                            <p className="caregiver-review__owner">{review.owner}</p>
                            <div className="caregiver-review__stars" aria-label="5 estrellas">
                              {Array.from({ length: 5 }, (_, i) => (
                                <img
                                  key={i}
                                  src={profileAsset('icon-star.svg')}
                                  alt=""
                                  width={14}
                                  height={14}
                                  draggable={false}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <ReviewText text={review.text} resetKey={reviewResetKey} />
                      </div>
                      <ReviewMedia
                        review={review}
                        playing={playingKey === key}
                        onPlay={() => playReview(key)}
                        onPause={pausePlaying}
                        videoRef={(el) => {
                          if (el) videoEls.current.set(key, el)
                          else videoEls.current.delete(key)
                        }}
                      />
                      <p className="caregiver-review__date">{review.date}</p>
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>
        </div>
      </div>

      <div className="caregiver-profile__footer">
        <button type="button" className="caregiver-cta" onClick={openCalendar}>
          Agendar sesión
        </button>
      </div>

      {calendarMounted ? (
        <CaregiverCalendarScreen
          caregiver={caregiver}
          open={calendarOpen}
          onBack={closeCalendar}
          onOpened={onCalendarOpened}
          onClosed={onCalendarClosed}
        />
      ) : null}
    </div>
  )
}
