import type { Timestamp } from 'firebase/firestore'

const ZONA = 'America/Argentina/Buenos_Aires'
const dinero = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export function formatoDinero(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : dinero.format(v)
}

function aFecha(v: Timestamp | Date | string | null | undefined): Date | null {
  if (!v) return null
  if (typeof v === 'string') return new Date(v.length === 10 ? `${v}T12:00:00` : v)
  return v instanceof Date ? v : v.toDate()
}

export function formatoFecha(v: Timestamp | Date | string | null | undefined): string {
  const d = aFecha(v)
  return d ? new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeZone: ZONA }).format(d) : '—'
}

export function formatoFechaHora(v: Timestamp | Date | string | null | undefined): string {
  const d = aFecha(v)
  return d ? new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short', timeZone: ZONA }).format(d) : '—'
}

export function formatoPorcentaje(v: number): string {
  return `${(v * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`
}

/** Milisegundos de un Timestamp (0 si todavía no se resolvió el serverTimestamp). */
export function ms(v: Timestamp | null | undefined): number {
  return v ? v.toMillis() : Number.MAX_SAFE_INTEGER
}
