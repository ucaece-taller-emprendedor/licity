import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { COMISION } from '@/config/app'
import type { Con } from '@/hooks/useColeccion'
import { db } from '@/lib/firebase'
import type { Obra, Oferta } from '@/lib/tipos'
import type { ObraForm } from '@/lib/validations/obras'
import { agregarAviso, agregarNovedad, type Autor } from './base'

/** Publica una obra nueva (queda PUBLICADA). El nombre de la empresa sale del perfil de la PyME. */
export async function publicarObra(uid: string, d: ObraForm): Promise<string> {
  const perfil = await getDoc(doc(db, 'perfiles', uid))
  const clienteNombre = perfil.data()?.nombreEmpresa as string | undefined
  if (!clienteNombre) throw new Error('Falta el perfil de la empresa.')
  const ref = await addDoc(collection(db, 'obras'), {
    clienteId: uid,
    clienteNombre,
    ...d,
    estado: 'PUBLICADA',
    avance: 0,
    contratistaId: null,
    contratistaNombre: null,
    ofertaId: null,
    montoAdjudicado: null,
    publicadaEn: serverTimestamp(),
    adjudicadaEn: null,
    iniciadaEn: null,
    contratistaTerminoEn: null,
    finalizadaEn: null,
    reportadaEn: null,
    motivoReporte: null,
    reportadaPor: null,
    motivoCancelacion: null,
    isDemo: false,
  })
  return ref.id
}

/** Edita los datos de una obra que todavía no recibió ofertas. */
export async function editarObra(id: string, d: ObraForm) {
  await updateDoc(doc(db, 'obras', id), { ...d })
}

/** Deja de aceptar ofertas nuevas y empieza la evaluación. */
export async function comenzarEvaluacion(obra: Con<Obra>, autor: Autor) {
  const lote = writeBatch(db)
  lote.update(doc(db, 'obras', obra.id), { estado: 'EVALUANDO' })
  agregarNovedad(lote, obra.id, autor, { tipo: 'ESTADO', estadoHacia: 'EVALUANDO', mensaje: 'La PyME comenzó a evaluar las ofertas.' })
  await lote.commit()
}

/** Adjudica la obra: acepta la oferta elegida y deja "no seleccionadas" a las demás pendientes. */
export async function adjudicar(obra: Con<Obra>, ganadora: Con<Oferta>, otras: Con<Oferta>[], autor: Autor) {
  const lote = writeBatch(db)
  lote.update(doc(db, 'obras', obra.id), {
    estado: 'ADJUDICADA',
    contratistaId: ganadora.contratistaId,
    contratistaNombre: ganadora.contratistaNombre,
    ofertaId: ganadora.id,
    montoAdjudicado: ganadora.monto,
    adjudicadaEn: serverTimestamp(),
  })
  lote.update(doc(db, 'ofertas', ganadora.id), { estado: 'ACEPTADA' })
  agregarNovedad(lote, obra.id, autor, { tipo: 'ESTADO', estadoHacia: 'ADJUDICADA', mensaje: `Obra adjudicada a ${ganadora.contratistaNombre}.` })
  agregarAviso(lote, ganadora.contratistaId, { titulo: 'Te adjudicaron una obra', cuerpo: `"${obra.titulo}" fue adjudicada a tu oferta.`, href: `/app/contratista/obras/${obra.id}`, obraId: obra.id })
  for (const o of otras.filter(x => x.id !== ganadora.id && x.estado === 'PENDIENTE')) {
    lote.update(doc(db, 'ofertas', o.id), { estado: 'RECHAZADA' })
    agregarAviso(lote, o.contratistaId, { titulo: 'Tu oferta no fue seleccionada', cuerpo: `La PyME eligió otra propuesta para "${obra.titulo}".`, href: `/app/contratista/obras/${obra.id}`, obraId: obra.id })
  }
  await lote.commit()
}

/** Cancela la obra y deja sin efecto las ofertas vigentes. */
export async function cancelarObra(obra: Con<Obra>, ofertas: Con<Oferta>[], motivo: string | null, autor: Autor) {
  const lote = writeBatch(db)
  lote.update(doc(db, 'obras', obra.id), { estado: 'CANCELADA', motivoCancelacion: motivo })
  agregarNovedad(lote, obra.id, autor, { tipo: 'ESTADO', estadoHacia: 'CANCELADA', mensaje: motivo ?? 'La PyME canceló la obra.' })
  for (const o of ofertas.filter(x => x.estado === 'PENDIENTE' || x.estado === 'ACEPTADA')) {
    lote.update(doc(db, 'ofertas', o.id), { estado: 'RECHAZADA' })
    agregarAviso(lote, o.contratistaId, { titulo: 'Una obra fue cancelada', cuerpo: `La PyME canceló "${obra.titulo}".`, href: `/app/contratista/obras/${obra.id}`, obraId: obra.id })
  }
  await lote.commit()
}

/**
 * Confirma la finalización y deja el REGISTRO DE PRUEBA del pago (sin pasarela): monto final y comisión de referencia del 1,5 %.
 */
export async function confirmarFinalizacion(obra: Con<Obra>, autor: Autor) {
  if (obra.montoAdjudicado === null || !obra.contratistaId) throw new Error('La obra no tiene adjudicación.')
  const lote = writeBatch(db)
  lote.update(doc(db, 'obras', obra.id), { estado: 'FINALIZADA', avance: 100, finalizadaEn: serverTimestamp() })
  lote.set(doc(db, 'pagos', obra.id), {
    obraId: obra.id,
    clienteId: obra.clienteId,
    contratistaId: obra.contratistaId,
    montoFinal: obra.montoAdjudicado,
    tasaComision: COMISION,
    comisionMonto: Math.round(obra.montoAdjudicado * COMISION * 100) / 100,
    estado: 'REGISTRO_DE_PRUEBA',
    finalizadaEn: serverTimestamp(),
    isDemo: false,
  })
  agregarNovedad(lote, obra.id, autor, { tipo: 'ESTADO', estadoHacia: 'FINALIZADA', mensaje: 'La PyME confirmó la finalización. Se registró el pago de prueba.' })
  agregarAviso(lote, obra.contratistaId, { titulo: 'Obra finalizada', cuerpo: `La PyME confirmó "${obra.titulo}". Quedó el registro de prueba del pago.`, href: `/app/contratista/obras/${obra.id}`, obraId: obra.id })
  await lote.commit()
}

export async function actualizarPerfil(uid: string, datos: Record<string, unknown>) {
  await updateDoc(doc(db, 'perfiles', uid), datos)
}
