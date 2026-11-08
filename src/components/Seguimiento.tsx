import { collection } from 'firebase/firestore'
import { useMemo } from 'react'
import { Progreso, Seccion } from '@/components/comunes'
import { ESTADO_OBRA } from '@/config/app'
import { useColeccion } from '@/hooks/useColeccion'
import { db } from '@/lib/firebase'
import { formatoFechaHora, ms } from '@/lib/formato'
import type { Novedad } from '@/lib/tipos'

/** Avance y línea de tiempo de la obra (novedades: cambios de estado, avances y notas). */
export function Seguimiento({ obraId, avance }: { obraId: string; avance: number }) {
  const consulta = useMemo(() => collection(db, 'obras', obraId, 'novedades'), [obraId])
  const { datos } = useColeccion<Novedad>(consulta)
  const eventos = [...datos].sort((a, b) => ms(b.creadaEn) - ms(a.creadaEn))
  return (
    <Seccion titulo="Seguimiento de la obra">
      <div className="mb-6"><Progreso valor={avance} /></div>
      {eventos.length === 0 ? (
        <p className="text-sm text-suave">Todavía no hay novedades.</p>
      ) : (
        <ol className="space-y-4 border-l-2 border-borde pl-5">
          {eventos.map(e => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[1.6rem] top-1.5 size-3 rounded-full bg-primario" aria-hidden />
              <p className="font-bold">{e.tipo === 'ESTADO' && e.estadoHacia ? ESTADO_OBRA[e.estadoHacia].etiqueta : e.tipo === 'AVANCE' ? `Avance ${e.avance}%` : 'Nota'}</p>
              {e.mensaje && <p className="text-sm text-suave">{e.mensaje}</p>}
              <p className="text-xs text-suave">{formatoFechaHora(e.creadaEn)} · {e.autorNombre}</p>
            </li>
          ))}
        </ol>
      )}
    </Seccion>
  )
}
