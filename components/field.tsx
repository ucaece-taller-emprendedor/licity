import { cn } from '@/lib/utils'

type CommonProps = {
  name: string
  label: string
  hint?: string
  required?: boolean
  className?: string
}

export function Field({
  name,
  label,
  hint,
  required,
  className,
  ...rest
}: CommonProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'className'>) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        aria-describedby={hint ? `${name}-hint` : undefined}
        className="field"
        {...rest}
      />
      {hint && (
        <p id={`${name}-hint`} className="mt-1 text-xs text-marron-suave">
          {hint}
        </p>
      )}
    </div>
  )
}

export function TextArea({
  name,
  label,
  hint,
  required,
  className,
  ...rest
}: CommonProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'className'>) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <textarea
        id={name}
        name={name}
        required={required}
        rows={4}
        aria-describedby={hint ? `${name}-hint` : undefined}
        className="field py-3"
        {...rest}
      />
      {hint && (
        <p id={`${name}-hint`} className="mt-1 text-xs text-marron-suave">
          {hint}
        </p>
      )}
    </div>
  )
}

export function Select({
  name,
  label,
  required,
  className,
  options,
  placeholder,
  defaultValue,
}: CommonProps & {
  options: readonly string[]
  placeholder?: string
  defaultValue?: string
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ''}
        className={cn('field')}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

export function TermsCheckbox() {
  return (
    <label className="flex items-start gap-3 text-sm text-marron">
      <input type="checkbox" name="terms" required className="mt-1 size-5 accent-[#b83f27]" />
      <span>
        Acepto los{' '}
        <a href="/terminos" target="_blank" rel="noreferrer" className="font-bold underline underline-offset-4">
          Términos y condiciones
        </a>{' '}
        y la{' '}
        <a href="/privacidad" target="_blank" rel="noreferrer" className="font-bold underline underline-offset-4">
          Política de privacidad
        </a>
        .
      </span>
    </label>
  )
}
