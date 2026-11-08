import { sendPasswordResetEmail } from 'firebase/auth'
import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { useAuth } from '@/auth/useAuth'
import { Alerta, Boton, Campo } from '@/components/ui'
import { auth } from '@/lib/firebase'
import { mensajeDeError } from '@/lib/validations/form'

const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Ingresá un email válido.'))

async function enviarMail(email: string) {
  auth.languageCode = 'es'
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (err) {
    // No revelamos si el email existe: se responde igual que si se hubiera enviado.
    if ((err as { code?: string }).code !== 'auth/user-not-found') throw err
  }
}

/** "Olvidé mi contraseña": pide el email y manda el mail de Firebase para elegir una nueva. */
export function RecuperarClave() {
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = emailSchema.safeParse(new FormData(e.currentTarget).get('email'))
    if (!r.success) return setError(r.error.issues[0]?.message ?? 'Ingresá un email válido.')
    setError('')
    setEnviando(true)
    try {
      await enviarMail(r.data)
      setEnviado(true)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  if (!abierto) {
    return (
      <p className="mt-3 text-center text-sm">
        <button type="button" onClick={() => setAbierto(true)} className="font-semibold text-primario underline-offset-2 hover:underline">
          Olvidé mi contraseña
        </button>
      </p>
    )
  }
  return (
    <form onSubmit={e => void enviar(e)} noValidate className="mt-4 space-y-3 border-t border-borde pt-4" aria-label="Recuperar contraseña">
      <p className="text-sm text-suave">Te mandamos un mail con un enlace para elegir una contraseña nueva.</p>
      <Campo etiqueta="Email de tu cuenta" name="email" type="email" autoComplete="email" />
      {error && <Alerta>{error}</Alerta>}
      {enviado && <Alerta tipo="ok">Si el email tiene una cuenta, te enviamos el enlace. Revisá también el spam.</Alerta>}
      <Boton type="submit" variante="borde" className="w-full" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviarme el enlace'}</Boton>
    </form>
  )
}

/** Para el panel de admin: manda el mail de cambio de contraseña a la cuenta con sesión iniciada. */
export function CambiarClave({ className = '' }: { className?: string }) {
  const { usuario } = useAuth()
  const [estado, setEstado] = useState<'' | 'enviando' | 'ok' | 'error'>('')
  if (!usuario?.email) return null
  const email = usuario.email
  async function enviar() {
    setEstado('enviando')
    try {
      await enviarMail(email)
      setEstado('ok')
    } catch {
      setEstado('error')
    }
  }
  return (
    <div className={className}>
      <Boton variante="borde" className="w-full" onClick={() => void enviar()} disabled={estado === 'enviando'}>
        Cambiar mi contraseña
      </Boton>
      {estado === 'ok' && <p role="status" className="mt-1 text-xs text-ok">Te enviamos un mail con el enlace.</p>}
      {estado === 'error' && <p role="alert" className="mt-1 text-xs text-peligro">No pudimos enviarlo. Probá de nuevo.</p>}
    </div>
  )
}
