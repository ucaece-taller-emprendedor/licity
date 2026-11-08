import { collection, doc, query, where } from 'firebase/firestore'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { AccionDirecta, CabeceraPagina, ConfirmarAccion, Datos, Estadistica, Insignia, Progreso, Seccion, VacioConAccion } from '@/components/comunes'
import { CamposPerfil } from '@/components/CamposPerfil'
import { EstadoVerificacion } from '@/components/EstadoVerificacion'
import { Notificaciones } from '@/components/Notificaciones'
import { Seguimiento } from '@/components/Seguimiento'
import { Alerta, Boton, Campo, CampoTexto, Cargando, Etiqueta } from '@/components/ui'
import { AVISO_PAGO, ESTADO_OBRA, ESTADO_OFERTA, ESTADOS_ABIERTOS, ROTULO_PAGO } from '@/config/app'
import { useColeccion } from '@/hooks/useColeccion'
import { useDocumento } from '@/hooks/useDocumento'
import { enviarOferta, iniciarObra, marcarTerminada, registrarAvance, reportarObra, retirarOferta } from '@/lib/acciones/contratista'
import { actualizarPerfil } from '@/lib/acciones/pyme'
import { db } from '@/lib/firebase'
import { formatoDinero, formatoFecha, formatoPorcentaje, ms } from '@/lib/formato'
import type { Obra, Oferta, Pago, PerfilContratista } from '@/lib/tipos'
import { perfilContratistaSchema } from '@/lib/validations/auth'
import { mensajeDeError, validarFormulario, type Errores } from '@/lib/validations/form'
import { avanceSchema, ofertaSchema, reporteSchema } from '@/lib/validations/obras'

function useMisOfertas() {
  const { usuario } = useAuth()
  const uid = usuario?.uid
  const r = useColeccion<Oferta>(useMemo(() => (uid ? query(collection(db, 'ofertas'), where('contratistaId', '==', uid)) : null), [uid]))
  const datos = useMemo(() => [...r.datos].sort((a, b) => ms(b.creadaEn) - ms(a.creadaEn)), [r.datos])
  return { ...r, datos }
}
function useMisTrabajos() {
  const { usuario } = useAuth()
  const uid = usuario?.uid
  const r = useColeccion<Obra>(useMemo(() => (uid ? query(collection(db, 'obras'), where('contratistaId', '==', uid)) : null), [uid]))
  const datos = useMemo(() => [...r.datos].sort((a, b) => ms(b.adjudicadaEn) - ms(a.adjudicadaEn)), [r.datos])
  return { ...r, datos }
}

export function ContratistaInicio() {
  const { perfil } = useAuth()
  const ofertas = useMisOfertas()
  const trabajos = useMisTrabajos()
  const verificado = perfil?.verificacion === 'APROBADO'
  const pendientes = ofertas.datos.filter(o => o.estado === 'PENDIENTE').length
  const enCurso = trabajos.datos.filter(o => ['ADJUDICADA', 'EN_EJECUCION'].includes(o.estado)).length
  const finalizados = trabajos.datos.filter(o => o.estado === 'FINALIZADA').length

  return (
    <>
      <CabeceraPagina
        titulo={`Hola, ${perfil?.displayName.split(' ')[0] ?? ''}`}
        descripcion="Encontrá obras de tu zona, ofertá y gestioná tus trabajos."
        accion={verificado ? <Link to="/app/contratista/obras" className="inline-flex min-h-11 items-center justify-center rounded-full bg-primario px-5 text-sm font-semibold text-primario-texto hover:opacity-90">Ver obras abiertas</Link> : undefined}
      />
      <div className="mb-6"><EstadoVerificacion /></div>
      {verificado && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Estadistica etiqueta="Ofertas enviadas" valor={ofertas.datos.length} />
          <Estadistica etiqueta="Ofertas pendientes" valor={pendientes} />
          <Estadistica etiqueta="Trabajos en curso" valor={enCurso} />
          <Estadistica etiqueta="Obras finalizadas" valor={finalizados} />
        </div>
      )}
      <div className="mt-8"><Notificaciones /></div>
    </>
  )
}

