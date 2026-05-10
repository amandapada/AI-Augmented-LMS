export function AuthLayout({ children }) {
  return (
    <div className="h-dvh min-h-0 overflow-hidden bg-[#070A12] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_10%_10%,rgba(59,130,246,0.12),transparent_60%),radial-gradient(900px_600px_at_90%_30%,rgba(99,102,241,0.10),transparent_65%)]" />
        <div className="absolute inset-0 bg-linear-to-b from-white/3 via-transparent to-black/40" />
      </div>

      <main className="relative z-10 flex h-full min-h-0 w-full flex-col md:flex-row">
        {children}
      </main>
    </div>
  )
}

