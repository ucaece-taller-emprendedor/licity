import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore'
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { auth, db } from '@/lib/firebase'
import type { DatosCompletar, DatosRegistro } from '@/lib/validations/auth'
import type { Perfil } from './tipos'

export type AuthValor = {
  usuario: User | null
  perfil: Perfil | null
  esAdmin: boolean
  /** true mientras se resuelve la sesión o se está registrando. */
  cargando: boolean
  registrar: (d: DatosRegistro) => Promise<void>
  ingresar: (email: string, clave: string) => Promise<void>
  /** Ingresa con Google. Si la cuenta no existe en Licity, el guard lleva a /app/completar-perfil. */
  ingresarConGoogle: () => Promise<void>
  /** Crea la cuenta y el perfil de quien ingresó con Google sin haberlos creado. */
  completarPerfil: (d: DatosCompletar) => Promise<void>
  salir: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthValor | null>(null)

/**
 * Crea users/{uid} y perfiles/{uid} en un solo batch (las reglas exigen las dos juntas).
 * El contratista nace con verificación PENDIENTE; la PyME, activa. Nadie puede crearse admin ni aprobado.
 */
async function crearCuenta(u: User, d: DatosRegistro | DatosCompletar) {
  const lote = writeBatch(db)
  const base = { email: u.email ?? '', displayName: d.nombre, role: d.rol, status: 'activo', isDemo: false, createdAt: serverTimestamp() }
  if (d.rol === 'pyme') {
    lote.set(doc(db, 'users', u.uid), base)
    lote.set(doc(db, 'perfiles', u.uid), { nombreEmpresa: d.nombreEmpresa, cuit: d.cuit, ciudad: d.ciudad, telefono: d.telefono })
  } else {
    lote.set(doc(db, 'users', u.uid), { ...base, verificacion: 'PENDIENTE' })
    lote.set(doc(db, 'perfiles', u.uid), {
      nombreEmpresa: d.nombreEmpresa, cuit: d.cuit, especialidad: d.especialidad, ciudad: d.ciudad,
      zona: d.zona, descripcion: d.descripcion, telefono: d.telefono, anios: d.anios,
    })
  }
  await lote.commit()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [authListo, setAuthListo] = useState(false)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [perfilListo, setPerfilListo] = useState(false)
  const [esAdmin, setEsAdmin] = useState(false)
  const [claimsListo, setClaimsListo] = useState(false)
  const [ocupado, setOcupado] = useState(0)

  useEffect(
    () =>
      onAuthStateChanged(auth, async u => {
        setUsuario(u)
        setAuthListo(true)
        if (!u) {
          setEsAdmin(false)
          setPerfil(null)
          setPerfilListo(true)
          setClaimsListo(true)
          return
        }
        setPerfilListo(false)
        setClaimsListo(false)
        const t = await u.getIdTokenResult()
        setEsAdmin(t.claims.admin === true)
        setClaimsListo(true)
      }),
    [],
  )

  useEffect(() => {
    if (!usuario) return
    const uid = usuario.uid
    return onSnapshot(
      doc(db, 'users', uid),
      snap => {
        const d = snap.data()
        setPerfil(
          snap.exists() && d
            ? ({ uid, email: d.email, displayName: d.displayName, role: d.role, status: d.status, verificacion: d.verificacion ?? null, motivoRechazo: d.motivoRechazo ?? null, isDemo: d.isDemo === true } as Perfil)
            : null,
        )
        setPerfilListo(true)
      },
      () => {
        setPerfil(null)
        setPerfilListo(true)
      },
    )
  }, [usuario])

  const conOcupado = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setOcupado(n => n + 1)
    try {
      return await fn()
    } finally {
      setOcupado(n => n - 1)
    }
  }, [])

  const valor = useMemo<AuthValor>(
    () => ({
      usuario,
      perfil,
      esAdmin,
      cargando: !authListo || ocupado > 0 || (usuario !== null && (!perfilListo || !claimsListo)),
      registrar: d =>
        conOcupado(async () => {
          const cred = await createUserWithEmailAndPassword(auth, d.email, d.clave)
          await updateProfile(cred.user, { displayName: d.nombre })
          await crearCuenta(cred.user, d)
        }),
      ingresar: (email, clave) => conOcupado(async () => void (await signInWithEmailAndPassword(auth, email, clave))),
      ingresarConGoogle: () =>
        conOcupado(async () => {
          await signInWithPopup(auth, new GoogleAuthProvider())
          // Si la cuenta no existe en Licity, el guard lleva a /app/completar-perfil (tipo de usuario + datos).
        }),
      completarPerfil: d =>
        conOcupado(async () => {
          if (!auth.currentUser) throw new Error('Sin sesión')
          await crearCuenta(auth.currentUser, d)
        }),
      salir: () => signOut(auth),
    }),
    [usuario, perfil, esAdmin, authListo, perfilListo, claimsListo, ocupado, conOcupado],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
