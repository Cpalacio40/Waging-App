import { useEffect, useState, type TransitionEvent } from 'react'
import type { Caregiver } from '../data/caregivers'
import { useDragScroll } from '../hooks/useDragScroll'
import { assetUrl } from '../utils/assetUrl'
import './screens.css'

const caregiverAsset = (name: string) => assetUrl(`caregiver/${name}`)
const profileAsset = (name: string) => assetUrl(`caregiver/profile/${name}`)

const SESSION_ICON: Record<Caregiver['sessions'][number]['icon'], string> = {
  clipboard: 'icon-clipboard.svg',
  chart: 'icon-chart.svg',
  hourglass: 'icon-hourglass.svg',
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
  const dragScroll = useDragScroll({
    enabled: open && entered,
    ignoreSelector: 'button, a, input, textarea',
  })

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    // Double rAF so the sheet paints off-screen before sliding in.
    let inner = 0
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setEntered(true))
    })
    return () => {
      window.cancelAnimationFrame(outer)
      window.cancelAnimationFrame(inner)
    }
  }, [open])

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
      <div
        ref={dragScroll.ref}
        className={`caregiver-profile__scroller${dragScroll.dragging ? ' is-dragging' : ''}`}
        {...dragScroll.scrollerProps}
      >
        <div ref={dragScroll.contentRef} className="caregiver-profile__scroll-content">
          <div className="caregiver-profile__hero-bg" aria-hidden="true" />

          <header className="caregiver-profile__header">
            <button type="button" className="caregiver-back" aria-label="Volver" onClick={onBack}>
              <img src={caregiverAsset('arrow-left.svg')} alt="" width={32} height={32} draggable={false} />
            </button>
          </header>

          <div className="caregiver-profile__photo-wrap">
            <img
              className={`caregiver-profile__photo caregiver-profile__photo--${caregiver.id}`}
              src={caregiverAsset(caregiver.photo)}
              alt=""
              draggable={false}
            />
          </div>

          <div className="caregiver-profile__body">
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

            <hr className="caregiver-profile__rule" />

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
              <h2 className="caregiver-profile__heading">Que haremos en cada sesión</h2>
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
              <h2 className="caregiver-profile__heading">
                Aquí también empezaron con un perro que no sabían cómo ayudar
              </h2>
              <ul className="caregiver-profile__reviews">
                {caregiver.reviews.map((review) => (
                  <li key={`${review.owner}-${review.date}`} className="caregiver-review">
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
                    <div className="caregiver-review__photo" aria-hidden="true" />
                    <p className="caregiver-review__date">{review.date}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      <div className="caregiver-profile__footer">
        <button type="button" className="caregiver-cta">
          Agendar sesión
        </button>
      </div>
    </div>
  )
}
