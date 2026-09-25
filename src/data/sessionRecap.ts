import { assetUrl } from '../utils/assetUrl'

const recapAsset = (name: string) => assetUrl(`app-recap/${name}`)

export type SessionRecapSlide =
  | {
      id: string
      kind: 'image'
      src: string
      alt: string
    }
  | {
      id: string
      kind: 'video'
      src: string
      title: string
      subtitle: string
    }

/** Looping bed under the whole recap; ducks while the video slide plays. */
export const SESSION_RECAP_MUSIC = recapAsset('recap-music.m4a')

export const SESSION_RECAP_MUSIC_VOLUME = 0.55
export const SESSION_RECAP_MUSIC_DUCKED = 0.12

/** 8-section post-walk recap — Figma 3:16 / Pantallas. Video is slide 4. */
export const SESSION_RECAP_SLIDES: SessionRecapSlide[] = [
  {
    id: 'intro',
    kind: 'image',
    src: recapAsset('01.png'),
    alt: 'Sesión 1 — Resumen de Luca',
  },
  {
    id: 'worked',
    kind: 'image',
    src: recapAsset('02.png'),
    alt: 'Lo que trabajaron',
  },
  {
    id: 'why',
    kind: 'image',
    src: recapAsset('03.png'),
    alt: 'Por qué esto importa',
  },
  {
    id: 'video',
    kind: 'video',
    src: recapAsset('sesion-1.mp4'),
    title: 'Luca y María Camila',
    subtitle: 'Hora del juego',
  },
  {
    id: 'photo-a',
    kind: 'image',
    src: recapAsset('05.png'),
    alt: 'Foto de la sesión',
  },
  {
    id: 'photo-b',
    kind: 'image',
    src: recapAsset('06.png'),
    alt: 'Foto de la sesión',
  },
  {
    id: 'practice',
    kind: 'image',
    src: recapAsset('07.png'),
    alt: 'Para que practiques esta semana',
  },
  {
    id: 'share',
    kind: 'image',
    src: recapAsset('08.png'),
    alt: 'Compartir resumen',
  },
]
