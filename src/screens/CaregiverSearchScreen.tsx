import { useState, type FormEvent } from 'react'
import { CAREGIVERS } from '../data/caregivers'
import { useDragScroll } from '../hooks/useDragScroll'
import { assetUrl } from '../utils/assetUrl'
import './screens.css'

const caregiverAsset = (name: string) => assetUrl(`caregiver/${name}`)

type CaregiverSearchScreenProps = {
  onBack?: () => void
}

/** Address search + caregiver cards — Figma 164:6857 / 120:6900. */
export function CaregiverSearchScreen({ onBack }: CaregiverSearchScreenProps) {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const dragScroll = useDragScroll({
    enabled: showResults,
    ignoreSelector: 'button, a, input, textarea, [role="button"]',
  })

  const onSearch = (e?: FormEvent) => {
    e?.preventDefault()
    setShowResults(true)
  }

  return (
    <div className="screen caregiver-search">
      <div
        ref={dragScroll.ref}
        className={`caregiver-search__scroller${dragScroll.dragging ? ' is-dragging' : ''}`}
        {...dragScroll.scrollerProps}
      >
        <header className="caregiver-search__header">
          <button type="button" className="caregiver-back" aria-label="Volver" onClick={onBack}>
            <img src={caregiverAsset('arrow-left.svg')} alt="" width={32} height={32} draggable={false} />
          </button>
        </header>

        <div className="caregiver-search__content">
          <p className="caregiver-search__lead">
            El cuidador correcto hace la diferencia entre un paseo y una salida que enriquece
          </p>

          <form className="caregiver-search__form" onSubmit={onSearch}>
            <div className="caregiver-search__field">
              <label className="caregiver-search__label" htmlFor="caregiver-address">
                ¿Cuál es tu dirección?
              </label>
              <input
                id="caregiver-address"
                className="caregiver-search__input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar aquí"
                autoComplete="street-address"
              />
            </div>
            <button type="submit" className="caregiver-cta">
              Buscar
            </button>
          </form>

          {showResults ? (
            <ul className="caregiver-search__results">
              {CAREGIVERS.map((caregiver) => (
                <li key={caregiver.id} className="caregiver-card">
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
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  )
}
