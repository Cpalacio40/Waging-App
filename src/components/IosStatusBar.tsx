import { useEffect, useState } from 'react'
import { assetUrl } from '../utils/assetUrl'
import './IosStatusBar.css'

export type StatusBarTone = 'light' | 'dark'

type IosStatusBarProps = {
  /** `dark` = white icons (dark/photo screens). `light` = black icons (light screens). */
  tone?: StatusBarTone
}

const statusAsset = (tone: StatusBarTone, name: string) =>
  assetUrl(`ios-status/${tone}/${name}`)

function formatStatusTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * iOS status bar — Figma Status Bar 320:7856 (light) / 320:7857 (dark).
 * Fixed chrome over SpringBoard and in-app screens (same position everywhere).
 * Clock tracks the device clock and refreshes on each minute.
 */
export function IosStatusBar({ tone = 'dark' }: IosStatusBarProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    const msToNextMinute = 60_000 - (Date.now() % 60_000) + 50
    let intervalId = 0
    const timeoutId = window.setTimeout(() => {
      tick()
      intervalId = window.setInterval(tick, 60_000)
    }, msToNextMinute)
    return () => {
      window.clearTimeout(timeoutId)
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [])

  return (
    <div className={`ios-status-bar ios-status-bar--${tone}`} aria-hidden="true">
      <div className="ios-status-bar__time">
        <span className="ios-status-bar__time-text">{formatStatusTime(now)}</span>
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
