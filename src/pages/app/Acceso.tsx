import { sendPasswordResetEmail } from 'firebase/auth'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { CamposPerfil } from '@/components/CamposPerfil'
import { Alerta, Boton, Campo, Cargando, Tarjeta } from '@/components/ui'
import { panelDe, ROLES_REGISTRABLES, type RolRegistrable } from '@/config/app'
import { auth } from '@/lib/firebase'
import { completarSchema, loginSchema, recuperarSchema, registroSchema } from '@/lib/validations/auth'
import { mensajeDeError, validarFormulario, type Errores } from '@/lib/validations/form'

function BotonGoogle({ onClick, deshabilitado }: { onClick: () => void; deshabilitado: boolean }) {
  return (
    <Boton variante="borde" className="w-full" onClick={onClick} disabled={deshabilitado}>
      Continuar con Google
    </Boton>
  )
}

function SelectorTipo({ valor, onCambio, error }: { valor: string; onCambio: (v: RolRegistrable) => void; error?: string | undefined }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">Soy…</legend>
      <div className="mt-2 grid gap-2">
        {ROLES_REGISTRABLES.map(r => (
          <label key={r.rol} className={`flex cursor-pointer items-start gap-3 rounded-tema border p-3 ${valor === r.rol ? 'border-primario bg-primario/5' : 'border-borde'}`}>
            <input type="radio" name="rol" value={r.rol} checked={valor === r.rol} onChange={() => onCambio(r.rol)} className="mt-1" />
            <span>
              <span className="block text-sm font-semibold">{r.etiqueta}</span>
              <span className="block text-xs text-suave">{r.descripcion}</span>
            </span>
          </label>
        ))}
      </div>
      {error && <span className="mt-1 block text-xs text-peligro">{error}</span>}
    </fieldset>
  )
}

function tipoDe(valor: string | null): RolRegistrable {
  return ROLES_REGISTRABLES.find(r => r.rol === valor)?.rol ?? ROLES_REGISTRABLES[0]!.rol
}

