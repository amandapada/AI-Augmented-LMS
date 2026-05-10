import clsx from 'clsx'

export function SegmentedControl({ value, onChange, options, className }) {
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )

  return (
    <div
      className={clsx(
        'relative grid h-10 grid-cols-2 rounded-lg border border-white/10 bg-white/3 p-1',
        className,
      )}
      role="tablist"
      aria-label="Account type"
    >
      <div
        className={clsx(
          'pointer-events-none absolute top-1 h-8 w-[calc(50%-0.25rem)] rounded-md bg-white/6 shadow-sm transition-transform duration-200',
          activeIndex === 0 ? 'translate-x-0' : 'translate-x-[calc(100%+0.5rem)]',
        )}
        aria-hidden="true"
      />
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={clsx(
              'relative z-10 rounded-md text-[12px] font-semibold transition-colors',
              active ? 'text-[#3B82F6]' : 'text-white/55 hover:text-white/75',
              'focus:outline-none focus:ring-4 focus:ring-sky-500/10',
            )}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

