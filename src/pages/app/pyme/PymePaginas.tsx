import { collection, doc, query, where } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { CabeceraPagina, ConfirmarAccion, Datos, Estadistica, Insignia, Seccion, VacioConAccion } from '@/components/comunes'
import { FormularioObra } from '@/components/FormularioObra'
import { Notificaciones } from '@/components/Notificaciones'
import { Seguimiento } from '@/components/Seguimiento'
import { Alerta, BotonLink, Cargando, Etiqueta } from '@/components/ui'
import { AVISO_PAGO, ESTADO_OBRA, ESTADO_OFERTA, PUEDE_ADJUDICAR, PUEDE_CANCELAR, ROTULO_PAGO } from '@/config/app'
import { useColeccion } from '@/hooks/useColeccion'
import { useDocumento } from '@/hooks/useDocumento'
import { actualizarPerfil, adjudicar, cancelarObra, comenzarEvaluacion, confirmarFinalizacion, editarObra, publicarObra } from '@/lib/acciones/pyme'
import { db } from '@/lib/firebase'
import { formatoDinero, formatoFecha, formatoPorcentaje, ms } from '@/lib/formato'
import type { Obra, Oferta, Pago, PerfilPyme } from '@/lib/tipos'
import { perfilPymeSchema } from '@/lib/validations/auth'
import { mensajeDeError, validarFormulario, type Errores } from '@/lib/validations/form'
import { CamposPerfil } from '@/components/CamposPerfil'
import { Boton } from '@/components/ui'

function useMisObras() {
  const { usuario } = useAuth()
  const uid = usuario?.uid
  const consulta = useMemo(() => (uid ? query(collection(db, 'obras'), where('clienteId', '==', uid)) : null), [uid])
  const r = useColeccion<Obra>(consulta)
  const datos = useMemo(() => [...r.datos].sort((a, b) => ms(b.publicadaEn) - ms(a.publicadaEn)), [r.datos])
  return { ...r, datos }
}

export function PymeInicio() {
  const { perfil, usuario } = useAuth()
  const uid = usuario?.uid
  const obras = useMisObras()
  const pendientes = useColeccion<Oferta>(useMemo(() => (uid ? query(collection(db, 'ofertas'), where('clienteId', '==', uid), where('estado', '==', 'PENDIENTE')) : null), [uid]))
  const abiertas = obras.datos.filter(o => ['PUBLICADA', 'RECIBIENDO_OFERTAS', 'EVALUANDO'].includes(o.estado)).length
  const enMarcha = obras.datos.filter(o => ['ADJUDICADA', 'EN_EJECUCION'].includes(o.estado)).length
  const ofertasPorRevisar = pendientes.datos.filter(o => obras.datos.some(ob => ob.id === o.obraId && PUEDE_ADJUDICAR.includes(ob.estado))).length

  return (
    <>
      <CabeceraPagina
        titulo={`Hola, ${perfil?.displayName.split(' ')[0] ?? ''}`}
        descripcion="Seguí tus obras, compará ofertas y elegí a tu contratista."
        accion={<BotonLink to="/app/pyme/obras/nueva">Publicar obra</BotonLink>}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Estadistica etiqueta="Obras publicadas" valor={obras.datos.length} testid="stat-obras" />
        <Estadistica etiqueta="Recibiendo ofertas" valor={abiertas} />
        <Estadistica etiqueta="Ofertas por revisar" valor={ofertasPorRevisar} />
        <Estadistica etiqueta="En marcha" valor={enMarcha} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Seccion titulo="Obras recientes" accion={<Link to="/app/pyme/obras" className="text-sm font-bold underline underline-offset-4">Ver todas</Link>}>
          {obras.cargando ? <Cargando /> : obras.datos.length === 0 ? (
            <VacioConAccion titulo="Todavía no publicaste obras" texto="Publicá tu primera obra y empezá a recibir ofertas de contratistas verificados." to="/app/pyme/obras/nueva" accion="Publicar obra" />
          ) : (
            <ListaObras obras={obras.datos.slice(0, 5)} />
          )}
        </Seccion>
        <Notificaciones />
      </div>
    </>
  )
}

