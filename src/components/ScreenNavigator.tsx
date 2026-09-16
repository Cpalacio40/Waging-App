import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { SCREENS, type ScreenId } from '../data/screens'
import './ScreenNavigator.css'

type ScreenNavigatorProps = {
  active: ScreenId
  onSelect: (id: ScreenId) => void
}

/**
 * Collapsible prototype chrome — jump to any screen without walking the full flow.
 */
export function ScreenNavigator({ active, onSelect }: ScreenNavigatorProps) {
  const [open, setOpen] = useState(true)
  const panelId = useId()
  const activeLabel = SCREENS.find((s) => s.id === active)?.label ?? active

  return (
    <nav className={`screen-nav${open ? ' is-open' : ''}`} aria-label="Navegador de pantallas">
      <button
        type="button"
        className="screen-nav__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="screen-nav__toggle-text">
          <span className="screen-nav__title">Pantallas</span>
          {!open && <span className="screen-nav__active-hint">{activeLabel}</span>}
        </span>
        <ChevronDown className="screen-nav__chevron" size={18} aria-hidden="true" />
      </button>

      <div
        id={panelId}
        className="screen-nav__panel"
        role="region"
        hidden={!open}
      >
        <ul className="screen-nav__list">
          {SCREENS.map((screen) => {
            const isActive = screen.id === active
            return (
              <li key={screen.id}>
                <button
                  type="button"
                  className={`screen-nav__btn${isActive ? ' is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onSelect(screen.id)}
                >
                  {screen.label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
