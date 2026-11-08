import { doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import type { Con } from '@/hooks/useColeccion'
import { db } from '@/lib/firebase'
import type { Obra, Oferta, PerfilContratista } from '@/lib/tipos'
import type { OfertaForm } from '@/lib/validations/obras'
import { agregarAviso, agregarNovedad, type Autor } from './base'

/**
 * Envía una oferta (id `${obraId}_${uid}`: una por contratista y obra). Si es la primera oferta de la obra,
 * el mismo batch la pasa a RECIBIENDO_OFERTAS. Si había retirado la suya, se vuelve a enviar sobre la misma.
 */
export async function enviarOferta(obra: Con<Obra>, uid: string, perfil: PerfilContratista, d: OfertaForm, anterior?: Con<Oferta>) {
  const id = `${obra.id}_${uid}`
  if (anterior) {
    await updateDoc(doc(db, 'ofertas', id), { estado: 'PENDIENTE', monto: d.monto, plazoDias: d.plazoDias, descripcion: d.descripcion, notas: d.notas, creadaEn: serverTimestamp() })
    return
  }
  const lote = writeBatch(db)
  lote.set(doc(db, 'ofertas', id), {
    obraId: obra.id,
    obraTitulo: obra.titulo,
    clienteId: obra.clienteId,
    contratistaId: uid,
    contratistaNombre: perfil.nombreEmpresa,
    especialidad: perfil.especialidad,
    ciudad: perfil.ciudad,
    anios: perfil.anios,
    monto: d.monto,
    descripcion: d.descripcion,
    plazoDias: d.plazoDias,
    notas: d.notas,
    estado: 'PENDIENTE',
    creadaEn: serverTimestamp(),
    isDemo: false,
  })
  if (obra.estado === 'PUBLICADA') lote.update(doc(db, 'obras', obra.id), { estado: 'RECIBIENDO_OFERTAS' })
  agregarAviso(lote, obra.clienteId, { titulo: 'Recibiste una oferta', cuerpo: `${perfil.nombreEmpresa} ofertó en "${obra.titulo}".`, href: `/app/pyme/obras/${obra.id}`, obraId: obra.id })
  await lote.commit()
}

export async function retirarOferta(oferta: Con<Oferta>) {
  const lote = writeBatch(db)
  lote.update(doc(db, 'ofertas', oferta.id), { estado: 'RETIRADA' })
  agregarAviso(lote, oferta.clienteId, { titulo: 'Un contratista retiró su oferta', cuerpo: `${oferta.contratistaNombre} retiró su oferta de "${oferta.obraTitulo}".`, href: `/app/pyme/obras/${oferta.obraId}`, obraId: oferta.obraId })
  await lote.commit()
}

export async function iniciarObra(obra: Con<Obra>, autor: Autor) {
  const lote = writeBatch(db)
  lote.update(doc(db, 'obras', obra.id), { estado: 'EN_EJECUCION', iniciadaEn: serverTimestamp() })
  agregarNovedad(lote, obra.id, autor, { tipo: 'ESTADO', estadoHacia: 'EN_EJECUCION', mensaje: 'El contratista inició la ejecución.' })
  agregarAviso(lote, obra.clienteId, { titulo: 'Tu obra empezó', cuerpo: `${obra.contratistaNombre} inició "${obra.titulo}".`, href: `/app/pyme/obras/${obra.id}`, obraId: obra.id })
  await lote.commit()
}

export async function registrarAvance(obra: Con<Obra>, avance: number, mensaje: string, autor: Autor) {
  if (avance < obra.avance) throw new Error('El avance no puede ser menor al registrado.')
  const lote = writeBatch(db)
  lote.update(doc(db, 'obras', obra.id), { avance })
  agregarNovedad(lote, obra.id, autor, { tipo: 'AVANCE', avance, mensaje })
  agregarAviso(lote, obra.clienteId, { titulo: 'Nuevo avance de obra', cuerpo: `"${obra.titulo}" va al ${avance}%.`, href: `/app/pyme/obras/${obra.id}`, obraId: obra.id })
  await lote.commit()
}

export async function marcarTerminada(obra: Con<Obra>, autor: Autor) {
  const lote = writeBatch(db)
  lote.update(doc(db, 'obras', obra.id), { avance: 100, contratistaTerminoEn: serverTimestamp() })
  agregarNovedad(lote, obra.id, autor, { tipo: 'AVANCE', avance: 100, mensaje: 'El contratista marcó la obra como terminada. Esperando confirmación de la PyME.' })
  agregarAviso(lote, obra.clienteId, { titulo: 'Tu obra está terminada', cuerpo: `Confirmá la finalización de "${obra.titulo}".`, href: `/app/pyme/obras/${obra.id}`, obraId: obra.id })
  await lote.commit()
}

export async function reportarObra(obra: Con<Obra>, uid: string, motivo: string) {
  await updateDoc(doc(db, 'obras', obra.id), { reportadaEn: serverTimestamp(), motivoReporte: motivo, reportadaPor: uid })
}

export async function pedirRevisionNuevamente(uid: string) {
  await updateDoc(doc(db, 'users', uid), { verificacion: 'PENDIENTE' })
}
