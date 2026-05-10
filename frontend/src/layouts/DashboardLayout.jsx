import { NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Wordmark } from '../components/Brand/Wordmark'
import { useAuth } from '../context/useAuth'

function Icon({ name, className }) {
  const common = 'h-4 w-4'
  switch (name) {
    case 'handout':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M14 3v4h4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'upload':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M12 3v10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8 7l4-4 4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'dashboard':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'analytics':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M4 19V5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4 19h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8 15v-4M12 15V7M16 15v-2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'courses':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M3 7l9-4 9 4-9 4-9-4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M21 7v10l-9 4-9-4V7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12 11v10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'schedule':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M8 3v3M16 3v3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4.5 7.5h15v13a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-13Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 11h3.5M7.5 14.5h6.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'logout':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M10 7V6a2 2 0 0 1 2-2h7v16h-7a2 2 0 0 1-2-2v-1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M3 12h10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M7 8l-4 4 4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return null
  }
}

function SidebarLink({ to, icon, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center gap-3 rounded-lg py-2.5 pl-3 pr-3 text-[13px] font-medium transition-colors',
          isActive
            ? 'bg-white/[0.04] text-white'
            : 'text-white/50 hover:bg-white/[0.03] hover:text-white/80',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span
              className="absolute right-0 top-1.5 h-[calc(100%-12px)] w-0.5 rounded-l bg-[#3B82F6]"
              aria-hidden
            />
          ) : null}
          <span
            className={clsx(
              isActive ? 'text-[#3B82F6]' : 'text-white/40 group-hover:text-white/60',
            )}
          >
            {icon}
          </span>
          <span>{children}</span>
        </>
      )}
    </NavLink>
  )
}

export function DashboardLayout({
  children,
  navItems = [],
  userFallbackName = 'User',
}) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  function onLogout() {
    signOut()
    navigate('/login', { replace: true })
  }

  const initials = String(user?.name || userFallbackName)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')

  return (
    <div className="min-h-dvh bg-[#0B0E14] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_12%_8%,rgba(59,130,246,0.08),transparent_55%),radial-gradient(800px_500px_at_90%_20%,rgba(99,102,241,0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-linear-to-b from-white/[0.02] via-transparent to-black/40" />
      </div>

      <div className="relative grid min-h-dvh w-full grid-cols-1 md:grid-cols-[minmax(0,280px)_1fr]">
        <aside className="hidden min-h-0 flex-col border-r border-white/[0.06] bg-[#0B0E14] p-5 md:flex">
          <div className="shrink-0">
            <Wordmark />
          </div>

          <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-0.5">
            {navItems.map((item) => (
              <SidebarLink
                key={item.to}
                to={item.to}
                end={item.to === '/lecturer' || item.to === '/student'}
                icon={<Icon name={item.icon} />}
              >
                {item.label}
              </SidebarLink>
            ))}
          </nav>

          <div className="mt-auto flex shrink-0 items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-[#151921] px-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e2634] text-[12px] font-semibold text-white/90 ring-1 ring-white/10">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-white/90">
                  {user?.name || userFallbackName}
                </div>
                <div className="truncate text-[10px] text-white/40">
                  {user?.email || ''}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/5 hover:text-white/80"
              aria-label="Sign out"
              title="Sign out"
            >
              <Icon name="logout" />
            </button>
          </div>
        </aside>

        <main className="min-h-0 min-w-0 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

