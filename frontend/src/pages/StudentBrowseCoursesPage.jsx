import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { STUDENT_NAV } from '../config/studentNav'

function PageTitle({ title, subtitle, className }) {
  return (
    <header className={clsx('mb-8', className)}>
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
    case 'search':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden
        >
          <path
            d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15ZM21 21l-4.35-4.35"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'layers':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden
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
        </svg>
      )
    case 'clock':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden
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
    case 'calendar':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden
        >
          <path
            d="M8 3v3M16 3v3M5 9h14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6 7h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9 14h2M13 14h2M9 18h6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )
    default:
      return null
  }
}

const DEPARTMENTS = ['All departments', 'Computer Engineering', 'Electrical Engineering']
const LEVELS = ['All levels', 'Undergraduate', 'Graduate']
const STATUSES = ['All statuses', 'Available', 'Enrolled', 'Completed']

const MOCK_COURSES = [
  {
    code: 'COEN 451',
    title: 'Digital Image Processing',
    instructor: 'Dr. Ahmed Ibrahim',
    credits: 18,
    hours: 12,
    materials: 32,
    status: 'enrolled',
    dept: 'Computer Engineering',
    level: 'Undergraduate',
  },
  {
    code: 'COEN 432',
    title: 'Computer Networks',
    instructor: 'Dr. Sarah Johnson',
    credits: 15,
    hours: 10,
    materials: 28,
    status: 'available',
    dept: 'Computer Engineering',
    level: 'Undergraduate',
  },
  {
    code: 'EEEN 501',
    title: 'Advanced Signal Processing',
    instructor: 'Dr. Michael Chen',
    credits: 12,
    hours: 9,
    materials: 24,
    status: 'completed',
    dept: 'Electrical Engineering',
    level: 'Graduate',
  },
  {
    code: 'COEN 420',
    title: 'Embedded Systems Design',
    instructor: 'Dr. Emily Rodriguez',
    credits: 16,
    hours: 11,
    materials: 40,
    status: 'available',
    dept: 'Computer Engineering',
    level: 'Undergraduate',
  },
  {
    code: 'COEN 415',
    title: 'Database Systems',
    instructor: 'Dr. James Wilson',
    credits: 14,
    hours: 10,
    materials: 22,
    status: 'enrolled',
    dept: 'Computer Engineering',
    level: 'Undergraduate',
  },
  {
    code: 'EEEN 410',
    title: 'Control Systems',
    instructor: 'Dr. Patricia Adebayo',
    credits: 13,
    hours: 9,
    materials: 19,
    status: 'available',
    dept: 'Electrical Engineering',
    level: 'Undergraduate',
  },
]

function StatusBadge({ status }) {
  const cfg =
    status === 'enrolled'
      ? 'border-[#3B82F6]/35 bg-[#3B82F6]/15 text-[#60A5FA]'
      : status === 'available'
        ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-400'
        : 'border-violet-500/35 bg-violet-500/15 text-violet-300'

  const label =
    status === 'enrolled'
      ? 'ENROLLED'
      : status === 'available'
        ? 'AVAILABLE'
        : 'COMPLETED'

  return (
    <span
      className={clsx(
        'rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide',
        cfg,
      )}
    >
      {label}
    </span>
  )
}

