export type CaregiverSessionStep = {
  title: string
  body: string
  icon: 'clipboard' | 'chart' | 'hourglass'
}

export type CaregiverReview = {
  owner: string
  text: string
  date: string
  avatar: '1' | '2' | '3'
  /** Still / poster under public/caregiver/profile/ */
  photo: string
  /** Optional looping video; when set, used instead of photo */
  video?: string
  /** Figma videoTransform / imageTransform → CSS object-position */
  objectPosition: string
}

export type Caregiver = {
  id: string
  name: string
  specialty: string
  badge: string
  bio: string
  photo: string
  tagline: string
  reviewsCount: number
  about: string
  priority: string
  sessions: CaregiverSessionStep[]
  reviewsHeading: string
  reviews: CaregiverReview[]
}

/** Mock caregivers for search + profile — Figma 120:6900 / 160:4038 / 180:5520+ */
export const CAREGIVERS: Caregiver[] = [
  {
    id: 'maria',
    name: 'María Camila Rodríguez',
    specialty: 'Especialista en perros ansiosos · 312 salidas realizadas',
    badge: '50 dueños repiten',
    bio: 'Llevo cuatro años trabajando con perros, y me especialicé en ansiedad de separación porque tuve el mío propio...',
    photo: 'caregiver-maria.png',
    tagline:
      'Cuéntame si tu perro tiene miedos concretos, cómo reacciona con otros perros, y qué le ayuda a calmarse. Así puedo prepararme antes de la primera salida.',
    reviewsCount: 150,
    about:
      'Llevo cuatro años trabajando con perros, y me especialicé en ansiedad porque tuve el mío propio. Sé lo que es no saber qué le pasa a tu perro, y también sé que con paciencia, casi todos pueden aprender a estar tranquilos.',
    priority:
      'Que tu perro avance a su propio ritmo, nunca al mío. Un paso pequeño hoy vale más que forzar uno grande.',
    sessions: [
      {
        title: 'Cada salida',
        body: 'Identifico qué puede detonar su ansiedad, sea dentro de casa o fuera, según lo que le afecta a tu perro en concreto.',
        icon: 'clipboard',
      },
      {
        title: 'Semana a semana',
        body: 'Aumentamos poco a poco el tiempo de exposición a eso que le altera, según lo que tolera, siempre con refuerzo positivo.',
        icon: 'chart',
      },
      {
        title: 'Con el tiempo',
        body: 'Tarda menos en calmarse y gana confianza real, no solo se acostumbra.',
        icon: 'hourglass',
      },
    ],
    reviewsHeading: 'Aquí también empezaron con un perro que no sabían cómo ayudar',
    reviews: [
      {
        owner: 'Dueño de Calletano',
        text: 'Pensé que Luna nunca iba a poder cruzarse con otro perro sin ladrar. Llevamos dos meses y ayer se cruzó con uno tranquila.',
        date: 'Agosto 10, 2026',
        avatar: '1',
        photo: 'reviews/ansiedad-calletano.png',
        video: 'reviews/ansiedad-calletano.mp4',
        objectPosition: '50% 49.9%',
      },
      {
        owner: 'Dueña de Roko',
        text: 'Lo que más valoro es que nunca fuerza nada. Si Roko no está listo para algo, lo deja para la próxima sesión.',
        date: 'Mayo 20, 2026',
        avatar: '2',
        photo: 'reviews/ansiedad-roko.png',
        video: 'reviews/ansiedad-roko.mp4',
        objectPosition: '50% 69.6%',
      },
      {
        owner: 'Dueño de Kiwi',
        text: 'Me explica cómo le va a Kiwi después de cada salida, no solo si salió bien o mal. Eso me ayudó a entenderlo mejor yo también.',
        date: 'Junio 7, 2026',
        avatar: '3',
        photo: 'reviews/ansiedad-kiwi.png',
        objectPosition: '50% 77.2%',
      },
      {
        owner: 'Dueña de Nala',
        text: 'Nala llegó a las sesiones mordiendo la correa de puros nervios. Ahora la primera media hora ya está relajada.',
        date: 'Septiembre 19, 2026',
        avatar: '1',
        photo: 'reviews/ansiedad-nala.png',
        video: 'reviews/ansiedad-nala.mp4',
        objectPosition: '50% 91%',
      },
      {
        owner: 'Dueño de Toby',
        text: 'No es magia, es paciencia. Con Toby se nota semana a semana, que se queda más tranquilo en casa cuando se queda solo.',
        date: 'Julio 15, 2026',
        avatar: '2',
        photo: 'reviews/ansiedad-toby.png',
        video: 'reviews/ansiedad-toby.mp4',
        objectPosition: '50% 50%',
      },
    ],
  },
  {
    id: 'andres',
    name: 'Andrés Eduardo Peralta',
    specialty: 'Especialista en perros reactivos · 220 salidas realizadas',
    badge: '58 dueños repiten',
    bio: 'Leo las señales de tu perro antes de que la tensión escale, y trabajo con calma la distancia y el control...',
    photo: 'caregiver-andres.png',
    tagline:
      'Cuéntame qué situaciones lo alteran (otros perros, ruidos, desconocidos) y cómo suele reaccionar, para saber qué evitar y qué trabajar con calma.',
    reviewsCount: 200,
    about:
      'Tres años especializándome en perros reactivos. Aprendí a leer las señales antes de que la tensión escale, y a dar a cada perro la distancia que necesita para sentirse seguro.',
    priority:
      'Que tu perro deje de sentir que tiene que reaccionar. La calma se construye, no se exige.',
    sessions: [
      {
        title: 'Cada salida',
        body: 'Identifico su umbral: la distancia a la que puede ver lo que lo altera sin reaccionar.',
        icon: 'clipboard',
      },
      {
        title: 'Semana a semana',
        body: 'Trabajamos esa distancia, premiando cada señal de calma.',
        icon: 'chart',
      },
      {
        title: 'Con el tiempo',
        body: 'La distancia se acorta, y tarda más en reaccionar cuando algo lo sobresalta.',
        icon: 'hourglass',
      },
    ],
    reviewsHeading: 'Aquí también empezaron avanzando poco a poco, con la guía correcta',
    reviews: [
      {
        owner: 'Dueño de Zeus',
        text: 'Zeus reacciona a otros perros desde lejos. Andrés sabe exactamente a qué distancia trabajar sin que se dispare.',
        date: 'Agosto 10, 2026',
        avatar: '1',
        photo: 'reviews/reactivos-zeus.png',
        video: 'reviews/reactivos-zeus.mp4',
        objectPosition: '50% 61%',
      },
      {
        owner: 'Dueña de Kira',
        text: 'Antes evitábamos cruzarnos con nadie en la calle. Ahora Kira puede ver a otro perro pasar sin explotar. Y guiarla con refuerzo positivo.',
        date: 'Mayo 20, 2026',
        avatar: '2',
        photo: 'reviews/reactivos-kira.png',
        video: 'reviews/reactivos-kira.mp4',
        objectPosition: '50% 50%',
      },
      {
        owner: 'Dueño de Rex',
        text: "Lo que más me tranquiliza es que Andrés nunca arriesga una situación solo para 'probar'.",
        date: 'Junio 7, 2026',
        avatar: '3',
        photo: 'reviews/reactivos-rex.png',
        video: 'reviews/reactivos-rex.mp4',
        objectPosition: '41.7% 94.2%',
      },
      {
        owner: 'Dueña de Oscar',
        text: 'No lo expone a lo que le altera de golpe. Va aumentando la exposición poco a poco, y eso se nota semana a semana.',
        date: 'Septiembre 19, 2026',
        avatar: '1',
        photo: 'reviews/reactivos-oscar.png',
        video: 'reviews/reactivos-oscar.mp4',
        objectPosition: '50% 50%',
      },
      {
        owner: 'Dueño de Nano',
        text: 'Nano mordió a alguien antes de empezar con Andrés. Hoy todavía tiene sus límites, pero me alivia contar con alguien que sabe con....',
        date: 'Julio 15, 2026',
        avatar: '2',
        photo: 'reviews/reactivos-nano.png',
        video: 'reviews/reactivos-nano.mp4',
        objectPosition: '50% 43.7%',
      },
    ],
  },
  {
    id: 'javier',
    name: 'Javier Ramírez',
    specialty: 'Especialista en perros activos · 148 salidas realizadas',
    badge: '58 dueños repiten',
    bio: 'Combino ejercicio físico con comandos y estímulos mentales, no solo cansarlo caminando...',
    photo: 'caregiver-javier.png',
    tagline:
      'Cuéntame su nivel de energía real y si conoce ya algunos comandos básicos. Así preparo salidas que lo reten sin frustrarlo.',
    reviewsCount: 130,
    about:
      '5 años trabajando con perros de alta energía, muchos de razas que necesitan mente y cuerpo ocupados. No creo en cansar a un perro sin más, creo en darle algo que valga la pena hacer.',
    priority:
      'Que la energía de tu perro tenga un propósito. Un perro cansado con la mente ocupada duerme mejor que uno solo agotado.',
    sessions: [
      {
        title: 'Cada salida',
        body: 'Empezamos con un ejercicio corto de obediencia para centrar su energía, y seguimos con exploración o juego.',
        icon: 'clipboard',
      },
      {
        title: 'Semana a semana',
        body: 'Subo el nivel de los retos mentales según lo que ya domina.',
        icon: 'chart',
      },
      {
        title: 'Con el tiempo',
        body: 'Responde mejor incluso muy activado, y gasta energía con propósito, no solo corriendo sin parar.',
        icon: 'hourglass',
      },
    ],
    reviewsHeading: 'Aquí también empezaron buscando algo más que un paseo cualquiera',
    reviews: [
      {
        owner: 'Dueño de Milo',
        text: 'Milo tiene la mala costumbre de comer palos, por eso lleva el bozal en las salidas. Pero se va avanzando con él para que suelte esa costumbre sesión a sesión.',
        date: 'Agosto 3, 2026',
        avatar: '1',
        photo: 'reviews/activos-milo.png',
        video: 'reviews/activos-milo.mp4',
        objectPosition: '50% 50%',
      },
      {
        owner: 'Dueña de Pepe',
        text: 'Aquí seguimos para que controle su emoción al saludar a las personas, reforzando saludos más tranquilos y positivos.',
        date: 'Junio 20, 2026',
        avatar: '2',
        photo: 'reviews/activos-pepe.png',
        video: 'reviews/activos-pepe.mp4',
        objectPosition: '50% 71.3%',
      },
      {
        owner: 'Dueña de Coco',
        text: 'No es solo correr. Javier le pone juegos de olfato al final para que también se canse la cabeza. Lo aplicaré para la próxima vez.',
        date: 'Agosto 2, 2026',
        avatar: '3',
        photo: 'reviews/activos-coco.png',
        video: 'reviews/activos-coco.mp4',
        objectPosition: '50% 50%',
      },
      {
        owner: 'Dueño de Simba',
        text: 'Con Simba estamos reforzando buenos hábitos durante los paseos para que aprenda a caminar sin jalar la correa y disfrute cada salida.',
        date: 'Marzo 16, 2026',
        avatar: '1',
        photo: 'reviews/activos-simba.png',
        video: 'reviews/activos-simba.mp4',
        objectPosition: '50% 74.7%',
      },
      {
        owner: 'Dueño de Bruno',
        text: 'Bruno necesitaba gastar energía de otra forma, no solo caminar más rápido. Javier entendió eso desde la primera sesión.',
        date: 'Abril 15, 2026',
        avatar: '2',
        photo: 'reviews/activos-bruno.png',
        video: 'reviews/activos-bruno.mp4',
        objectPosition: '50% 45.7%',
      },
    ],
  },
  {
    id: 'sofia',
    name: 'Sofía Gutiérrez',
    specialty: 'Especialista en perros con necesidades especiales · 501 salidas realizadas',
    badge: '60 dueños repiten',
    bio: 'Adapto cada salida a lo que tu perro puede hacer hoy, atenta a signos de dolor o cansancio...',
    photo: 'caregiver-sofia.png',
    tagline:
      'Cuéntame sus antecedentes médicos, si toma medicación, y qué señales suele dar cuando algo le duele o le cansa.',
    reviewsCount: 140,
    about:
      'Seis años acompañando perros mayores y con condiciones médicas. Aprendí que cada salida es distinta según cómo amanece el perro, y que escuchar eso importa más que cumplir un recorrido.',
    priority:
      'Que tu perro siga moviéndose con dignidad, sin dolor y sin prisas, el tiempo que haga falta.',
    sessions: [
      {
        title: 'Cada salida',
        body: 'Reviso cómo está ese día antes de decidir el ritmo.',
        icon: 'clipboard',
      },
      {
        title: 'Semana a semana',
        body: 'Ajusto duración e intensidad según su evolución, nunca un recorrido fijo.',
        icon: 'chart',
      },
      {
        title: 'Con el tiempo',
        body: 'Llego a conocer su patrón mejor que nadie, y me anticipo antes de que algo empeore.',
        icon: 'hourglass',
      },
    ],
    reviewsHeading: 'Aquí también aprendieron a acompañar a su perro a su ritmo',
    reviews: [
      {
        owner: 'Dueño de Tana',
        text: 'Tana es ciega de nacimiento. Sin embargo eso no lo detiene para jugar con la pelota. Reforzando con comandos de voz mientras se...',
        date: 'Agosto 10, 2026',
        avatar: '1',
        photo: 'reviews/especiales-tana.png',
        video: 'reviews/especiales-tana.mp4',
        objectPosition: '50% 40%',
      },
      {
        owner: 'Dueña de Cris',
        text: 'Es muy reconfortante para mí saber que mi perrita está en buenas manos, que sabe de ella y manejar su carrito de ruedas con...',
        date: 'Mayo 20, 2026',
        avatar: '2',
        photo: 'reviews/especiales-cris.png',
        video: 'reviews/especiales-cris.mp4',
        objectPosition: '50% 50%',
      },
      {
        owner: 'Dueño de Pancho',
        text: 'Vivir sola con mi perrito a veces puede ser difícil, pero contar con una red de cuidadores que entienden sus necesidades y me...',
        date: 'Junio 7, 2026',
        avatar: '3',
        photo: 'reviews/especiales-pancho.png',
        video: 'reviews/especiales-pancho.mp4',
        objectPosition: '50% 50%',
      },
      {
        owner: 'Dueña de Maru',
        text: 'Luna ya es mayor y se cansa distinto cada semana. Sofía siempre sigue su ritmo y la cuida en el proceso debido a su artritis.',
        date: 'Septiembre 19, 2026',
        avatar: '1',
        photo: 'reviews/especiales-maru.png',
        video: 'reviews/especiales-maru.mp4',
        objectPosition: '50% 50%',
      },
      {
        owner: 'Dueño de Wilson',
        text: 'Aunque mi perrito sigue recuperándose de su operación de cadera, me sorprende cada día con su energía, determinación y capac...',
        date: 'Julio 15, 2026',
        avatar: '2',
        photo: 'reviews/especiales-wilson.png',
        video: 'reviews/especiales-wilson.mp4',
        objectPosition: '50% 50%',
      },
    ],
  },
]

