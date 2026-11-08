import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { CabeceraPagina, ConfirmarAccion, Datos, Estadistica, Insignia, Seccion } from '@/components/comunes'
import { Alerta, Boton, Cargando, EstadoVacio, Etiqueta, Selector, Tarjeta } from '@/components/ui'
import { COMISION, ESTADO_OBRA, ESTADOS_CUENTA, ETIQUETA_ROL, ROTULO_PAGO, VERIFICACION, AVISO_PAGO, type EstadoCuenta } from '@/config/app'
import { useColeccion, type Con } from '@/hooks/useColeccion'
import { cambiarEstadoCuenta, cancelarObraAdmin, resolverReporte, revisarVerificacion } from '@/lib/acciones/admin'
import { db } from '@/lib/firebase'
import { formatoDinero, formatoFecha, formatoPorcentaje, ms } from '@/lib/formato'
import type { CuentaUsuario, Obra, Oferta, Pago, PerfilContratista } from '@/lib/tipos'
import { mensajeDeError } from '@/lib/validations/form'

const usuariosQ = () => query(collection(db, 'users'), orderBy('email'))

export function AdminInicio() {
  const u = useColeccion<CuentaUsuario>(useMemo(() => usuariosQ(), []))
  const o = useColeccion<Obra>(useMemo(() => query(collection(db, 'obras')), []))
  const p = useColeccion<Pago>(useMemo(() => query(collection(db, 'pagos')), []))
  const pendientes = u.datos.filter(x => x.role === 'contratista' && x.verificacion === 'PENDIENTE').length
  const reportadas = o.datos.filter(x => x.reportadaEn).length
  const comision = p.datos.reduce((t, x) => t + x.comisionMonto, 0)
  return (
    <div className="space-y-6">
      <CabeceraPagina titulo="Administración" descripcion="Resumen de Licity." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Estadistica etiqueta="Usuarios" valor={u.datos.length} />
        <Estadistica etiqueta="Verificaciones pendientes" valor={pendientes} testid="pendientes" />
        <Estadistica etiqueta="Obras" valor={o.datos.length} />
        <Estadistica etiqueta="Obras reportadas" valor={reportadas} />
        <Estadistica etiqueta="Pagos registrados (prueba)" valor={p.datos.length} />
        <Estadistica etiqueta="Comisión de referencia" valor={formatoDinero(comision)} ayuda="Suma de registros de prueba" />
      </div>
    </div>
  )
}

