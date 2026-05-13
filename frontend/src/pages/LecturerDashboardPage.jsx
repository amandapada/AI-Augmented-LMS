import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { LECTURER_NAV } from '../config/lecturerNav'
import { overview as fetchOverview } from '../api/analytics.js'
import { useAuth } from '../context/useAuth'
import { list as listHandouts } from '../api/handouts.js'

function Icon({ name, className }) {
  const common = 'h-4 w-4'
  switch (name) {
    case 'plus':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'flashcards':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M4 6a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M8 10h8M8 14h5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'bolt':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M13 2 3 14h8l-1 8 11-14h-8l0-6Z"
            fill="currentColor"
            opacity="0.9"
          />
        </svg>
      )
    case 'target':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 12h.01"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'chat':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M6 3h9a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-4 3v-3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return null
  }
}

function StatTile({ label, value, accent = 'default' }) {
  const valueColor =
    accent === 'green' ? 'text-[#10B981]' : 'text-white/95'
  return (
    <article className="rounded-lg border border-white/6 bg-[#151921] p-4 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {label}
      </div>
      <div
        className={clsx(
          'mt-2 text-2xl font-semibold tabular-nums leading-none tracking-tight',
          valueColor,
        )}
      >
        {value}
      </div>
    </article>
  )
}

function Panel({ title, children }) {
  return (
    <section className="rounded-lg border border-white/6 bg-[#151921] p-5 shadow-sm">
      <div className="text-sm font-semibold text-white/90">{title}</div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function StatusPill({ status }) {
  const s = String(status || '').toUpperCase()
  const map = {
    APPROVED: 'bg-[#10B981]/10 text-[#6EE7B7] ring-1 ring-[#10B981]/20',
    READY: 'bg-[#3B82F6]/10 text-[#93C5FD] ring-1 ring-[#3B82F6]/20',
    PROCESSING: 'bg-[#F59E0B]/10 text-[#FCD34D] ring-1 ring-[#F59E0B]/25',
    UPLOADED: 'bg-white/5 text-white/65 ring-1 ring-white/10',
    FAILED: 'bg-[#EF4444]/10 text-[#FCA5A5] ring-1 ring-[#EF4444]/25',
  }
  const cls = map[s] || map.UPLOADED
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest',
        cls,
      )}
    >
      {s || 'UNKNOWN'}
    </span>
  )
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function WeakestRow({ label, value, barVariant = 'neutral' }) {
  const barClass =
    barVariant === 'danger'
      ? 'bg-[#EF4444]/90'
      : 'bg-zinc-600/50'
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-[12px] leading-snug text-white/80">
          {label}
        </div>
        <div className="shrink-0 text-[12px] font-semibold tabular-nums text-white/55">
          {value}%
        </div>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/6">
        <div
          className={clsx('h-1 rounded-full', barClass)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function UsageRow({ icon, label, value, boxClass }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-3.5 last:border-0">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={clsx(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            boxClass,
          )}
        >
          {icon}
        </div>
        <div className="text-[12px] font-medium text-white/75">{label}</div>
      </div>
      <div className="text-base font-semibold tabular-nums text-white/90">
        {value}
      </div>
    </div>
  )
}

// (duplicate StatusPill removed; see earlier StatusPill definition)

function TableButton({ variant = 'ghost', disabled = false, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={clsx(
        'inline-flex h-8 min-w-18 items-center justify-center rounded-md px-3 text-[11px] font-semibold transition',
        'focus:outline-none focus:ring-2 focus:ring-sky-500/20',
        'disabled:cursor-not-allowed disabled:opacity-45',
        variant === 'primary'
          ? 'bg-[#3B82F6] text-white hover:bg-[#3276EA]'
          : 'bg-[#1e2430] text-white/80 ring-1 ring-white/8 hover:bg-[#242b38]',
      )}
    >
      {children}
    </button>
  )
}

