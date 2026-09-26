import type { SummaryResponse } from '@/data/dashboard'

export const summaryFixture: SummaryResponse = {
  educator: {
    firstName: 'Loreto',
    fullName: 'Loreto Castillo',
    role: 'Educadora diferencial',
    initials: 'LC',
  },
  greetingDateLabel: 'Sábado, 26 de septiembre de 2026',
  demoToday: '2026-09-26',
  demoWeekStart: '2026-09-21',
  stats: [
    {
      id: 'today',
      label: 'Citas de hoy',
      value: '2',
      hint: 'de 3 cupos disponibles',
      icon: 'calendar',
    },
    {
      id: 'confirmed',
      label: 'Confirmadas',
      value: '1',
      hint: '50% de tus citas',
      icon: 'check',
    },
    {
      id: 'pending',
      label: 'Por confirmar',
      value: '1',
      hint: 'Requiere seguimiento',
      icon: 'clock',
    },
    {
      id: 'families',
      label: 'Familias activas',
      value: '14',
      hint: '+2 este mes',
      icon: 'users',
    },
  ],
  sessions: [
    {
      id: 's1',
      date: '2026-09-26',
      time: '19:00',
      duration: '1 hora',
      childName: 'Mateo González',
      guardianName: 'Camila González',
      initials: 'MG',
      status: 'pendiente',
    },
    {
      id: 's2',
      date: '2026-09-26',
      time: '20:00',
      duration: '1 hora',
      childName: 'Emilia Rojas',
      guardianName: 'Francisca Rojas',
      initials: 'ER',
      status: 'confirmada',
    },
  ],
  availableSlot: {
    date: '2026-09-26',
    time: '21:00',
    title: 'Cupo disponible',
    hint: 'Listo para reservar',
  },
  attentionItems: [
    {
      id: 'a1',
      childName: 'Mateo González',
      detail: 'Sesión hoy a las 19:00',
      statusLabel: 'Esperando confirmación',
    },
  ],
  activities: [
    {
      id: 'act1',
      kind: 'confirmacion',
      title: 'Emilia Rojas confirmó su sesión',
      meta: 'Hoy, 10:32 · Sábado 26 de septiembre a las 20:00',
      badge: 'Confirmación',
    },
    {
      id: 'act2',
      kind: 'nueva_reserva',
      title: 'Se reservó una nueva sesión',
      meta: 'Ayer, 18:45 · Mateo González · Sábado 26 de septiembre',
      badge: 'Nueva reserva',
    },
  ],
  quote: {
    text: 'Cada pequeño paso cuenta en el proceso de acompañar.',
    attribution: 'Tu espacio de apoyo',
  },
}
