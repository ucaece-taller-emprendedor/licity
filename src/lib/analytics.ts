/**
 * Google Analytics 4 (gratis). Solo se activa en el sitio publicado y si hay un ID de medición
 * (VITE_GA_MEASUREMENT_ID en .env.production). Sin ID, o con emuladores, no se envía nada.
 * Las zonas se distinguen por la ruta: / = landing, /app = usuarios, /admin = administración.
 */
type Gtag = (...args: unknown[]) => void
declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

export const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? ''
export const analyticsActivo = GA_ID !== '' && import.meta.env.VITE_USE_EMULATORS !== 'true'

export function zonaDe(ruta: string): 'admin' | 'app' | 'landing' {
  if (ruta.startsWith('/admin')) return 'admin'
  if (ruta.startsWith('/app')) return 'app'
  return 'landing'
}

export function iniciarAnalytics() {
  if (!analyticsActivo || window.gtag) return
  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true })
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
  document.head.appendChild(s)
}

/** Registra una visita de página (se llama en cada cambio de ruta). */
export function registrarVisita(ruta: string) {
  if (!analyticsActivo || !window.gtag) return
  window.gtag('event', 'page_view', { page_path: ruta, page_location: window.location.href, zona: zonaDe(ruta) })
}
