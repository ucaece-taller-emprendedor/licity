import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { crearEntorno } from './ayuda'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await crearEntorno('demo-licity-reglas')
})
afterAll(async () => env.cleanup())

// ── Datos de partida ─────────────────────────────────────────────────────
// Usuarios: pyme1, pyme2 · con1, con2 (verificados) · conPend (pendiente) · conRech (rechazado) · pymeSusp (suspendida)
const T = () => new Date()
const base = { isDemo: true, createdAt: T() }
const perfilPyme = (nombre: string) => ({ nombreEmpresa: nombre, cuit: '30-12345678-9', ciudad: 'Mar del Plata', telefono: null })
const perfilCon = (nombre: string) => ({ nombreEmpresa: nombre, cuit: '20-12345678-9', especialidad: 'Albañilería', ciudad: 'Mar del Plata', zona: null, descripcion: null, telefono: null, anios: 5 })

const obraBase = (o: Record<string, unknown> = {}) => ({
  clienteId: 'pyme1', clienteNombre: 'Panadería Uno SRL', titulo: 'Ampliación de depósito', descripcion: 'Ampliar el depósito trasero con losa y cerramiento.',
  categoria: 'Reforma / ampliación', ciudad: 'Mar del Plata', fechaInicio: null, plazoDias: 60, presupuesto: 1000000,
  estado: 'PUBLICADA', avance: 0, contratistaId: null, contratistaNombre: null, ofertaId: null, montoAdjudicado: null,
  publicadaEn: T(), adjudicadaEn: null, iniciadaEn: null, contratistaTerminoEn: null, finalizadaEn: null,
  reportadaEn: null, motivoReporte: null, reportadaPor: null, motivoCancelacion: null, isDemo: true, ...o,
})
const ofertaBase = (obraId: string, con: string, o: Record<string, unknown> = {}) => ({
  obraId, obraTitulo: 'Ampliación de depósito', clienteId: 'pyme1', contratistaId: con, contratistaNombre: con === 'con1' ? 'Obras Uno SA' : 'Obras Dos SA',
  especialidad: 'Albañilería', ciudad: 'Mar del Plata', anios: 5, monto: 500000, descripcion: 'Incluye materiales y mano de obra completa.',
  plazoDias: 45, notas: null, estado: 'PENDIENTE', creadaEn: T(), isDemo: true, ...o,
})
const adjudicada = { estado: 'ADJUDICADA', contratistaId: 'con1', contratistaNombre: 'Obras Uno SA', ofertaId: 'o-adj_con1', montoAdjudicado: 500000, adjudicadaEn: T() }

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore()
    const u = (id: string, role: string, extra: Record<string, unknown> = {}) =>
      setDoc(doc(db, `users/${id}`), { ...base, email: `${id}@test.com`, displayName: `Nombre ${id}`, role, status: 'activo', ...extra })
    await u('pyme1', 'pyme')
    await u('pyme2', 'pyme')
    await u('pymeSusp', 'pyme', { status: 'suspendido' })
    await u('con1', 'contratista', { verificacion: 'APROBADO' })
    await u('con2', 'contratista', { verificacion: 'APROBADO' })
    await u('conPend', 'contratista', { verificacion: 'PENDIENTE' })
    await u('conRech', 'contratista', { verificacion: 'RECHAZADO', motivoRechazo: 'CUIT ilegible' })
    await u('adminDoc', 'admin')
    await setDoc(doc(db, 'perfiles/pyme1'), perfilPyme('Panadería Uno SRL'))
    await setDoc(doc(db, 'perfiles/pyme2'), perfilPyme('Panadería Dos SRL'))
    await setDoc(doc(db, 'perfiles/pymeSusp'), perfilPyme('Susp SRL'))
    for (const c of ['con1', 'con2', 'conPend', 'conRech']) await setDoc(doc(db, `perfiles/${c}`), perfilCon(c === 'con1' ? 'Obras Uno SA' : c === 'con2' ? 'Obras Dos SA' : c))

    const obra = (id: string, o: Record<string, unknown> = {}) => setDoc(doc(db, `obras/${id}`), obraBase(o))
    await obra('o-pub')
    await obra('o-rec', { estado: 'RECIBIENDO_OFERTAS' })
    await obra('o-eval', { estado: 'EVALUANDO' })
    await obra('o-adj', adjudicada)
    await obra('o-ejec', { ...adjudicada, estado: 'EN_EJECUCION', avance: 40, iniciadaEn: T() })
    await obra('o-listo', { ...adjudicada, estado: 'EN_EJECUCION', avance: 100, iniciadaEn: T(), contratistaTerminoEn: T() })
    await obra('o-fin', { ...adjudicada, estado: 'FINALIZADA', avance: 100, finalizadaEn: T() })
    await obra('o-p2', { clienteId: 'pyme2', clienteNombre: 'Panadería Dos SRL' })
    const of = (obraId: string, con: string, o: Record<string, unknown> = {}) => setDoc(doc(db, `ofertas/${obraId}_${con}`), ofertaBase(obraId, con, o))
    await of('o-rec', 'con1')
    await of('o-rec', 'con2')
    await of('o-eval', 'con1')
    await of('o-eval', 'con2')
    await of('o-adj', 'con1', { estado: 'ACEPTADA' })
    await of('o-adj', 'con2', { estado: 'RECHAZADA' })
  })
})

const como = (uid: string, email = `${uid}@test.com`, claims: Record<string, unknown> = {}) => env.authenticatedContext(uid, { email, ...claims }).firestore()
const anonimo = () => env.unauthenticatedContext().firestore()
const admin = () => como('admin1', 'admin@test.com', { admin: true })
type Db = ReturnType<typeof como>
const ahora = serverTimestamp

// Documentos de alta válidos
const altaUsuario = (rol: 'pyme' | 'contratista', email: string) =>
  rol === 'pyme'
    ? { email, displayName: 'Nueva Persona', role: 'pyme', status: 'activo', isDemo: false, createdAt: ahora() }
    : { email, displayName: 'Nueva Persona', role: 'contratista', status: 'activo', verificacion: 'PENDIENTE', isDemo: false, createdAt: ahora() }
