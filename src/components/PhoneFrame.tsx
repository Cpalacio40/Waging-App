import type { ReactNode } from 'react'
import './PhoneFrame.css'

type PhoneFrameProps = {
  children: ReactNode
}

/**
 * Fixed-size phone shell (~iPhone 11 / Figma 390×844).
 * Scales to fit the viewport while keeping aspect ratio.
 */
export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="phone-stage">
      <div className="phone-scale">
        <div className="phone-bezel" aria-label="Emulador móvil">
          <div className="phone-notch" aria-hidden="true" />
          <div className="phone-screen">{children}</div>
          <div className="phone-home-indicator" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
