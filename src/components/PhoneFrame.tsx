import type { ReactNode } from 'react'
import { useHomeSwipe } from '../hooks/useHomeSwipe'
import './PhoneFrame.css'

type PhoneFrameProps = {
  children: ReactNode
  /** When true, home indicator can dismiss the in-app layer. */
  canGoHome?: boolean
  onGoHome?: () => void
}

/**
 * Fixed-size phone shell (~iPhone 11 / Figma 390×844).
 * Scales to fit the viewport while keeping aspect ratio.
 */
export function PhoneFrame({ children, canGoHome = false, onGoHome }: PhoneFrameProps) {
  const { homeIndicatorProps } = useHomeSwipe({
    enabled: canGoHome && Boolean(onGoHome),
    onCommit: () => onGoHome?.(),
  })

  return (
    <div className="phone-stage">
      <div className="phone-scale">
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