export function ContratistaObras() {
  const ofertas = useMisOfertas()
  const { datos, cargando, error } = useColeccion<Obra>(useMemo(() => query(collection(db, 'obras'), where('estado', 'in', ESTADOS_ABIERTOS)), []))
  const ordenadas = useMemo(() => [...datos].sort((a, b) => ms(b.publicadaEn) - ms(a.publicadaEn)), [datos])
  const ofertadas = new Set(ofertas.datos.filter(o => o.estado !== 'RETIRADA').map(o => o.obraId))
  return (
    <>
      <CabeceraPagina titulo="Obras abiertas" descripcion="Obras que están recibiendo ofertas." />
      {error && <Alerta>{error}</Alerta>}
      {cargando ? <Cargando /> : ordenadas.length === 0 ? (
        <VacioConAccion titulo="No hay obras abiertas por ahora" texto="Cuando una PyME publique una obra la vas a ver acá." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {ordenadas.map(o => (
            <li key={o.id}>
              <Link to={`/app/contratista/obras/${o.id}`} className="block h-full rounded-tema border border-borde bg-superficie p-5 hover:border-primario">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-2xl">{o.titulo}</h2>
                  <div className="flex gap-2">{ofertadas.has(o.id) && <Etiqueta tono="ok">Ya ofertaste</Etiqueta>}{o.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}</div>
                </div>
                <p className="mt-1 text-sm text-suave">{o.categoria} · {o.ciudad} · {o.clienteNombre}</p>
                <p className="mt-3 line-clamp-3 text-sm">{o.descripcion}</p>
                <p className="mt-3 text-sm font-bold">{o.presupuesto ? `Presupuesto estimado ${formatoDinero(o.presupuesto)}` : 'Presupuesto a convenir'}{o.plazoDias ? ` · ${o.plazoDias} días` : ''}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function FormularioOferta({ obra, anterior }: { obra: Obra & { id: string }; anterior?: Oferta & { id: string } }) {
  const { usuario } = useAuth()
  const uid = usuario!.uid
  const perfilR = useDocumento<PerfilContratista>(useMemo(() => doc(db, 'perfiles', uid), [uid]))
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  if (!perfilR.datos) return <Cargando />
  const perfil = perfilR.datos

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = validarFormulario(ofertaSchema, e.currentTarget)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    setEnviando(true)
    setError('')
    try {
      await enviarOferta(obra, uid, perfil, r.datos, anterior)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }
  return (
    <form onSubmit={e => void enviar(e)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Monto total (ARS)" name="monto" inputMode="decimal" placeholder="1500000" defaultValue={anterior?.monto ?? ''} error={errores.monto} />
        <Campo etiqueta="Plazo (días)" name="plazoDias" type="number" min={1} max={3650} defaultValue={anterior?.plazoDias ?? ''} error={errores.plazoDias} />
      </div>
      <CampoTexto etiqueta="Alcance de tu propuesta" name="descripcion" rows={5} maxLength={3000} defaultValue={anterior?.descripcion ?? ''} error={errores.descripcion} />
      <CampoTexto etiqueta="Notas (opcional)" name="notas" rows={3} maxLength={1000} defaultValue={anterior?.notas ?? ''} error={errores.notas} />
      {error && <Alerta>{error}</Alerta>}
      <Boton type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar oferta'}</Boton>
    </form>
  )
}

function FormularioAvance({ obra, onEnviar }: { obra: Obra & { id: string }; onEnviar: (avance: number, mensaje: string) => Promise<void> }) {
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const r = validarFormulario(avanceSchema, form)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    if (r.datos.avance < obra.avance) return setError('El avance no puede ser menor al registrado.')
    setError('')
    try {
      await onEnviar(r.datos.avance, r.datos.mensaje)
      form.reset()
    } catch (err) {
      setError(mensajeDeError(err))
    }
  }
  return (
    <form onSubmit={e => void enviar(e)} noValidate className="space-y-3">
      <Campo etiqueta="Avance (%)" name="avance" type="number" min={obra.avance} max={99} defaultValue={obra.avance} error={errores.avance} />
      <CampoTexto etiqueta="¿Qué se hizo?" name="mensaje" rows={3} maxLength={1000} error={errores.mensaje} />
      {error && <Alerta>{error}</Alerta>}
      <Boton type="submit" variante="borde">Registrar avance</Boton>
    </form>
  )
}

function ReportarObra({ obra, uid }: { obra: Obra & { id: string }; uid: string }) {
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  const [abierto, setAbierto] = useState(false)
  if (obra.reportadaEn) return <Alerta tipo="aviso">Ya reportaste esta obra. El equipo de Licity la está revisando.</Alerta>
  if (!abierto) return <Boton variante="borde" onClick={() => setAbierto(true)}>Reportar esta obra</Boton>
  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={e => {
        e.preventDefault()
        const r = validarFormulario(reporteSchema, e.currentTarget)
        setErrores(r.errores ?? {})
        if (!r.datos) return
        reportarObra(obra, uid, r.datos.motivo).catch(err => setError(mensajeDeError(err)))
      }}
    >
      <CampoTexto etiqueta="Motivo del reporte" name="motivo" rows={3} maxLength={500} error={errores.motivo} />
      {error && <Alerta>{error}</Alerta>}
      <Boton type="submit" variante="borde">Enviar reporte</Boton>
    </form>
  )
}

export function ContratistaObraDetalle() {
  const { id = '' } = useParams()
  const { usuario, perfil } = useAuth()
  const uid = usuario?.uid
  const obraR = useDocumento<Obra>(useMemo(() => doc(db, 'obras', id), [id]))
  const obra = obraR.datos
  const mias = useColeccion<Oferta>(useMemo(() => (uid ? query(collection(db, 'ofertas'), where('contratistaId', '==', uid), where('obraId', '==', id)) : null), [uid, id]))
  const miOferta = mias.datos[0]
  const finalizada = obra?.estado === 'FINALIZADA'
  const pagoR = useDocumento<Pago>(useMemo(() => (finalizada ? doc(db, 'pagos', id) : null), [finalizada, id]))

  if (obraR.cargando || mias.cargando) return <Cargando />
  if (obraR.error || !obra) return <Alerta>{obraR.error ?? 'No encontramos la obra.'}</Alerta>
  if (!perfil || !uid) return <Cargando />

  const autor = { uid, displayName: perfil.displayName }
  const esMia = obra.contratistaId === uid
  const abierta = ESTADOS_ABIERTOS.includes(obra.estado)
  const ofertaVigente = miOferta && miOferta.estado !== 'RETIRADA'
  const pago = pagoR.datos

  return (
    <>
      <CabeceraPagina titulo={obra.titulo} descripcion={`${obra.categoria} · ${obra.ciudad}`} accion={<Insignia info={ESTADO_OBRA[obra.estado]} />} />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <Seccion titulo="Datos de la obra">
            <p className="mb-5 whitespace-pre-line leading-relaxed">{obra.descripcion}</p>
            <Datos items={[
              { etiqueta: 'PyME', valor: obra.clienteNombre },
              { etiqueta: 'Publicada', valor: formatoFecha(obra.publicadaEn) },
              { etiqueta: 'Inicio deseado', valor: formatoFecha(obra.fechaInicio) },
              { etiqueta: 'Plazo estimado', valor: obra.plazoDias ? `${obra.plazoDias} días` : null },
              { etiqueta: 'Presupuesto estimado', valor: obra.presupuesto ? formatoDinero(obra.presupuesto) : null },
            ]} />
          </Seccion>

          {esMia && obra.estado === 'ADJUDICADA' && (
            <Seccion titulo="Empezar la obra">
              <p className="mb-3 text-sm text-suave">La PyME te adjudicó esta obra por {formatoDinero(obra.montoAdjudicado)}. Cuando arranques, iniciá la ejecución.</p>
              <AccionDirecta etiqueta="Iniciar obra" accion={() => iniciarObra(obra, autor)} />
            </Seccion>
          )}

          {esMia && obra.estado === 'EN_EJECUCION' && (
            <Seccion titulo="Gestión de la obra">
              {obra.contratistaTerminoEn ? (
                <Alerta tipo="ok">Marcaste la obra como terminada. La PyME debe confirmar la finalización.</Alerta>
              ) : (
                <div className="space-y-6">
                  <FormularioAvance obra={obra} onEnviar={(a, m) => registrarAvance(obra, a, m, autor)} />
                  <ConfirmarAccion etiqueta="Marcar como terminada" variante="acento" aviso="Vas a informar que la obra está terminada al 100 %. La PyME tendrá que confirmarlo." accion={() => marcarTerminada(obra, autor)} />
                </div>
              )}
            </Seccion>
          )}

          {esMia && !['ADJUDICADA'].includes(obra.estado) && <Seguimiento obraId={obra.id} avance={obra.avance} />}
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          {miOferta && (
            <Seccion titulo="Tu oferta">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="titulo-marca text-3xl">{formatoDinero(miOferta.monto)}</p>
                <Insignia info={ESTADO_OFERTA[miOferta.estado]} />
              </div>
              <p className="text-sm text-suave">{miOferta.plazoDias} días · enviada el {formatoFecha(miOferta.creadaEn)}</p>
              <p className="mt-3 whitespace-pre-line text-sm">{miOferta.descripcion}</p>
              {miOferta.estado === 'PENDIENTE' && ['PUBLICADA', 'RECIBIENDO_OFERTAS', 'EVALUANDO'].includes(obra.estado) && (
                <div className="mt-4"><ConfirmarAccion etiqueta="Retirar oferta" variante="borde" aviso="Tu oferta dejará de estar disponible para la PyME." accion={() => retirarOferta(miOferta)} /></div>
              )}
            </Seccion>
          )}

          {abierta && !ofertaVigente ? (
            <Seccion titulo={miOferta ? 'Volver a ofertar' : 'Enviar oferta'}>
              <FormularioOferta obra={obra} anterior={miOferta} />
            </Seccion>
          ) : null}
          {!abierta && !miOferta && !esMia && <Alerta tipo="aviso">Esta obra ya no recibe ofertas.</Alerta>}

          {pago && (
            <Seccion titulo="Pago final">
              <Datos items={[
                { etiqueta: 'Monto final', valor: formatoDinero(pago.montoFinal) },
                { etiqueta: `Comisión Licity (${formatoPorcentaje(pago.tasaComision)})`, valor: formatoDinero(pago.comisionMonto) },
                { etiqueta: 'Estado del pago', valor: <Insignia info={ROTULO_PAGO} /> },
              ]} />
              <p className="mt-3 text-xs text-suave">{AVISO_PAGO}</p>
            </Seccion>
          )}
          {esMia && obra.estado === 'EN_EJECUCION' && <Seccion><Progreso valor={obra.avance} /></Seccion>}
          <ReportarObra obra={obra} uid={uid} />
        </aside>
      </div>
    </>
  )
}

export function ContratistaOfertas() {
  const { datos, cargando, error } = useMisOfertas()
  return (
    <>
      <CabeceraPagina titulo="Mis ofertas" descripcion="Todas las ofertas que enviaste." />
      {error && <Alerta>{error}</Alerta>}
      {cargando ? <Cargando /> : datos.length === 0 ? (
        <VacioConAccion titulo="Todavía no enviaste ofertas" texto="Mirá las obras abiertas y enviá tu primera oferta." to="/app/contratista/obras" accion="Ver obras abiertas" />
      ) : (
        <Seccion>
          <ul className="divide-y divide-borde">
            {datos.map(o => (
              <li key={o.id}>
                <Link to={`/app/contratista/obras/${o.obraId}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-fondo/60">
                  <div className="min-w-0">
                    <p className="font-bold">{o.obraTitulo} {o.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}</p>
                    <p className="text-sm text-suave">{formatoDinero(o.monto)} · {o.plazoDias} días · {formatoFecha(o.creadaEn)}</p>
                  </div>
                  <Insignia info={ESTADO_OFERTA[o.estado]} />
                </Link>
              </li>
            ))}
          </ul>
        </Seccion>
      )}
    </>
  )
}

export function ContratistaTrabajos() {
  const { datos, cargando, error } = useMisTrabajos()
  return (
    <>
      <CabeceraPagina titulo="Mis trabajos" descripcion="Obras que te adjudicaron." />
      {error && <Alerta>{error}</Alerta>}
      {cargando ? <Cargando /> : datos.length === 0 ? (
        <VacioConAccion titulo="Todavía no tenés trabajos" texto="Cuando una PyME te adjudique una obra la vas a ver acá." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {datos.map(o => (
            <li key={o.id}>
              <Link to={`/app/contratista/obras/${o.id}`} className="block rounded-tema border border-borde bg-superficie p-5 hover:border-primario">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-2xl">{o.titulo}</h2>
                  <Insignia info={ESTADO_OBRA[o.estado]} />
                </div>
                <p className="mt-1 text-sm text-suave">{o.clienteNombre} · {formatoDinero(o.montoAdjudicado)}</p>
                <div className="mt-4"><Progreso valor={o.avance} /></div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function ContratistaPerfil() {
  const { usuario } = useAuth()
  const uid = usuario?.uid
  const { datos, cargando } = useDocumento<PerfilContratista>(useMemo(() => (uid ? doc(db, 'perfiles', uid) : null), [uid]))
  const [errores, setErrores] = useState<Errores>({})
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  if (cargando || !datos || !uid) return <Cargando />
  return (
    <>
      <CabeceraPagina titulo="Mi perfil" descripcion="Estos datos los ve Licity para verificarte y las PyMEs en tus ofertas." />
      <div className="mb-6"><EstadoVerificacion /></div>
      <Seccion className="max-w-xl">
        <form
          noValidate
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault()
            const r = validarFormulario(perfilContratistaSchema, e.currentTarget)
            setErrores(r.errores ?? {})
            if (!r.datos) return
            actualizarPerfil(uid, r.datos).then(
              () => setAviso({ tipo: 'ok', texto: 'Perfil actualizado.' }),
              err => setAviso({ tipo: 'error', texto: mensajeDeError(err) }),
            )
          }}
        >
          <CamposPerfil rol="contratista" errores={errores} valores={datos} />
          {aviso && <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>}
          <Boton type="submit">Guardar cambios</Boton>
        </form>
      </Seccion>
    </>
  )
}
