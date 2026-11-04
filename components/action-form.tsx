'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActionState } from '@/lib/actions/types'

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>

export function FormMessages({ state }: { state: ActionState }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="rounded-xl bg-[#f6d6cf] px-4 py-3 text-sm font-bold text-[#7a1f10]">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p role="status" className="rounded-xl bg-[#dcebd3] px-4 py-3 text-sm font-bold text-[#27501a]">
          {state.message}
        </p>
      )}
    </>
  )
}

export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = 'Guardando…',
  className,
  buttonClassName = 'btn-primary',
  resetOnSuccess = false,
}: {
  action: Action
  children?: React.ReactNode
  submitLabel: string
  pendingLabel?: string
  className?: string
  buttonClassName?: string
  resetOnSuccess?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, {})
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (resetOnSuccess && state.ok) ref.current?.reset()
  }, [state, resetOnSuccess])

  return (
    <form ref={ref} action={formAction} className={cn('flex flex-col gap-4', className)}>
      {children}
      <FormMessages state={state} />
      <button type="submit" disabled={pending} className={cn(buttonClassName, 'disabled:opacity-60')}>
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  )
}

export function ConfirmForm({
  action,
  fields,
  label,
  confirmText,
  buttonClassName = 'btn-outline',
  confirmButtonClassName = 'btn-primary',
  reasonLabel,
  reasonRequired = false,
}: {
  action: Action
  fields: Record<string, string>
  label: string
  confirmText: string
  buttonClassName?: string
  confirmButtonClassName?: string
  reasonLabel?: string
  reasonRequired?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, {})
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (state.ok) setOpen(false)
  }, [state])

  return (
    <div className="flex flex-col gap-3">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className={buttonClassName}>
          {label}
        </button>
      ) : (
        <form action={formAction} className="card flex flex-col gap-3 border-2 border-marron p-4">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <p className="text-sm font-bold text-marron">{confirmText}</p>
          {reasonLabel && (
            <div>
              <label className="label" htmlFor={`reason-${fields.workId ?? fields.requestId ?? fields.userId ?? fields.offerId}`}>
                {reasonLabel}
              </label>
              <textarea
                id={`reason-${fields.workId ?? fields.requestId ?? fields.userId ?? fields.offerId}`}
                name="reason"
                required={reasonRequired}
                rows={3}
                maxLength={500}
                className="field py-3"
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className={cn(confirmButtonClassName, 'disabled:opacity-60')}>
              {pending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
              {pending ? 'Procesando…' : 'Confirmar'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-outline">
              Cancelar
            </button>
          </div>
        </form>
      )}
      <FormMessages state={state} />
    </div>
  )
}
