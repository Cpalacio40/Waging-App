import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  SESSION_RECAP_MUSIC,
  SESSION_RECAP_MUSIC_DUCKED,
  SESSION_RECAP_MUSIC_VOLUME,
  SESSION_RECAP_SLIDES,
} from '../data/sessionRecap'
import { assetUrl } from '../utils/assetUrl'

type SessionRecapScreenProps = {
  open: boolean
  onClose: () => void
  /** Caregiver from the completed outing — shown on the intro slide. */
  caregiverName?: string
}

const DEFAULT_RECAP_CAREGIVER = 'María Camila'

function shortCaregiverName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return DEFAULT_RECAP_CAREGIVER
  if (parts.length === 1) return parts[0]!
  // Keep compound given names (“María Camila …”) like Figma.
  return `${parts[0]} ${parts[1]}`
}

const SWIPE_THRESHOLD = 48
const VIDEO_SLIDE_INDEX = SESSION_RECAP_SLIDES.findIndex((slide) => slide.kind === 'video')
const MUSIC_FADE_IN_MS = 520
const MUSIC_FADE_OUT_MS = 420
const MUSIC_DUCK_MS = 280

function clampVolume(value: number) {
  return Math.min(1, Math.max(0, value))
}

function targetMusicVolume(slideIndex: number) {
  return slideIndex === VIDEO_SLIDE_INDEX ? SESSION_RECAP_MUSIC_DUCKED : SESSION_RECAP_MUSIC_VOLUME
}

