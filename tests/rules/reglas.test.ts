import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, getDocs, collection, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { crearEntorno } from './ayuda'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await crearEntorno('demo-licity-reglas')
})
afterAll(async () => env.cleanup())
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore()
    const base = { isDemo: true, createdAt: new Date() }
    await setDoc(doc(db, 'users/usuario1'), { ...base, email: 'u1@test.com', displayName: 'Usuario Uno', role: 'usuario', status: 'activo' })
    await setDoc(doc(db, 'users/usuario2'), { ...base, email: 'u2@test.com', displayName: 'Usuario Dos', role: 'usuario', status: 'activo' })
    await setDoc(doc(db, 'users/socio1'), { ...base, email: 's1@test.com', displayName: 'Socio Uno', role: 'socio', status: 'activo' })
    await setDoc(doc(db, 'users/pendiente1'), { ...base, email: 'p1@test.com', displayName: 'Socio Pendiente', role: 'socio', status: 'pendiente' })
    await setDoc(doc(db, 'items/publico'), { ownerId: 'socio1', ownerName: 'Socio Uno', titulo: 'Público', descripcion: 'Descripción pública', publicado: true, isDemo: true, createdAt: new Date() })
    await setDoc(doc(db, 'items/borrador'), { ownerId: 'socio1', ownerName: 'Socio Uno', titulo: 'Borrador', descripcion: 'Descripción borrador', publicado: false, isDemo: true, createdAt: new Date() })
  })
})

const como = (uid: string, email = `${uid}@test.com`, claims: Record<string, unknown> = {}) => env.authenticatedContext(uid, { email, ...claims }).firestore()
const anonimo = () => env.unauthenticatedContext().firestore()
const admin = () => como('admin1', 'admin@test.com', { admin: true })

describe('users', () => {
  it('registro: un usuario normal se crea activo', async () => {
    await assertSucceeds(setDoc(doc(como('nuevo'), 'users/nuevo'), { email: 'nuevo@test.com', displayName: 'Nuevo', role: 'usuario', status: 'activo', isDemo: false, createdAt: serverTimestamp() }))
  })
  it('registro: un socio solo puede crearse pendiente', async () => {
    const db = como('nuevo')
    await assertFails(setDoc(doc(db, 'users/nuevo'), { email: 'nuevo@test.com', displayName: 'Nuevo', role: 'socio', status: 'activo', isDemo: false, createdAt: serverTimestamp() }))
    await assertSucceeds(setDoc(doc(db, 'users/nuevo'), { email: 'nuevo@test.com', displayName: 'Nuevo', role: 'socio', status: 'pendiente', isDemo: false, createdAt: serverTimestamp() }))
  })
  it('registro: no se puede crear con role admin ni con campos de más', async () => {
    const db = como('nuevo')
    await assertFails(setDoc(doc(db, 'users/nuevo'), { email: 'nuevo@test.com', displayName: 'Nuevo', role: 'admin', status: 'activo', isDemo: false, createdAt: serverTimestamp() }))
    await assertFails(setDoc(doc(db, 'users/nuevo'), { email: 'nuevo@test.com', displayName: 'Nuevo', role: 'usuario', status: 'activo', isDemo: false, createdAt: serverTimestamp(), admin: true }))
  })
  it('registro: no se puede crear el perfil de otro uid', async () => {
    await assertFails(setDoc(doc(como('nuevo'), 'users/otro'), { email: 'nuevo@test.com', displayName: 'Otro', role: 'usuario', status: 'activo', isDemo: false, createdAt: serverTimestamp() }))
  })
  it('un usuario NO puede escalar su rol ni su estado', async () => {
    const db = como('usuario1')
    await assertFails(updateDoc(doc(db, 'users/usuario1'), { role: 'admin' }))
    await assertFails(updateDoc(doc(db, 'users/usuario1'), { role: 'socio' }))
    await assertFails(updateDoc(doc(db, 'users/usuario1'), { status: 'suspendido' }))
    await assertSucceeds(updateDoc(doc(db, 'users/usuario1'), { displayName: 'Otro Nombre' }))
  })
  it('un socio pendiente NO puede aprobarse solo', async () => {
    await assertFails(updateDoc(doc(como('pendiente1'), 'users/pendiente1'), { status: 'activo' }))
  })
  it('no puede leer perfiles ajenos; anónimo tampoco', async () => {
    await assertFails(getDoc(doc(como('usuario1'), 'users/usuario2')))
    await assertFails(getDoc(doc(anonimo(), 'users/usuario1')))
    await assertSucceeds(getDoc(doc(como('usuario1'), 'users/usuario1')))
  })
  it('no se puede listar todos los usuarios', async () => {
    await assertFails(getDocs(collection(como('usuario1'), 'users')))
  })
  it('el admin (claim) lee todos, aprueba, y no puede crear otro admin por Firestore', async () => {
    const db = admin()
    await assertSucceeds(getDocs(collection(db, 'users')))
    await assertSucceeds(updateDoc(doc(db, 'users/pendiente1'), { status: 'activo' }))
    await assertFails(updateDoc(doc(db, 'users/usuario1'), { role: 'admin' }))
    await assertFails(deleteDoc(doc(db, 'users/usuario1')))
  })
  it('un usuario con role "admin" en su doc pero SIN claim no es admin', async () => {
    await env.withSecurityRulesDisabled(async ctx => setDoc(doc(ctx.firestore(), 'users/falso'), { email: 'f@test.com', displayName: 'Falso', role: 'admin', status: 'activo', isDemo: false, createdAt: new Date() }))
    await assertFails(getDocs(collection(como('falso'), 'users')))
  })
})