async function registrar(db: Db, uid: string, rol: 'pyme' | 'contratista', usuarioExtra: Record<string, unknown> = {}, perfilExtra: Record<string, unknown> = {}) {
  const b = writeBatch(db)
  b.set(doc(db, `users/${uid}`), { ...altaUsuario(rol, `${uid}@test.com`), ...usuarioExtra })
  b.set(doc(db, `perfiles/${uid}`), { ...(rol === 'pyme' ? perfilPyme('Mi Empresa') : perfilCon('Mi Empresa')), ...perfilExtra })
  await b.commit()
}

describe('users y registro', () => {
  it('una PyME se registra activa (cuenta + perfil en el mismo batch)', async () => {
    await assertSucceeds(registrar(como('nueva'), 'nueva', 'pyme'))
  })
  it('un contratista se registra y nace con verificación PENDIENTE', async () => {
    await assertSucceeds(registrar(como('nuevo'), 'nuevo', 'contratista'))
  })
  it('un contratista NO puede crearse ya aprobado', async () => {
    await assertFails(registrar(como('nuevo'), 'nuevo', 'contratista', { verificacion: 'APROBADO' }))
  })
  it('no se puede crear con role admin ni con campos de más ni suspendido', async () => {
    await assertFails(registrar(como('x1'), 'x1', 'pyme', { role: 'admin' }))
    await assertFails(registrar(como('x2'), 'x2', 'pyme', { admin: true }))
    await assertFails(registrar(como('x3'), 'x3', 'pyme', { status: 'suspendido' }))
    await assertFails(registrar(como('x4'), 'x4', 'pyme', { isDemo: true }))
  })
  it('una PyME no puede registrarse con campo de verificación (para saltearse nada)', async () => {
    await assertFails(registrar(como('x5'), 'x5', 'pyme', { verificacion: 'APROBADO' }))
  })
  it('la cuenta sin perfil en el mismo batch es rechazada', async () => {
    await assertFails(setDoc(doc(como('sinperfil'), 'users/sinperfil'), altaUsuario('pyme', 'sinperfil@test.com')))
  })
  it('un perfil de contratista con CUIT inválido es rechazado', async () => {
    await assertFails(registrar(como('x6'), 'x6', 'contratista', {}, { cuit: '123' }))
  })
  it('no se puede crear el perfil de otro uid', async () => {
    const db = como('nuevo')
    const b = writeBatch(db)
    b.set(doc(db, 'users/otro'), altaUsuario('pyme', 'nuevo@test.com'))
    b.set(doc(db, 'perfiles/otro'), perfilPyme('X'))
    await assertFails(b.commit())
  })
  it('un usuario NO puede escalar su rol ni su estado', async () => {
    const db = como('pyme1')
    await assertFails(updateDoc(doc(db, 'users/pyme1'), { role: 'admin' }))
    await assertFails(updateDoc(doc(db, 'users/pyme1'), { role: 'contratista' }))
    await assertFails(updateDoc(doc(db, 'users/pyme1'), { status: 'suspendido' }))
    await assertSucceeds(updateDoc(doc(db, 'users/pyme1'), { displayName: 'Otro Nombre' }))
  })
  it('un contratista pendiente NO puede aprobarse solo; el rechazado solo puede volver a PENDIENTE', async () => {
    await assertFails(updateDoc(doc(como('conPend'), 'users/conPend'), { verificacion: 'APROBADO' }))
    await assertFails(updateDoc(doc(como('conRech'), 'users/conRech'), { verificacion: 'APROBADO' }))
    await assertSucceeds(updateDoc(doc(como('conRech'), 'users/conRech'), { verificacion: 'PENDIENTE' }))
  })
  it('un contratista aprobado no puede volver a pedir revisión ni cambiar su verificación', async () => {
    await assertFails(updateDoc(doc(como('con1'), 'users/con1'), { verificacion: 'PENDIENTE' }))
    await assertFails(updateDoc(doc(como('con1'), 'users/con1'), { verificacion: 'RECHAZADO' }))
  })
  it('no puede leer cuentas ajenas; anónimo tampoco; no se puede listar todo', async () => {
    await assertFails(getDoc(doc(como('pyme1'), 'users/pyme2')))
    await assertFails(getDoc(doc(anonimo(), 'users/pyme1')))
    await assertSucceeds(getDoc(doc(como('pyme1'), 'users/pyme1')))
    await assertFails(getDocs(collection(como('pyme1'), 'users')))
  })
  it('el admin (claim) aprueba un contratista; rechazar exige motivo; no cambia roles ni toca a otro admin', async () => {
    const db = admin()
    await assertSucceeds(getDocs(collection(db, 'users')))
    await assertFails(updateDoc(doc(db, 'users/conPend'), { verificacion: 'RECHAZADO' }))
    await assertFails(updateDoc(doc(db, 'users/conPend'), { verificacion: 'RECHAZADO', motivoRechazo: 'no' }))
    await assertSucceeds(updateDoc(doc(db, 'users/conPend'), { verificacion: 'RECHAZADO', motivoRechazo: 'Falta la constancia de CUIT' }))
    await assertSucceeds(updateDoc(doc(db, 'users/conRech'), { verificacion: 'APROBADO', motivoRechazo: deleteField() }))
    await assertFails(updateDoc(doc(db, 'users/pyme1'), { verificacion: 'APROBADO' }))
    await assertFails(updateDoc(doc(db, 'users/adminDoc'), { status: 'suspendido' }))
    await assertFails(deleteDoc(doc(db, 'users/pyme1')))
  })
  it('el admin suspende y reactiva', async () => {
    await assertSucceeds(updateDoc(doc(admin(), 'users/pyme1'), { status: 'suspendido' }))
    await assertSucceeds(updateDoc(doc(admin(), 'users/pymeSusp'), { status: 'activo' }))
    await assertFails(updateDoc(doc(admin(), 'users/pyme1'), { status: 'borrado' }))
  })
})

describe('perfiles', () => {
  it('cada uno lee y edita solo el suyo', async () => {
    await assertSucceeds(getDoc(doc(como('pyme1'), 'perfiles/pyme1')))
    await assertFails(getDoc(doc(como('pyme2'), 'perfiles/pyme1')))
    await assertFails(getDoc(doc(como('con1'), 'perfiles/pyme1')))
    await assertSucceeds(updateDoc(doc(como('pyme1'), 'perfiles/pyme1'), { telefono: '223 555 1234' }))
    await assertFails(updateDoc(doc(como('pyme2'), 'perfiles/pyme1'), { telefono: '223 555 1234' }))
  })
  it('un perfil de PyME no admite campos de contratista', async () => {
    await assertFails(updateDoc(doc(como('pyme1'), 'perfiles/pyme1'), { especialidad: 'Pintura' }))
  })
  it('el admin puede leer perfiles', async () => {
    await assertSucceeds(getDoc(doc(admin(), 'perfiles/con1')))
  })
})