/** Post-walk recap — slides in from the right; swipe between 8 sections (video = 4th). */
export function SessionRecapScreen({ open, onClose, caregiverName }: SessionRecapScreenProps) {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startXRef = useRef(0)
  const widthRef = useRef(390)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const fadeRafRef = useRef<number | null>(null)
  const indexRef = useRef(0)
  const musicReadyRef = useRef(false)
  indexRef.current = index

  const stopMusicFade = useCallback(() => {
    if (fadeRafRef.current != null) {
      window.cancelAnimationFrame(fadeRafRef.current)
      fadeRafRef.current = null
    }
  }, [])

  const fadeMusicTo = useCallback(
    (to: number, durationMs: number, onDone?: () => void) => {
      const music = musicRef.current
      if (!music) {
        onDone?.()
        return
      }

      stopMusicFade()
      const from = music.volume
      const target = clampVolume(to)
      if (durationMs <= 0 || Math.abs(from - target) < 0.01) {
        music.volume = target
        onDone?.()
        return
      }

      const startedAt = performance.now()
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / durationMs)
        const eased = 1 - (1 - progress) ** 3
        music.volume = clampVolume(from + (target - from) * eased)
        if (progress < 1) {
          fadeRafRef.current = window.requestAnimationFrame(tick)
          return
        }
        fadeRafRef.current = null
        music.volume = target
        onDone?.()
      }
      fadeRafRef.current = window.requestAnimationFrame(tick)
    },
    [stopMusicFade],
  )

  useEffect(() => {
    if (open) {
      setMounted(true)
      setIndex(0)
      setDragX(0)
      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setShown(true))
      })
      return () => window.cancelAnimationFrame(frame)
    }
    setShown(false)
  }, [open])

  useEffect(() => {
    const music = musicRef.current
    if (!music) return

    if (shown) {
      music.loop = true
      music.volume = 0
      void music
        .play()
        .then(() => {
          fadeMusicTo(targetMusicVolume(indexRef.current), MUSIC_FADE_IN_MS)
        })
        .catch(() => {})
      return () => stopMusicFade()
    }

    fadeMusicTo(0, MUSIC_FADE_OUT_MS, () => {
      music.pause()
      music.currentTime = 0
      music.volume = 0
    })
    return () => stopMusicFade()
  }, [shown, fadeMusicTo, stopMusicFade])

  useEffect(() => {
    if (!shown) {
      musicReadyRef.current = false
      return
    }
    // Skip the first tick — enter fade-in already targets the right volume.
    if (!musicReadyRef.current) {
      musicReadyRef.current = true
      return
    }
    fadeMusicTo(targetMusicVolume(index), MUSIC_DUCK_MS)
  }, [index, shown, fadeMusicTo])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onVideo = shown && index === VIDEO_SLIDE_INDEX
    if (onVideo) {
      video.muted = false
      video.volume = 1
      void video.play().catch(() => {})
    } else {
      video.pause()
      video.muted = true
    }
  }, [shown, index])

  const handleTransitionEnd = useCallback(() => {
    if (!shown) {
      setMounted(false)
      setIndex(0)
      setDragX(0)
      stopMusicFade()
      const music = musicRef.current
      if (music) {
        music.pause()
        music.currentTime = 0
        music.volume = 0
      }
    }
  }, [shown, stopMusicFade])

  const goTo = useCallback((next: number) => {
    setIndex(Math.max(0, Math.min(SESSION_RECAP_SLIDES.length - 1, next)))
    setDragX(0)
  }, [])

  const onShare = useCallback(async () => {
    const name = shortCaregiverName(caregiverName ?? '')
    const payload = {
      title: 'Resumen de Luca',
      text: `Sesión 1 con ${name} — mira cómo le fue a Luca.`,
    }
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(payload)
        return
      }
    } catch {
      /* user cancelled or share unavailable */
    }
  }, [caregiverName])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    if (target.closest('button, a')) return
    widthRef.current = scrollerRef.current?.clientWidth ?? 390
    startXRef.current = event.clientX
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging) return
      setDragX(event.clientX - startXRef.current)
    },
    [dragging],
  )

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging) return
      setDragging(false)
      const delta = event.clientX - startXRef.current
      if (delta <= -SWIPE_THRESHOLD && index < SESSION_RECAP_SLIDES.length - 1) {
        goTo(index + 1)
      } else if (delta >= SWIPE_THRESHOLD && index > 0) {
        goTo(index - 1)
      } else {
        setDragX(0)
      }
    },
    [dragging, goTo, index],
  )

  if (!mounted) return null

  const introCaregiver = shortCaregiverName(caregiverName ?? '')
  const introLine = `Sesión 1 con ${introCaregiver}`
  const offsetPct = (dragX / widthRef.current) * 100
  const trackStyle = {
    transform: `translate3d(calc(${-index * 100}% + ${dragging || dragX ? `${offsetPct}%` : '0%'}), 0, 0)`,
    transition: dragging ? 'none' : 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
  }

  return (
    <div
      className={`session-recap${shown ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Resumen de la sesión"
      onTransitionEnd={handleTransitionEnd}
    >
      <audio ref={musicRef} src={SESSION_RECAP_MUSIC} preload="auto" loop playsInline />

      <div
        ref={scrollerRef}
        className="session-recap__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="session-recap__track" style={trackStyle}>
          {SESSION_RECAP_SLIDES.map((slide) => (
            <section key={slide.id} className="session-recap__slide" aria-roledescription="slide">
              {slide.kind === 'image' ? (
                <>
                  <img
                    className="session-recap__image"
                    src={slide.src}
                    alt={slide.alt}
                    draggable={false}
                  />
                  {slide.id === 'intro' ? (
                    <p className="session-recap__intro-eyebrow">{introLine}</p>
                  ) : null}
                  {slide.id === 'share' ? (
                    <button
                      type="button"
                      className="session-recap__share"
                      onClick={onShare}
                    >
                      <img
                        src={assetUrl('app-recap/icon-share.svg')}
                        alt=""
                        width={24}
                        height={24}
                        draggable={false}
                      />
                      <span>Compartir</span>
                    </button>
                  ) : null}
                </>
              ) : (
                <div className="session-recap__video-slide">
                  <video
                    ref={videoRef}
                    className="session-recap__video"
                    src={slide.src}
                    playsInline
                    muted
                    loop
                    controls={false}
                    disablePictureInPicture
                    poster={assetUrl('app-recap/05.png')}
                  />
                </div>
              )}
            </section>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="session-recap__close"
        aria-label="Cerrar resumen"
        onClick={onClose}
      >
        <img
          src={assetUrl('app-recap/icon-close-on-light.svg')}
          alt=""
          width={32}
          height={32}
          draggable={false}
        />
      </button>

      <div className="session-recap__dots" role="tablist" aria-label="Secciones del resumen">
        {SESSION_RECAP_SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Sección ${i + 1}`}
            className={`session-recap__dot${i === index ? ' is-active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  )
}
