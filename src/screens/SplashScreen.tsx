import { useEffect } from 'react'
import './screens.css'

type SplashScreenProps = {
  onDone?: () => void
  /** Auto-advance to app home (ms). Set 0 to keep static. */
  autoMs?: number
}

/** Placeholder: brand splash. */
export function SplashScreen({ onDone, autoMs = 1400 }: SplashScreenProps) {
  useEffect(() => {
    if (!onDone || autoMs <= 0) return
    const t = window.setTimeout(onDone, autoMs)
    return () => window.clearTimeout(t)
  }, [onDone, autoMs])

  return (
    <div className="screen splash">
      <p className="splash__logo" aria-label="waging">
        waging
      </p>
      <p className="screen-placeholder-note splash__note">
        Placeholder — logo final desde assets Figma.
      </p>
    </div>
  )
}
