import { LogOut, Mail, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { MARCA, panelDe } from '@/config/app'
import { Logo, Marca } from './Marca'
import { Boton, BotonLink } from './ui'
import { CambiarClave } from './RecuperarClave'

export type EnlaceNav = { to: string; etiqueta: string; fin?: boolean }

const enlace = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-4 text-sm font-bold transition-colors ${isActive ? 'bg-texto text-superficie' : 'text-texto hover:bg-superficie'}`

const ENLACES_PUBLICOS: { to: string; etiqueta: string; fin?: boolean }[] = [
  { to: '/', etiqueta: 'Inicio', fin: true },
  { to: '/#como-funciona', etiqueta: 'Cómo funciona' },
  { to: '/app/registro?tipo=contratista', etiqueta: 'Soy contratista' },
]

/** Cabecera y pie de la web pública y de las pantallas de acceso. */
export function SitioLayout() {
  const { perfil, usuario, salir } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [abierto, setAbierto] = useState(false)
  const [ultimaRuta, setUltimaRuta] = useState(ubicacion.pathname + ubicacion.hash)
  // Cierra el menú móvil al navegar (ajuste de estado durante el render).
  if (ultimaRuta !== ubicacion.pathname + ubicacion.hash) {
    setUltimaRuta(ubicacion.pathname + ubicacion.hash)
    setAbierto(false)
  }
  const sesion = usuario && perfil

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-borde bg-fondo/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <Marca to="/" />
          <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
            {ENLACES_PUBLICOS.map(n => (
              <NavLink key={n.to} to={n.to} end={n.fin ?? false} className={n.to === '/' ? enlace : 'inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold text-texto hover:bg-superficie'}>
                {n.etiqueta}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {sesion ? (
              <>
                <BotonLink to={panelDe(perfil.role)}>Ir a mi panel</BotonLink>
                <Boton variante="borde" className="hidden sm:inline-flex" onClick={() => void salir().then(() => navegar('/'))} aria-label="Salir">
                  <LogOut className="size-4" aria-hidden /> Salir
                </Boton>
              </>
            ) : (
              <>
                <BotonLink to="/app/ingresar" variante="borde" className="!px-3 sm:!px-5">Ingresar</BotonLink>
                <BotonLink to="/app/registro" className="!px-3 sm:!px-5">Registrarme</BotonLink>
              </>
            )}
            <button
              type="button"
              onClick={() => setAbierto(v => !v)}
              aria-expanded={abierto}
              aria-controls="menu-movil"
              aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
              className="inline-flex size-11 items-center justify-center rounded-full text-texto hover:bg-superficie lg:hidden"
            >
              {abierto ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
            </button>
          </div>
        </div>
        {abierto && (
          <nav id="menu-movil" aria-label="Menú móvil" className="border-t border-borde bg-fondo px-4 pb-5 pt-3 lg:hidden">
            <ul className="mx-auto flex max-w-6xl flex-col gap-1">
              {ENLACES_PUBLICOS.map(n => (
                <li key={n.to}>
                  <Link to={n.to} className="flex min-h-12 items-center rounded-xl px-4 text-lg font-bold hover:bg-superficie">{n.etiqueta}</Link>
                </li>
              ))}
              {sesion && (
                <li>
                  <button type="button" className="flex min-h-12 w-full items-center rounded-xl px-4 text-lg font-bold hover:bg-superficie" onClick={() => void salir().then(() => navegar('/'))}>Salir</button>
                </li>
              )}
            </ul>
          </nav>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <PieDeSitio />
      <ScrollRestoration />
    </div>
  )
}

function PieDeSitio() {
  return (
    <footer className="bg-texto text-crema-claro">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo claro />
          <p className="titulo-marca mt-4 text-2xl text-mostaza">{MARCA.eslogan}</p>
          <p className="mt-2 max-w-xs text-sm text-crema">Piloto en Mar del Plata, Argentina.</p>
        </div>
        <nav aria-label="Pie de página">
          <h2 className="text-xl text-crema-claro">Explorá</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {[
              ['/app/registro?tipo=pyme', 'Soy PyME: publicar una obra'],
              ['/app/registro?tipo=contratista', 'Soy contratista'],
              ['/app/ingresar', 'Ingresar'],
              ['/terminos', 'Términos y condiciones'],
              ['/privacidad', 'Política de privacidad'],
            ].map(([to = '/', etiqueta]) => (
              <li key={to}>
                <Link to={to} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">{etiqueta}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-xl text-crema-claro">Contacto</h2>
          <a href={`mailto:${MARCA.contacto}`} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm underline-offset-4 hover:underline">
            <Mail className="size-4" aria-hidden /> {MARCA.contacto}
          </a>
        </div>
      </div>
      <div className="border-t border-crema/20 px-4 py-5 text-center text-sm text-crema">
        Versión MVP · Proyecto del Taller Emprendedor. Los pagos son simulados (registro de prueba): todavía no hay pasarela real.
      </div>
    </footer>
  )
}

/** Panel de PyME / contratista: cabecera con navegación en una fila deslizable (mobile first). */
export function PanelLayout({ navegacion, etiquetaRol }: { navegacion: EnlaceNav[]; etiquetaRol: string }) {
  const { perfil, salir } = useAuth()
  const navegar = useNavigate()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-borde bg-fondo/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Marca to="/" />
          <div className="flex items-center gap-3">
            <p className="hidden text-right text-xs leading-tight text-suave sm:block">
              <span className="block font-bold text-texto">{perfil?.displayName}</span>
              {etiquetaRol}
            </p>
            <Boton variante="borde" onClick={() => void salir().then(() => navegar('/'))} aria-label="Salir">
              <LogOut className="size-4" aria-hidden /> Salir
            </Boton>
          </div>
        </div>
        <nav aria-label="Mi panel" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {navegacion.map(n => (
            <NavLink key={n.to} to={n.to} end={n.fin} className={enlace}>
              {n.etiqueta}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}

/** Panel de administración: barra lateral en escritorio, menú horizontal en el celular. */
export function AdminLayout({ navegacion }: { navegacion: EnlaceNav[] }) {
  const { usuario, salir } = useAuth()
  const navegar = useNavigate()
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
      <aside className="border-b border-borde bg-superficie p-4 md:border-r md:border-b-0">
        <Marca to="/admin" />
        <p className="mt-1 text-xs text-suave">Panel de administración</p>
        <nav aria-label="Administración" className="mt-4 flex gap-1 overflow-x-auto md:flex-col">
          {navegacion.map(n => (
            <NavLink key={n.to} to={n.to} end={n.fin} className={enlace}>
              {n.etiqueta}
            </NavLink>
          ))}
        </nav>
        <p className="mt-6 hidden truncate text-xs text-suave md:block">{usuario?.email}</p>
        <CambiarClave className="mt-2" />
        <Boton variante="borde" className="mt-2" onClick={() => void salir().then(() => navegar('/admin/login'))}>
          <LogOut className="size-4" aria-hidden /> Salir
        </Boton>
      </aside>
      <main className="min-w-0 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
