'use client'

import { ActionForm, ConfirmForm } from '@/components/action-form'
import { Field } from '@/components/field'
import { markDone, postProgress, reportWork, startWork } from '@/lib/actions/business'

export function StartWorkButton({ workId }: { workId: string }) {
  return (
    <ConfirmForm
      action={startWork}
      fields={{ workId }}
      label="Iniciar obra"
      confirmText="Vas a marcar la obra como en ejecución y se avisa a la PyME."
      buttonClassName="btn-primary"
    />
  )
}

export function ProgressForm({ workId, current }: { workId: string; current: number }) {
  return (
    <ActionForm action={postProgress} submitLabel="Registrar avance" pendingLabel="Guardando…" resetOnSuccess>
      <input type="hidden" name="workId" value={workId} />
      <Field
        name="progress"
        label={`Avance (%) — actual ${current}%`}
        type="number"
        min={current}
        max={99}
        required
        defaultValue={Math.min(current + 10, 99)}
      />
      <Field name="message" label="Descripción del avance" required maxLength={1000} />
    </ActionForm>
  )
}

export function MarkDoneButton({ workId }: { workId: string }) {
  return (
    <ConfirmForm
      action={markDone}
      fields={{ workId }}
      label="Marcar como terminada"
      confirmText="La PyME va a recibir el aviso para revisar el trabajo y confirmar la finalización."
      buttonClassName="btn-outline"
    />
  )
}

export function ReportWorkButton({ workId }: { workId: string }) {
  return (
    <ConfirmForm
      action={reportWork}
      fields={{ workId }}
      label="Reportar un problema"
      confirmText="Contale al equipo de Licity qué pasó con esta obra."
      reasonLabel="Motivo del reporte"
      reasonRequired
    />
  )
}