describe('obras: alta, edición y lectura', () => {
  const nueva = (o: Record<string, unknown> = {}) => {
    const { publicadaEn: _p, ...resto } = obraBase({ isDemo: false, ...o })
    void _p
    return { ...resto, publicadaEn: ahora() }
  }
  it('una PyME activa publica su obra', async () => {
    await assertSucceeds(setDoc(doc(como('pyme1'), 'obras/nueva'), nueva()))
  })
  it('un contratista, una PyME suspendida o un anónimo no publican', async () => {
    await assertFails(setDoc(doc(como('con1'), 'obras/n1'), nueva({ clienteId: 'con1' })))
    await assertFails(setDoc(doc(como('pymeSusp'), 'obras/n2'), nueva({ clienteId: 'pymeSusp', clienteNombre: 'Susp SRL' })))
    await assertFails(setDoc(doc(anonimo(), 'obras/n3'), nueva()))
  })
  it('no se puede publicar a nombre de otra PyME ni saltearse estados', async () => {
    await assertFails(setDoc(doc(como('pyme2'), 'obras/n4'), nueva()))
    await assertFails(setDoc(doc(como('pyme1'), 'obras/n5'), nueva({ estado: 'ADJUDICADA' })))
    await assertFails(setDoc(doc(como('pyme1'), 'obras/n6'), nueva({ avance: 50 })))
    await assertFails(setDoc(doc(como('pyme1'), 'obras/n7'), nueva({ contratistaId: 'con1' })))
    await assertFails(setDoc(doc(como('pyme1'), 'obras/n8'), nueva({ clienteNombre: 'Otra empresa' })))
  })
  it('valida tipos, categorías y rangos', async () => {
    await assertFails(setDoc(doc(como('pyme1'), 'obras/v1'), nueva({ categoria: 'Magia' })))
    await assertFails(setDoc(doc(como('pyme1'), 'obras/v2'), nueva({ titulo: 'abc' })))
    await assertFails(setDoc(doc(como('pyme1'), 'obras/v3'), nueva({ presupuesto: -5 })))
    await assertFails(setDoc(doc(como('pyme1'), 'obras/v4'), nueva({ plazoDias: 'muchos' })))
    await assertFails(setDoc(doc(como('pyme1'), 'obras/v5'), nueva({ extra: 'x' })))
    await assertSucceeds(setDoc(doc(como('pyme1'), 'obras/v6'), nueva({ presupuesto: null, plazoDias: null, fechaInicio: '2026-12-01' })))
  })
  it('la PyME edita su obra solo mientras está PUBLICADA', async () => {
    await assertSucceeds(updateDoc(doc(como('pyme1'), 'obras/o-pub'), { titulo: 'Otro título válido' }))
    await assertFails(updateDoc(doc(como('pyme1'), 'obras/o-rec'), { titulo: 'Otro título válido' }))
    await assertFails(updateDoc(doc(como('pyme1'), 'obras/o-pub'), { titulo: 'Otro título válido', estado: 'FINALIZADA' }))
  })
  it('acceso cruzado: otra PyME no lee, no edita, no cancela ni evalúa la obra ajena', async () => {
    const db = como('pyme2')
    await assertFails(getDoc(doc(db, 'obras/o-pub')))
    await assertFails(updateDoc(doc(db, 'obras/o-pub'), { titulo: 'Hackeada por otra PyME' }))
    await assertFails(updateDoc(doc(db, 'obras/o-pub'), { estado: 'CANCELADA', motivoCancelacion: null }))
    await assertFails(updateDoc(doc(db, 'obras/o-rec'), { estado: 'EVALUANDO' }))
    await assertFails(getDocs(query(collection(db, 'obras'), where('clienteId', '==', 'pyme1'))))
    await assertSucceeds(getDocs(query(collection(db, 'obras'), where('clienteId', '==', 'pyme2'))))
  })
  it('el contratista verificado ve las obras abiertas y las suyas; no las cerradas ajenas', async () => {
    const db = como('con1')
    await assertSucceeds(getDocs(query(collection(db, 'obras'), where('estado', 'in', ['PUBLICADA', 'RECIBIENDO_OFERTAS']))))
    await assertSucceeds(getDoc(doc(db, 'obras/o-pub')))
    await assertSucceeds(getDoc(doc(db, 'obras/o-eval'))) // ofertó
    await assertSucceeds(getDocs(query(collection(db, 'obras'), where('contratistaId', '==', 'con1'))))
    await assertFails(getDoc(doc(como('con2'), 'obras/o-ejec'))) // adjudicada a otro
    await assertFails(getDocs(collection(db, 'obras')))
  })
  it('un contratista pendiente o rechazado NO ve obras; un anónimo tampoco', async () => {
    await assertFails(getDoc(doc(como('conPend'), 'obras/o-pub')))
    await assertFails(getDoc(doc(como('conRech'), 'obras/o-pub')))
    await assertFails(getDocs(query(collection(como('conPend'), 'obras'), where('estado', 'in', ['PUBLICADA', 'RECIBIENDO_OFERTAS']))))
    await assertFails(getDoc(doc(anonimo(), 'obras/o-pub')))
  })
  it('la PyME no borra obras; el admin tampoco', async () => {
    await assertFails(deleteDoc(doc(como('pyme1'), 'obras/o-pub')))
    await assertFails(deleteDoc(doc(admin(), 'obras/o-pub')))
  })
  it('el admin lee todo', async () => {
    await assertSucceeds(getDocs(collection(admin(), 'obras')))
  })
})

