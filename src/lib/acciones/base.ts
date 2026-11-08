import { collection, doc, serverTimestamp, type WriteBatch } from 'firebase/firestore'
import type { EstadoObra } from '@/config/app'
import { db } from '@/lib/firebase'

export type Autor = { uid: string; displayName: string }

/** Agrega al batch una entrada del seguimiento de la obra (obras/{id}/novedades). */
export function agregarNovedad(
  lote: WriteBatch,
  obraId: string,
  autor: Autor,
  d: { tipo: 'ESTADO' | 'AVANCE' | 'NOTA'; estadoHacia?: EstadoObra; avance?: number; mensaje?: string | null },
) {
  lote.set(doc(collection(db, 'obras', obraId, 'novedades')), {
    tipo: d.tipo,
    estadoHacia: d.estadoHacia ?? null,
    avance: d.avance ?? null,
    mensaje: d.mensaje ?? null,
    autorId: autor.uid,
    autorNombre: autor.displayName,
    creadaEn: serverTimestamp(),
  })
}

/**
 * Agrega al batch un aviso dentro de la app. Las reglas exigen que quien avisa y quien recibe
 * sean parte de la misma obra (o que avise el admin).
 */
export function agregarAviso(lote: WriteBatch, para: string, d: { titulo: string; cuerpo?: string | null; href?: string | null; obraId?: string | null }) {
  lote.set(doc(collection(db, 'notificaciones')), {
    usuarioId: para,
    titulo: d.titulo,
    cuerpo: d.cuerpo ?? null,
    href: d.href ?? null,
    obraId: d.obraId ?? null,
    leida: false,
    creadaEn: serverTimestamp(),
  })
}
