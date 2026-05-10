import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { STUDENT_NAV } from '../config/studentNav'

function PageTitle({ title, subtitle, className }) {
  return (
    <header className={clsx(className)}>
      <h1 className="font-serif text-[2rem] font-normal tracking-tight text-white md:text-[2.25rem]">
        {title}
      </h1>
      <p className="mt-2 text-[13px] text-white/45">{subtitle}</p>
    </header>
  )
}

function Icon({ name, className }) {
  const common = 'h-4 w-4 shrink-0'
  switch (name) {
    case 'chevLeft':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={clsx(common, className)} aria-hidden>
          <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'chevRight':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={clsx(common, className)} aria-hidden>
          <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'list':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={clsx(common, className)} aria-hidden>
          <path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    case 'plus':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={clsx(common, className)} aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

/** @typedef {'purple' | 'blue' | 'green' | 'amber'} Accent */

/** @type {{ dayIndex: number, start: string, label: string, accent: Accent }[]} */
const WEEK_SESSIONS = [
  { dayIndex: 0, start: '9:00 AM', label: 'COEN 451', accent: 'blue' },
  { dayIndex: 0, start: '11:30 AM', label: 'Lab prep', accent: 'purple' },
  { dayIndex: 1, start: '10:00 AM', label: 'EEEN 410', accent: 'green' },
  { dayIndex: 2, start: '3:00 PM', label: 'Review week', accent: 'purple' },
  { dayIndex: 3, start: '9:00 AM', label: 'COEN 432', accent: 'amber' },
  { dayIndex: 4, start: '2:00 PM', label: 'Office hrs', accent: 'blue' },
  { dayIndex: 5, start: '11:00 AM', label: 'Quiz prep', accent: 'green' },
  { dayIndex: 6, start: '4:00 PM', label: 'Read Ch. 8', accent: 'amber' },
]

/** @type {{ title: string, detail: string, tag: string, tagTone: 'purple' | 'green', accent: 'purple' | 'green' }[]} */
const UPCOMING = [
  {
    title: 'Digital Image Processing',
    detail: 'Today at 9:00 AM · 2 hours',
    tag: 'FLASHCARDS',
    tagTone: 'purple',
    accent: 'purple',
  },
  {
    title: 'Computer Networks',
    detail: 'Tomorrow at 2:00 PM · 1 hour',
    tag: 'QUIZ',
    tagTone: 'green',
    accent: 'green',
  },
  {
    title: 'Embedded Systems Design',
    detail: 'Wed at 10:00 AM · 90 min',
    tag: 'FLASHCARDS',
    tagTone: 'purple',
    accent: 'purple',
  },
]

function sessionAccentClasses(accent) {
  switch (accent) {
    case 'purple':
      return 'border-l-violet-500 bg-violet-950/35 text-white/90'
    case 'blue':
      return 'border-l-[#3B82F6] bg-[#1e3a5f]/35 text-white/90'
    case 'green':
      return 'border-l-emerald-500 bg-emerald-950/30 text-white/90'
    default:
      return 'border-l-amber-600 bg-amber-950/35 text-white/90'
  }
}

function rowAccentBar(accent) {
  switch (accent) {
    case 'purple':
      return 'bg-violet-500'
    case 'green':
      return 'bg-emerald-500'
    default:
      return 'bg-violet-500'
  }
}

function tagClasses(tone) {
  return tone === 'green'
    ? 'border border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
    : 'border border-violet-500/35 bg-violet-500/15 text-violet-200'
}

function startOfWeekMonday(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function fmtMonthDay(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtRange(monday) {
  const sunday = addDays(monday, 6)
  const y = sunday.getFullYear()
  return `${fmtMonthDay(monday)} – ${fmtMonthDay(sunday)}, ${y}`
}

function ScheduleBlock({ session }) {
  return (
    <div
      className={clsx(
        'rounded-md border-l-[3px] px-2 py-1.5 text-[11px] leading-tight shadow-sm',
        sessionAccentClasses(session.accent),
      )}
    >
      <div className="font-semibold text-white/95">{session.start}</div>
      <div className="mt-0.5 text-white/70">{session.label}</div>
    </div>
  )
}

export function StudentStudySchedulePage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()))
  const [listView, setListView] = useState(false)

  const days = useMemo(() => {
    return WEEKDAY_LABELS.map((label, i) => ({
      label,
      date: addDays(weekStart, i),
    }))
  }, [weekStart])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function prevWeek() {
    setWeekStart((ws) => addDays(ws, -7))
  }

  function nextWeek() {
    setWeekStart((ws) => addDays(ws, 7))
  }

  function goToday() {
    setWeekStart(startOfWeekMonday(new Date()))
  }

  const sessionsByDay = useMemo(() => {
    const map = Array.from({ length: 7 }, () => [])
    for (const s of WEEK_SESSIONS) {
      map[s.dayIndex].push(s)
    }
    return map
  }, [])

  const flatSessions = useMemo(() => {
    return WEEK_SESSIONS.map((s, i) => ({
      ...s,
      key: `${s.dayIndex}-${s.start}-${i}`,
      dayLabel: WEEKDAY_LABELS[s.dayIndex],
    }))
  }, [])

  return (
    <DashboardLayout userFallbackName="Student" navItems={STUDENT_NAV}>
      <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <PageTitle
          className="mb-0 min-w-0 flex-1"
          title="Study schedule"
          subtitle="Plan and track your learning sessions"
        />
        <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => setListView((v) => !v)}
            aria-pressed={listView}
            className={clsx(
              'inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-[13px] font-semibold transition',
              listView
                ? 'border-white/15 bg-white/8 text-white'
                : 'border-white/10 bg-[#151921] text-white/70 hover:border-white/15 hover:bg-white/5 hover:text-white',
            )}
          >
            <Icon name="list" />
            List view
          </button>
          <button
            type="button"
            className={clsx(
              'inline-flex h-10 items-center gap-2 rounded-lg bg-[#3B82F6] px-4 text-[13px] font-semibold text-white shadow-[0_14px_40px_-18px_rgba(59,130,246,0.75)] transition hover:bg-[#3276EA]',
              'focus:outline-none focus:ring-2 focus:ring-sky-500/40',
            )}
          >
            <Icon name="plus" className="text-white" />
            Add session
          </button>
        </div>
      </div>

      {!listView ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevWeek}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#151921] text-white/60 transition hover:border-white/15 hover:text-white"
                aria-label="Previous week"
              >
                <Icon name="chevLeft" />
              </button>
              <span className="min-w-[200px] px-2 text-center text-[13px] font-medium text-white/85 md:min-w-[240px]">
                {fmtRange(weekStart)}
              </span>
              <button
                type="button"
                onClick={nextWeek}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#151921] text-white/60 transition hover:border-white/15 hover:text-white"
                aria-label="Next week"
              >
                <Icon name="chevRight" />
              </button>
            </div>
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg border border-white/10 bg-[#151921] px-4 py-2 text-[12px] font-semibold text-white/75 transition hover:border-white/15 hover:bg-white/5 hover:text-white"
            >
              Today
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/6 bg-[#151921]/80">
            <div className="grid min-w-[720px] grid-cols-7 border-b border-white/6">
              {days.map(({ label, date }) => (
                <div
                  key={label}
                  className="border-r border-white/6 px-2 py-3 text-center last:border-r-0"
                >
                  <div className="text-[10px] font-semibold tracking-[0.14em] text-white/40">
                    {label}
                  </div>
                  <div className="mt-2 flex justify-center">
                    <span
                      className={clsx(
                        'flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums',
                        sameDay(date, today)
                          ? 'bg-[#3B82F6] text-white shadow-[0_0_0_3px_rgba(59,130,246,0.25)]'
                          : 'text-white/80',
                      )}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid min-h-[280px] min-w-[720px] grid-cols-7">
              {sessionsByDay.map((sessions, col) => (
                <div
                  key={col}
                  className="border-r border-white/6 p-2 last:border-r-0 md:min-h-[320px]"
                >
                  <div className="flex flex-col gap-2">
                    {sessions.map((s) => (
                      <ScheduleBlock key={`${s.dayIndex}-${s.start}-${s.label}`} session={s} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-white/6 bg-[#151921]/80">
          <div className="border-b border-white/6 px-4 py-3">
            <h2 className="text-[13px] font-semibold text-white/70">All sessions this week</h2>
          </div>
          <ul className="divide-y divide-white/6">
            {flatSessions.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={clsx(
                      'h-10 w-1 shrink-0 rounded-full',
                      s.accent === 'green' ? 'bg-emerald-500' : 'bg-violet-500',
                    )}
                  />
                  <div>
                    <div className="text-[14px] font-semibold text-white">{s.label}</div>
                    <div className="text-[12px] text-white/45">
                      {s.dayLabel} · {s.start}
                    </div>
                  </div>
                </div>
                <span
                  className={clsx(
                    'rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide',
                    s.accent === 'green'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-violet-500/15 text-violet-200',
                  )}
                >
                  {s.accent === 'green' ? 'LAB' : 'CLASS'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-serif text-[1.35rem] font-normal tracking-tight text-white md:text-[1.5rem]">
          Upcoming this week
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {UPCOMING.map((row) => (
            <div
              key={row.title}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/6 bg-[#151921] px-4 py-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={clsx(
                    'mt-0.5 h-12 w-1 shrink-0 rounded-full',
                    rowAccentBar(row.accent),
                  )}
                />
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-white">{row.title}</div>
                  <div className="mt-1 text-[13px] text-white/45">{row.detail}</div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <span
                  className={clsx(
                    'rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em]',
                    tagClasses(row.tagTone),
                  )}
                >
                  {row.tag}
                </span>
                <button
                  type="button"
                  className="rounded-lg border border-white/12 bg-transparent px-4 py-2 text-[12px] font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  )
}