describe('ofertas', () => {
  const oferta = (obraId: string, con: string, o: Record<string, unknown> = {}) => {
    const { creadaEn: _c, ...resto } = ofertaBase(obraId, con, { isDemo: false, ...o })
    void _c
    return { ...resto, creadaEn: ahora() }
  }
  it('la primera oferta pasa la obra a RECIBIENDO_OFERTAS en el mismo batch', async () => {
    const db = como('con1')
    const b = writeBatch(db)
    b.set(doc(db, 'ofertas/o-pub_con1'), oferta('o-pub', 'con1'))
    b.update(doc(db, 'obras/o-pub'), { estado: 'RECIBIENDO_OFERTAS' })
    // El aviso a la PyME viaja en el mismo batch (la oferta todavía no existe antes del commit).
    b.set(doc(collection(db, 'notificaciones')), { usuarioId: 'pyme1', titulo: 'Recibiste una oferta', cuerpo: null, href: '/app/pyme/obras/o-pub', obraId: 'o-pub', leida: false, creadaEn: ahora() })
    await assertSucceeds(b.commit())
  })
  it('ofertar a una obra PUBLICADA sin pasarla a RECIBIENDO_OFERTAS es rechazado', async () => {
    await assertFails(setDoc(doc(como('con1'), 'ofertas/o-pub_con1'), oferta('o-pub', 'con1')))
  })
  it('una oferta a una obra que ya recibe ofertas no necesita tocar la obra', async () => {
    await env.withSecurityRulesDisabled(async ctx => deleteDoc(doc(ctx.firestore(), 'ofertas/o-rec_con2')))
    await assertSucceeds(setDoc(doc(como('con2'), 'ofertas/o-rec_con2'), oferta('o-rec', 'con2')))
  })
  it('el contratista pendiente/rechazado NO puede ofertar', async () => {
    await assertFails(setDoc(doc(como('conPend'), 'ofertas/o-rec_conPend'), oferta('o-rec', 'conPend')))
    await assertFails(setDoc(doc(como('conRech'), 'ofertas/o-rec_conRech'), oferta('o-rec', 'conRech')))
  })
  it('una PyME no puede ofertar', async () => {
    await assertFails(setDoc(doc(como('pyme2'), 'ofertas/o-rec_pyme2'), oferta('o-rec', 'pyme2')))
  })
  it('no se oferta a obras en evaluación/adjudicadas, ni con id ajeno, ni con datos adulterados', async () => {
    await env.withSecurityRulesDisabled(async ctx => deleteDoc(doc(ctx.firestore(), 'ofertas/o-eval_con2')))
    await assertFails(setDoc(doc(como('con2'), 'ofertas/o-eval_con2'), oferta('o-eval', 'con2')))
    await assertFails(setDoc(doc(como('con2'), 'ofertas/o-adj_con2x'), oferta('o-adj', 'con2')))
    await assertFails(setDoc(doc(como('con2'), 'ofertas/o-rec_con1'), oferta('o-rec', 'con1')))
    await env.withSecurityRulesDisabled(async ctx => deleteDoc(doc(ctx.firestore(), 'ofertas/o-rec_con2')))
    await assertFails(setDoc(doc(como('con2'), 'ofertas/o-rec_con2'), oferta('o-rec', 'con2', { clienteId: 'pyme2' })))
    await assertFails(setDoc(doc(como('con2'), 'ofertas/o-rec_con2'), oferta('o-rec', 'con2', { contratistaNombre: 'Otra Empresa' })))
    await assertFails(setDoc(doc(como('con2'), 'ofertas/o-rec_con2'), oferta('o-rec', 'con2', { estado: 'ACEPTADA' })))
    await assertFails(setDoc(doc(como('con2'), 'ofertas/o-rec_con2'), oferta('o-rec', 'con2', { monto: -1 })))
    await assertFails(setDoc(doc(como('con2'), 'ofertas/o-rec_con2'), oferta('o-rec', 'con2', { plazoDias: 0 })))
  })
  it('no se puede pisar una oferta existente con otro monto', async () => {
    await assertFails(setDoc(doc(como('con1'), 'ofertas/o-rec_con1'), oferta('o-rec', 'con1', { monto: 1 })))
    await assertFails(updateDoc(doc(como('con1'), 'ofertas/o-rec_con1'), { monto: 1 }))
  })
  it('acceso cruzado: la oferta la ven su autor y la PyME dueña, no otro contratista ni otra PyME', async () => {
    await assertSucceeds(getDoc(doc(como('con1'), 'ofertas/o-rec_con1')))
    await assertSucceeds(getDoc(doc(como('pyme1'), 'ofertas/o-rec_con1')))
    await assertFails(getDoc(doc(como('con2'), 'ofertas/o-rec_con1')))
    await assertFails(getDoc(doc(como('pyme2'), 'ofertas/o-rec_con1')))
    await assertSucceeds(getDocs(query(collection(como('pyme1'), 'ofertas'), where('obraId', '==', 'o-rec'), where('clienteId', '==', 'pyme1'))))
    await assertFails(getDocs(query(collection(como('pyme2'), 'ofertas'), where('obraId', '==', 'o-rec'))))
    await assertFails(getDocs(query(collection(como('con2'), 'ofertas'), where('obraId', '==', 'o-rec'))))
  })
  it('retirar la oferta y volver a ofertar', async () => {
    await assertSucceeds(updateDoc(doc(como('con1'), 'ofertas/o-rec_con1'), { estado: 'RETIRADA' }))
    await assertSucceeds(updateDoc(doc(como('con1'), 'ofertas/o-rec_con1'), { estado: 'PENDIENTE', monto: 450000, plazoDias: 40, descripcion: 'Nueva propuesta con todo incluido.', notas: null, creadaEn: ahora() }))
  })
  it('no se retira una oferta aceptada ni una de una obra adjudicada; ajeno tampoco', async () => {
    await assertFails(updateDoc(doc(como('con1'), 'ofertas/o-adj_con1'), { estado: 'RETIRADA' }))
    await assertFails(updateDoc(doc(como('con2'), 'ofertas/o-rec_con1'), { estado: 'RETIRADA' }))
  })
  it('un contratista no puede aceptarse su propia oferta', async () => {
    await assertFails(updateDoc(doc(como('con1'), 'ofertas/o-rec_con1'), { estado: 'ACEPTADA' }))
  })
})

