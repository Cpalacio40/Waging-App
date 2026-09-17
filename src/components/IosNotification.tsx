import type { AnimationEvent } from 'react'
import { assetUrl } from '../utils/assetUrl'
import './IosNotification.css'

const notifyAsset = (name: string) => assetUrl(`ios-notification/${name}`)

export type IosNotificationPhase = 'in' | 'hold' | 'out'

type IosNotificationProps = {
  phase: IosNotificationPhase
  onAnimationEnd: (e: AnimationEvent<HTMLElement>) => void
}

/** iOS banner — Figma Notification (iPhone) 115:3967. */
export function IosNotification({ phase, onAnimationEnd }: IosNotificationProps) {
  const motionClass = phase === 'in' ? ' is-entering' : phase === 'out' ? ' is-leaving' : ''

  return (
    <aside
      className={`ios-notification${motionClass}`}
      role="status"
      aria-live="polite"
      onAnimationEnd={onAnimationEnd}
    >
      <div className="ios-notification__icon">
        <img
          src={notifyAsset('app-icon.png')}
          alt=""
          width={38}
          height={38}
          draggable={false}
        />
      </div>
      <div className="ios-notification__copy">
        <div className="ios-notification__headline">
          <p className="ios-notification__title">
            <img
              className="ios-notification__dog"
              src={notifyAsset('dog.png')}
              alt=""
              width={16}
              height={16}
              draggable={false}
            />
            Luca necesita moverse
          </p>
          <p className="ios-notification__time">ahora</p>
        </div>
        <div className="ios-notification__body-row">
          <p className="ios-notification__body">
            Hoy se ha movido menos de lo que
            {'\n'}
            suele. Échale un vistazo.
          </p>
          <div className="ios-notification__alert" aria-hidden="true">
            <img
              src={notifyAsset('alert-mark.png')}
              alt=""
              width={32}
              height={32}
              draggable={false}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
