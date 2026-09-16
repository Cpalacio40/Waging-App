import { useEffect } from 'react'
import { assetUrl } from '../utils/assetUrl'
import './screens.css'

type SplashScreenProps = {
  onDone?: () => void
  /** Auto-advance to app home (ms). Set 0 to keep static. */
  autoMs?: number
}

/** Brand splash — Figma iPhone 13 & 14 - 55 (node 68:10010). */
export function SplashScreen({ onDone, autoMs = 1400 }: SplashScreenProps) {
  useEffect(() => {
    if (!onDone || autoMs <= 0) return
    const t = window.setTimeout(onDone, autoMs)
    return () => window.clearTimeout(t)
  }, [onDone, autoMs])

  return (
    <div className="screen splash">
      <img
        className="splash__logo"
        src={assetUrl('splash/waging-wordmark.svg')}
        alt="waging"
        width={214}
        height={49}
        draggable={false}
      />
    </div>
  )
}
