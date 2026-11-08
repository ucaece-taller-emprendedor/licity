import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Alerta, Boton, CampoTexto, Etiqueta, Tarjeta } from '@/components/ui'
import type { Tono } from '@/config/app'
import { mensajeDeError } from '@/lib/validations/form'

export function Insignia({ info }: { info: { etiqueta: string; tono: Tono } }) {
  return <Etiqueta tono={info.tono}>{info.etiqueta}</Etiqueta>
}

export function CabeceraPagina({ titulo, descripcion, accion }: { titulo: string; descripcion?: string; accion?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-4xl text-texto sm:text-5xl">{titulo}</h1>
        {descripcion && <p className="mt-2 max-w-2xl text-base text-suave">{descripcion}</p>}
      </div>
      {accion}
    </div>
  )
}

export function Seccion({ titulo, children, accion, className = '' }: { titulo?: string; children: ReactNode; accion?: ReactNode; className?: string }) {
  return (
    <Tarjeta className={`p-5 sm:p-6 ${className}`}>
      {(titulo || accion) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {titulo && <h2 className="text-2xl text-texto">{titulo}</h2>}
          {accion}
        </div>
      )}
      {children}
    </Tarjeta>
  )
}

export function Datos({ items }: { items: { etiqueta: string; valor: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(i => (
        <div key={i.etiqueta}>
          <dt className="text-xs font-bold uppercase tracking-wider text-suave">{i.etiqueta}</dt>
          <dd className="mt-1 break-words text-base">{i.valor || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Estadistica({ etiqueta, valor, ayuda, testid }: { etiqueta: string; valor: ReactNode; ayuda?: string; testid?: string }) {
  return (
    <Tarjeta>
      <p className="text-sm font-bold text-suave">{etiqueta}</p>
      <p className="titulo-marca mt-2 text-4xl" data-testid={testid}>{valor}</p>
      {ayuda && <p className="mt-1 text-xs text-suave">{ayuda}</p>}
    </Tarjeta>
  )
}

export function Progreso({ valor }: { valor: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold">
        <span>Avance</span>
        <span>{valor}%</span>
      </div>
      <div role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100} aria-label="Avance de la obra" className="h-3 overflow-hidden rounded-full bg-borde">
        <div className="h-full rounded-full bg-primario" style={{ width: `${valor}%` }} />
      </div>
    </div>
  )
}

export function VacioConAccion({ titulo, texto, to, accion }: { titulo: string; texto: string; to?: string; accion?: string }) {
  return (
    <Tarjeta className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <h2 className="text-2xl">{titulo}</h2>
      <p className="max-w-md text-suave">{texto}</p>
      {to && accion && (
        <Link to={to} className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full bg-primario px-5 text-sm font-semibold text-primario-texto hover:opacity-90">
          {accion}
        </Link>
      )}
    </Tarjeta>
  )
}

/**
 * Botón que pide confirmación antes de ejecutar una acción (opcionalmente con un motivo).
 * `accion` recibe el motivo (o null) y puede lanzar errores de Firestore: se muestran en español.
 */
export function ConfirmarAccion({
  etiqueta,
  aviso,
  variante = 'primario',
  motivo,
  accion,
}: {
  etiqueta: string
  aviso: string
  variante?: 'primario' | 'borde' | 'peligro' | 'acento'
  motivo?: { etiqueta: string; obligatorio?: boolean }
  accion: (motivo: string | null) => Promise<void>
}) {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function confirmar(e: FormEvent) {
    e.preventDefault()
    const m = texto.trim()
    if (motivo?.obligatorio && m.length < 5) return setError('Indicá el motivo (mínimo 5 caracteres).')
    setEnviando(true)
    setError('')
    try {
      await accion(m === '' ? null : m)
      setAbierto(false)
      setTexto('')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  if (!abierto) return <Boton variante={variante} onClick={() => setAbierto(true)}>{etiqueta}</Boton>
  return (
    <form onSubmit={e => void confirmar(e)} className="space-y-3 rounded-tema border border-borde bg-fondo p-4" aria-label={etiqueta}>
      <p className="text-sm">{aviso}</p>
      {motivo && <CampoTexto etiqueta={motivo.etiqueta} rows={2} value={texto} onChange={e => setTexto(e.target.value)} maxLength={300} />}
      {error && <Alerta>{error}</Alerta>}
      <div className="flex flex-wrap gap-2">
        <Boton type="submit" variante={variante === 'borde' ? 'primario' : variante} disabled={enviando}>{enviando ? 'Procesando…' : 'Confirmar'}</Boton>
        <Boton variante="borde" onClick={() => { setAbierto(false); setError('') }} disabled={enviando}>Volver</Boton>
      </div>
    </form>
  )
}

/** Botón de una acción directa (sin confirmación) que muestra el error si falla. */
export function AccionDirecta({ etiqueta, variante = 'primario', accion }: { etiqueta: string; variante?: 'primario' | 'borde' | 'acento'; accion: () => Promise<void> }) {
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  async function ir() {
    setEnviando(true)
    setError('')
    try {
      await accion()
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }
  return (
    <div className="space-y-2">
      <Boton variante={variante} onClick={() => void ir()} disabled={enviando}>{enviando ? 'Procesando…' : etiqueta}</Boton>
      {error && <Alerta>{error}</Alerta>}
    </div>
  )
}
