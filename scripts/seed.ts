/**
 * Datos de DEMO de Licity (todo marcado isDemo: true). Por defecto corre contra los EMULADORES. Para producción: FIREBASE_PROJECT_ID=... GOOGLE_APPLICATION_CREDENTIALS=... npm run seed -- --produccion --yes
 *   1) npm run emuladores   (en otra terminal)
 *   2) npm run seed
 * Es idempotente: se puede correr varias veces.
 */
import { pathToFileURL } from 'node:url'
import { iniciarAdmin } from './lib/admin-sdk'

export const CLAVE_DEMO = 'Demo-Clave-2026' // pública, solo existe en los emuladores

type Usuario = {
  uid: string
  email: string
  displayName: string
  role: 'pyme' | 'contratista' | 'admin'
  verificacion?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
  perfil?: Record<string, unknown>
  etiqueta: string
}

export const USUARIOS_DEMO: Usuario[] = [
  {
    uid: 'demo-pyme', email: 'pyme.demo@licity.test', displayName: 'Lucía Fernández', role: 'pyme', etiqueta: 'PyME',
    perfil: { nombreEmpresa: 'Panadería La Espiga SRL', cuit: '30-71234567-8', ciudad: 'Mar del Plata', telefono: '223 555 0101' },
  },
  {
    uid: 'demo-contratista', email: 'contratista.demo@licity.test', displayName: 'Martín Gómez', role: 'contratista', verificacion: 'APROBADO', etiqueta: 'Contratista verificado',
    perfil: { nombreEmpresa: 'Obras del Sur SA', cuit: '30-70987654-3', especialidad: 'Albañilería y reformas', ciudad: 'Mar del Plata', zona: 'Mar del Plata y Batán', descripcion: 'Quince años haciendo reformas y ampliaciones para comercios y pymes.', telefono: '223 555 0102', anios: 15 },
  },
  {
    uid: 'demo-contratista-2', email: 'contratista2.demo@licity.test', displayName: 'Sofía Ibarra', role: 'contratista', verificacion: 'APROBADO', etiqueta: 'Contratista verificado (2)',
    perfil: { nombreEmpresa: 'Atlántica Construcciones', cuit: '30-71111222-5', especialidad: 'Obra civil', ciudad: 'Mar del Plata', zona: 'Zona costera', descripcion: null, telefono: null, anios: 8 },
  },
  {
    uid: 'demo-contratista-pendiente', email: 'pendiente.demo@licity.test', displayName: 'Diego Paz', role: 'contratista', verificacion: 'PENDIENTE', etiqueta: 'Contratista pendiente de verificación',
    perfil: { nombreEmpresa: 'Paz Electricidad', cuit: '20-30555666-1', especialidad: 'Electricidad', ciudad: 'Mar del Plata', zona: null, descripcion: null, telefono: '223 555 0103', anios: 4 },
  },
  { uid: 'demo-admin', email: 'admin.demo@licity.test', displayName: 'Admin Licity', role: 'admin', etiqueta: 'Superadmin (entra en /admin/login)' },
]

const dias = (n: number) => new Date(Date.now() - n * 86_400_000)

/** En producción NO se crean cuentas demo (tendrían contraseña pública): solo datos de ejemplo. */
function usuariosDemoActivos() {
  return process.argv.includes('--produccion') ? [] : USUARIOS_DEMO
}

