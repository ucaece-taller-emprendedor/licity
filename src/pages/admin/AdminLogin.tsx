import { signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { RecuperarClave } from '@/components/RecuperarClave'
import { Marca } from '@/components/Marca'
import { Alerta, Boton, Campo, Cargando, Tarjeta } from '@/components/ui'
import { auth, db } from '@/lib/firebase'
import { loginSchema } from '@/lib/validations/auth'
import { mensajeDeError, validarFormulario, type Errores } from '@/lib/validations/form'

/** Login del panel admin. No hay registro: los admins los da de alta la cátedra (ver README). */
export default function AdminLogin() {
  const { ingresar, esAdmin, cargando } = useAuth()
  const navegar = useNavigate()
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cargando && !enviando) return <Cargando />
  if (esAdmin) return <Navigate to="/admin" replace />

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = validarFormulario(loginSchema, e.currentTarget)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    setError('')
    setEnviando(true)
    try {
      await ingresar(r.datos.email, r.datos.clave)
      const token = await auth.currentUser?.getIdTokenResult(true)
      let permitido = token?.claims.admin === true
      if (!permitido && auth.currentUser) {
        // Admin dado desde el panel: figura con role 'admin' en su perfil.
        const perfilDoc = (await getDoc(doc(db, 'users', auth.currentUser.uid))).data()
        permitido = perfilDoc?.role === 'admin' && perfilDoc.status === 'activo'
      }
      if (!permitido) {
        await signOut(auth)
        setError('Esta cuenta no tiene permisos de administrador.')
        return
      }
      navegar('/admin', { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
      <Marca to="/" />
      <Tarjeta>
        <h1 className="text-2xl font-bold">Acceso administración</h1>
        <form onSubmit={e => void enviar(e)} noValidate className="mt-4 space-y-4">
          <Campo etiqueta="Email" name="email" type="email" autoComplete="username" error={errores.email} />
          <Campo etiqueta="Contraseña" name="clave" type="password" autoComplete="current-password" error={errores.clave} />
          {error && <Alerta>{error}</Alerta>}
          <Boton type="submit" className="w-full" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</Boton>
        </form>
        <RecuperarClave />
      </Tarjeta>
    </div>
  )
}