export function AdminUsuarios() {
  const { datos, cargando, error } = useColeccion<CuentaUsuario>(useMemo(() => usuariosQ(), []))
  const [aviso, setAviso] = useState('')
  async function cambiar(uid: string, estado: EstadoCuenta) {
    setAviso('')
    try {
      await cambiarEstadoCuenta(uid, estado)
    } catch (e) {
      setAviso(mensajeDeError(e))
    }
  }
  return (
    <div className="space-y-4">
      <CabeceraPagina titulo="Usuarios" />
      {(error || aviso) && <Alerta>{error ?? aviso}</Alerta>}
      {cargando ? <Cargando /> : datos.length === 0 ? <EstadoVacio>No hay usuarios.</EstadoVacio> : (
        <div className="overflow-x-auto rounded-tema border border-borde bg-superficie">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-borde text-xs uppercase text-suave">
              <tr><th className="p-3">Usuario</th><th className="p-3">Tipo</th><th className="p-3">Verificación</th><th className="p-3">Estado</th></tr>
            </thead>
            <tbody>
              {datos.map(u => (
                <tr key={u.id} className="border-b border-borde last:border-0" data-testid={`usuario-${u.email}`}>
                  <td className="p-3"><p className="font-medium">{u.displayName} {u.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}</p><p className="text-xs text-suave">{u.email}</p></td>
                  <td className="p-3">{ETIQUETA_ROL[u.role]}</td>
                  <td className="p-3">{u.verificacion ? <Insignia info={VERIFICACION[u.verificacion]} /> : '—'}</td>
                  <td className="p-3">
                    {u.role === 'admin' ? <Etiqueta>activo</Etiqueta> : (
                      <Selector etiqueta="" aria-label={`Estado de ${u.email}`} value={u.status} onChange={e => void cambiar(u.id, e.target.value as EstadoCuenta)}>
                        {ESTADOS_CUENTA.map(s => <option key={s} value={s}>{s}</option>)}
                      </Selector>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function AdminVerificaciones() {
  const u = useColeccion<CuentaUsuario>(useMemo(() => query(collection(db, 'users'), where('role', '==', 'contratista')), []))
  const perfiles = useColeccion<PerfilContratista>(useMemo(() => query(collection(db, 'perfiles')), []))
  const [ver, setVer] = useState<'PENDIENTE' | 'RECHAZADO' | 'APROBADO'>('PENDIENTE')
  const lista = u.datos.filter(x => x.verificacion === ver).sort((a, b) => a.email.localeCompare(b.email))
  return (
    <div className="space-y-4">
      <CabeceraPagina titulo="Verificaciones" descripcion="Revisá los datos del contratista y aprobá o rechazá su cuenta. Hasta que se apruebe no puede ofertar." />
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Estado de verificación">
        {(['PENDIENTE', 'RECHAZADO', 'APROBADO'] as const).map(v => (
          <Boton key={v} variante={ver === v ? 'primario' : 'borde'} onClick={() => setVer(v)} role="tab" aria-selected={ver === v}>
            {VERIFICACION[v].etiqueta} ({u.datos.filter(x => x.verificacion === v).length})
          </Boton>
        ))}
      </div>
      {u.error && <Alerta>{u.error}</Alerta>}
      {u.cargando ? <Cargando /> : lista.length === 0 ? <EstadoVacio>No hay solicitudes en este estado.</EstadoVacio> : (
        <ul className="grid gap-4">
          {lista.map(c => {
            const p = perfiles.datos.find(x => x.id === c.id)
            return (
              <li key={c.id}>
                <Tarjeta data-testid={`verificacion-${c.email}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-2xl">{p?.nombreEmpresa ?? c.displayName} {c.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}</h2>
                      <p className="text-sm text-suave">{c.displayName} · {c.email}</p>
                    </div>
                    <Insignia info={VERIFICACION[c.verificacion ?? 'PENDIENTE']} />
                  </div>
                  {p && <div className="mt-4"><Datos items={[
                    { etiqueta: 'CUIT', valor: p.cuit },
                    { etiqueta: 'Especialidad', valor: p.especialidad },
                    { etiqueta: 'Ciudad', valor: p.ciudad },
                    { etiqueta: 'Zona', valor: p.zona },
                    { etiqueta: 'Teléfono', valor: p.telefono },
                    { etiqueta: 'Años de experiencia', valor: p.anios },
                    { etiqueta: 'Presentación', valor: p.descripcion },
                  ]} /></div>}
                  {c.motivoRechazo && c.verificacion === 'RECHAZADO' && <p className="mt-3 text-sm text-suave">Motivo del rechazo: {c.motivoRechazo}</p>}
                  <div className="mt-4 flex flex-wrap items-start gap-3">
                    {c.verificacion !== 'APROBADO' && <ConfirmarAccion etiqueta="Aprobar" aviso={`Vas a verificar a ${p?.nombreEmpresa ?? c.displayName}. Podrá ver obras y ofertar.`} accion={() => revisarVerificacion(c.id, 'APROBADO')} />}
                    {c.verificacion !== 'RECHAZADO' && <ConfirmarAccion etiqueta="Rechazar" variante="borde" aviso="El contratista verá el motivo y podrá corregir su perfil y volver a pedir la revisión." motivo={{ etiqueta: 'Motivo del rechazo', obligatorio: true }} accion={m => revisarVerificacion(c.id, 'RECHAZADO', m ?? '')} />}
                  </div>
                </Tarjeta>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function CancelarObraAdmin({ obra }: { obra: Con<Obra> }) {
  return (
    <ConfirmarAccion
      etiqueta="Cancelar por moderación"
      variante="peligro"
      aviso="Se cancela la obra, se dejan sin efecto sus ofertas y se avisa a las partes."
      motivo={{ etiqueta: 'Motivo (se le muestra a las partes)', obligatorio: true }}
      accion={async m => {
        const ofertas = await getDocs(query(collection(db, 'ofertas'), where('obraId', '==', obra.id)))
        await cancelarObraAdmin(obra, ofertas.docs.map(d => ({ id: d.id, ...(d.data() as Oferta) })), m ?? '')
      }}
    />
  )
}

export function AdminObras() {
  const { datos, cargando, error } = useColeccion<Obra>(useMemo(() => query(collection(db, 'obras')), []))
  const ordenadas = useMemo(() => [...datos].sort((a, b) => Number(!!b.reportadaEn) - Number(!!a.reportadaEn) || ms(b.publicadaEn) - ms(a.publicadaEn)), [datos])
  return (
    <div className="space-y-4">
      <CabeceraPagina titulo="Obras" descripcion="Todas las obras de la plataforma. Las reportadas aparecen primero." />
      {error && <Alerta>{error}</Alerta>}
      {cargando ? <Cargando /> : ordenadas.length === 0 ? <EstadoVacio>No hay obras.</EstadoVacio> : (
        <ul className="grid gap-3">
          {ordenadas.map(o => (
            <li key={o.id}>
              <Tarjeta data-testid={`obra-${o.titulo}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-2xl">{o.titulo} {o.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}</h2>
                    <p className="text-sm text-suave">{o.clienteNombre} · {o.categoria} · {o.ciudad} · {formatoFecha(o.publicadaEn)}</p>
                    {o.contratistaNombre && <p className="text-sm text-suave">Contratista: {o.contratistaNombre} · {formatoDinero(o.montoAdjudicado)} · avance {o.avance}%</p>}
                  </div>
                  <Insignia info={ESTADO_OBRA[o.estado]} />
                </div>
                {o.reportadaEn && (
                  <div className="mt-3 space-y-2">
                    <Alerta tipo="aviso">Reportada el {formatoFecha(o.reportadaEn)}: {o.motivoReporte}</Alerta>
                    <ConfirmarAccion etiqueta="Marcar reporte como resuelto" variante="borde" aviso="El reporte se da por resuelto." accion={() => resolverReporte(o.id)} />
                  </div>
                )}
                {!['FINALIZADA', 'CANCELADA'].includes(o.estado) && <div className="mt-3"><CancelarObraAdmin obra={o} /></div>}
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function AdminPagos() {
  const { datos, cargando, error } = useColeccion<Pago>(useMemo(() => query(collection(db, 'pagos')), []))
  const obras = useColeccion<Obra>(useMemo(() => query(collection(db, 'obras')), []))
  const ordenados = useMemo(() => [...datos].sort((a, b) => ms(b.finalizadaEn) - ms(a.finalizadaEn)), [datos])
  const total = datos.reduce((t, x) => t + x.montoFinal, 0)
  const comision = datos.reduce((t, x) => t + x.comisionMonto, 0)
  return (
    <div className="space-y-4">
      <CabeceraPagina titulo="Pagos y comisiones" descripcion={AVISO_PAGO} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Estadistica etiqueta="Registros" valor={datos.length} />
        <Estadistica etiqueta="Monto total" valor={formatoDinero(total)} />
        <Estadistica etiqueta={`Comisión de referencia (${formatoPorcentaje(COMISION)})`} valor={formatoDinero(comision)} />
      </div>
      {error && <Alerta>{error}</Alerta>}
      {cargando ? <Cargando /> : ordenados.length === 0 ? <EstadoVacio>Todavía no hay pagos registrados.</EstadoVacio> : (
        <Seccion>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-borde text-xs uppercase text-suave">
                <tr><th className="p-3">Obra</th><th className="p-3">Fecha</th><th className="p-3">Monto final</th><th className="p-3">Comisión</th><th className="p-3">Estado</th></tr>
              </thead>
              <tbody>
                {ordenados.map(p => (
                  <tr key={p.id} className="border-b border-borde last:border-0">
                    <td className="p-3">{obras.datos.find(o => o.id === p.obraId)?.titulo ?? p.obraId} {p.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}</td>
                    <td className="p-3">{formatoFecha(p.finalizadaEn)}</td>
                    <td className="p-3">{formatoDinero(p.montoFinal)}</td>
                    <td className="p-3">{formatoDinero(p.comisionMonto)} ({formatoPorcentaje(p.tasaComision)})</td>
                    <td className="p-3"><Insignia info={ROTULO_PAGO} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Seccion>
      )}
    </div>
  )
}
