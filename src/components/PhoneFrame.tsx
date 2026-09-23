import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useHomeSwipe } from '../hooks/useHomeSwipe'
import './PhoneFrame.css'

type PhoneFrameProps = {
  children: ReactNode
  /** When true, home indicator can dismiss the in-app layer. */
  canGoHome?: boolean
  onGoHome?: () => void
}

const PHONE_OUTER_W = 390 + 2 * 12
const PHONE_OUTER_H = 844 + 2 * 12
/** Studio chrome (padding + brand + footer) in CSS px at 100% zoom — must stay zoom-independent. */
const CHROME_Y = 160
const CHROME_X = 48
const SCALE_MIN = 0.4
const SCALE_MAX = 1.35

function browserZoom(): number {
  return window.visualViewport?.scale ?? 1
}

/** Fit the phone to the window; ignore browser zoom so Ctrl+/- scales phone with the rest of the page. */
function computePhoneScale(): number {
  const zoom = browserZoom()
  const availH = window.innerHeight * zoom - CHROME_Y
  const availW = window.innerWidth * zoom - CHROME_X
  const next = Math.min(availH / PHONE_OUTER_H, availW / PHONE_OUTER_W)
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, next))
}

/**
 * Fixed-size phone shell (~iPhone 11 / Figma 390×844).
 * Scales with window size; stays stable under browser zoom.
 */
export function PhoneFrame({ children, canGoHome = false, onGoHome }: PhoneFrameProps) {
  const [scale, setScale] = useState(1)
  const { homeIndicatorProps } = useHomeSwipe({
    enabled: canGoHome && Boolean(onGoHome),
    onCommit: () => onGoHome?.(),
  })

  useEffect(() => {
    const update = () => setScale(computePhoneScale())
    update()
    window.addEventListener('resize', update)
    const vv = window.visualViewport
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    return () => {
      window.removeEventListener('resize', update)
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
    }
  }, [])

  return (
    <div className="phone-stage">
      <div
        className="phone-scale"
        style={{ '--scale': String(scale) } as CSSProperties}
      >
        <div className="phone-bezel" aria-label="Emulador móvil">
          <div className="phone-notch" aria-hidden="true" />
          <div className="phone-screen">{children}</div>
          {canGoHome ? (
            <button
              type="button"
              className="phone-home-indicator is-interactive"
              aria-label="Volver al inicio"
              {...homeIndicatorProps}
            />
          ) : (
            <div className="phone-home-indicator" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  )
}
