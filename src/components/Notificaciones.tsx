import { collection, doc, query, updateDoc, where } from 'firebase/firestore'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { Seccion } from '@/components/comunes'
import { useColeccion } from '@/hooks/useColeccion'
import { db } from '@/lib/firebase'
import { formatoFechaHora, ms } from '@/lib/formato'
import type { Notificacion } from '@/lib/tipos'

/** Avisos dentro de la app (los escriben las otras partes de la obra o el admin; no hay mails). */
export function Notificaciones() {
  const { usuario } = useAuth()
  const uid = usuario?.uid
  const consulta = useMemo(() => (uid ? query(collection(db, 'notificaciones'), where('usuarioId', '==', uid)) : null), [uid])
  const { datos } = useColeccion<Notificacion>(consulta)
  const ordenadas = [...datos].sort((a, b) => ms(b.creadaEn) - ms(a.creadaEn)).slice(0, 8)
  const sinLeer = datos.filter(n => !n.leida).length

  return (
    <Seccion titulo={sinLeer ? `Avisos (${sinLeer})` : 'Avisos'}>
      {ordenadas.length === 0 ? (
        <p className="text-sm text-suave">Todavía no tenés avisos.</p>
      ) : (
        <ul className="divide-y divide-borde">
          {ordenadas.map(n => (
            <li key={n.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className={`text-sm ${n.leida ? '' : 'font-bold'}`}>
                  {n.href ? <Link to={n.href} className="hover:underline">{n.titulo}</Link> : n.titulo}
                </p>
                {n.cuerpo && <p className="text-sm text-suave">{n.cuerpo}</p>}
                <p className="text-xs text-suave">{formatoFechaHora(n.creadaEn)}</p>
              </div>
              {!n.leida && (
                <button type="button" className="shrink-0 text-xs font-bold text-primario underline underline-offset-4" onClick={() => void updateDoc(doc(db, 'notificaciones', n.id), { leida: true })}>
                  Marcar leído
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Seccion>
  )
}
