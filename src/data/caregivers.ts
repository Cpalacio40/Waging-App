export type Caregiver = {
  id: string
  name: string
  specialty: string
  badge: string
  bio: string
  photo: string
}

/** Mock caregivers for search results — Figma iPhone 13 & 14 - 4 (120:6900). */
export const CAREGIVERS: Caregiver[] = [
  {
    id: 'maria',
    name: 'María Camila Rodriguez',
    specialty: 'Especialista en perros ansiosos · 312 salidas realizadas',
    badge: '50 dueños repiten',
    bio: 'Llevo cuatro años trabajando con perros, y me especialicé en ansiedad de separación porque tuve el mío propio...',
    photo: 'caregiver-maria.png',
  },
  {
    id: 'andres',
    name: 'Andrés Eduardo Peralta',
    specialty: 'Especialista en perros reactivos · 220 salidas realizadas',
    badge: '58 dueños repiten',
    bio: 'Leo las señales de tu perro antes de que la tensión escale, y trabajo con calma la distancia y el control...',
    photo: 'caregiver-andres.png',
  },
  {
    id: 'javier',
    name: 'Javier Ramírez',
    specialty: 'Especialista en perros activos · 148 salidas realizadas',
    badge: '58 dueños repiten',
    bio: 'Combino ejercicio físico con comandos y estímulos mentales, no solo cansarlo caminando...',
    photo: 'caregiver-javier.png',
  },
  {
    id: 'sofia',
    name: 'Sofía Gutierrez',
    specialty: 'Especialista en perros con necesidades especiales · 501 salidas realizadas',
    badge: '60 dueños repiten',
    bio: 'Adapto cada salida a lo que tu perro puede hacer hoy, atenta a signos de dolor o cansancio...',
    photo: 'caregiver-sofia.png',
  },
]
