'use client'

import { ActionForm } from '@/components/action-form'
import { Field, TextArea } from '@/components/field'
import { submitOffer } from '@/lib/actions/business'

export function OfferForm({ workId }: { workId: string }) {
  return (
    <ActionForm action={submitOffer} submitLabel="Enviar oferta" pendingLabel="Enviando…">
      <input type="hidden" name="workId" value={workId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="amount" label="Monto total (ARS)" inputMode="decimal" required placeholder="1500000" />
        <Field name="estimatedDays" label="Plazo (días)" type="number" min={1} max={3650} required />
      </div>
      <TextArea
        name="description"
        label="Alcance de tu propuesta"
        required
        minLength={20}
        maxLength={3000}
        rows={5}
        hint="Detallá qué incluye tu oferta, materiales y condiciones."
      />
      <TextArea name="notes" label="Notas (opcional)" maxLength={1000} rows={3} />
    </ActionForm>
  )
}