export const DEFAULT_CAREGIVER_ID = CAREGIVERS[0]?.id ?? 'maria'

export function findCaregiver(id: string | undefined): Caregiver {
  return CAREGIVERS.find((caregiver) => caregiver.id === id) ?? CAREGIVERS[0]!
}

/** Minimal address shape used to seed demo “zone” results. */
export type CaregiverAddressSeed = {
  id?: string
  lat: number
  lng: number
  tag: string
}

function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle<T>(items: readonly T[], rand: () => number): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const a = next[i]!
    const b = next[j]!
    next[i] = b
    next[j] = a
  }
  return next
}

/**
 * Demo search results by address.
 * The first saved address keeps the full canonical list; any extra address gets a
 * deterministic shuffle + subset (2–4) so the same place always shows the same “zone”.
 */
export function caregiversForAddress(
  address: CaregiverAddressSeed | null,
  savedAddresses: readonly CaregiverAddressSeed[],
): Caregiver[] {
  if (!address || !savedAddresses.length) return [...CAREGIVERS]

  const primary = savedAddresses[0]
  const isPrimary = primary
    ? primary.id && address.id
      ? primary.id === address.id
      : primary.lat === address.lat &&
        primary.lng === address.lng &&
        primary.tag === address.tag
    : false
  if (isPrimary) return [...CAREGIVERS]

  const seed = hashSeed(
    address.id
      ? `id:${address.id}`
      : `${address.lat.toFixed(5)},${address.lng.toFixed(5)}|${address.tag.toLowerCase()}`,
  )
  const rand = mulberry32(seed)
  const shuffled = seededShuffle(CAREGIVERS, rand)
  const count = Math.min(shuffled.length, 2 + Math.floor(rand() * 3))
  return shuffled.slice(0, count)
}
