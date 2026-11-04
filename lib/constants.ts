import type { OfferStatus, Role, WorkStatus } from '@/lib/db/schema'

export const COMMISSION_RATE = 0.015

export const WORK_CATEGORIES = [
  'Reforma / ampliación',
  'Obra nueva',
  'Mantenimiento',
  'Electricidad',
  'Plomería y gas',
  'Pintura',
  'Albañilería',
  'Techos e impermeabilización',
  'Climatización',
  'Otro',
] as const

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger'

export const WORK_STATUS: Record<WorkStatus, { label: string; tone: Tone }> = {
  PUBLISHED: { label: 'Publicada', tone: 'info' },
  RECEIVING_OFFERS: { label: 'Recibiendo ofertas', tone: 'info' },
  EVALUATING: { label: 'En evaluación', tone: 'warning' },
  AWARDED: { label: 'Adjudicada', tone: 'success' },
  IN_PROGRESS: { label: 'En ejecución', tone: 'warning' },
  COMPLETED: { label: 'Finalizada', tone: 'success' },
  CANCELLED: { label: 'Cancelada', tone: 'danger' },
}

export const OFFER_STATUS: Record<OfferStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Pendiente', tone: 'info' },
  ACCEPTED: { label: 'Aceptada', tone: 'success' },
  REJECTED: { label: 'No seleccionada', tone: 'neutral' },
  WITHDRAWN: { label: 'Retirada', tone: 'neutral' },
}

export const VERIFICATION_STATUS: Record<
  'PENDING' | 'APPROVED' | 'REJECTED',
  { label: string; tone: Tone }
> = {
  PENDING: { label: 'Verificación pendiente', tone: 'warning' },
  APPROVED: { label: 'Verificado', tone: 'success' },
  REJECTED: { label: 'Verificación rechazada', tone: 'danger' },
}

export const PAYMENT_STATUS = {
  PENDING_GATEWAY: { label: 'Pendiente de pasarela de pago', tone: 'warning' as Tone },
  TEST_RECORD: { label: 'Registro de prueba', tone: 'neutral' as Tone },
}

export const ROLE_LABEL: Record<Role, string> = {
  SUPERADMIN: 'Superadministrador',
  BUSINESS: 'Contratista',
  CLIENT: 'PyME',
}

export const OPEN_FOR_OFFERS: WorkStatus[] = ['PUBLISHED', 'RECEIVING_OFFERS']
export const CAN_AWARD: WorkStatus[] = ['RECEIVING_OFFERS', 'EVALUATING']
export const CAN_CANCEL: WorkStatus[] = [
  'PUBLISHED',
  'RECEIVING_OFFERS',
  'EVALUATING',
  'AWARDED',
]
