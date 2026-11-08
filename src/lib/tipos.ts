import type { Timestamp } from 'firebase/firestore'
import type { EstadoObra, EstadoOferta, Verificacion } from '@/config/app'

export type Fecha = Timestamp | null

export type PerfilPyme = { nombreEmpresa: string; cuit: string | null; ciudad: string; telefono: string | null }
export type PerfilContratista = {
  nombreEmpresa: string
  cuit: string
  especialidad: string
  ciudad: string
  zona: string | null
  descripcion: string | null
  telefono: string | null
  anios: number | null
}

export type Obra = {
  clienteId: string
  clienteNombre: string
  titulo: string
  descripcion: string
  categoria: string
  ciudad: string
  fechaInicio: string | null
  plazoDias: number | null
  presupuesto: number | null
  estado: EstadoObra
  avance: number
  contratistaId: string | null
  contratistaNombre: string | null
  ofertaId: string | null
  montoAdjudicado: number | null
  publicadaEn: Fecha
  adjudicadaEn: Fecha
  iniciadaEn: Fecha
  contratistaTerminoEn: Fecha
  finalizadaEn: Fecha
  reportadaEn: Fecha
  motivoReporte: string | null
  reportadaPor: string | null
  motivoCancelacion: string | null
  isDemo: boolean
}

export type Oferta = {
  obraId: string
  obraTitulo: string
  clienteId: string
  contratistaId: string
  contratistaNombre: string
  especialidad: string
  ciudad: string
  anios: number | null
  monto: number
  descripcion: string
  plazoDias: number
  notas: string | null
  estado: EstadoOferta
  creadaEn: Fecha
  isDemo: boolean
}

export type Pago = {
  obraId: string
  clienteId: string
  contratistaId: string
  montoFinal: number
  tasaComision: number
  comisionMonto: number
  estado: 'REGISTRO_DE_PRUEBA'
  finalizadaEn: Fecha
  isDemo: boolean
}

export type Novedad = {
  tipo: 'ESTADO' | 'AVANCE' | 'NOTA'
  estadoHacia: EstadoObra | null
  avance: number | null
  mensaje: string | null
  autorId: string
  autorNombre: string
  creadaEn: Fecha
}

export type Notificacion = { usuarioId: string; titulo: string; cuerpo: string | null; href: string | null; obraId: string | null; leida: boolean; creadaEn: Fecha }

export type CuentaUsuario = {
  email: string
  displayName: string
  role: 'pyme' | 'contratista' | 'admin'
  status: 'activo' | 'suspendido'
  verificacion?: Verificacion
  motivoRechazo?: string
  isDemo: boolean
}
