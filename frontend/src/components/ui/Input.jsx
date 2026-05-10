import clsx from 'clsx'
import { forwardRef, useId } from 'react'

export const Input = forwardRef(function Input(
  { className, label, labelRight, type = 'text', id, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor={inputId}
            className="text-[10px] font-semibold tracking-[0.2em] text-white/50"
          >
            {label}
          </label>
          {labelRight ? <div className="shrink-0">{labelRight}</div> : null}
        </div>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={clsx(
          'h-11 w-full rounded-lg border border-white/10 bg-white/3 px-3 text-[13px] text-white/90 outline-none',
          'placeholder:text-white/35',
          'focus:border-sky-400/40 focus:ring-4 focus:ring-sky-500/10',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...props}
      />
    </div>
  )
})

