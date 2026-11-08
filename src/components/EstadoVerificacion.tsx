import { useAuth } from '@/auth/useAuth'
import { AccionDirecta, Insignia } from '@/components/comunes'
import { Alerta } from '@/components/ui'
import { VERIFICACION } from '@/config/app'
import { pedirRevisionNuevamente } from '@/lib/acciones/contratista'

/** Estado de la verificación del contratista: pendiente, rechazada (con motivo) o aprobada. */
export function EstadoVerificacion() {
  const { perfil } = useAuth()
  if (!perfil?.verificacion) return null
  const v = perfil.verificacion
  return (
    <div className="space-y-3" data-testid="estado-verificacion">
      <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold">Estado de tu cuenta:</span> <Insignia info={VERIFICACION[v]} /></div>
      {v === 'PENDIENTE' && <Alerta tipo="aviso">Tu cuenta está pendiente de verificación. Licity revisa tu perfil y, cuando te aprueben, vas a poder ver obras y enviar ofertas. Mientras tanto, completá tu perfil.</Alerta>}
      {v === 'RECHAZADO' && (
        <>
          <Alerta>Tu verificación fue rechazada{perfil.motivoRechazo ? `: ${perfil.motivoRechazo}` : '.'} Corregí tu perfil y volvé a enviarlo a revisión.</Alerta>
          <AccionDirecta etiqueta="Volver a enviar a revisión" accion={() => pedirRevisionNuevamente(perfil.uid)} />
        </>
      )}
      {v === 'APROBADO' && <Alerta tipo="ok">Tu cuenta está verificada: ya podés ofertar en las obras abiertas.</Alerta>}
    </div>
  )
}
