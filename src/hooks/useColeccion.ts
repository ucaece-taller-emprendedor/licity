import { onSnapshot, type DocumentData, type Query } from 'firebase/firestore'
import { useEffect, useState } from 'react'

export type Con<T> = T & { id: string }

/**
 * Escucha una consulta de Firestore en tiempo real.
 * Pasar `null` mientras todavía no se puede consultar (por ejemplo, sin usuario).
 * Importante: la consulta tiene que estar memoizada (useMemo) o venir de un estado estable.
 */
export function useColeccion<T = DocumentData>(consulta: Query | null): { datos: Con<T>[]; cargando: boolean; error: string | null } {
  const [estado, setEstado] = useState<{ datos: Con<T>[]; cargando: boolean; error: string | null }>({ datos: [], cargando: consulta !== null, error: null })
  useEffect(() => {
    if (!consulta) return
    return onSnapshot(
      consulta,
      snap => setEstado({ datos: snap.docs.map(d => ({ id: d.id, ...(d.data() as T) })), cargando: false, error: null }),
      e => setEstado({ datos: [], cargando: false, error: e.code === 'permission-denied' ? 'No tenés permiso para ver estos datos.' : 'No se pudieron cargar los datos.' }),
    )
  }, [consulta])
  return estado
}
