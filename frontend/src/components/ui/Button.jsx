import clsx from 'clsx'

export function Button({ className, variant = 'primary', ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-[13px] font-semibold',
        'transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' &&
          'bg-[#3B82F6] text-white shadow-[0_14px_40px_-18px_rgba(59,130,246,0.75)] hover:bg-[#3276EA]',
        variant === 'ghost' &&
          'bg-transparent text-white/80 hover:bg-white/5',
        className,
      )}
      {...props}
    />
  )
}

