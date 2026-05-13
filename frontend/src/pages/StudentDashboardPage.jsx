import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { STUDENT_NAV } from '../config/studentNav'
import { useAuth } from '../context/useAuth'
import { apiFetch, formatApiError } from '../lib/apiClient'

function Icon({ name, className }) {
  const common = 'h-4 w-4'
  switch (name) {
    case 'arrow':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M5 12h12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'grid':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'list':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M8 6h13M8 12h13M8 18h13"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4 6h.01M4 12h.01M4 18h.01"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'share':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M16 8a3 3 0 1 0-2.88-4H13a3 3 0 0 0 .12.84L8.9 7.06a3 3 0 0 0-1.9-.69 3 3 0 1 0 0 6c.7 0 1.35-.24 1.86-.64l4.3 2.3A3 3 0 1 0 15 15a2.98 2.98 0 0 0-.12-.84l-4.3-2.3c.27-.46.42-.99.42-1.56 0-.56-.15-1.08-.41-1.53l4.23-2.24c.5.38 1.12.6 1.75.6Z"
            fill="currentColor"
            opacity="0.85"
          />
        </svg>
      )
    case 'layers':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M12 3l9 5-9 5-9-5 9-5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M3 12l9 5 9-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M3 17l9 5 9-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'clock':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 7v6l4 2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'message':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M7 18l-3 3V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M8 9h8M8 12h6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'check':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'flame':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M13 3s2 2 2 5-2 4-2 4 1-1 3-1c2.5 0 4 2.2 4 4.6C20 20.4 16.9 22 13.8 22 8.8 22 6 19 6 15.7 6 11 11 9 11 5c0-1.4-.3-2.5-.3-2.5S12 3 13 3Z"
            fill="currentColor"
            opacity="0.85"
          />
        </svg>
      )
    case 'dots':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M6 12h.01M12 12h.01M18 12h.01"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      )
    default:
      return null
  }
}

function IconButton({ label, children, className }) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-white/2 text-white/60',
        'transition hover:bg-white/4 hover:text-white/80',
        'focus:outline-none focus:ring-4 focus:ring-sky-500/10',
        className,
      )}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}

function HandoutLinkCard({ id, title, createdAt, status }) {
  let date = null
  if (createdAt) {
    const d = new Date(createdAt)
    if (!Number.isNaN(d.getTime())) {
      date = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }
  const st = String(status || '').toLowerCase()
  return (
    <Link
      to={`/student/handouts/${id}`}
      className="group block rounded-2xl border border-white/5 bg-white/2 p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.75)] transition hover:border-[#3B82F6]/25 hover:bg-white/4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold tracking-[0.18em] text-white/35">
            {date ? date.toUpperCase() : '—'}
          </div>
          <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-white/90 group-hover:text-white">
            {title}
          </h3>
        </div>
        <span
          className={clsx(
            'shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-[0.12em]',
            st === 'approved'
              ? 'border-emerald-500/35 text-emerald-300/90'
              : 'border-white/10 text-white/40',
          )}
        >
          {st.toUpperCase()}
        </span>
      </div>
      <div className="mt-5 border-t border-white/5 pt-4 text-[11px] font-medium text-[#3B82F6]/80 group-hover:text-[#3B82F6]">
        Open handout →
      </div>
    </Link>
  )
}

function StatCard({ label, value, suffix, icon, accent = 'blue' }) {
  const accentColor =
    accent === 'green'
      ? 'text-emerald-400'
      : accent === 'orange'
        ? 'text-orange-400'
        : 'text-[#3B82F6]'

  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/2 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold tracking-[0.18em] text-white/35">
            {label}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-[22px] font-semibold tracking-tight text-white/90 tabular-nums">
              {value}
            </div>
            {suffix ? (
              <div className="text-[11px] font-semibold text-white/35">
                {suffix}
              </div>
            ) : null}
          </div>
        </div>

        <div className={clsx('rounded-xl bg-black/20 p-2', accentColor)}>
          {icon}
        </div>
      </div>
    </article>
  )
}

export function StudentDashboardPage() {
  const { user, accessToken } = useAuth()
  const name = user?.name || 'Student'
  const [handouts, setHandouts] = useState([])
  const [listError, setListError] = useState('')

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!accessToken) {
        await Promise.resolve()
        if (!cancelled) {
          setHandouts([])
          setListError('')
        }
        return
      }

      const { res, data } = await apiFetch('/handouts', { token: accessToken })
      if (cancelled) return

      if (!res.ok) {
        setListError(formatApiError(data, res.status, res.statusText))
        setHandouts([])
        return
      }

      setListError('')
      setHandouts(Array.isArray(data) ? data : [])
    })()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  return (
    <DashboardLayout
      userFallbackName="Student"
      navItems={STUDENT_NAV}
    >
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/2 p-6 md:p-7">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#3B82F6]/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-black/30" />
          </div>

          <div className="relative max-w-2xl">
            <h1 className="text-balance font-serif text-[26px] font-normal tracking-tight text-white/95 md:text-[28px]">
              Good morning, {name}
            </h1>
            <p className="mt-2 text-[12px] leading-relaxed text-white/55">
              You&apos;ve reached 85% of your study goal this week. Ready to
              tackle Signal Processing today?
            </p>

            <div className="mt-5">
              <Link
                to={
                  handouts.length
                    ? `/student/handouts/${handouts[0].id}`
                    : '/student#study-materials'
                }
                className={clsx(
                  'inline-flex h-10 items-center gap-2 rounded-lg bg-[#3B82F6] px-4 text-[12px] font-semibold text-white',
                  'shadow-[0_14px_40px_-18px_rgba(59,130,246,0.8)] transition hover:bg-[#3276EA]',
                  'focus:outline-none focus:ring-4 focus:ring-sky-500/10',
                )}
              >
                {handouts.length ? 'Open a handout' : 'View study materials'}{' '}
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section id="study-materials" className="scroll-mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[16px] font-semibold tracking-tight text-white/90">
              Your Study Materials
            </h2>
            <div className="flex items-center gap-2">
              <IconButton label="Grid view">
                <Icon name="grid" />
              </IconButton>
              <IconButton label="List view">
                <Icon name="list" />
              </IconButton>
              <IconButton label="More">
                <Icon name="dots" />
              </IconButton>
            </div>
          </div>

          {listError ? (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-100/90">
              {listError}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {handouts.length === 0 && !listError ? (
              <p className="col-span-full text-[13px] text-white/45">
                No handouts yet. When your lecturer publishes approved materials, they will appear here.
              </p>
            ) : (
              handouts.map((h) => (
                <HandoutLinkCard
                  key={h.id}
                  id={h.id}
                  title={h.title}
                  createdAt={h.created_at}
                  status={h.status}
                />
              ))
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              label="CARDS TODAY"
              value="42"
              suffix="/ 50"
              icon={<Icon name="layers" />}
              accent="blue"
            />
            <StatCard
              label="QUIZZES"
              value="3"
              suffix="completed"
              icon={<Icon name="check" />}
              accent="green"
            />
            <StatCard
              label="STUDY STREAK"
              value="12"
              suffix="Days"
              icon={<Icon name="flame" />}
              accent="orange"
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

