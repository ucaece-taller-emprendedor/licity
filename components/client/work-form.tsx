'use client'

import { ActionForm } from '@/components/action-form'
import { Field, Select, TextArea } from '@/components/field'
import { WORK_CATEGORIES } from '@/lib/constants'
import { createWork, updateWork } from '@/lib/actions/client'

type WorkDefaults = {
  id: string
  title: string
  category: string
  description: string
  city: string
  desiredStartDate: string | null
  estimatedDays: number | null
  budgetEstimate: string | null
}

export function WorkForm({ work }: { work?: WorkDefaults }) {
  return (
    <ActionForm
      action={work ? updateWork : createWork}
      submitLabel={work ? 'Guardar cambios' : 'Publicar obra'}
      pendingLabel={work ? 'Guardando…' : 'Publicando…'}
    >
      {work && <input type="hidden" name="workId" value={work.id} />}
      <Field
        name="title"
        label="Título de la obra"
        required
        maxLength={120}
        defaultValue={work?.title}
        placeholder="Ej.: Ampliación de depósito"
      />
      <Select
        name="category"
        label="Tipo de obra"
        required
        options={WORK_CATEGORIES}
        placeholder="Elegí un tipo"
        defaultValue={work?.category}
      />
      <TextArea
        name="description"
        label="Descripción"
        required
        maxLength={3000}
        rows={6}
        defaultValue={work?.description}
        hint="Contá qué necesitás, medidas aproximadas y cualquier requisito importante."
      />
      <Field
        name="city"
        label="Ubicación"
        required
        maxLength={120}
        defaultValue={work?.city}
        placeholder="Ciudad o barrio"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          name="desiredStartDate"
          label="Inicio deseado (opcional)"
          type="date"
          defaultValue={work?.desiredStartDate ?? ''}
        />
        <Field
          name="estimatedDays"
          label="Plazo en días (opcional)"
          type="number"
          min={1}
          max={3650}
          defaultValue={work?.estimatedDays ?? ''}
        />
        <Field
          name="budgetEstimate"
          label="Presupuesto ARS (opcional)"
          inputMode="decimal"
          defaultValue={work?.budgetEstimate ? Math.round(Number(work.budgetEstimate)) : ''}
        />
      </div>
    </ActionForm>
  )
}
