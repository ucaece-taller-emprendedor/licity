import { Campo, CampoTexto } from '@/components/ui'
import type { RolRegistrable } from '@/config/app'
import type { PerfilContratista, PerfilPyme } from '@/lib/tipos'
import type { Errores } from '@/lib/validations/form'

type Valores = { [K in keyof (PerfilPyme & PerfilContratista)]?: (PerfilPyme & PerfilContratista)[K] | null }

/** Campos de la empresa (PyME) o del contratista. Los nombres coinciden con los esquemas Zod de validations/auth.ts. */
export function CamposPerfil({ rol, errores, valores = {} }: { rol: RolRegistrable; errores: Errores; valores?: Valores }) {
  return (
    <div className="space-y-4">
      {rol === 'pyme' ? (
        <>
          <Campo etiqueta="Nombre de la empresa" name="nombreEmpresa" autoComplete="organization" defaultValue={valores.nombreEmpresa ?? ''} error={errores.nombreEmpresa} />
          <Campo etiqueta="CUIT (opcional)" name="cuit" inputMode="numeric" placeholder="30-12345678-9" defaultValue={valores.cuit ?? ''} error={errores.cuit} />
        </>
      ) : (
        <>
          <Campo etiqueta="Nombre o razón social" name="nombreEmpresa" autoComplete="organization" defaultValue={valores.nombreEmpresa ?? ''} error={errores.nombreEmpresa} />
          <Campo etiqueta="CUIT" name="cuit" inputMode="numeric" placeholder="20-12345678-9" defaultValue={valores.cuit ?? ''} error={errores.cuit} />
          <Campo etiqueta="Especialidad" name="especialidad" placeholder="Ej.: Albañilería, electricidad" defaultValue={valores.especialidad ?? ''} error={errores.especialidad} />
        </>
      )}
      <Campo etiqueta="Ciudad" name="ciudad" autoComplete="address-level2" defaultValue={valores.ciudad ?? ''} error={errores.ciudad} />
      <Campo etiqueta="Teléfono (opcional)" name="telefono" type="tel" autoComplete="tel" defaultValue={valores.telefono ?? ''} error={errores.telefono} />
      {rol === 'contratista' && (
        <>
          <Campo etiqueta="Zona de cobertura (opcional)" name="zona" placeholder="Ej.: Mar del Plata y Batán" defaultValue={valores.zona ?? ''} error={errores.zona} />
          <Campo etiqueta="Años de experiencia (opcional)" name="anios" type="number" min={0} max={80} defaultValue={valores.anios ?? ''} error={errores.anios} />
          <CampoTexto etiqueta="Presentación (opcional)" name="descripcion" rows={3} defaultValue={valores.descripcion ?? ''} error={errores.descripcion} />
        </>
      )}
    </div>
  )
}