export function Ingresar() {
  const { ingresar, ingresarConGoogle, perfil, cargando } = useAuth()
  const navegar = useNavigate()
  const loc = useLocation()
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cargando && !enviando) return <Cargando />
  if (perfil) return <Navigate to={(loc.state as { desde?: string } | null)?.desde ?? panelDe(perfil.role)} replace />

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = validarFormulario(loginSchema, e.currentTarget)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    setError('')
    setEnviando(true)
    try {
      await ingresar(r.datos.email, r.datos.clave)
      navegar('/app', { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }
  async function conGoogle() {
    setError('')
    try {
      await ingresarConGoogle()
      navegar('/app', { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Tarjeta>
        <h1 className="text-4xl">Ingresar</h1>
        <form onSubmit={e => void enviar(e)} noValidate className="mt-4 space-y-4">
          <Campo etiqueta="Email" name="email" type="email" autoComplete="email" error={errores.email} />
          <Campo etiqueta="Contraseña" name="clave" type="password" autoComplete="current-password" error={errores.clave} />
          {error && <Alerta>{error}</Alerta>}
          <Boton type="submit" className="w-full" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</Boton>
        </form>
        <p className="mt-3 text-center text-sm"><Link to="/app/recuperar" className="font-semibold text-primario">Olvidé mi contraseña</Link></p>
        <p className="my-4 text-center text-xs text-suave">o</p>
        <BotonGoogle onClick={() => void conGoogle()} deshabilitado={enviando} />
        <p className="mt-4 text-center text-sm text-suave">
          ¿No tenés cuenta? <Link to="/app/registro" className="font-semibold text-primario">Registrate</Link>
        </p>
      </Tarjeta>
    </div>
  )
}

export function Registro() {
  const { registrar, ingresarConGoogle, perfil, cargando } = useAuth()
  const navegar = useNavigate()
  const [params] = useSearchParams()
  const [rol, setRol] = useState<RolRegistrable>(tipoDe(params.get('tipo')))
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cargando && !enviando) return <Cargando />
  if (perfil) return <Navigate to={panelDe(perfil.role)} replace />

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = validarFormulario(registroSchema, e.currentTarget)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    setError('')
    setEnviando(true)
    try {
      await registrar(r.datos)
      navegar(panelDe(r.datos.rol), { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }
  async function conGoogle() {
    setError('')
    setEnviando(true)
    try {
      await ingresarConGoogle()
      // Falta cargar los datos de la empresa: se piden en el paso siguiente (si la cuenta ya existía, va a su panel).
      navegar(`/app/completar-perfil?tipo=${rol}`, { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Tarjeta>
        <h1 className="text-4xl">Crear cuenta</h1>
        <form onSubmit={e => void enviar(e)} noValidate className="mt-4 space-y-4">
          <SelectorTipo valor={rol} onCambio={setRol} error={errores.rol} />
          <Campo etiqueta="Tu nombre y apellido" name="nombre" autoComplete="name" error={errores.nombre} />
          <Campo etiqueta="Email" name="email" type="email" autoComplete="email" error={errores.email} />
          <Campo etiqueta="Contraseña" name="clave" type="password" autoComplete="new-password" ayuda="Mínimo 8 caracteres." error={errores.clave} />
          <CamposPerfil key={rol} rol={rol} errores={errores} />
          {rol === 'contratista' && <Alerta tipo="aviso">Después de registrarte, Licity verifica tu perfil. Hasta que te aprueben no vas a poder ofertar.</Alerta>}
          {error && <Alerta>{error}</Alerta>}
          <Boton type="submit" className="w-full" disabled={enviando}>{enviando ? 'Creando cuenta…' : 'Registrarme'}</Boton>
        </form>
        <p className="my-4 text-center text-xs text-suave">o, con el tipo elegido arriba</p>
        <BotonGoogle onClick={() => void conGoogle()} deshabilitado={enviando} />
        <p className="mt-4 text-center text-sm text-suave">
          ¿Ya tenés cuenta? <Link to="/app/ingresar" className="font-semibold text-primario">Ingresá</Link>
        </p>
      </Tarjeta>
    </div>
  )
}

/** Para quien ingresó con Google y todavía no tiene cuenta en Licity: falta elegir el tipo y cargar los datos. */
export function CompletarPerfil() {
  const { usuario, perfil, completarPerfil, cargando } = useAuth()
  const navegar = useNavigate()
  const [params] = useSearchParams()
  const [rol, setRol] = useState<RolRegistrable>(tipoDe(params.get('tipo')))
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cargando && !enviando) return <Cargando />
  if (!usuario) return <Navigate to="/app/ingresar" replace />
  if (perfil) return <Navigate to={panelDe(perfil.role)} replace />

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = validarFormulario(completarSchema, e.currentTarget)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    setEnviando(true)
    try {
      await completarPerfil(r.datos)
      navegar(panelDe(r.datos.rol), { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Tarjeta>
        <h1 className="text-4xl">Completá tu perfil</h1>
        <form onSubmit={e => void enviar(e)} noValidate className="mt-4 space-y-4">
          <SelectorTipo valor={rol} onCambio={setRol} error={errores.rol} />
          <Campo etiqueta="Tu nombre y apellido" name="nombre" defaultValue={usuario.displayName ?? ''} error={errores.nombre} />
          <CamposPerfil key={rol} rol={rol} errores={errores} />
          {rol === 'contratista' && <Alerta tipo="aviso">Después de continuar, Licity verifica tu perfil. Hasta que te aprueben no vas a poder ofertar.</Alerta>}
          {error && <Alerta>{error}</Alerta>}
          <Boton type="submit" className="w-full" disabled={enviando}>Continuar</Boton>
        </form>
      </Tarjeta>
    </div>
  )
}

export function Recuperar() {
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = validarFormulario(recuperarSchema, e.currentTarget)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    setError('')
    try {
      await sendPasswordResetEmail(auth, r.datos.email)
    } catch (err) {
      const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: unknown }).code) : ''
      // No revelamos si el email existe: cualquier error que no sea de red se trata como enviado.
      if (code === 'auth/network-request-failed' || code === 'auth/too-many-requests') return setError(mensajeDeError(err))
    }
    setListo(true)
  }
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Tarjeta>
        <h1 className="text-4xl">Recuperar contraseña</h1>
        {listo ? (
          <div className="mt-4 space-y-4">
            <Alerta tipo="ok">Si el email tiene una cuenta, te enviamos un enlace para crear una contraseña nueva.</Alerta>
            <Link to="/app/ingresar" className="font-semibold text-primario">Volver a ingresar</Link>
          </div>
        ) : (
          <form onSubmit={e => void enviar(e)} noValidate className="mt-4 space-y-4">
            <Campo etiqueta="Email" name="email" type="email" autoComplete="email" error={errores.email} />
            {error && <Alerta>{error}</Alerta>}
            <Boton type="submit" className="w-full">Enviar enlace</Boton>
          </form>
        )}
      </Tarjeta>
    </div>
  )
}

export function Suspendido() {
  const { salir } = useAuth()
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-4xl">Tu cuenta está suspendida</h1>
      <p className="mt-2 text-suave">Escribinos si creés que es un error.</p>
      <Boton className="mt-6" onClick={() => void salir()}>Salir</Boton>
    </div>
  )
}

/** /app → manda al panel que corresponde. */
export function AppInicio() {
  const { usuario, perfil, cargando } = useAuth()
  if (cargando) return <Cargando />
  if (!usuario) return <Navigate to="/app/ingresar" replace />
  return <Navigate to={perfil ? panelDe(perfil.role) : '/app/completar-perfil'} replace />
}

/** Compatibilidad con los enlaces de la app original: /app/registro/pyme y /app/registro/contratista. */
export function RegistroPorTipo() {
  const { tipo } = useParams()
  return <Navigate to={`/app/registro?tipo=${tipo === 'contratista' ? 'contratista' : 'pyme'}`} replace />
}