describe('transiciones de estado de la obra', () => {
  const adjudicarBatch = (db: Db, ganador = 'con1', obraId = 'o-rec', otros: string[] = ['con2']) => {
    const b = writeBatch(db)
    b.update(doc(db, `obras/${obraId}`), {
      estado: 'ADJUDICADA', contratistaId: ganador, contratistaNombre: ganador === 'con1' ? 'Obras Uno SA' : 'Obras Dos SA',
      ofertaId: `${obraId}_${ganador}`, montoAdjudicado: 500000, adjudicadaEn: ahora(),
    })
    b.update(doc(db, `ofertas/${obraId}_${ganador}`), { estado: 'ACEPTADA' })
    for (const o of otros) b.update(doc(db, `ofertas/${obraId}_${o}`), { estado: 'RECHAZADA' })
    return b
  }

  it('flujo feliz: evaluar → adjudicar (con 2 ofertas) → iniciar → avance → terminé → confirmar con pago de prueba', async () => {
    const pyme = como('pyme1')
    const con = como('con1')
    await assertSucceeds(updateDoc(doc(pyme, 'obras/o-rec'), { estado: 'EVALUANDO' }))
    const b = adjudicarBatch(pyme)
    const nov = doc(collection(pyme, 'obras/o-rec/novedades'))
    b.set(nov, { tipo: 'ESTADO', estadoHacia: 'ADJUDICADA', avance: null, mensaje: 'Obra adjudicada.', autorId: 'pyme1', autorNombre: 'Nombre pyme1', creadaEn: ahora() })
    const notif = doc(collection(pyme, 'notificaciones'))
    b.set(notif, { usuarioId: 'con1', titulo: 'Te adjudicaron una obra', cuerpo: null, href: '/app/contratista/obras/o-rec', obraId: 'o-rec', leida: false, creadaEn: ahora() })
    const notif2 = doc(collection(pyme, 'notificaciones'))
    b.set(notif2, { usuarioId: 'con2', titulo: 'No fuiste seleccionado', cuerpo: null, href: null, obraId: 'o-rec', leida: false, creadaEn: ahora() })
    await assertSucceeds(b.commit())
    await assertSucceeds(updateDoc(doc(con, 'obras/o-rec'), { estado: 'EN_EJECUCION', iniciadaEn: ahora() }))
    await assertSucceeds(updateDoc(doc(con, 'obras/o-rec'), { avance: 30 }))
    await assertSucceeds(updateDoc(doc(con, 'obras/o-rec'), { avance: 100, contratistaTerminoEn: ahora() }))
    const fin = writeBatch(pyme)
    fin.update(doc(pyme, 'obras/o-rec'), { estado: 'FINALIZADA', avance: 100, finalizadaEn: ahora() })
    fin.set(doc(pyme, 'pagos/o-rec'), { obraId: 'o-rec', clienteId: 'pyme1', contratistaId: 'con1', montoFinal: 500000, tasaComision: 0.015, comisionMonto: 7500, estado: 'REGISTRO_DE_PRUEBA', finalizadaEn: ahora(), isDemo: false })
    await assertSucceeds(fin.commit())
  })

  it('adjudicar exige aceptar la oferta en el mismo batch', async () => {
    await assertFails(updateDoc(doc(como('pyme1'), 'obras/o-rec'), { estado: 'ADJUDICADA', contratistaId: 'con1', contratistaNombre: 'Obras Uno SA', ofertaId: 'o-rec_con1', montoAdjudicado: 500000, adjudicadaEn: ahora() }))
  })
  it('adjudicar con monto distinto al de la oferta o a un contratista que no ofertó es rechazado', async () => {
    const db = como('pyme1')
    const b = adjudicarBatch(db)
    b.update(doc(db, 'obras/o-rec'), { montoAdjudicado: 1 })
    await assertFails(b.commit())
    const c = writeBatch(db)
    c.update(doc(db, 'obras/o-rec'), { estado: 'ADJUDICADA', contratistaId: 'conPend', contratistaNombre: 'conPend', ofertaId: 'o-rec_conPend', montoAdjudicado: 500000, adjudicadaEn: ahora() })
    await assertFails(c.commit())
  })
  it('no se adjudica a un contratista que fue suspendido o desverificado', async () => {
    await env.withSecurityRulesDisabled(async ctx => updateDoc(doc(ctx.firestore(), 'users/con1'), { verificacion: 'RECHAZADO' }))
    await assertFails(adjudicarBatch(como('pyme1')).commit())
  })
  it('otra PyME o un contratista no pueden adjudicar', async () => {
    await assertFails(adjudicarBatch(como('pyme2')).commit())
    await assertFails(adjudicarBatch(como('con1')).commit())
  })
  it('no se adjudica una obra que sigue PUBLICADA, ni una ya adjudicada', async () => {
    const db = como('pyme1')
    const b = writeBatch(db)
    b.update(doc(db, 'obras/o-pub'), { estado: 'ADJUDICADA', contratistaId: 'con1', contratistaNombre: 'Obras Uno SA', ofertaId: 'o-pub_con1', montoAdjudicado: 1, adjudicadaEn: ahora() })
    await assertFails(b.commit())
    await assertFails(adjudicarBatch(db, 'con2', 'o-adj', []).commit())
  })
  it('transiciones inválidas: saltear estados, retroceder o forzar el final', async () => {
    const pyme = como('pyme1')
    await assertFails(updateDoc(doc(pyme, 'obras/o-pub'), { estado: 'EVALUANDO' }))
    await assertFails(updateDoc(doc(pyme, 'obras/o-eval'), { estado: 'PUBLICADA' }))
    await assertFails(updateDoc(doc(pyme, 'obras/o-adj'), { estado: 'EN_EJECUCION', iniciadaEn: ahora() }))
    await assertFails(updateDoc(doc(pyme, 'obras/o-ejec'), { estado: 'FINALIZADA', avance: 100, finalizadaEn: ahora() }))
    await assertFails(updateDoc(doc(pyme, 'obras/o-fin'), { estado: 'EN_EJECUCION' }))
    await assertFails(updateDoc(doc(pyme, 'obras/o-fin'), { estado: 'CANCELADA', motivoCancelacion: null }))
  })
  it('el contratista no puede cambiar estados que no le corresponden', async () => {
    const con = como('con1')
    await assertFails(updateDoc(doc(con, 'obras/o-ejec'), { estado: 'FINALIZADA', avance: 100 }))
    await assertFails(updateDoc(doc(con, 'obras/o-ejec'), { estado: 'CANCELADA' }))
    await assertFails(updateDoc(doc(con, 'obras/o-rec'), { estado: 'EVALUANDO' }))
    await assertFails(updateDoc(doc(con, 'obras/o-adj'), { estado: 'FINALIZADA' }))
    await assertFails(updateDoc(doc(con, 'obras/o-adj'), { montoAdjudicado: 9999999 }))
  })
  it('solo el contratista adjudicado inicia y avanza; otro verificado no', async () => {
    await assertSucceeds(updateDoc(doc(como('con1'), 'obras/o-adj'), { estado: 'EN_EJECUCION', iniciadaEn: ahora() }))
    await assertFails(updateDoc(doc(como('con2'), 'obras/o-adj'), { estado: 'EN_EJECUCION', iniciadaEn: ahora() }))
    await assertFails(updateDoc(doc(como('con2'), 'obras/o-ejec'), { avance: 60 }))
    await assertFails(updateDoc(doc(como('pyme1'), 'obras/o-ejec'), { avance: 60 }))
  })
  it('avance: no retrocede, no es fraccionario ni llega a 100 por esa vía', async () => {
    const con = como('con1')
    await assertFails(updateDoc(doc(con, 'obras/o-ejec'), { avance: 10 }))
    await assertFails(updateDoc(doc(con, 'obras/o-ejec'), { avance: 100 }))
    await assertFails(updateDoc(doc(con, 'obras/o-ejec'), { avance: 55.5 }))
    await assertFails(updateDoc(doc(con, 'obras/o-ejec'), { avance: 60, estado: 'FINALIZADA' }))
    await assertSucceeds(updateDoc(doc(con, 'obras/o-ejec'), { avance: 60 }))
  })
  it('"terminé" exige estar EN_EJECUCION; no se repite', async () => {
    await assertFails(updateDoc(doc(como('con1'), 'obras/o-adj'), { avance: 100, contratistaTerminoEn: ahora() }))
    await assertFails(updateDoc(doc(como('con1'), 'obras/o-listo'), { avance: 100, contratistaTerminoEn: ahora() }))
    await assertSucceeds(updateDoc(doc(como('con1'), 'obras/o-ejec'), { avance: 100, contratistaTerminoEn: ahora() }))
  })
  it('confirmar la finalización: antes del "terminé" no, sin pago no, con comisión mal calculada no', async () => {
    const db = como('pyme1')
    const sinTermino = writeBatch(db)
    sinTermino.update(doc(db, 'obras/o-ejec'), { estado: 'FINALIZADA', avance: 100, finalizadaEn: ahora() })
    sinTermino.set(doc(db, 'pagos/o-ejec'), { obraId: 'o-ejec', clienteId: 'pyme1', contratistaId: 'con1', montoFinal: 500000, tasaComision: 0.015, comisionMonto: 7500, estado: 'REGISTRO_DE_PRUEBA', finalizadaEn: ahora(), isDemo: false })
    await assertFails(sinTermino.commit())

    await assertFails(updateDoc(doc(db, 'obras/o-listo'), { estado: 'FINALIZADA', avance: 100, finalizadaEn: ahora() }))

    const comisionMala = writeBatch(db)
    comisionMala.update(doc(db, 'obras/o-listo'), { estado: 'FINALIZADA', avance: 100, finalizadaEn: ahora() })
    comisionMala.set(doc(db, 'pagos/o-listo'), { obraId: 'o-listo', clienteId: 'pyme1', contratistaId: 'con1', montoFinal: 500000, tasaComision: 0.015, comisionMonto: 1, estado: 'REGISTRO_DE_PRUEBA', finalizadaEn: ahora(), isDemo: false })
    await assertFails(comisionMala.commit())

    const pagoReal = writeBatch(db)
    pagoReal.update(doc(db, 'obras/o-listo'), { estado: 'FINALIZADA', avance: 100, finalizadaEn: ahora() })
    pagoReal.set(doc(db, 'pagos/o-listo'), { obraId: 'o-listo', clienteId: 'pyme1', contratistaId: 'con1', montoFinal: 500000, tasaComision: 0.015, comisionMonto: 7500, estado: 'APROBADO', finalizadaEn: ahora(), isDemo: false })
    await assertFails(pagoReal.commit())

    const d2 = como('pyme2')
    const b2 = writeBatch(d2)
    b2.update(doc(d2, 'obras/o-listo'), { estado: 'FINALIZADA', avance: 100, finalizadaEn: ahora() })
    b2.set(doc(d2, 'pagos/o-listo'), { obraId: 'o-listo', clienteId: 'pyme2', contratistaId: 'con1', montoFinal: 500000, tasaComision: 0.015, comisionMonto: 7500, estado: 'REGISTRO_DE_PRUEBA', finalizadaEn: ahora(), isDemo: false })
    await assertFails(b2.commit())
  })
  it('cancelar: la PyME dueña sí (hasta ADJUDICADA), en ejecución no; otra PyME no', async () => {
    await assertSucceeds(updateDoc(doc(como('pyme1'), 'obras/o-pub'), { estado: 'CANCELADA', motivoCancelacion: 'Ya no la necesito' }))
    await assertSucceeds(updateDoc(doc(como('pyme1'), 'obras/o-adj'), { estado: 'CANCELADA', motivoCancelacion: null }))
    await assertFails(updateDoc(doc(como('pyme1'), 'obras/o-ejec'), { estado: 'CANCELADA', motivoCancelacion: null }))
    await assertFails(updateDoc(doc(como('pyme2'), 'obras/o-p2x'), { estado: 'CANCELADA', motivoCancelacion: null }))
  })
  it('cancelar rechaza también las ofertas en el mismo batch', async () => {
    const db = como('pyme1')
    const b = writeBatch(db)
    b.update(doc(db, 'obras/o-rec'), { estado: 'CANCELADA', motivoCancelacion: 'Cambio de planes' })
    b.update(doc(db, 'ofertas/o-rec_con1'), { estado: 'RECHAZADA' })
    b.update(doc(db, 'ofertas/o-rec_con2'), { estado: 'RECHAZADA' })
    await assertSucceeds(b.commit())
  })
  it('rechazar ofertas sin adjudicar ni cancelar es rechazado', async () => {
    await assertFails(updateDoc(doc(como('pyme1'), 'ofertas/o-rec_con1'), { estado: 'RECHAZADA' }))
  })
  it('el admin cancela por moderación (con motivo) y resuelve reportes; no puede finalizar', async () => {
    await assertSucceeds(updateDoc(doc(admin(), 'obras/o-ejec'), { estado: 'CANCELADA', motivoCancelacion: 'Moderación: contenido inválido' }))
    await assertFails(updateDoc(doc(admin(), 'obras/o-pub'), { estado: 'CANCELADA', motivoCancelacion: 'x' }))
    await assertFails(updateDoc(doc(admin(), 'obras/o-fin'), { estado: 'CANCELADA', motivoCancelacion: 'Moderación: ya terminada' }))
    await assertFails(updateDoc(doc(admin(), 'obras/o-listo'), { estado: 'FINALIZADA' }))
  })
  it('reportes: un contratista verificado reporta una obra que ve; el admin lo resuelve', async () => {
    await assertSucceeds(updateDoc(doc(como('con2'), 'obras/o-pub'), { reportadaEn: ahora(), motivoReporte: 'Parece una publicación falsa', reportadaPor: 'con2' }))
    await assertFails(updateDoc(doc(como('con2'), 'obras/o-p2'), { reportadaEn: ahora(), motivoReporte: 'corto', reportadaPor: 'con2' }))
    await assertFails(updateDoc(doc(como('conPend'), 'obras/o-pub'), { reportadaEn: ahora(), motivoReporte: 'Parece una publicación falsa', reportadaPor: 'conPend' }))
    await env.withSecurityRulesDisabled(async ctx => updateDoc(doc(ctx.firestore(), 'obras/o-pub'), { reportadaEn: T(), motivoReporte: 'Reporte previo largo', reportadaPor: 'con1' }))
    await assertFails(updateDoc(doc(como('pyme1'), 'obras/o-pub'), { reportadaEn: null, motivoReporte: null, reportadaPor: null }))
    await assertFails(updateDoc(doc(como('con1'), 'obras/o-pub'), { reportadaEn: null, motivoReporte: null, reportadaPor: null }))
    await assertSucceeds(updateDoc(doc(admin(), 'obras/o-pub'), { reportadaEn: null, motivoReporte: null, reportadaPor: null }))
  })
})