export function LecturerDashboardPage() {
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const [overview, setOverview] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [handouts, setHandouts] = useState(null)
  const [handoutsError, setHandoutsError] = useState('')

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false

    ;(async () => {
      try {
        await Promise.resolve()
        if (cancelled) return
        setLoadError('')
        const data = await fetchOverview({ accessToken })
        if (!cancelled) setOverview(data)
      } catch (e) {
        if (!cancelled) setLoadError(e?.message || 'Failed to load analytics.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    const ac = new AbortController()

    ;(async () => {
      try {
        await Promise.resolve()
        if (cancelled) return
        setHandoutsError('')
        const data = await listHandouts({ accessToken, signal: ac.signal })
        if (!cancelled) setHandouts(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setHandoutsError(e?.message || 'Failed to load handouts.')
      }
    })()

    return () => {
      cancelled = true
      ac.abort()
    }
  }, [accessToken])

  const handoutCounts = useMemo(() => {
    const rows = Array.isArray(handouts) ? handouts : []
    /** @type {Record<string, number>} */
    const counts = { total: rows.length }
    for (const h of rows) {
      const s = typeof h?.status === 'string' ? h.status : 'UNKNOWN'
      counts[s] = (counts[s] || 0) + 1
    }
    return counts
  }, [handouts])

  const recentHandouts = useMemo(() => {
    const rows = Array.isArray(handouts) ? handouts : []
    return [...rows]
      .sort((a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime())
      .slice(0, 8)
  }, [handouts])

  const weakestRows = useMemo(() => {
    const rows = overview?.weakest_topics
    if (!Array.isArray(rows) || rows.length === 0) return []
    return rows.slice(0, 3).map((r, idx) => {
      const avg = Number(r.avg_score)
      const v = Number.isFinite(avg) ? Math.max(0, Math.min(100, Math.round(avg))) : 0
      return {
        label: String(r.topic || 'Unknown'),
        value: v,
        barVariant: idx === 0 && v < 50 ? 'danger' : 'neutral',
      }
    })
  }, [overview])

  const usageCounts = useMemo(() => {
    const u = overview?.feature_usage
    if (!u || typeof u !== 'object') return { flashcards: 0, quizzes: 0, chats: 0 }
    return {
      flashcards: Number(u.flashcards) || 0,
      quizzes: Number(u.quizzes) || 0,
      chats: Number(u.chats) || 0,
    }
  }, [overview])

  const hasAnyUsage = useMemo(() => {
    return usageCounts.flashcards + usageCounts.quizzes + usageCounts.chats > 0
  }, [usageCounts])

  const avgQuizScore = useMemo(() => {
    const rows = overview?.quiz_trends
    if (!Array.isArray(rows) || rows.length === 0) return null
    const vals = rows
      .map((r) => Number(r.avg_score))
      .filter((v) => Number.isFinite(v))
    if (!vals.length) return null
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    return `${Math.round(Math.max(0, Math.min(100, avg)))}%`
  }, [overview])

  return (
    <DashboardLayout
      userFallbackName="Lecturer"
      navItems={LECTURER_NAV}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
            <p className="mt-1 text-[12px] text-white/45">
              {overview?.refreshed_at
                ? `Last refreshed: ${String(overview.refreshed_at).replace('T', ' ').slice(0, 19)}`
                : 'Analytics load automatically when activity exists.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/lecturer/upload')}
            className={clsx(
              'inline-flex h-9 items-center gap-2 rounded-md bg-[#3B82F6] px-3.5 text-xs font-semibold text-white',
              'shadow-[0_8px_24px_-6px_rgba(59,130,246,0.55)] transition hover:bg-[#3276EA]',
              'focus:outline-none focus:ring-2 focus:ring-sky-500/25',
            )}
          >
            <Icon name="plus" className="h-3.5 w-3.5" />
            New Handout
          </button>
        </header>

        {loadError ? (
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-[12px] text-red-100/90">
            {loadError}
          </div>
        ) : null}

        {handoutsError ? (
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-[12px] text-red-100/90">
            {handoutsError}
          </div>
        ) : null}

        {!loadError && overview && !hasAnyUsage && weakestRows.length === 0 ? (
          <div className="rounded-lg border border-white/6 bg-white/2 px-4 py-3 text-[12px] text-white/60">
            No analytics data yet. Once students start attempting quizzes, reviewing flashcards, or
            using AI chat, these charts and tables will populate automatically.
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Total Handouts" value={String(handoutCounts.total ?? 0)} />
          <StatTile label="Approved" value={String(handoutCounts.APPROVED ?? 0)} accent="green" />
          <StatTile label="Processing" value={String(handoutCounts.PROCESSING ?? 0)} />
          <StatTile label="Avg Quiz Score" value={avgQuizScore ?? '—'} />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Weakest Topics">
            {weakestRows.length ? (
              <div className="space-y-5">
                {weakestRows.map((r) => (
                  <WeakestRow
                    key={r.label}
                    label={r.label}
                    value={r.value}
                    barVariant={r.barVariant}
                  />
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-white/55">
                No quiz attempts yet — topic performance will appear after the first submissions.
              </div>
            )}
          </Panel>

          <Panel title="Feature Usage (All time)">
            {hasAnyUsage ? (
              <div>
                <UsageRow
                  icon={<Icon name="flashcards" className="text-[#3B82F6]" />}
                  label="Flashcard Reviews"
                  value={usageCounts.flashcards.toLocaleString()}
                  boxClass="bg-[#3B82F6]/12"
                />
                <UsageRow
                  icon={<Icon name="target" className="text-[#10B981]" />}
                  label="Quiz Attempts"
                  value={usageCounts.quizzes.toLocaleString()}
                  boxClass="bg-[#10B981]/12"
                />
                <UsageRow
                  icon={<Icon name="chat" className="text-[#F59E0B]" />}
                  label="AI Chat Messages"
                  value={usageCounts.chats.toLocaleString()}
                  boxClass="bg-[#F59E0B]/12"
                />
              </div>
            ) : (
              <div className="text-[12px] text-white/55">
                No activity yet.
              </div>
            )}
          </Panel>
        </section>

        <section className="rounded-lg border border-white/6 bg-[#151921] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white/90">Study tools</h2>
            <div className="text-[12px] text-white/45">Generate quizzes/flashcards per handout</div>
          </div>

          {Array.isArray(handouts) && handouts.length === 0 ? (
            <div className="mt-4 text-[12px] text-white/55">
              No handouts yet. Upload one to start generating study tools.
            </div>
          ) : null}

          {Array.isArray(handouts) && handouts.length > 0 ? (
            <div className="mt-4 overflow-x-auto -mx-1">
              <table className="w-full min-w-[760px] border-collapse text-left text-[12px]">
                <thead>
                  <tr className="border-b border-white/8 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                    <th className="py-2.5 pr-4 font-medium">Handout</th>
                    <th className="px-2 py-2.5 font-medium">Status</th>
                    <th className="px-2 py-2.5 font-medium">Created</th>
                    <th className="w-[1%] py-2.5 pl-2 text-right font-medium whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentHandouts.map((h) => (
                    <tr key={h.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3.5 pr-4 align-middle text-white/80">
                        <div className="font-semibold text-white/85">{h.title}</div>
                        <div className="mt-0.5 text-[11px] text-white/45">
                          Handout #{h.id}
                        </div>
                      </td>
                      <td className="px-2 py-3.5 align-middle">
                        <StatusPill status={h.status} />
                      </td>
                      <td className="px-2 py-3.5 align-middle tabular-nums text-white/45">
                        {formatDate(h.created_at)}
                      </td>
                      <td className="py-3.5 pl-2 text-right align-middle whitespace-nowrap">
                        <div className="inline-flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/lecturer/handouts/${h.id}/flashcards`)}
                            className={clsx(
                              'inline-flex h-8 items-center justify-center rounded-md px-3 text-[11px] font-semibold',
                              'bg-[#1e2430] text-white/80 ring-1 ring-white/8 hover:bg-[#242b38]',
                            )}
                          >
                            Flashcards
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/lecturer/handouts/${h.id}/quiz`)}
                            className={clsx(
                              'inline-flex h-8 items-center justify-center rounded-md px-3 text-[11px] font-semibold',
                              'bg-[#1e2430] text-white/80 ring-1 ring-white/8 hover:bg-[#242b38]',
                            )}
                          >
                            Quiz
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </DashboardLayout>
  )
}