describe('items', () => {
  const nuevo = (uid: string, extra: Record<string, unknown> = {}) => ({ ownerId: uid, ownerName: uid === 'socio1' ? 'Socio Uno' : 'Socio Pendiente', titulo: 'Un título', descripcion: 'Una descripción larga', publicado: true, isDemo: false, createdAt: serverTimestamp(), ...extra })

  it('cualquiera lee lo publicado, pero no los borradores ajenos', async () => {
    await assertSucceeds(getDoc(doc(anonimo(), 'items/publico')))
    await assertFails(getDoc(doc(como('usuario1'), 'items/borrador')))
    await assertSucceeds(getDoc(doc(como('socio1'), 'items/borrador')))
    await assertSucceeds(getDocs(query(collection(anonimo(), 'items'), where('publicado', '==', true))))
    await assertFails(getDocs(collection(anonimo(), 'items')))
  })
  it('un socio activo publica a su nombre', async () => {
    await assertSucceeds(setDoc(doc(como('socio1'), 'items/n1'), nuevo('socio1')))
  })
  it('un socio PENDIENTE no puede publicar', async () => {
    await assertFails(setDoc(doc(como('pendiente1'), 'items/n2'), nuevo('pendiente1')))
  })
  it('un usuario común no puede publicar', async () => {
    await assertFails(setDoc(doc(como('usuario1'), 'items/n3'), nuevo('usuario1')))
  })
  it('no se puede publicar a nombre de otro ni con datos inválidos', async () => {
    const db = como('socio1')
    await assertFails(setDoc(doc(db, 'items/n4'), nuevo('socio1', { ownerId: 'usuario1' })))
    await assertFails(setDoc(doc(db, 'items/n5'), nuevo('socio1', { titulo: 'ab' })))
    await assertFails(setDoc(doc(db, 'items/n6'), nuevo('socio1', { publicado: 'si' })))
    await assertFails(setDoc(doc(db, 'items/n7'), nuevo('socio1', { extra: 1 })))
  })
  it('solo el dueño (o admin) edita y borra', async () => {
    await assertFails(updateDoc(doc(como('usuario1'), 'items/publico'), { titulo: 'Hackeado' }))
    await assertFails(deleteDoc(doc(como('usuario1'), 'items/publico')))
    await assertFails(updateDoc(doc(como('socio1'), 'items/publico'), { ownerId: 'usuario1' }))
    await assertSucceeds(updateDoc(doc(como('socio1'), 'items/publico'), { titulo: 'Nuevo título' }))
    await assertSucceeds(deleteDoc(doc(admin(), 'items/publico')))
  })
  it('colecciones no declaradas están denegadas', async () => {
    await assertFails(setDoc(doc(admin(), 'otra/x'), { a: 1 }))
    await assertFails(getDoc(doc(admin(), 'otra/x')))
  })
})
