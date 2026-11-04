'use client'

import { ActionForm } from '@/components/action-form'
import { Field, TermsCheckbox, TextArea } from '@/components/field'
import { registerClient, registerContractor } from '@/lib/actions/auth'

function Credentials() {
  return (
    <>
      <Field name="name" label="Tu nombre y apellido" autoComplete="name" required maxLength={80} />
      <Field name="email" label="Correo electrónico" type="email" autoComplete="email" required />
      <Field
        name="password"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="Mínimo 8 caracteres."
      />
    </>
  )
}

export function RegisterClientForm() {
  return (
    <ActionForm
      action={registerClient}
      submitLabel="Crear cuenta de PyME"
      pendingLabel="Creando cuenta…"
    >
      <Credentials />
      <Field name="companyName" label="Nombre de la empresa" required maxLength={120} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="cuit" label="CUIT (opcional)" inputMode="numeric" placeholder="30-12345678-9" />
        <Field name="city" label="Ciudad" required maxLength={80} />
      </div>
      <Field name="phone" label="Teléfono (opcional)" type="tel" autoComplete="tel" />
      <TermsCheckbox />
    </ActionForm>
  )
}

export function RegisterContractorForm() {
  return (
    <ActionForm
      action={registerContractor}
      submitLabel="Crear cuenta de contratista"
      pendingLabel="Creando cuenta…"
    >
      <Credentials />
      <Field name="displayName" label="Nombre o razón social" required maxLength={120} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="cuit" label="CUIT" inputMode="numeric" placeholder="20-12345678-9" required />
        <Field name="specialty" label="Especialidad" placeholder="Ej.: Albañilería" required maxLength={80} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="city" label="Ciudad" required maxLength={80} />
        <Field name="coverageZone" label="Zona de cobertura (opcional)" maxLength={160} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="yearsExperience" label="Años de experiencia (opcional)" type="number" min={0} max={80} />
        <Field name="phone" label="Teléfono (opcional)" type="tel" autoComplete="tel" />
      </div>
      <TextArea name="description" label="Presentación (opcional)" maxLength={1000} />
      <p className="text-sm text-marron-suave">
        Licity revisa cada cuenta de contratista antes de habilitarla para enviar ofertas.
      </p>
      <TermsCheckbox />
    </ActionForm>
  )
}