export async function sembrar() {
  const { auth, db, esEmulador } = iniciarAdmin({ produccion: process.argv.includes('--produccion') })
  if (!esEmulador && !process.argv.includes('--yes')) throw new Error('Para sembrar PRODUCCIÓN agregá --produccion --yes (en producción solo se cargan datos de ejemplo, sin cuentas demo).')

  for (const u of usuariosDemoActivos()) {
    const datos = { email: u.email, displayName: u.displayName, password: CLAVE_DEMO, emailVerified: true }
    await auth.updateUser(u.uid, datos).catch(() => auth.createUser({ uid: u.uid, ...datos }))
    await auth.setCustomUserClaims(u.uid, u.role === 'admin' ? { admin: true } : {})
    await db.doc(`users/${u.uid}`).set({
      email: u.email, displayName: u.displayName, role: u.role, status: 'activo', ...(u.verificacion ? { verificacion: u.verificacion } : {}), isDemo: true, createdAt: dias(30),
    })
    if (u.perfil) await db.doc(`perfiles/${u.uid}`).set(u.perfil)
  }

  const vacia = {
    avance: 0, contratistaId: null, contratistaNombre: null, ofertaId: null, montoAdjudicado: null, adjudicadaEn: null, iniciadaEn: null,
    contratistaTerminoEn: null, finalizadaEn: null, reportadaEn: null, motivoReporte: null, reportadaPor: null, motivoCancelacion: null,
  }
  const comun = { clienteId: 'demo-pyme', clienteNombre: 'Panadería La Espiga SRL', ciudad: 'Mar del Plata', isDemo: true }

  const obras = [
    { id: 'demo-obra-ofertas', ...vacia, ...comun, titulo: 'Ampliación de depósito trasero', categoria: 'Reforma / ampliación', estado: 'RECIBIENDO_OFERTAS', publicadaEn: dias(6),
      descripcion: 'Ampliar el depósito trasero de la panadería: losa, cerramiento de mampostería y portón. Aproximadamente 40 m².', fechaInicio: null, plazoDias: 60, presupuesto: 9500000 },
    { id: 'demo-obra-nueva', ...vacia, ...comun, titulo: 'Pintura de local y fachada', categoria: 'Pintura', estado: 'PUBLICADA', publicadaEn: dias(1),
      descripcion: 'Pintura interior completa del local (120 m²) y fachada con revoque a reparar. Incluye materiales.', fechaInicio: null, plazoDias: 20, presupuesto: null },
    { id: 'demo-obra-ejecucion', ...comun, titulo: 'Reforma de cocina industrial', categoria: 'Reforma / ampliación', estado: 'EN_EJECUCION', publicadaEn: dias(25),
      descripcion: 'Renovación de la cocina: revestimientos, mesadas de acero, instalación eléctrica y de gas.', fechaInicio: null, plazoDias: 45, presupuesto: 6800000,
      avance: 40, contratistaId: 'demo-contratista', contratistaNombre: 'Obras del Sur SA', ofertaId: 'demo-obra-ejecucion_demo-contratista', montoAdjudicado: 6200000,
      adjudicadaEn: dias(15), iniciadaEn: dias(10), contratistaTerminoEn: null, finalizadaEn: null, reportadaEn: null, motivoReporte: null, reportadaPor: null, motivoCancelacion: null },
    { id: 'demo-obra-finalizada', ...comun, titulo: 'Impermeabilización de techo', categoria: 'Techos e impermeabilización', estado: 'FINALIZADA', publicadaEn: dias(60),
      descripcion: 'Impermeabilización con membrana de la losa del techo (90 m²) y reparación de desagües.', fechaInicio: null, plazoDias: 15, presupuesto: 2400000,
      avance: 100, contratistaId: 'demo-contratista', contratistaNombre: 'Obras del Sur SA', ofertaId: 'demo-obra-finalizada_demo-contratista', montoAdjudicado: 2250000,
      adjudicadaEn: dias(50), iniciadaEn: dias(45), contratistaTerminoEn: dias(30), finalizadaEn: dias(28), reportadaEn: null, motivoReporte: null, reportadaPor: null, motivoCancelacion: null },
  ]
  for (const { id, ...o } of obras) await db.doc(`obras/${id}`).set(o)

  const oferta = (obraId: string, titulo: string, uid: string, nombre: string, esp: string, anios: number | null, extra: Record<string, unknown>) => ({
    obraId, obraTitulo: titulo, clienteId: 'demo-pyme', contratistaId: uid, contratistaNombre: nombre, especialidad: esp, ciudad: 'Mar del Plata', anios,
    notas: null, isDemo: true, ...extra,
  })
  const ofertas = [
    oferta('demo-obra-ofertas', 'Ampliación de depósito trasero', 'demo-contratista', 'Obras del Sur SA', 'Albañilería y reformas', 15,
      { monto: 8900000, plazoDias: 50, descripcion: 'Incluye excavación, losa de hormigón, muros de ladrillo hueco, portón metálico y retiro de escombros. Materiales incluidos.', estado: 'PENDIENTE', creadaEn: dias(4) }),
    oferta('demo-obra-ofertas', 'Ampliación de depósito trasero', 'demo-contratista-2', 'Atlántica Construcciones', 'Obra civil', 8,
      { monto: 9400000, plazoDias: 40, descripcion: 'Ejecución llave en mano con equipo propio. Plazo reducido, materiales y mano de obra incluidos, garantía de un año.', estado: 'PENDIENTE', creadaEn: dias(3) }),
    oferta('demo-obra-ejecucion', 'Reforma de cocina industrial', 'demo-contratista', 'Obras del Sur SA', 'Albañilería y reformas', 15,
      { monto: 6200000, plazoDias: 40, descripcion: 'Reforma completa de cocina con instalaciones eléctricas y de gas certificadas.', estado: 'ACEPTADA', creadaEn: dias(20) }),
    oferta('demo-obra-finalizada', 'Impermeabilización de techo', 'demo-contratista', 'Obras del Sur SA', 'Albañilería y reformas', 15,
      { monto: 2250000, plazoDias: 14, descripcion: 'Membrana asfáltica con aluminio, reparación de desagües y prueba de estanqueidad.', estado: 'ACEPTADA', creadaEn: dias(55) }),
  ]
  for (const o of ofertas) await db.doc(`ofertas/${o.obraId}_${o.contratistaId}`).set(o)

  const nov = (obraId: string, id: string, d: Record<string, unknown>) => db.doc(`obras/${obraId}/novedades/${id}`).set({ estadoHacia: null, avance: null, mensaje: null, ...d })
  await nov('demo-obra-ejecucion', 'n1', { tipo: 'ESTADO', estadoHacia: 'ADJUDICADA', mensaje: 'Obra adjudicada a Obras del Sur SA.', autorId: 'demo-pyme', autorNombre: 'Lucía Fernández', creadaEn: dias(15) })
  await nov('demo-obra-ejecucion', 'n2', { tipo: 'ESTADO', estadoHacia: 'EN_EJECUCION', mensaje: 'El contratista inició la ejecución.', autorId: 'demo-contratista', autorNombre: 'Martín Gómez', creadaEn: dias(10) })
  await nov('demo-obra-ejecucion', 'n3', { tipo: 'AVANCE', avance: 40, mensaje: 'Demolición y nuevas instalaciones terminadas. Empezamos con revestimientos.', autorId: 'demo-contratista', autorNombre: 'Martín Gómez', creadaEn: dias(3) })
  await nov('demo-obra-finalizada', 'n1', { tipo: 'ESTADO', estadoHacia: 'FINALIZADA', mensaje: 'La PyME confirmó la finalización. Se registró el pago de prueba.', autorId: 'demo-pyme', autorNombre: 'Lucía Fernández', creadaEn: dias(28) })

  await db.doc('pagos/demo-obra-finalizada').set({
    obraId: 'demo-obra-finalizada', clienteId: 'demo-pyme', contratistaId: 'demo-contratista', montoFinal: 2250000, tasaComision: 0.015, comisionMonto: 33750,
    estado: 'REGISTRO_DE_PRUEBA', finalizadaEn: dias(28), isDemo: true,
  })

  await db.doc('notificaciones/demo-aviso-1').set({
    usuarioId: 'demo-pyme', titulo: 'Recibiste una oferta', cuerpo: 'Atlántica Construcciones ofertó en "Ampliación de depósito trasero".',
    href: '/app/pyme/obras/demo-obra-ofertas', obraId: 'demo-obra-ofertas', leida: false, creadaEn: dias(3),
  })
  await db.doc('notificaciones/demo-aviso-2').set({
    usuarioId: 'demo-contratista', titulo: 'Obra finalizada', cuerpo: 'La PyME confirmó "Impermeabilización de techo". Quedó el registro de prueba del pago.',
    href: '/app/contratista/obras/demo-obra-finalizada', obraId: 'demo-obra-finalizada', leida: true, creadaEn: dias(28),
  })
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  sembrar()
    .then(() => {
      console.log('✔ Seed de demo listo (emuladores). Usuarios DEMO (clave pública de demo):')
      for (const u of usuariosDemoActivos()) console.log(`  ${u.etiqueta.padEnd(40)} ${u.email}  /  ${CLAVE_DEMO}`)
    })
    .catch((e: unknown) => {
      console.error(`✖ ${e instanceof Error ? e.message : String(e)}`)
      process.exit(1)
    })
}
