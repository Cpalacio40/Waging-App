import { assetUrl } from '../utils/assetUrl'
import './screens.css'

const bookingAsset = (name: string) => assetUrl(`caregiver/booking/${name}`)

export type BookingSuccessDetails = {
  caregiverName: string
  sessionLine: string
  addressLine: string
  email?: string
}

type BookingSuccessScreenProps = {
  details: BookingSuccessDetails
  visible: boolean
  /** Skip enter fade — paint solid then fade out (booking → home). */
  snap?: boolean
  onAccept?: () => void
  /** Fired when fade-out opacity transition finishes (visible → false). */
  onFadeOutEnd?: () => void
}

const DEFAULT_EMAIL = 'camipalacio78@gmail.com'

/** Booking confirmed — Figma 241:8047. Fades in like splash → home. */
export function BookingSuccessScreen({
  details,
  visible,
  snap = false,
  onAccept,
  onFadeOutEnd,
}: BookingSuccessScreenProps) {
  const email = details.email ?? DEFAULT_EMAIL

  return (
    <div
      className={[
        'booking-success',
        visible ? 'is-visible' : '',
        snap ? 'is-snap' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden={!visible}
      inert={!visible ? true : undefined}
      onTransitionEnd={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.propertyName !== 'opacity') return
        if (!visible) onFadeOutEnd?.()
      }}
    >
      <img
        className="booking-success__logo"
        src={bookingAsset('logo.svg')}
        alt="waging"
        width={149}
        height={34}
        draggable={false}
      />

      <div className="booking-success__body">
        <div className="booking-success__hero">
          <h1 className="booking-success__title display-title">¡Todo listo!</h1>
          <p className="booking-success__copy">
            Se ha <strong>enviado un correo electrónico</strong> de confirmación a:{' '}
            <strong>{email}</strong>
          </p>
        </div>

        <div className="booking-success__card">
          <p className="booking-success__card-title">Detalle de la sesión</p>
          <ul className="booking-success__rows">
            <li className="booking-success__row">
              <img
                src={bookingAsset('icon-id-card.svg')}
                alt=""
                width={20}
                height={20}
                draggable={false}
              />
              <span>
                {details.caregiverName} (Cuidadora)
              </span>
            </li>
            <li className="booking-success__row">
              <img
                src={bookingAsset('icon-calendar.svg')}
                alt=""
                width={20}
                height={20}
                draggable={false}
              />
              <span>{details.sessionLine}</span>
            </li>
            <li className="booking-success__row">
              <img
                src={bookingAsset('icon-map.svg')}
                alt=""
                width={20}
                height={20}
                draggable={false}
              />
              <span>{details.addressLine}</span>
            </li>
          </ul>
        </div>
      </div>

      {onAccept ? (
        <div className="booking-success__footer">
          <button type="button" className="caregiver-cta" onClick={onAccept}>
            Aceptar
          </button>
        </div>
      ) : null}
    </div>
  )
}
