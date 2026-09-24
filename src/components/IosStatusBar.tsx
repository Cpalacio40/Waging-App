import { assetUrl } from '../utils/assetUrl'
import './IosStatusBar.css'

export type StatusBarTone = 'light' | 'dark'

type IosStatusBarProps = {
  /** `dark` = white icons (dark/photo screens). `light` = black icons (light screens). */
  tone?: StatusBarTone
}

const statusAsset = (tone: StatusBarTone, name: string) =>
  assetUrl(`ios-status/${tone}/${name}`)

/**
 * iOS status bar — Figma Status Bar 320:7856 (light) / 320:7857 (dark).
 * Fixed chrome over SpringBoard and in-app screens (same position everywhere).
 */
export function IosStatusBar({ tone = 'dark' }: IosStatusBarProps) {
  return (
    <div className={`ios-status-bar ios-status-bar--${tone}`} aria-hidden="true">
      <div className="ios-status-bar__time">
        <img src={statusAsset(tone, 'time.svg')} alt="" draggable={false} />
      </div>
      <div className="ios-status-bar__icons">
        <img
          className="ios-status-bar__network"
          src={statusAsset(tone, 'network.svg')}
          alt=""
          draggable={false}
        />
        <img
          className="ios-status-bar__wifi"
          src={statusAsset(tone, 'wifi.svg')}
          alt=""
          draggable={false}
        />
        <img
          className="ios-status-bar__battery"
          src={statusAsset(tone, 'battery.svg')}
          alt=""
          draggable={false}
        />
      </div>
    </div>
  )
}
