import { z } from 'zod'

/** Texto opcional: vacío → null. */
export const textoOpcional = (max: number, mensaje = 'El texto es demasiado largo.') =>
  z.string().trim().max(max, mensaje).transform(v => (v === '' ? null : v))

/** Número entero positivo opcional (los campos de formulario llegan como texto). */
export const enteroOpcional = (etiqueta: string, max: number) =>
  z
    .string()
    .trim()
    .transform(v => (v === '' ? null : Number(v.replace(',', '.'))))
    .refine(v => v === null || (Number.isInteger(v) && v >= 1 && v <= max), `${etiqueta} debe ser un número entero entre 1 y ${max}.`)

/** Importe en pesos (acepta 1500000, 1.500.000 o 1500000,50). */
export function aNumero(v: string): number {
  const limpio = v.trim().replace(/\s/g, '')
  // Si tiene coma decimal, los puntos son separadores de miles.
  const normal = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(limpio) ? limpio.replace(/\./g, '') : limpio
  return Number(normal)
}
export const dineroOpcional = (etiqueta: string) =>
  z
    .string()
    .trim()
    .transform(v => (v === '' ? null : aNumero(v)))
    .refine(v => v === null || (Number.isFinite(v) && v > 0 && v < 1e11), `${etiqueta} no es válido.`)
export const dineroRequerido = (etiqueta: string) =>
  z
    .string()
    .trim()
    .min(1, `Ingresá ${etiqueta.toLowerCase()}.`)
    .transform(aNumero)
    .refine(v => Number.isFinite(v) && v > 0 && v < 1e11, `${etiqueta} no es válido.`)

export const CUIT = /^\d{2}-?\d{8}-?\d$/
export const cuitRequerido = z.string().trim().regex(CUIT, 'Ingresá un CUIT válido (11 dígitos, ej. 30-12345678-9).')
export const cuitOpcional = z
  .string()
  .trim()
  .refine(v => v === '' || CUIT.test(v), 'Ingresá un CUIT válido (11 dígitos, ej. 30-12345678-9).')
  .transform(v => (v === '' ? null : v))