describe('pagos (registro de prueba)', () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async ctx =>
      setDoc(doc(ctx.firestore(), 'pagos/o-fin'), { obraId: 'o-fin', clienteId: 'pyme1', contratistaId: 'con1', montoFinal: 500000, tasaComision: 0.015, comisionMonto: 7500, estado: 'REGISTRO_DE_PRUEBA', finalizadaEn: T(), isDemo: true }),
    )
  })
  it('lo leen la PyME, el contratista de la obra y el admin; nadie más', async () => {
    await assertSucceeds(getDoc(doc(como('pyme1'), 'pagos/o-fin')))
    await assertSucceeds(getDoc(doc(como('con1'), 'pagos/o-fin')))
    await assertSucceeds(getDoc(doc(admin(), 'pagos/o-fin')))
    await assertFails(getDoc(doc(como('pyme2'), 'pagos/o-fin')))
    await assertFails(getDoc(doc(como('con2'), 'pagos/o-fin')))
    await assertFails(getDocs(collection(como('pyme1'), 'pagos')))
  })
  it('no se edita ni se borra, ni siquiera por el admin', async () => {
    await assertFails(updateDoc(doc(como('pyme1'), 'pagos/o-fin'), { estado: 'PAGADO' }))
    await assertFails(updateDoc(doc(admin(), 'pagos/o-fin'), { comisionMonto: 0 }))
    await assertFails(deleteDoc(doc(admin(), 'pagos/o-fin')))
  })
  it('no se crea un pago suelto (fuera de la confirmación de la obra)', async () => {
    await assertFails(setDoc(doc(como('pyme1'), 'pagos/o-pub'), { obraId: 'o-pub', clienteId: 'pyme1', contratistaId: 'con1', montoFinal: 1, tasaComision: 0.015, comisionMonto: 0.02, estado: 'REGISTRO_DE_PRUEBA', finalizadaEn: ahora(), isDemo: false }))
  })
})

