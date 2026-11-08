// ──────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE LICITY — marca, roles, estados y textos que se repiten en la app.
// Los colores y la tipografía están en src/styles/tema.css.
// Si cambiás roles o estados, hay que cambiarlos TAMBIÉN en firestore.rules y en tests/rules.
// ──────────────────────────────────────────────────────────────────────────

export const MARCA = {
  nombre: 'Licity',
  eslogan: 'Obras conectadas.',
  logo: '/logo.svg',
  contacto: 'licity@gmail.com',
}

/** PyME = quien publica obras (antes CLIENT). Contratista = quien oferta (antes BUSINESS). */
export type Rol = 'pyme' | 'contratista' | 'admin'
export type EstadoCuenta = 'activo' | 'suspendido'
export type Verificacion = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
export type Tono = 'neutro' | 'info' | 'aviso' | 'ok' | 'peligro'

export type RolRegistrable = Exclude<Rol, 'admin'>

export const ROLES_REGISTRABLES: {
  rol: RolRegistrable
  etiqueta: string
  descripcion: string
  /** Panel al que va después de ingresar. */
  panel: string
}[] = [
  { rol: 'pyme', etiqueta: 'PyME', descripcion: 'Publicá tus obras, compará ofertas y elegí contratista. Es gratis.', panel: '/app/pyme' },
  { rol: 'contratista', etiqueta: 'Contratista', descripcion: 'Ofertá en obras reales. Licity verifica tu perfil antes de que puedas ofertar.', panel: '/app/contratista' },
]

export const ETIQUETA_ROL: Record<Rol, string> = { pyme: 'PyME', contratista: 'Contratista', admin: 'Superadministrador' }
export const ESTADOS_CUENTA: EstadoCuenta[] = ['activo', 'suspendido']

export function panelDe(rol: Rol): string {
  if (rol === 'admin') return '/admin'
  return ROLES_REGISTRABLES.find(r => r.rol === rol)?.panel ?? '/app'
}

// ── Dominio: obras, ofertas, pagos ────────────────────────────────────────

/** Comisión de referencia de Licity: 1,5 % del monto final, cobrada al contratista si la obra se termina. */
export const COMISION = 0.015

export const CATEGORIAS = [
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

export type EstadoObra = 'PUBLICADA' | 'RECIBIENDO_OFERTAS' | 'EVALUANDO' | 'ADJUDICADA' | 'EN_EJECUCION' | 'FINALIZADA' | 'CANCELADA'
export type EstadoOferta = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'RETIRADA'

export const ESTADO_OBRA: Record<EstadoObra, { etiqueta: string; tono: Tono }> = {
  PUBLICADA: { etiqueta: 'Publicada', tono: 'info' },
  RECIBIENDO_OFERTAS: { etiqueta: 'Recibiendo ofertas', tono: 'info' },
  EVALUANDO: { etiqueta: 'En evaluación', tono: 'aviso' },
  ADJUDICADA: { etiqueta: 'Adjudicada', tono: 'ok' },
  EN_EJECUCION: { etiqueta: 'En ejecución', tono: 'aviso' },
  FINALIZADA: { etiqueta: 'Finalizada', tono: 'ok' },
  CANCELADA: { etiqueta: 'Cancelada', tono: 'peligro' },
}

export const ESTADO_OFERTA: Record<EstadoOferta, { etiqueta: string; tono: Tono }> = {
  PENDIENTE: { etiqueta: 'Pendiente', tono: 'info' },
  ACEPTADA: { etiqueta: 'Aceptada', tono: 'ok' },
  RECHAZADA: { etiqueta: 'No seleccionada', tono: 'neutro' },
  RETIRADA: { etiqueta: 'Retirada', tono: 'neutro' },
}

export const VERIFICACION: Record<Verificacion, { etiqueta: string; tono: Tono }> = {
  PENDIENTE: { etiqueta: 'Verificación pendiente', tono: 'aviso' },
  APROBADO: { etiqueta: 'Verificado', tono: 'ok' },
  RECHAZADO: { etiqueta: 'Verificación rechazada', tono: 'peligro' },
}

/** Los pagos son SIMULADOS: no hay pasarela. Siempre se rotulan "Registro de prueba". */
export const ROTULO_PAGO = { etiqueta: 'Registro de prueba', tono: 'neutro' as Tono }
export const AVISO_PAGO =
  'Pago simulado: todavía no hay pasarela de pago. Este registro de prueba muestra el monto final y la comisión de referencia del 1,5 %, pero no mueve dinero.'

export const ESTADOS_ABIERTOS: EstadoObra[] = ['PUBLICADA', 'RECIBIENDO_OFERTAS']
export const PUEDE_ADJUDICAR: EstadoObra[] = ['RECIBIENDO_OFERTAS', 'EVALUANDO']
export const PUEDE_CANCELAR: EstadoObra[] = ['PUBLICADA', 'RECIBIENDO_OFERTAS', 'EVALUANDO', 'ADJUDICADA']

/** Credenciales DEMO públicas (las crea scripts/seed.ts solo en los emuladores). */
export const CLAVE_DEMO = 'Demo-Clave-2026'
