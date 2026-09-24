import { assetUrl } from '../utils/assetUrl'

const inicioAsset = (name: string) => assetUrl(`app-inicio/${name}`)

export type AppTabId = 'hoy' | 'salud' | 'cuidador' | 'perfil'

type AppTabBarProps = {
  active: AppTabId
  onHoy?: () => void
  onCuidador?: () => void
}

/** Shared bottom tab pill — stays fixed while home ↔ caregiver list push. */
export function AppTabBar({ active, onHoy, onCuidador }: AppTabBarProps) {
  return (
    <nav className="app-home__tabbar" aria-label="Navegación principal">
      <button
        type="button"
        className={active === 'hoy' ? 'is-active' : undefined}
        onClick={onHoy}
      >
        <img
          src={inicioAsset(active === 'hoy' ? 'nav-sun.svg' : 'nav-sun-muted.svg')}
          alt=""
          width={24}
          height={24}
          draggable={false}
        />
        Hoy
      </button>
      <button type="button" className={active === 'salud' ? 'is-active' : undefined}>
        <img src={inicioAsset('nav-heart.svg')} alt="" width={24} height={24} draggable={false} />
        Salud
      </button>
      <button
        type="button"
        className={active === 'cuidador' ? 'is-active' : undefined}
        onClick={onCuidador}
      >
        <img
          src={inicioAsset(
            active === 'cuidador' ? 'nav-handshake-active.svg' : 'nav-handshake.svg',
          )}
          alt=""
          width={24}
          height={24}
          draggable={false}
        />
        Cuidador
      </button>
      <button type="button" className={active === 'perfil' ? 'is-active' : undefined}>
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
  )
}
