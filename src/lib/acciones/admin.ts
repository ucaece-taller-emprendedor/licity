import { deleteField, doc, updateDoc, writeBatch } from 'firebase/firestore'
import type { EstadoCuenta } from '@/config/app'
import type { Con } from '@/hooks/useColeccion'
import { db } from '@/lib/firebase'
import type { Obra, Oferta } from '@/lib/tipos'
import { agregarAviso } from './base'

/** Aprueba o rechaza (con motivo) la verificación de un contratista y le avisa. */
export async function revisarVerificacion(uid: string, decision: 'APROBADO' | 'RECHAZADO', motivo?: string) {
  const lote = writeBatch(db)
  lote.update(doc(db, 'users', uid), decision === 'APROBADO' ? { verificacion: 'APROBADO', motivoRechazo: deleteField() } : { verificacion: 'RECHAZADO', motivoRechazo: motivo })
  agregarAviso(lote, uid, {
    titulo: decision === 'APROBADO' ? '¡Tu cuenta fue verificada!' : 'Tu verificación fue rechazada',
    cuerpo: decision === 'APROBADO' ? 'Ya podés ofertar en las obras abiertas.' : (motivo ?? null),
    href: '/app/contratista',
  })
  await lote.commit()
}

export async function cambiarEstadoCuenta(uid: string, status: EstadoCuenta) {
  await updateDoc(doc(db, 'users', uid), { status })
}

export async function resolverReporte(obraId: string) {
  await updateDoc(doc(db, 'obras', obraId), { reportadaEn: null, motivoReporte: null, reportadaPor: null })
}

/** Cancela una obra por moderación y deja sin efecto sus ofertas vigentes. */
export async function cancelarObraAdmin(obra: Con<Obra>, ofertas: Con<Oferta>[], motivo: string) {
  const lote = writeBatch(db)
  lote.update(doc(db, 'obras', obra.id), { estado: 'CANCELADA', motivoCancelacion: `Moderación: ${motivo}` })
  for (const o of ofertas.filter(x => x.estado === 'PENDIENTE' || x.estado === 'ACEPTADA')) lote.update(doc(db, 'ofertas', o.id), { estado: 'RECHAZADA' })
  const destinos = new Set<string>([obra.clienteId, ...ofertas.map(o => o.contratistaId)])
  for (const para of destinos) agregarAviso(lote, para, { titulo: 'Una obra fue cancelada por Licity', cuerpo: `"${obra.titulo}": ${motivo}`, obraId: obra.id })
  await lote.commit()
}
