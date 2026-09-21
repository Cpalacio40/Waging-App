import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { NAV_GROUPS, navLabelFor, type NavItem } from '../data/screens'
import './ScreenNavigator.css'

type ScreenNavigatorProps = {
  activeId: string
  onSelect: (item: NavItem) => void
}

/**
 * Collapsible prototype chrome — jump to any screen without walking the full flow.
 */
export function ScreenNavigator({ activeId, onSelect }: ScreenNavigatorProps) {
  const [open, setOpen] = useState(true)
  const panelId = useId()
  const activeLabel = navLabelFor(activeId)

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
          <span className="screen-nav__active-hint">{activeLabel}</span>
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
          {NAV_GROUPS.map((group) => {
            const hasOptions = group.items.length > 1
            if (!hasOptions) {
              const item = group.items[0]
              const isActive = item.id === activeId
              return (
                <li key={group.id}>
                  <button
                    type="button"
                    className={`screen-nav__btn${isActive ? ' is-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => onSelect(item)}
                  >
                    {group.label}
                  </button>
                </li>
              )
            }

            return (
              <li key={group.id} className="screen-nav__group">
                <p className="screen-nav__group-label">{group.label}</p>
                <ul className="screen-nav__sublist">
                  {group.items.map((item) => {
                    const isActive = item.id === activeId
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`screen-nav__btn screen-nav__btn--sub${isActive ? ' is-active' : ''}`}
                          aria-current={isActive ? 'page' : undefined}
                          onClick={() => onSelect(item)}
                        >
                          {item.label}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
