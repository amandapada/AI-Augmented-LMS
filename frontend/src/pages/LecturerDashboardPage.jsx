import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { LECTURER_NAV } from '../config/lecturerNav'

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
    <article className="rounded-lg border border-white/[0.06] bg-[#151921] p-4 shadow-sm">
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
    <section className="rounded-lg border border-white/[0.06] bg-[#151921] p-5 shadow-sm">
      <div className="text-sm font-semibold text-white/90">{title}</div>
      <div className="mt-4">{children}</div>
    </section>
  )
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
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
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
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.05] py-3.5 last:border-0">
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

function StatusPill({ status }) {
  const map = {
    APPROVED: {
      className:
        'bg-[#10B981]/10 text-[#6EE7B7] ring-1 ring-[#10B981]/20',
    },
    PROCESSING: {
      className:
        'bg-[#F59E0B]/10 text-[#FCD34D] ring-1 ring-[#F59E0B]/25',
    },
    READY: {
      className: 'bg-[#3B82F6]/10 text-[#93C5FD] ring-1 ring-[#3B82F6]/20',
    },
  }
  const s = map[status] || map.READY
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]',
        s.className,
      )}
    >
      {status}
    </span>
  )
}

function TableButton({ variant = 'ghost', disabled = false, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={clsx(
        'inline-flex h-8 min-w-[4.5rem] items-center justify-center rounded-md px-3 text-[11px] font-semibold transition',
        'focus:outline-none focus:ring-2 focus:ring-sky-500/20',
        'disabled:cursor-not-allowed disabled:opacity-45',
        variant === 'primary'
          ? 'bg-[#3B82F6] text-white hover:bg-[#3276EA]'
          : 'bg-[#1e2430] text-white/80 ring-1 ring-white/[0.08] hover:bg-[#242b38]',
      )}
    >
      {children}
    </button>
  )
}

const RECENT = [
  {
    title: 'Intro to Signal Processing.pdf',
    status: 'APPROVED',
    date: 'Oct 24, 2024',
    canApprove: true,
  },
  {
    title: 'Embedded Systems Design.png',
    status: 'PROCESSING',
    date: 'Oct 25, 2024',
    canApprove: false,
  },
  {
    title: 'Network Security Protocols.pdf',
    status: 'READY',
    date: 'Oct 25, 2024',
    canApprove: true,
  },
]

export function LecturerDashboardPage() {
  const navigate = useNavigate()
  return (
    <DashboardLayout
      userFallbackName="Lecturer"
      navItems={LECTURER_NAV}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Dashboard
          </h1>
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

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Total Handouts" value="24" />
          <StatTile label="Approved" value="18" accent="green" />
          <StatTile label="Students Enrolled" value="1,248" />
          <StatTile label="Avg Quiz Score" value="76%" />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Weakest Topics">
            <div className="space-y-5">
              <WeakestRow
                label="Data Structures & Algorithms"
                value={42}
                barVariant="danger"
              />
              <WeakestRow
                label="Operating Systems"
                value={58}
              />
              <WeakestRow
                label="Network Protocols"
                value={62}
              />
            </div>
          </Panel>

          <Panel title="Feature Usage (Last 7 Days)">
            <div>
              <UsageRow
                icon={
                  <Icon
                    name="flashcards"
                    className="text-[#3B82F6]"
                  />
                }
                label="Flashcard Sessions"
                value="3,420"
                boxClass="bg-[#3B82F6]/12"
              />
              <UsageRow
                icon={
                  <Icon
                    name="target"
                    className="text-[#10B981]"
                  />
                }
                label="Quiz Attempts"
                value="1,850"
                boxClass="bg-[#10B981]/12"
              />
              <UsageRow
                icon={
                  <Icon
                    name="chat"
                    className="text-[#F59E0B]"
                  />
                }
                label="AI Chat Messages"
                value="12,400"
                boxClass="bg-[#F59E0B]/12"
              />
            </div>
          </Panel>
        </section>

        <section className="rounded-lg border border-white/[0.06] bg-[#151921] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-white/90">Recent Handouts</h2>

          <div className="mt-4 overflow-x-auto -mx-1">
            <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-white/[0.08] text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  <th className="py-2.5 pr-4 font-medium">Title</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5 font-medium">Date uploaded</th>
                  <th className="w-[1%] py-2.5 pl-2 text-right font-medium whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {RECENT.map((row) => (
                  <tr
                    key={row.title}
                    className="border-b border-white/[0.05] last:border-0"
                  >
                    <td className="py-3.5 pr-4 align-middle text-white/75">
                      {row.title}
                    </td>
                    <td className="px-2 py-3.5 align-middle">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-2 py-3.5 align-middle tabular-nums text-white/45">
                      {row.date}
                    </td>
                    <td className="py-3.5 pl-2 text-right align-middle">
                      <div className="inline-flex justify-end gap-2">
                        <TableButton>Audit</TableButton>
                        <TableButton
                          variant="primary"
                          disabled={!row.canApprove}
                        >
                          Approve
                        </TableButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
