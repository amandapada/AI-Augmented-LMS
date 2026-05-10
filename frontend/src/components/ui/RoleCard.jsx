import clsx from 'clsx'

export function RoleCard({
  title,
  description,
  selected,
  onSelect,
  className,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'group relative flex min-h-[96px] w-full flex-col justify-end overflow-hidden rounded-xl border p-4 text-left',
        'transition focus:outline-none focus:ring-4 focus:ring-sky-500/10',
        selected
          ? 'border-[#3B82F6]/60 bg-white/4'
          : 'border-white/10 bg-white/3 hover:border-white/20',
        className,
      )}
      aria-pressed={selected}
    >
      <div
        className={clsx(
          'pointer-events-none absolute inset-0 opacity-0 transition-opacity',
          selected ? 'opacity-100' : 'group-hover:opacity-100',
        )}
        aria-hidden="true"
      >
        <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-[#3B82F6]/10 blur-2xl" />
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
      </div>

      <div
        className={clsx(
          'pointer-events-none absolute left-4 top-4 h-10 w-10 rounded-full bg-white/5 ring-1 ring-white/10',
          selected ? 'ring-[#3B82F6]/30' : '',
        )}
        aria-hidden="true"
      />

      <div className="relative">
        <div className="text-[13px] font-semibold text-white/90">{title}</div>
        <div className="mt-1 text-[11px] text-white/45">{description}</div>
      </div>
    </button>
  )
}

