import { useEffect, useRef, useState, type TransitionEvent } from 'react'
import { Play } from 'lucide-react'
import type { Caregiver, CaregiverReview } from '../data/caregivers'
import { useDragScroll } from '../hooks/useDragScroll'
import { useHorizontalDragScroll } from '../hooks/useHorizontalDragScroll'
import { assetUrl } from '../utils/assetUrl'
import { CaregiverCalendarScreen } from './CaregiverCalendarScreen'
import './screens.css'

const caregiverAsset = (name: string) => assetUrl(`caregiver/${name}`)
const profileAsset = (name: string) => assetUrl(`caregiver/profile/${name}`)

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
  onBack: () => void
  onOpened?: () => void
  onClosed: () => void
}

/** Profile sheet — Figma 160:4038 / 180:5520 / 180:5599 / 180:5678. */
export function CaregiverProfileScreen({
  caregiver,
  open,
  onBack,
  onOpened,
  onClosed,
}: CaregiverProfileScreenProps) {
  const [entered, setEntered] = useState(false)
  const [reviews, setReviews] = useState(() => shuffleReviews(caregiver.reviews))
  const [calendarMounted, setCalendarMounted] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [playingKey, setPlayingKey] = useState<string | null>(null)
  const videoEls = useRef(new Map<string, HTMLVideoElement>())
  const dragScroll = useDragScroll({
    enabled: open && entered && !calendarOpen,
    ignoreSelector: 'button, a, input, textarea, .caregiver-profile__reviews, .caregiver-review__photo',
  })
  const reviewsScroll = useHorizontalDragScroll({ enabled: open && entered && !calendarOpen })

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
    setReviews(shuffleReviews(caregiver.reviews))
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
  }, [open, caregiver.id, caregiver.reviews])

  useEffect(() => {
    if (!calendarOpen) return
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
    setCalendarMounted(true)
    setCalendarOpen(true)
  }

  const closeCalendar = () => {
    setCalendarOpen(false)
  }

  const onCalendarClosed = () => {
    setCalendarMounted(false)
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
      <header className="caregiver-profile__header">
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
          <div className="caregiver-profile__top">
            <div className="caregiver-profile__header-spacer" aria-hidden="true" />

            <div className="caregiver-profile__photo-wrap">
              <img
                className={`caregiver-profile__photo caregiver-profile__photo--${caregiver.id}`}
                src={caregiverAsset(caregiver.photo)}
                alt=""
                draggable={false}
              />
            </div>

            <div className="caregiver-profile__intro">
              <h1 className="caregiver-profile__name display-title">{caregiver.name}</h1>
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
                        <p className="caregiver-review__text">{review.text}</p>
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
          onClosed={onCalendarClosed}
        />
      ) : null}
    </div>
  )
}
