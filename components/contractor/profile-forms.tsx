'use client'

import { ActionForm, ConfirmForm } from '@/components/action-form'
import { Field, TextArea } from '@/components/field'
import { resubmitVerification, updateContractorProfile } from '@/lib/actions/business'

type Profile = {
  displayName: string
  specialty: string
  city: string
  coverageZone: string | null
  phone: string | null
  yearsExperience: number | null
  description: string | null
}

export function ContractorProfileForm({ profile }: { profile: Profile }) {
  return (
    <ActionForm action={updateContractorProfile} submitLabel="Guardar cambios">
      <Field name="displayName" label="Nombre o razón social" required defaultValue={profile.displayName} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="specialty" label="Especialidad" required defaultValue={profile.specialty} />
        <Field name="city" label="Ciudad" required defaultValue={profile.city} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="coverageZone" label="Zona de cobertura" defaultValue={profile.coverageZone ?? ''} />
        <Field name="yearsExperience" label="Años de experiencia" type="number" min={0} max={80} defaultValue={profile.yearsExperience ?? ''} />
      </div>
      <Field name="phone" label="Teléfono" type="tel" defaultValue={profile.phone ?? ''} />
      <TextArea name="description" label="Presentación" maxLength={1000} defaultValue={profile.description ?? ''} />
    </ActionForm>
  )
}

export function ResubmitVerification() {
  return (
    <ConfirmForm
      action={resubmitVerification}
      fields={{ resubmit: '1' }}
      label="Pedir nueva revisión"
      confirmText="Enviamos tu perfil de nuevo al equipo de Licity para que lo revise."
      buttonClassName="btn-primary"
    />
  )
}
