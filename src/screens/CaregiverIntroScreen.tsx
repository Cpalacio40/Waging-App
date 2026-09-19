import type { CSSProperties } from 'react'
import { assetUrl } from '../utils/assetUrl'
import './screens.css'

const caregiverAsset = (name: string) => assetUrl(`caregiver/${name}`)

const CRED_POINTS = [
  {
    icon: 'icon-shield-check.svg',
    title: 'Formación real en comportamiento canino',
    body: 'No solo voluntad de cuidar, sino conocimiento práctico para leer a tu perro.',
  },
  {
    icon: 'icon-user-check.svg',
    title: 'Tu cuidador de referencia',
    body: 'Alguien que va conociendo a tu perro y entiende sus ritmos y señales.',
  },
  {
    icon: 'icon-copy-check.svg',
    title: 'Fotos y resumen de cada salida',
    body: 'Sabrás cómo fue la experiencia y qué aprendió tu perro durante la jornada.',
  },
] as const

/** Exact visible tile geometry from the rendered Figma node 155:3566. */
const COLLAGE_TILES = [
  { id: 'left', left: -17, top: 21 },
  { id: 'middle-top', left: 92, top: 44 },
  { id: 'middle-bottom', left: 92, top: 151 },
  { id: 'right-top', left: 199, top: 0 },
  { id: 'right-bottom', left: 199, top: 107 },
  { id: 'far-right', left: 306, top: 66 },
] as const

type CaregiverIntroScreenProps = {
  onBack?: () => void
  onContinue?: () => void
}

/** Intermediate value prop — Figma iPhone 13 & 14 - 3 (155:3548). */
export function CaregiverIntroScreen({ onBack, onContinue }: CaregiverIntroScreenProps) {
  return (
    <div className="screen caregiver-intro">
      <header className="caregiver-intro__header">
        <button type="button" className="caregiver-back" aria-label="Volver" onClick={onBack}>
          <img src={caregiverAsset('arrow-left.svg')} alt="" width={32} height={32} draggable={false} />
        </button>
      </header>

      <div className="caregiver-intro__collage" aria-hidden="true">
        {COLLAGE_TILES.map((tile) => (
          <div
            key={tile.id}
            className="caregiver-intro__collage-tile"
            style={{ left: tile.left, top: tile.top } as CSSProperties}
          >
            <img
              className="caregiver-intro__collage-img"
              src={caregiverAsset('intro-collage.png')}
              alt=""
              draggable={false}
              style={{ left: -tile.left - 1.28, top: -tile.top - 0.15 } as CSSProperties}
            />
          </div>
        ))}
        <span className="caregiver-intro__chip caregiver-intro__chip--explore">Explorar</span>
        <span className="caregiver-intro__chip caregiver-intro__chip--sniff">Olfatear</span>
        <span className="caregiver-intro__chip caregiver-intro__chip--pace">A su paso</span>
      </div>

      <div className="caregiver-intro__body">
        <h1 className="caregiver-intro__title display-title">Más que un paseo, un vínculo</h1>
        <ul className="caregiver-intro__cred">
          {CRED_POINTS.map((point) => (
            <li key={point.title} className="caregiver-intro__cred-row">
              <img src={caregiverAsset(point.icon)} alt="" width={24} height={24} draggable={false} />
              <div className="caregiver-intro__cred-copy">
                <p className="caregiver-intro__cred-title">{point.title}</p>
                <p className="caregiver-intro__cred-body">{point.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="caregiver-intro__footer">
        <button type="button" className="caregiver-cta" onClick={onContinue}>
          Continuar
        </button>
      </div>
    </div>
  )
}