function ListaObras({ obras }: { obras: ReturnType<typeof useMisObras>['datos'] }) {
  return (
    <ul className="divide-y divide-borde">
      {obras.map(o => (
        <li key={o.id}>
          <Link to={`/app/pyme/obras/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-fondo/60">
            <div className="min-w-0">
              <p className="font-bold">{o.titulo} {o.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}</p>
              <p className="text-sm text-suave">{o.categoria} · {o.ciudad} · Publicada el {formatoFecha(o.publicadaEn)}</p>
            </div>
            <Insignia info={ESTADO_OBRA[o.estado]} />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function PymeObras() {
  const { datos, cargando, error } = useMisObras()
  return (
    <>
      <CabeceraPagina titulo="Mis obras" descripcion="Todas las obras que publicaste." accion={<BotonLink to="/app/pyme/obras/nueva">Publicar obra</BotonLink>} />
      {error && <Alerta>{error}</Alerta>}
      {cargando ? <Cargando /> : datos.length === 0 ? (
        <VacioConAccion titulo="Todavía no publicaste obras" texto="Publicá tu primera obra para empezar a recibir ofertas." to="/app/pyme/obras/nueva" accion="Publicar obra" />
      ) : (
        <Seccion><ListaObras obras={datos} /></Seccion>
      )}
    </>
  )
}

export function PymeObraNueva() {
  const { usuario } = useAuth()
  const navegar = useNavigate()
  return (
    <>
      <CabeceraPagina titulo="Publicar obra" descripcion="Contanos qué necesitás. Publicar es gratis." />
      <Seccion>
        <FormularioObra etiqueta="Publicar obra" onGuardar={async d => navegar(`/app/pyme/obras/${await publicarObra(usuario!.uid, d)}`)} />
      </Seccion>
    </>
  )
}

export function PymeObraEditar() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const { datos: obra, cargando, error } = useDocumento<Obra>(useMemo(() => doc(db, 'obras', id), [id]))
  if (cargando) return <Cargando />
  if (error || !obra) return <Alerta>{error ?? 'No encontramos la obra.'}</Alerta>
  if (obra.estado !== 'PUBLICADA') return <Alerta tipo="aviso">Solo podés editar una obra que todavía no recibió ofertas.</Alerta>
  return (
    <>
      <CabeceraPagina titulo="Editar obra" />
      <Seccion>
        <FormularioObra obra={obra} etiqueta="Guardar cambios" onGuardar={async d => { await editarObra(id, d); navegar(`/app/pyme/obras/${id}`) }} />
      </Seccion>
    </>
  )
}

export function PymeObraDetalle() {
  const { id = '' } = useParams()
  const { usuario, perfil } = useAuth()
  const uid = usuario?.uid
  const obraR = useDocumento<Obra>(useMemo(() => doc(db, 'obras', id), [id]))
  const obra = obraR.datos
  const ofertasR = useColeccion<Oferta>(useMemo(() => (uid ? query(collection(db, 'ofertas'), where('obraId', '==', id), where('clienteId', '==', uid)) : null), [uid, id]))
  const finalizada = obra?.estado === 'FINALIZADA'
  const pagoR = useDocumento<Pago>(useMemo(() => (finalizada ? doc(db, 'pagos', id) : null), [finalizada, id]))

  if (obraR.cargando) return <Cargando />
  if (obraR.error || !obra) return <Alerta>{obraR.error ?? 'No encontramos la obra.'}</Alerta>
  if (!perfil) return <Cargando />

  const autor = { uid: perfil.uid, displayName: perfil.displayName }
  const ofertas = ofertasR.datos.filter(o => o.estado !== 'RETIRADA').sort((a, b) => ms(a.creadaEn) - ms(b.creadaEn))
  const pendientes = ofertas.filter(o => o.estado === 'PENDIENTE')
  const menorPrecio = pendientes.length > 1 ? Math.min(...pendientes.map(o => o.monto)) : null
  const menorPlazo = pendientes.length > 1 ? Math.min(...pendientes.map(o => o.plazoDias)) : null
  const puedeAdjudicar = PUEDE_ADJUDICAR.includes(obra.estado)
  const ganadora = ofertas.find(o => o.estado === 'ACEPTADA')
  const pago = pagoR.datos

  return (
    <>
      <CabeceraPagina titulo={obra.titulo} descripcion={`${obra.categoria} · ${obra.ciudad}`} accion={<Insignia info={ESTADO_OBRA[obra.estado]} />} />
      {obra.reportadaEn && <div className="mb-6"><Alerta tipo="aviso">Esta obra fue reportada y está en revisión por el equipo de Licity.</Alerta></div>}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <Seccion titulo="Datos de la obra">
            <p className="mb-5 whitespace-pre-line leading-relaxed">{obra.descripcion}</p>
            <Datos items={[
              { etiqueta: 'Publicada', valor: formatoFecha(obra.publicadaEn) },
              { etiqueta: 'Inicio deseado', valor: formatoFecha(obra.fechaInicio) },
              { etiqueta: 'Plazo estimado', valor: obra.plazoDias ? `${obra.plazoDias} días` : null },
              { etiqueta: 'Presupuesto estimado', valor: obra.presupuesto ? formatoDinero(obra.presupuesto) : null },
            ]} />
            {obra.estado === 'PUBLICADA' && <BotonLink to={`/app/pyme/obras/${obra.id}/editar`} variante="borde" className="mt-5">Editar obra</BotonLink>}
          </Seccion>

          <Seccion
            titulo={`Ofertas recibidas (${ofertas.length})`}
            accion={
              obra.estado === 'RECIBIENDO_OFERTAS' && pendientes.length > 0 ? (
                <ConfirmarAccion etiqueta="Comenzar evaluación" variante="borde" aviso="Al comenzar la evaluación se dejan de aceptar ofertas nuevas. ¿Continuar?" accion={() => comenzarEvaluacion(obra, autor)} />
              ) : undefined
            }
          >
            {ofertas.length === 0 ? (
              <p className="text-suave">Todavía no recibiste ofertas. Te avisaremos cuando un contratista verificado envíe una propuesta.</p>
            ) : (
              <ul className="grid gap-4">
                {ofertas.map(o => (
                  <li key={o.id} className="rounded-2xl border border-borde bg-fondo p-5" data-testid={`oferta-${o.contratistaNombre}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl">{o.contratistaNombre}</h3>
                        <p className="text-sm text-suave">{o.especialidad} · {o.ciudad}{o.anios ? ` · ${o.anios} años de experiencia` : ''}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Etiqueta tono="ok">Verificado</Etiqueta>
                        <Insignia info={ESTADO_OFERTA[o.estado]} />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-suave">Monto</p>
                        <p className="titulo-marca text-3xl">{formatoDinero(o.monto)}</p>
                        {o.estado === 'PENDIENTE' && menorPrecio === o.monto && <Etiqueta tono="ok">Menor precio</Etiqueta>}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-suave">Plazo</p>
                        <p className="titulo-marca text-3xl">{o.plazoDias} días</p>
                        {o.estado === 'PENDIENTE' && menorPlazo === o.plazoDias && <Etiqueta tono="ok">Menor plazo</Etiqueta>}
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-line">{o.descripcion}</p>
                    {o.notas && <p className="mt-2 text-sm text-suave">Notas: {o.notas}</p>}
                    <p className="mt-2 text-xs text-suave">Enviada el {formatoFecha(o.creadaEn)}</p>
                    {puedeAdjudicar && o.estado === 'PENDIENTE' && (
                      <div className="mt-4">
                        <ConfirmarAccion
                          etiqueta="Adjudicar a este contratista"
                          aviso={`Vas a adjudicar la obra a ${o.contratistaNombre} por ${formatoDinero(o.monto)}. Las demás ofertas quedarán como no seleccionadas.`}
                          accion={() => adjudicar(obra, o, ofertas, autor)}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Seccion>

          {!['PUBLICADA', 'RECIBIENDO_OFERTAS', 'EVALUANDO'].includes(obra.estado) && <Seguimiento obraId={obra.id} avance={obra.avance} />}
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          {obra.contratistaId && (
            <Seccion titulo="Contratista adjudicado">
              <p className="text-xl font-bold">{obra.contratistaNombre}</p>
              {ganadora && <p className="text-sm text-suave">{ganadora.especialidad} · {ganadora.ciudad}</p>}
              <p className="titulo-marca mt-3 text-3xl">{formatoDinero(obra.montoAdjudicado)}</p>
              <p className="text-xs text-suave">Adjudicada el {formatoFecha(obra.adjudicadaEn)}</p>
            </Seccion>
          )}

          {obra.estado === 'EN_EJECUCION' && (
            <Seccion titulo="Finalización">
              {obra.contratistaTerminoEn ? (
                <div className="flex flex-col gap-3">
                  <Alerta tipo="ok">El contratista marcó la obra como terminada el {formatoFecha(obra.contratistaTerminoEn)}. Revisá el trabajo y confirmá la finalización.</Alerta>
                  <ConfirmarAccion etiqueta="Confirmar finalización" aviso="Al confirmar, la obra se da por finalizada y se genera el registro de prueba del pago final con la comisión de referencia de Licity." accion={() => confirmarFinalizacion(obra, autor)} />
                </div>
              ) : (
                <p className="text-sm text-suave">Cuando el contratista marque la obra como terminada vas a poder confirmar la finalización.</p>
              )}
            </Seccion>
          )}

          {pago && (
            <Seccion titulo="Pago final">
              <Datos items={[
                { etiqueta: 'Monto final', valor: formatoDinero(pago.montoFinal) },
                { etiqueta: `Comisión Licity (${formatoPorcentaje(pago.tasaComision)})`, valor: formatoDinero(pago.comisionMonto) },
                { etiqueta: 'Finalizada', valor: formatoFecha(pago.finalizadaEn) },
                { etiqueta: 'Estado del pago', valor: <Insignia info={ROTULO_PAGO} /> },
              ]} />
              <p className="mt-3 text-xs text-suave">{AVISO_PAGO}</p>
            </Seccion>
          )}

          {PUEDE_CANCELAR.includes(obra.estado) && (
            <Seccion titulo="Cancelar obra">
              <ConfirmarAccion
                etiqueta="Cancelar obra"
                variante="borde"
                aviso="Se cancelará la obra y se avisará a los contratistas involucrados. Esta acción no se puede deshacer."
                motivo={{ etiqueta: 'Motivo (opcional)' }}
                accion={m => cancelarObra(obra, ofertas, m, autor)}
              />
            </Seccion>
          )}
          {obra.estado === 'CANCELADA' && obra.motivoCancelacion && <Alerta tipo="info">Motivo de cancelación: {obra.motivoCancelacion}</Alerta>}
        </aside>
      </div>
    </>
  )
}

export function PymePerfil() {
  const { usuario } = useAuth()
  const uid = usuario?.uid
  const { datos, cargando } = useDocumento<PerfilPyme>(useMemo(() => (uid ? doc(db, 'perfiles', uid) : null), [uid]))
  const [errores, setErrores] = useState<Errores>({})
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  if (cargando || !datos || !uid) return <Cargando />

  return (
    <>
      <CabeceraPagina titulo="Mi perfil" descripcion="Los datos de tu empresa." />
      <Seccion className="max-w-xl">
        <form
          noValidate
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault()
            const r = validarFormulario(perfilPymeSchema, e.currentTarget)
            setErrores(r.errores ?? {})
            if (!r.datos) return
            actualizarPerfil(uid, r.datos).then(
              () => setAviso({ tipo: 'ok', texto: 'Perfil actualizado.' }),
              err => setAviso({ tipo: 'error', texto: mensajeDeError(err) }),
            )
          }}
        >
          <CamposPerfil rol="pyme" errores={errores} valores={datos} />
          {aviso && <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>}
          <Boton type="submit">Guardar cambios</Boton>
        </form>
      </Seccion>
    </>
  )
}
