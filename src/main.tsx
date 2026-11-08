import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { AuthProvider } from '@/auth/AuthContext'
import { iniciarAnalytics, registrarVisita } from '@/lib/analytics'
import { router } from './router'
import '@fontsource/anton/400.css'
import '@fontsource-variable/inter'
import './styles/index.css'

iniciarAnalytics()
let ultimaRuta = ''
router.subscribe(estado => {
  if (estado.location.pathname !== ultimaRuta) {
    ultimaRuta = estado.location.pathname
    registrarVisita(ultimaRuta)
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