describe('novedades (seguimiento)', () => {
  const nota = (autor: string, extra: Record<string, unknown> = {}) => ({ tipo: 'NOTA', estadoHacia: null, avance: null, mensaje: 'Llegamos a obra.', autorId: autor, autorNombre: `Nombre ${autor}`, creadaEn: ahora(), ...extra })
  it('las partes de la obra agregan notas y las leen; un tercero no', async () => {
    await assertSucceeds(setDoc(doc(como('con1'), 'obras/o-ejec/novedades/n1'), nota('con1')))
    await assertSucceeds(setDoc(doc(como('pyme1'), 'obras/o-ejec/novedades/n2'), nota('pyme1')))
    await assertSucceeds(getDoc(doc(como('pyme1'), 'obras/o-ejec/novedades/n1')))
    await assertSucceeds(getDoc(doc(como('con1'), 'obras/o-ejec/novedades/n2')))
    await assertFails(setDoc(doc(como('con2'), 'obras/o-ejec/novedades/n3'), nota('con2')))
    await assertFails(getDoc(doc(como('con2'), 'obras/o-ejec/novedades/n1')))
    await assertFails(getDoc(doc(como('pyme2'), 'obras/o-ejec/novedades/n1')))
  })
  it('no se suplanta al autor ni se edita ni se borra', async () => {
    await assertFails(setDoc(doc(como('con1'), 'obras/o-ejec/novedades/n4'), nota('pyme1')))
    await assertSucceeds(setDoc(doc(como('con1'), 'obras/o-ejec/novedades/n5'), nota('con1')))
    await assertFails(updateDoc(doc(como('con1'), 'obras/o-ejec/novedades/n5'), { mensaje: 'editado' }))
    await assertFails(deleteDoc(doc(como('con1'), 'obras/o-ejec/novedades/n5')))
  })
  it('una novedad de ESTADO o AVANCE tiene que coincidir con el estado real de la obra', async () => {
    const con = como('con1')
    const mentira = writeBatch(con)
    mentira.set(doc(con, 'obras/o-ejec/novedades/n6'), nota('con1', { tipo: 'ESTADO', estadoHacia: 'FINALIZADA', mensaje: null }))
    await assertFails(mentira.commit())
    const ok = writeBatch(con)
    ok.update(doc(con, 'obras/o-ejec'), { avance: 70 })
    ok.set(doc(con, 'obras/o-ejec/novedades/n7'), nota('con1', { tipo: 'AVANCE', avance: 70, mensaje: 'Terminamos la losa' }))
    await assertSucceeds(ok.commit())
  })
})

