import clsx from 'clsx'

export function Card({ className, children }) {
  return (
    <section
      className={clsx(
        'w-full max-w-[420px] rounded-2xl border border-white/10 bg-white/4 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-8',
        className,
      )}
      aria-label="Authentication"
    >
      {children}
    </section>
  )
}

