import { useState, type FormEvent } from 'react'
import { Alerta, Boton, Campo, CampoTexto, Selector } from '@/components/ui'
import { CATEGORIAS } from '@/config/app'
import type { Obra } from '@/lib/tipos'
import { obraSchema, type ObraForm } from '@/lib/validations/obras'
import { mensajeDeError, validarFormulario, type Errores } from '@/lib/validations/form'

/** Formulario de alta / edición de una obra. */
export function FormularioObra({ obra, onGuardar, etiqueta }: { obra?: Obra; onGuardar: (d: ObraForm) => Promise<void>; etiqueta: string }) {
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = validarFormulario(obraSchema, e.currentTarget)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    setEnviando(true)
    setError('')
    try {
      await onGuardar(r.datos)
    } catch (err) {
      setError(mensajeDeError(err))
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={e => void enviar(e)} noValidate className="space-y-4">
      <Campo etiqueta="Título de la obra" name="titulo" maxLength={120} defaultValue={obra?.titulo ?? ''} placeholder="Ej.: Ampliación de depósito" error={errores.titulo} />
      <Selector etiqueta="Tipo de obra" name="categoria" defaultValue={obra?.categoria ?? ''} error={errores.categoria}>
        <option value="" disabled>Elegí un tipo</option>
        {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
      </Selector>
      <CampoTexto etiqueta="Descripción" name="descripcion" rows={6} maxLength={3000} defaultValue={obra?.descripcion ?? ''} error={errores.descripcion} />
      <Campo etiqueta="Ubicación" name="ciudad" maxLength={120} defaultValue={obra?.ciudad ?? ''} placeholder="Ciudad o barrio" error={errores.ciudad} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo etiqueta="Inicio deseado (opcional)" name="fechaInicio" type="date" defaultValue={obra?.fechaInicio ?? ''} error={errores.fechaInicio} />
        <Campo etiqueta="Plazo en días (opcional)" name="plazoDias" type="number" min={1} max={3650} defaultValue={obra?.plazoDias ?? ''} error={errores.plazoDias} />
        <Campo etiqueta="Presupuesto ARS (opcional)" name="presupuesto" inputMode="decimal" defaultValue={obra?.presupuesto ?? ''} error={errores.presupuesto} />
      </div>
      {error && <Alerta>{error}</Alerta>}
      <Boton type="submit" disabled={enviando}>{enviando ? 'Guardando…' : etiqueta}</Boton>
    </form>
  )
}