describe('notificaciones', () => {
  const aviso = (para: string, obraId: string | null, extra: Record<string, unknown> = {}) => ({ usuarioId: para, titulo: 'Aviso', cuerpo: null, href: '/app/pyme', obraId, leida: false, creadaEn: ahora(), ...extra })
  it('se avisa a la otra parte de la obra', async () => {
    await assertSucceeds(setDoc(doc(como('con1'), 'notificaciones/a1'), aviso('pyme1', 'o-rec')))
    await assertSucceeds(setDoc(doc(como('pyme1'), 'notificaciones/a2'), aviso('con1', 'o-rec')))
  })
  it('no se puede mandar avisos a desconocidos, ni sin obra, ni con enlaces externos', async () => {
    await assertFails(setDoc(doc(como('con2'), 'notificaciones/a3'), aviso('pyme1', 'o-pub'))) // no ofertó a esa obra
    await assertFails(setDoc(doc(como('con1'), 'notificaciones/a4'), aviso('pyme2', 'o-rec')))
    await assertFails(setDoc(doc(como('con1'), 'notificaciones/a5'), aviso('pyme1', null)))
    await assertFails(setDoc(doc(como('con1'), 'notificaciones/a6'), aviso('pyme1', 'o-rec', { href: 'https://malo.test' })))
    await assertFails(setDoc(doc(como('con1'), 'notificaciones/a7'), aviso('pyme1', 'o-rec', { leida: true })))
  })
  it('el admin puede avisar a cualquiera', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'notificaciones/a8'), aviso('conPend', null, { href: null })))
  })
  it('solo el destinatario la lee y puede marcarla como leída', async () => {
    await env.withSecurityRulesDisabled(async ctx => setDoc(doc(ctx.firestore(), 'notificaciones/a9'), { ...aviso('pyme1', 'o-rec'), creadaEn: T() }))
    await assertSucceeds(getDoc(doc(como('pyme1'), 'notificaciones/a9')))
    await assertFails(getDoc(doc(como('pyme2'), 'notificaciones/a9')))
    await assertFails(updateDoc(doc(como('pyme2'), 'notificaciones/a9'), { leida: true }))
    await assertFails(updateDoc(doc(como('pyme1'), 'notificaciones/a9'), { titulo: 'cambiado' }))
    await assertSucceeds(updateDoc(doc(como('pyme1'), 'notificaciones/a9'), { leida: true }))
    await assertFails(deleteDoc(doc(como('pyme1'), 'notificaciones/a9')))
  })
})

describe('todo lo demás está denegado', () => {
  it('colecciones no declaradas', async () => {
    await assertFails(setDoc(doc(como('pyme1'), 'otra/cosa'), { x: 1 }))
    await assertFails(getDoc(doc(admin(), 'otra/cosa')))
  })
})

describe('administradores dados desde la app (role "admin" en el perfil)', () => {
  const adminDoc = (uid: string, status = 'activo') =>
    env.withSecurityRulesDisabled(async ctx => setDoc(doc(ctx.firestore(), `users/${uid}`), { email: `${uid}@test.com`, displayName: 'Admin De App', role: 'admin', status, isDemo: false, createdAt: new Date() }))

  it('un admin (claim) promueve a un usuario activo y esa persona pasa a ser admin', async () => {
    await assertFails(getDocs(collection(como('pyme1'), 'users')))
    await assertSucceeds(updateDoc(doc(admin(), 'users/pyme1'), { role: 'admin' }))
    await assertSucceeds(getDocs(collection(como('pyme1'), 'users')))
  })
  it('no se puede promover a alguien pendiente o suspendido, ni cambiar otros campos a la vez', async () => {
    await assertFails(updateDoc(doc(admin(), 'users/pymeSusp'), { role: 'admin' }))
    await assertFails(updateDoc(doc(admin(), 'users/pyme1'), { role: 'admin', displayName: 'Otro' }))
  })
  it('quien no es admin no puede promover a nadie, ni a sí mismo', async () => {
    await assertFails(updateDoc(doc(como('pyme1'), 'users/pyme2'), { role: 'admin' }))
    await assertFails(updateDoc(doc(como('pyme1'), 'users/pyme1'), { role: 'admin' }))
  })
  it('un admin de la app promueve y quita el rol a otros, pero no cambia el propio', async () => {
    await adminDoc('adm1')
    await adminDoc('adm2')
    const db = como('adm1')
    await assertSucceeds(updateDoc(doc(db, 'users/pyme1'), { role: 'admin' }))
    await assertSucceeds(updateDoc(doc(db, 'users/adm2'), { role: 'pyme' }))
    await assertFails(updateDoc(doc(db, 'users/adm1'), { role: 'pyme' }))
    await assertFails(deleteDoc(doc(db, 'users/pyme1')))
  })
  it('un admin de la app suspendido pierde los poderes', async () => {
    await adminDoc('adm3', 'suspendido')
    await assertFails(getDocs(collection(como('adm3'), 'users')))
  })
})

describe('superadmins protegidos (cátedra)', () => {
  it('a un superadmin nadie le puede quitar el rol, ni siquiera otro admin', async () => {
    await env.withSecurityRulesDisabled(async ctx => setDoc(doc(ctx.firestore(), 'users/sup1'), { email: 'sup1@test.com', displayName: 'Superadmin', role: 'admin', status: 'activo', superadmin: true, isDemo: false, createdAt: new Date() }))
    await env.withSecurityRulesDisabled(async ctx => setDoc(doc(ctx.firestore(), 'users/adm9'), { email: 'adm9@test.com', displayName: 'Admin Común', role: 'admin', status: 'activo', isDemo: false, createdAt: new Date() }))
    await assertFails(updateDoc(doc(como('adm9'), 'users/sup1'), { role: 'pyme' }))
    await assertFails(updateDoc(doc(admin(), 'users/sup1'), { role: 'pyme' }))
    await assertFails(updateDoc(doc(como('adm9'), 'users/sup1'), { superadmin: false }))
    await assertSucceeds(updateDoc(doc(admin(), 'users/adm9'), { role: 'pyme' }))
  })
})
