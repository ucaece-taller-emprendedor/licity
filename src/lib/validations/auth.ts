import { z } from 'zod'
import { cuitOpcional, cuitRequerido, textoOpcional } from './comunes'

const email = z.string().trim().toLowerCase().pipe(z.email('Ingresá un email válido.'))
const clave = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(100, 'La contraseña es demasiado larga.')
const nombre = z.string().trim().min(2, 'Ingresá tu nombre.').max(80, 'El nombre es demasiado largo.')

export const loginSchema = z.object({ email, clave: z.string().min(1, 'Ingresá tu contraseña.') })
export const recuperarSchema = z.object({ email })

// Datos de la empresa (PyME) o del contratista, según el tipo elegido.
const datosPyme = {
  rol: z.literal('pyme'),
  nombreEmpresa: z.string().trim().min(2, 'Ingresá el nombre de tu empresa.').max(120, 'Es demasiado largo.'),
  cuit: cuitOpcional,
  ciudad: z.string().trim().min(2, 'Ingresá tu ciudad.').max(80, 'Es demasiado largo.'),
  telefono: textoOpcional(40),
}
const datosContratista = {
  rol: z.literal('contratista'),
  nombreEmpresa: z.string().trim().min(2, 'Ingresá tu nombre o razón social.').max(120, 'Es demasiado largo.'),
  cuit: cuitRequerido,
  especialidad: z.string().trim().min(2, 'Ingresá tu especialidad.').max(80, 'Es demasiado larga.'),
  ciudad: z.string().trim().min(2, 'Ingresá tu ciudad.').max(80, 'Es demasiado largo.'),
  zona: textoOpcional(160),
  descripcion: textoOpcional(1000),
  telefono: textoOpcional(40),
  anios: z
    .string()
    .trim()
    .transform(v => (v === '' ? null : Number(v)))
    .refine(v => v === null || (Number.isInteger(v) && v >= 0 && v <= 80), 'Los años de experiencia deben ser un número entre 0 y 80.'),
}

export const registroSchema = z.discriminatedUnion('rol', [
  z.object({ nombre, email, clave, ...datosPyme }),
  z.object({ nombre, email, clave, ...datosContratista }),
])

/** Para quien ingresó con Google y todavía no tiene cuenta en Licity. */
export const completarSchema = z.discriminatedUnion('rol', [z.object({ nombre, ...datosPyme }), z.object({ nombre, ...datosContratista })])

export const perfilPymeSchema = z.object({
  nombreEmpresa: datosPyme.nombreEmpresa,
  cuit: datosPyme.cuit,
  ciudad: datosPyme.ciudad,
  telefono: datosPyme.telefono,
})
export const perfilContratistaSchema = z.object({
  nombreEmpresa: datosContratista.nombreEmpresa,
  cuit: datosContratista.cuit,
  especialidad: datosContratista.especialidad,
  ciudad: datosContratista.ciudad,
  zona: datosContratista.zona,
  descripcion: datosContratista.descripcion,
  telefono: datosContratista.telefono,
  anios: datosContratista.anios,
})

export type DatosRegistro = z.infer<typeof registroSchema>
export type DatosCompletar = z.infer<typeof completarSchema>
