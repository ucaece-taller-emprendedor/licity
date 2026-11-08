import { z } from 'zod'
import { CATEGORIAS } from '@/config/app'
import { dineroOpcional, dineroRequerido, enteroOpcional, textoOpcional } from './comunes'

export const obraSchema = z.object({
  titulo: z.string().trim().min(5, 'El título debe tener al menos 5 caracteres.').max(120, 'El título es demasiado largo.'),
  categoria: z.enum(CATEGORIAS, { error: 'Elegí un tipo de obra.' }),
  descripcion: z.string().trim().min(20, 'Describí la obra con al menos 20 caracteres.').max(3000, 'La descripción es demasiado larga.'),
  ciudad: z.string().trim().min(2, 'Ingresá la ubicación.').max(120, 'La ubicación es demasiado larga.'),
  fechaInicio: z
    .string()
    .trim()
    .refine(v => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'La fecha de inicio no es válida.')
    .transform(v => (v === '' ? null : v)),
  plazoDias: enteroOpcional('El plazo estimado', 3650),
  presupuesto: dineroOpcional('El presupuesto estimado'),
})
export type ObraForm = z.infer<typeof obraSchema>

export const ofertaSchema = z.object({
  monto: dineroRequerido('El monto'),
  plazoDias: z
    .string()
    .trim()
    .min(1, 'Ingresá el plazo en días.')
    .transform(Number)
    .refine(v => Number.isInteger(v) && v >= 1 && v <= 3650, 'El plazo debe ser un número entero de días (1 a 3650).'),
  descripcion: z.string().trim().min(20, 'Detallá el alcance de tu propuesta (mínimo 20 caracteres).').max(3000, 'Es demasiado largo.'),
  notas: textoOpcional(1000),
})
export type OfertaForm = z.infer<typeof ofertaSchema>

export const avanceSchema = z.object({
  avance: z
    .string()
    .trim()
    .min(1, 'Ingresá el porcentaje de avance.')
    .transform(Number)
    .refine(v => Number.isInteger(v) && v >= 0 && v <= 99, 'El avance debe ser un entero entre 0 y 99. Para el 100 % usá "Marcar como terminada".'),
  mensaje: z.string().trim().min(3, 'Escribí una breve descripción del avance.').max(1000, 'Es demasiado largo.'),
})

export const reporteSchema = z.object({ motivo: z.string().trim().min(10, 'Contanos el motivo (mínimo 10 caracteres).').max(500, 'Es demasiado largo.') })
export const motivoOpcionalSchema = z.object({ motivo: textoOpcional(300) })
export const motivoRechazoSchema = z.object({ motivo: z.string().trim().min(5, 'Indicá el motivo del rechazo (mínimo 5 caracteres).').max(300, 'Es demasiado largo.') })
export const motivoCancelAdminSchema = z.object({ motivo: z.string().trim().min(5, 'Indicá el motivo (mínimo 5 caracteres).').max(300, 'Es demasiado largo.') })
