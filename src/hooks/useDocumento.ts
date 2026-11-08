import { onSnapshot, type DocumentReference } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import type { Con } from './useColeccion'

/**
 * Escucha un documento en tiempo real. Pasar `null` si todavía no se puede leer.
 * La referencia tiene que estar memoizada. `datos` es null si no existe; `error` si no hay permiso.
 */
export function useDocumento<T>(ref: DocumentReference | null): { datos: Con<T> | null; cargando: boolean; error: string | null } {
  const [estado, setEstado] = useState<{ datos: Con<T> | null; cargando: boolean; error: string | null }>({ datos: null, cargando: ref !== null, error: null })
  useEffect(() => {
    if (!ref) return
    return onSnapshot(
      ref,
      snap => setEstado({ datos: snap.exists() ? ({ id: snap.id, ...(snap.data() as T) }) : null, cargando: false, error: null }),
      e => setEstado({ datos: null, cargando: false, error: e.code === 'permission-denied' ? 'No tenés permiso para ver esto.' : 'No se pudo cargar.' }),
    )
  }, [ref])
  return estado
}
