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
  photo: string
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
  reviews: CaregiverReview[]
}

/** Mock caregivers for search + profile — Figma 120:6900 / 160:4038 / 180:5520+ */
export const CAREGIVERS: Caregiver[] = [
  {
    id: 'maria',
    name: 'María Camila Rodriguez',
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
    reviews: [
      {
        owner: 'Dueña de Luna',
        text: 'Luna temblaba solo con oír la correa. María fue con una calma que yo no sabía transmitir.',
        date: 'Agosto 12, 2026',
        avatar: '2',
        photo: 'review-1.png',
      },
      {
        owner: 'Dueño de Toby',
        text: 'Antes no podíamos dejarlo solo ni cinco minutos. Ahora aguanta la mañana entera.',
        date: 'Julio 2, 2026',
        avatar: '1',
        photo: 'review-2.png',
      },
      {
        owner: 'Dueña de Nala',
        text: 'No fuerza nada. Cada semana un pasito, y Nala ya saluda sin esconderse.',
        date: 'Junio 18, 2026',
        avatar: '3',
        photo: 'review-3.png',
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
    reviews: [
      {
        owner: 'Dueño de Zeus',
        text: 'Zeus reacciona a otros perros desde lejos. Andrés sabe exactamente a qué distancia trabajar sin que se dispare.',
        date: 'Agosto 10, 2026',
        avatar: '1',
        photo: 'review-1.png',
      },
      {
        owner: 'Dueña de Kira',
        text: 'Antes evitábamos cruzarnos con nadie en la calle. Ahora Kira puede ver a otro perro pasar sin explotar.',
        date: 'Mayo 20, 2026',
        avatar: '2',
        photo: 'review-2.png',
      },
      {
        owner: 'Dueño de Rex',
        text: "Lo que más me tranquiliza es que Andrés nunca arriesga una situación solo para 'probar'.",
        date: 'Junio 7, 2026',
        avatar: '3',
        photo: 'review-3.png',
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
    reviews: [
      {
        owner: 'Dueño de Milo',
        text: 'Milo tiene la mala costumbre de comer palos, por eso lleva el bozal. Pero se va trabajando sesión a sesión.',
        date: 'Agosto 3, 2026',
        avatar: '1',
        photo: 'review-1.png',
      },
      {
        owner: 'Dueña de Coco',
        text: 'Por fin duerme la siesta. Javier le da trabajo de cabeza, no solo kilómetros.',
        date: 'Julio 22, 2026',
        avatar: '2',
        photo: 'review-2.png',
      },
      {
        owner: 'Dueño de Rocky',
        text: 'Rocky llega cansado y contento. Antes solo llegaba agitado.',
        date: 'Junio 30, 2026',
        avatar: '3',
        photo: 'review-3.png',
      },
    ],
  },
  {
    id: 'sofia',
    name: 'Sofía Gutierrez',
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
    reviews: [
      {
        owner: 'Dueño de Calletano',
        text: 'Con artrosis avanzada, Sofía adapta cada paseo. Él vuelve más calmado, no más dolorido.',
        date: 'Agosto 8, 2026',
        avatar: '1',
        photo: 'review-2.png',
      },
      {
        owner: 'Dueña de Miel',
        text: 'Miel es ciega. Sofía lee el entorno por ella y nunca la apura.',
        date: 'Julio 14, 2026',
        avatar: '2',
        photo: 'review-1.png',
      },
      {
        owner: 'Dueño de Teo',
        text: 'Después de la operación, Sofía fue la única en quien confiamos para sacarlo.',
        date: 'Junio 5, 2026',
        avatar: '3',
        photo: 'review-3.png',
      },
    ],
  },
]
