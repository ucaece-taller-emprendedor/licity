import { Alerta, Tarjeta } from '@/components/ui'
import { analyticsActivo, GA_ID } from '@/lib/analytics'

/** Estadísticas: las visitas van a Google Analytics 4 (gratis). Acá se explica cómo verlas. */
export default function Estadisticas() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Estadísticas</h1>
      {analyticsActivo ? (
        <Alerta tipo="ok">Google Analytics está activo (ID {GA_ID}). Las visitas tardan unas horas en aparecer en los informes.</Alerta>
      ) : (
        <Alerta tipo="aviso">Google Analytics todavía no está conectado: falta cargar el ID de medición (VITE_GA_MEASUREMENT_ID). Pasos en docs/INSTRUCTIVO-SETUP.md.</Alerta>
      )}
      <Tarjeta className="space-y-3 text-sm">
        <h2 className="text-lg font-semibold">Cómo ver las estadísticas</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Entrá a <a className="font-semibold text-primario underline" href="https://analytics.google.com" target="_blank" rel="noreferrer">analytics.google.com</a> con la cuenta de Google del equipo.</li>
          <li>Elegí la propiedad de esta app → <strong>Informes → Participación → Páginas y pantallas</strong>.</li>
          <li>Para separar por zona, filtrá por la ruta de la página:
            <ul className="list-disc pl-5">
              <li><code>/</code> → <strong>landing</strong> (público general)</li>
              <li><code>/app</code> → <strong>app</strong> (usuarios registrados)</li>
              <li><code>/admin</code> → administración</li>
            </ul>
          </li>
        </ol>
        <a className="inline-flex min-h-11 items-center rounded-tema bg-primario px-4 font-semibold text-primario-texto" href="https://analytics.google.com" target="_blank" rel="noreferrer">Abrir Google Analytics</a>
      </Tarjeta>
    </div>
  )
}
