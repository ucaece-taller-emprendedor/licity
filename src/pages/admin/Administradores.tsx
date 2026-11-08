import { collection, doc, orderBy, query, updateDoc } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { useAuth } from '@/auth/useAuth'
import { Alerta, Boton, Campo, Cargando, EstadoVacio, Etiqueta } from '@/components/ui'
import { ETIQUETA_ROL, ROLES_REGISTRABLES, type Rol } from '@/config/app'
import { useColeccion } from '@/hooks/useColeccion'
import { db } from '@/lib/firebase'
import { mensajeDeError } from '@/lib/validations/form'

type UsuarioFila = { email: string; displayName: string; role: Rol; status: string; isDemo?: boolean }

/** Tipo al que vuelve alguien cuando se le quita el rol admin: el primero que no necesita aprobación. */
const ROL_BASE = (ROLES_REGISTRABLES.find(r => !(r as { requiereAprobacion?: boolean }).requiereAprobacion) ?? ROLES_REGISTRABLES[0])?.rol

/**
 * Administradores: lista de todos los usuarios registrados y botón para darles (o sacarles) el rol admin.
 * La seguridad real está en firestore.rules: solo un admin puede cambiar un rol, y nadie puede cambiar el propio.
 */
export default function Administradores() {
  const { usuario } = useAuth()
  const { datos, cargando, error } = useColeccion<UsuarioFila>(useMemo(() => query(collection(db, 'users'), orderBy('email')), []))
  const [filtro, setFiltro] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState('')

  const filas = datos.filter(u => `${u.email} ${u.displayName}`.toLowerCase().includes(filtro.trim().toLowerCase()))
  const admins = datos.filter(u => u.role === 'admin').length

  async function cambiar(id: string, role: Rol) {
    setAviso('')
    setOcupado(id)
    try {
      await updateDoc(doc(db, 'users', id), { role })
    } catch (e) {
      setAviso(mensajeDeError(e))
    } finally {
      setOcupado('')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Administradores</h1>
      <Alerta tipo="info">
        Para sumar a una persona como administradora, <strong>primero tiene que registrarse en la app</strong> (desde /app/registro o con Google).
        Cuando aparezca en esta lista, tocá “Hacer admin”. La persona tiene que cerrar sesión y volver a entrar en /admin/login.
      </Alerta>
      {(error || aviso) && <Alerta>{error ?? aviso}</Alerta>}
      <Campo etiqueta="Buscar por nombre o email" name="buscar" value={filtro} onChange={e => setFiltro(e.target.value)} />
      <p className="text-sm text-suave">{admins} {admins === 1 ? 'administrador' : 'administradores'} en la lista · {datos.length} usuarios registrados</p>
      {cargando ? <Cargando /> : filas.length === 0 ? <EstadoVacio>No hay usuarios que coincidan.</EstadoVacio> : (
        <div className="overflow-x-auto rounded-tema border border-borde bg-superficie">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-borde text-xs uppercase text-suave"><tr><th className="p-3">Usuario</th><th className="p-3">Tipo</th><th className="p-3"><span className="sr-only">Acción</span></th></tr></thead>
            <tbody>
              {filas.map(u => {
                const esYo = u.id === usuario?.uid
                return (
                  <tr key={u.id} className="border-b border-borde last:border-0" data-testid={`admin-fila-${u.email}`}>
                    <td className="p-3"><p className="font-medium">{u.displayName} {u.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}</p><p className="text-xs text-suave">{u.email}</p></td>
                    <td className="p-3">{u.role === 'admin' ? <Etiqueta tono="ok">{ETIQUETA_ROL.admin}</Etiqueta> : <Etiqueta>{ETIQUETA_ROL[u.role] ?? u.role}</Etiqueta>}</td>
                    <td className="p-3 text-right">
                      {u.role === 'admin' ? (
                        esYo ? <span className="text-xs text-suave">Sos vos</span> : (
                          <Boton variante="borde" disabled={ocupado === u.id || !ROL_BASE} onClick={() => ROL_BASE && void cambiar(u.id, ROL_BASE)}>Quitar admin</Boton>
                        )
                      ) : u.status === 'activo' ? (
                        <Boton disabled={ocupado === u.id} onClick={() => void cambiar(u.id, 'admin')}>Hacer admin</Boton>
                      ) : <span className="text-xs text-suave">Primero debe estar activo</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