function CourseCard({ course }) {
  const cta =
    course.status === 'enrolled' ? (
      <button
        type="button"
        className={clsx(
          'mt-5 w-full rounded-lg border border-[#3B82F6]/50 bg-transparent py-2.5 text-[13px] font-semibold text-[#60A5FA]',
          'transition hover:border-[#3B82F6]/70 hover:bg-[#3B82F6]/10',
          'focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30',
        )}
      >
        Continue learning
      </button>
    ) : course.status === 'available' ? (
      <button
        type="button"
        className={clsx(
          'mt-5 w-full rounded-lg bg-[#3B82F6] py-2.5 text-[13px] font-semibold text-white shadow-[0_14px_40px_-18px_rgba(59,130,246,0.75)]',
          'transition hover:bg-[#3276EA] focus:outline-none focus:ring-2 focus:ring-sky-500/40',
        )}
      >
        Enroll now
      </button>
    ) : (
      <button
        type="button"
        className={clsx(
          'mt-5 w-full rounded-lg border border-violet-500/35 bg-violet-500/10 py-2.5 text-[13px] font-semibold text-violet-200',
          'transition hover:bg-violet-500/15 focus:outline-none focus:ring-2 focus:ring-violet-500/25',
        )}
      >
        View summary
      </button>
    )

  return (
    <article className="flex flex-col rounded-xl border border-white/6 bg-[#151921] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-semibold tracking-wide text-white/55">
          {course.code}
        </span>
        <StatusBadge status={course.status} />
      </div>
      <h2 className="mt-4 text-[17px] font-semibold leading-snug tracking-tight text-white">
        {course.title}
      </h2>
      <p className="mt-1.5 text-[13px] text-white/45">{course.instructor}</p>
      <div className="mt-4 flex flex-wrap items-center gap-5 text-[12px] text-white/50">
        <span className="inline-flex items-center gap-2 tabular-nums">
          <Icon name="layers" className="text-white/35" />
          {course.credits}
        </span>
        <span className="inline-flex items-center gap-2 tabular-nums">
          <Icon name="clock" className="text-white/35" />
          {course.hours}
        </span>
        <span className="inline-flex items-center gap-2 tabular-nums">
          <Icon name="calendar" className="text-white/35" />
          {course.materials}
        </span>
      </div>
      {cta}
    </article>
  )
}

function SelectFilter({ value, onChange, options }) {
  return (
    <div className="relative min-w-[140px] flex-1 md:flex-none md:min-w-[160px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'h-11 w-full appearance-none rounded-lg border border-white/10 bg-[#151921] pr-9 pl-3 text-[13px] text-white/80',
          'outline-none transition hover:border-white/15 focus:border-[#3B82F6]/50 focus:ring-2 focus:ring-[#3B82F6]/20',
        )}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/35">
        ▾
      </span>
    </div>
  )
}

export function StudentBrowseCoursesPage() {
  const [q, setQ] = useState('')
  const [dept, setDept] = useState(DEPARTMENTS[0])
  const [level, setLevel] = useState(LEVELS[0])
  const [statusFilter, setStatusFilter] = useState(STATUSES[0])

  const filtered = useMemo(() => {
    return MOCK_COURSES.filter((c) => {
      const hay = `${c.code} ${c.title} ${c.instructor}`.toLowerCase()
      if (q.trim() && !hay.includes(q.trim().toLowerCase())) return false
      if (dept !== DEPARTMENTS[0] && c.dept !== dept) return false
      if (level !== LEVELS[0] && c.level !== level) return false
      if (statusFilter !== STATUSES[0]) {
        const want = statusFilter.toLowerCase()
        if (c.status !== want) return false
      }
      return true
    })
  }, [q, dept, level, statusFilter])

  return (
    <DashboardLayout userFallbackName="Student" navItems={STUDENT_NAV}>
      <PageTitle
        title="Browse courses"
        subtitle="Discover and enroll in available courses"
      />

      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="relative min-w-0 flex-1 lg:max-w-xl">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
          />
          <input
            type="search"
            placeholder="Search courses..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={clsx(
              'h-11 w-full rounded-lg border border-white/10 bg-[#151921] py-2 pr-3 pl-10 text-[13px] text-white placeholder:text-white/35',
              'outline-none transition hover:border-white/15 focus:border-[#3B82F6]/50 focus:ring-2 focus:ring-[#3B82F6]/20',
            )}
          />
        </div>
        <div className="flex flex-wrap gap-3 md:flex-nowrap">
          <SelectFilter value={dept} onChange={setDept} options={DEPARTMENTS} />
          <SelectFilter value={level} onChange={setLevel} options={LEVELS} />
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUSES}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2 xl:gap-6">
        {filtered.map((course) => (
          <CourseCard key={course.code} course={course} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-[13px] text-white/45">
          No courses match your filters.
        </p>
      ) : null}
    </DashboardLayout>
  )
}
