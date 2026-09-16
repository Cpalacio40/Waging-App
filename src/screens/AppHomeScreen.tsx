import { Bell, Heart, Handshake, Sun, Zap, Waypoints, PawPrint, Moon } from 'lucide-react'
import './screens.css'

/** Placeholder: in-app home (Luca / Hoy). */
export function AppHomeScreen() {
  return (
    <div className="screen app-home">
      <header className="app-home__header">
        <div>
          <h1 className="app-home__name">
            Luca <span aria-hidden="true">▾</span>
          </h1>
          <p className="app-home__breed">Raza: Mixto</p>
        </div>
        <div className="app-home__actions">
          <button type="button" aria-label="Notificaciones" className="app-home__icon-btn">
            <Bell size={20} />
          </button>
          <span className="app-home__battery" aria-label="Estado collar">
            <Zap size={12} />
          </span>
        </div>
      </header>

      <div className="app-home__metrics">
        <div className="app-home__metric is-active">
          <Waypoints size={22} />
          <span>Todo</span>
        </div>
        <div className="app-home__metric">
          <PawPrint size={18} />
          <strong>62</strong>
          <span>Actividad</span>
        </div>
        <div className="app-home__metric">
          <Moon size={18} />
          <strong>78</strong>
          <span>Descanso</span>
        </div>
      </div>

      <section className="app-home__hero">
        <p className="app-home__kpi-label">Actividad</p>
        <p className="app-home__kpi">62</p>
        <h2 className="app-home__headline">Un buen día de movimiento</h2>
        <p className="app-home__copy">
          Entre el paseo, los ratos de juego y sus vueltas por casa, Luca se ha movido justo como
          suele. Un día tranquilo y activo a la vez.
        </p>
        <button type="button" className="app-home__cta">
          Leer más
        </button>
      </section>

      <nav className="app-home__tabbar" aria-label="Navegación principal">
        <button type="button" className="is-active">
          <Sun size={18} />
          Hoy
        </button>
        <button type="button">
          <Heart size={18} />
          Salud
        </button>
        <button type="button">
          <Handshake size={18} />
          Cuidador
        </button>
        <button type="button">
          <span className="app-home__avatar" aria-hidden="true" />
          Perfil
        </button>
      </nav>

      <p className="screen-placeholder-note">
        Placeholder — fidelidad alta desde Figma en el siguiente paso.
      </p>
    </div>
  )
}
