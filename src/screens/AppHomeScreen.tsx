import { assetUrl } from '../utils/assetUrl'
import './screens.css'

const inicioAsset = (name: string) => assetUrl(`app-inicio/${name}`)

/** In-app home — Figma iPhone 13 & 14 - 54 (node 48:3198). */
export function AppHomeScreen() {
  return (
    <div className="screen app-home">
      <div className="app-home__bg" aria-hidden="true">
        <img className="app-home__bg-photo" src={inicioAsset('bg-dog.jpg')} alt="" draggable={false} />
        <div className="app-home__bg-blur">
          <img className="app-home__bg-photo" src={inicioAsset('bg-dog.jpg')} alt="" draggable={false} />
        </div>
        <div className="app-home__bg-scrim app-home__bg-scrim--top" />
        <div className="app-home__bg-scrim app-home__bg-scrim--mid" />
        <div className="app-home__bg-scrim app-home__bg-scrim--tint" />
      </div>
      <div className="app-home__veil" aria-hidden="true" />

      <header className="app-home__header">
        <div className="app-home__identity">
          <div className="app-home__name-row">
            <h1 className="app-home__name">Luca</h1>
            <img
              className="app-home__chevron"
              src={inicioAsset('icon-chevron-down.svg')}
              alt=""
              width={24}
              height={24}
              draggable={false}
            />
          </div>
          <p className="app-home__breed">Raza: Mixto</p>
        </div>
        <div className="app-home__actions">
          <button type="button" className="app-home__icon-btn" aria-label="Notificaciones">
            <img src={inicioAsset('icon-bell.svg')} alt="" width={24} height={24} draggable={false} />
          </button>
          <span className="app-home__battery" aria-label="Estado del collar">
            <img
              src={inicioAsset('icon-battery.svg')}
              alt=""
              width={31}
              height={31}
              draggable={false}
            />
          </span>
        </div>
      </header>

      <div className="app-home__metrics">
        <div className="app-home__metric">
          <div className="app-home__metric-icon">
            <img
              src={inicioAsset('metric-todo.svg')}
              alt=""
              width={70}
              height={70}
              draggable={false}
            />
            <img
              className="app-home__metric-waypoints"
              src={inicioAsset('icon-waypoints.svg')}
              alt=""
              width={28}
              height={28}
              draggable={false}
            />
          </div>
          <p>Todo</p>
        </div>

        <div className="app-home__metric">
          <div className="app-home__metric-icon">
            <img
              src={inicioAsset('metric-ring.svg')}
              alt=""
              width={70}
              height={70}
              draggable={false}
            />
            <div className="app-home__metric-paw">
              <img src={inicioAsset('icon-paw.svg')} alt="" width={18} height={18} draggable={false} />
            </div>
            <span className="app-home__metric-value">62</span>
          </div>
          <p>Actividad</p>
        </div>

        <div className="app-home__metric">
          <div className="app-home__metric-icon">
            <img
              src={inicioAsset('metric-ring.svg')}
              alt=""
              width={70}
              height={70}
              draggable={false}
            />
            <img
              className="app-home__metric-moon"
              src={inicioAsset('icon-moon.svg')}
              alt=""
              width={18}
              height={18}
              draggable={false}
            />
            <span className="app-home__metric-value">78</span>
          </div>
          <p>Descanso</p>
        </div>
      </div>

      <div className="app-home__gauge" aria-hidden="true">
        <div className="app-home__gauge-track">
          <img src={inicioAsset('gauge-track.svg')} alt="" draggable={false} />
        </div>
        <div className="app-home__gauge-fill">
          <img src={inicioAsset('gauge-fill.svg')} alt="" draggable={false} />
        </div>

        <img
          className="app-home__bone app-home__bone--1"
          src={inicioAsset('bone.svg')}
          alt=""
          width={22}
          height={9}
          draggable={false}
        />
        <img
          className="app-home__bone app-home__bone--2"
          src={inicioAsset('bone.svg')}
          alt=""
          width={22}
          height={9}
          draggable={false}
        />
        <img
          className="app-home__bone app-home__bone--3"
          src={inicioAsset('bone.svg')}
          alt=""
          width={22}
          height={9}
          draggable={false}
        />
        <img
          className="app-home__bone app-home__bone--4"
          src={inicioAsset('bone-outline.svg')}
          alt=""
          width={22}
          height={9}
          draggable={false}
        />

        <div className="app-home__knob">
          <img src={inicioAsset('gauge-knob.svg')} alt="" width={15} height={15} draggable={false} />
        </div>

        <div className="app-home__paw-bubble">
          <div className="app-home__paw-bubble-icon">
            <img src={inicioAsset('icon-paw.svg')} alt="" width={18} height={18} draggable={false} />
          </div>
        </div>
      </div>

      <p className="app-home__scale app-home__scale--0">0</p>
      <p className="app-home__scale app-home__scale--100">100</p>
      <p className="app-home__kpi-label">Actividad</p>
      <p className="app-home__kpi">62</p>

      <section className="app-home__copy">
        <div className="app-home__copy-text">
          <h2 className="app-home__headline">Un buen día de movimiento</h2>
          <p className="app-home__body">
            Entre el paseo, los ratos de juego y sus vueltas por casa, Luca se ha movido justo como
            suele. Un día tranquilo y activo a la vez.
          </p>
        </div>
        <button type="button" className="app-home__cta">
          <span>Leer más</span>
        </button>
      </section>

      <nav className="app-home__tabbar" aria-label="Navegación principal">
        <button type="button" className="is-active">
          <img src={inicioAsset('nav-sun.svg')} alt="" width={24} height={24} draggable={false} />
          Hoy
        </button>
        <button type="button">
          <img src={inicioAsset('nav-heart.svg')} alt="" width={24} height={24} draggable={false} />
          Salud
        </button>
        <button type="button">
          <img src={inicioAsset('nav-handshake.svg')} alt="" width={24} height={24} draggable={false} />
          Cuidador
        </button>
        <button type="button">
          <img
            className="app-home__tab-avatar"
            src={inicioAsset('bg-dog.jpg')}
            alt=""
            width={24}
            height={24}
            draggable={false}
          />
          Perfil
        </button>
      </nav>
    </div>
  )
}
