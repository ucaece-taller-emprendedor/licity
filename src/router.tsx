import { createBrowserRouter, Navigate } from 'react-router'
import { RequireAdmin, RequireAuth, RequireRole, RequireVerificado } from '@/auth/guards'
import { AdminLayout, PanelLayout, SitioLayout } from '@/components/layouts'
import AdminLogin from '@/pages/admin/AdminLogin'
import { AdminInicio, AdminObras, AdminPagos, AdminUsuarios, AdminVerificaciones } from '@/pages/admin/AdminPaginas'
import { AppInicio, CompletarPerfil, Ingresar, Recuperar, Registro, RegistroPorTipo, Suspendido } from '@/pages/app/Acceso'
import { ContratistaInicio, ContratistaObraDetalle, ContratistaObras, ContratistaOfertas, ContratistaPerfil, ContratistaTrabajos } from '@/pages/app/contratista/ContratistaPaginas'
import { PymeInicio, PymeObraDetalle, PymeObraEditar, PymeObraNueva, PymeObras, PymePerfil } from '@/pages/app/pyme/PymePaginas'
import Landing from '@/pages/public/Landing'
import { Privacidad, Terminos } from '@/pages/public/Legal'
import NoEncontrada from '@/pages/public/NoEncontrada'

const navPyme = [
  { to: '/app/pyme', etiqueta: 'Inicio', fin: true },
  { to: '/app/pyme/obras', etiqueta: 'Mis obras' },
  { to: '/app/pyme/perfil', etiqueta: 'Perfil' },
]
const navContratista = [
  { to: '/app/contratista', etiqueta: 'Inicio', fin: true },
  { to: '/app/contratista/obras', etiqueta: 'Obras abiertas' },
  { to: '/app/contratista/ofertas', etiqueta: 'Mis ofertas' },
  { to: '/app/contratista/trabajos', etiqueta: 'Mis trabajos' },
  { to: '/app/contratista/perfil', etiqueta: 'Perfil' },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SitioLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'terminos', element: <Terminos /> },
      { path: 'privacidad', element: <Privacidad /> },
    ],
  },
  {
    path: '/app',
    element: <SitioLayout />,
    children: [
      { index: true, element: <AppInicio /> },
      { path: 'ingresar', element: <Ingresar /> },
      { path: 'registro', element: <Registro /> },
      { path: 'registro/:tipo', element: <RegistroPorTipo /> },
      { path: 'recuperar', element: <Recuperar /> },
      { path: 'completar-perfil', element: <CompletarPerfil /> },
      { path: 'suspendido', element: <Suspendido /> },
    ],
  },
  {
    path: '/app',
    element: <RequireAuth />,
    children: [
      {
        path: 'pyme',
        element: <RequireRole roles={['pyme']}><PanelLayout navegacion={navPyme} etiquetaRol="PyME" /></RequireRole>,
        children: [
          { index: true, element: <PymeInicio /> },
          { path: 'obras', element: <PymeObras /> },
          { path: 'obras/nueva', element: <PymeObraNueva /> },
          { path: 'obras/:id', element: <PymeObraDetalle /> },
          { path: 'obras/:id/editar', element: <PymeObraEditar /> },
          { path: 'perfil', element: <PymePerfil /> },
        ],
      },
      {
        path: 'contratista',
        element: <RequireRole roles={['contratista']}><PanelLayout navegacion={navContratista} etiquetaRol="Contratista" /></RequireRole>,
        children: [
          { index: true, element: <ContratistaInicio /> },
          { path: 'perfil', element: <ContratistaPerfil /> },
          {
            element: <RequireVerificado />,
            children: [
              { path: 'obras', element: <ContratistaObras /> },
              { path: 'obras/:id', element: <ContratistaObraDetalle /> },
              { path: 'ofertas', element: <ContratistaOfertas /> },
              { path: 'trabajos', element: <ContratistaTrabajos /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '/admin/login', element: <AdminLogin /> },
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <AdminLayout
          navegacion={[
            { to: '/admin', etiqueta: 'Inicio', fin: true },
            { to: '/admin/usuarios', etiqueta: 'Usuarios' },
            { to: '/admin/verificaciones', etiqueta: 'Verificaciones' },
            { to: '/admin/obras', etiqueta: 'Obras' },
            { to: '/admin/pagos', etiqueta: 'Pagos' },
          ]}
        />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <AdminInicio /> },
      { path: 'usuarios', element: <AdminUsuarios /> },
      { path: 'verificaciones', element: <AdminVerificaciones /> },
      { path: 'obras', element: <AdminObras /> },
      { path: 'pagos', element: <AdminPagos /> },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
  { path: '*', element: <SitioLayout />, children: [{ path: '*', element: <NoEncontrada /> }] },
])
