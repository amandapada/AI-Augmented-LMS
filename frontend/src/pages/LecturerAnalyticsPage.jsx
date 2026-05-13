import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { LECTURER_NAV } from '../config/lecturerNav'
import { overview as fetchOverview } from '../api/analytics.js'
import { useAuth } from '../context/useAuth'

function Icon({ name, className }) {
  const common = 'h-4 w-4'
  switch (name) {
    case 'calendar':
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
            d="M7.5 11h4.5M7.5 14.5h7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'download':
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
            d="M8 10l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 17v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'chevron':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M7 10l5 5 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'trend-up':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M4 16l6-6 4 4 6-8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'trend-down':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M4 8l6 6 4-4 6 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return null
  }
}

function Card({ title, children, className }) {
  return (
    <section
      className={clsx(
        'rounded-lg border border-white/6 bg-[#151921] shadow-sm',
        className,
      )}
    >
      <div className="px-5 pt-5 text-sm font-semibold text-white/90">
        {title}
      </div>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </section>
  )
}

function buildPath(points, width, height, padding) {
  if (!points.length) return ''
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = Math.max(1, max - min)

  const xStep = (width - padding * 2) / Math.max(1, points.length - 1)
  const toX = (i) => padding + i * xStep
  const toY = (v) => {
    const t = (v - min) / range
    return height - padding - t * (height - padding * 2)
  }

  const coords = points.map((v, i) => [toX(i), toY(v)])
  const d = coords
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')

  const area = `M ${coords[0][0].toFixed(2)} ${(height - padding).toFixed(
    2,
  )} ${coords
    .map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')} L ${coords[coords.length - 1][0].toFixed(2)} ${(height - padding).toFixed(2)} Z`

  return { d, area, coords, min, max }
}

function LineChart({ points, labels }) {
  const width = 980
  const height = 240
  const padding = 34

  const built = useMemo(
    () => buildPath(points, width, height, padding),
    [points],
  )

  const yTicks = useMemo(() => {
    const min = Math.floor(built.min / 5) * 5
    const max = Math.ceil(built.max / 5) * 5
    const steps = 5
    const out = []
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps
      out.push(Math.round(min + (max - min) * t))
    }
    return out
  }, [built.max, built.min])

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
          {/* spacer */}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
          <span className="inline-flex h-2 w-2 rounded-full bg-[#3B82F6]" />
          Average Score
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-md">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[240px] w-full"
          role="img"
          aria-label="Quiz score trends"
        >
          <defs>
            <linearGradient id="abuLine" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#3B82F6" stopOpacity="0.35" />
              <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {yTicks.map((t) => {
            const y =
              height -
              padding -
              ((t - built.min) / Math.max(1, built.max - built.min)) *
                (height - padding * 2)
            return (
              <g key={t}>
                <line
                  x1={padding}
                  x2={width - padding}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <text
                  x={10}
                  y={y + 4}
                  fill="rgba(255,255,255,0.35)"
                  fontSize="10"
                  fontWeight="600"
                >
                  {t}
                </text>
              </g>
            )
          })}

          <path d={built.area} fill="url(#abuLine)" />
          <path
            d={built.d}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {built.coords.map(([x, y], idx) => (
            <g key={idx}>
              <circle cx={x} cy={y} r="4" fill="#0B0E14" />
              <circle cx={x} cy={y} r="3" fill="#3B82F6" opacity="0.9" />
            </g>
          ))}

          {labels.map((l, idx) => {
            const x =
              padding +
              (idx * (width - padding * 2)) / Math.max(1, labels.length - 1)
            return (
              <text
                key={l}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fill="rgba(255,255,255,0.35)"
                fontSize="10"
                fontWeight="600"
              >
                {l}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function Donut({ segments, totalLabel }) {
  const size = 240
  const stroke = 18
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-[240px] w-[240px]"
        role="img"
        aria-label="Feature usage"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {segments.reduce(
          (acc, s) => {
            const dash = (s.value / 100) * c
            const offset = acc.offset
            acc.elements.push(
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeLinecap="butt"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                opacity="0.95"
              />,
            )
            acc.offset += dash
            return acc
          },
          { offset: 0, elements: [] },
        ).elements}

        <text
          x="50%"
          y="49%"
          textAnchor="middle"
          fill="rgba(255,255,255,0.9)"
          fontSize="22"
          fontWeight="700"
        >
          {totalLabel}
        </text>
        <text
          x="50%"
          y="58%"
          textAnchor="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize="10"
          fontWeight="700"
          letterSpacing="2"
        >
          TOTAL EVENTS
        </text>
      </svg>

      <div className="mt-4 grid w-full grid-cols-3 gap-3">
        {segments.map((s) => (
          <div
            key={s.label}
            className="rounded-md border border-white/6 bg-[#0f131b] px-3 py-3 text-center"
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
              {s.label}
            </div>
            <div
              className="mt-2 text-[12px] font-semibold tabular-nums"
              style={{ color: s.color }}
            >
              {s.value}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LecturerAnalyticsPage() {
  const [range, setRange] = useState('Last 30 Days')
  const { accessToken } = useAuth()
  const [overview, setOverview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!accessToken) {
      setLoadError('You are not signed in.')
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setLoadError('')

    ;(async () => {
      try {
        const data = await fetchOverview({ accessToken })
        if (cancelled) return
        setOverview(data)
      } catch (e) {
        if (cancelled) return
        setLoadError(e?.message || 'Failed to load analytics.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  const visibleTrends = useMemo(() => {
    const rows = overview?.quiz_trends
    if (!Array.isArray(rows)) return []
    const windowSize = range === 'Last 7 Days' ? 7 : 30
    return rows.slice(-windowSize)
  }, [overview, range])

  const trendLabels = useMemo(() => {
    if (visibleTrends.length === 0) return []
    return visibleTrends.map((p) => String(p.day))
  }, [visibleTrends])

  const trendPoints = useMemo(() => {
    if (visibleTrends.length === 0) return []
    return visibleTrends.map((p) => {
      const v = Number(p.avg_score)
      if (!Number.isFinite(v)) return 0
      return Math.max(0, Math.min(100, v))
    })
  }, [visibleTrends])

  const topicRows = useMemo(() => {
    const rows = overview?.weakest_topics
    if (!Array.isArray(rows) || rows.length === 0) return []
    return rows.slice(0, 10).map((r) => {
      const avg = Number(r.avg_score)
      const attempts = Number(r.attempts)
      return {
        topic: String(r.topic || 'Unknown'),
        avg: Number.isFinite(avg) ? Math.round(avg) : 0,
        attempts: Number.isFinite(attempts) ? attempts.toLocaleString() : '0',
        trend: avg >= 60 ? 'up' : 'down',
      }
    })
  }, [overview])

  const featureSegments = useMemo(() => {
    const usage = overview?.feature_usage
    if (!usage || typeof usage !== 'object') return []
    const flashcards = Number(usage.flashcards) || 0
    const quizzes = Number(usage.quizzes) || 0
    const chats = Number(usage.chats) || 0
    const total = Math.max(1, flashcards + quizzes + chats)
    const pct = (v) => Math.round((v / total) * 100)
    return [
      { label: 'Flashcards', value: pct(flashcards), color: '#3B82F6' },
      { label: 'Quizzes', value: pct(quizzes), color: '#F59E0B' },
      { label: 'AI Chat', value: pct(chats), color: '#10B981' },
    ]
  }, [overview])

  const totalEvents = useMemo(() => {
    const usage = overview?.feature_usage
    if (!usage || typeof usage !== 'object') return 0
    const flashcards = Number(usage.flashcards) || 0
    const quizzes = Number(usage.quizzes) || 0
    const chats = Number(usage.chats) || 0
    return flashcards + quizzes + chats
  }, [overview])

  const totalEventsLabel = useMemo(() => {
    const usage = overview?.feature_usage
    if (!usage || typeof usage !== 'object') return '0'
    const flashcards = Number(usage.flashcards) || 0
    const quizzes = Number(usage.quizzes) || 0
    const chats = Number(usage.chats) || 0
    return (flashcards + quizzes + chats).toLocaleString()
  }, [overview])

  function onExportCsv() {
    const rows = [
      ['Topic', 'AvgScore', 'Attempts', 'Trend'],
      ...topicRows.map((r) => [r.topic, String(r.avg), r.attempts, r.trend]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lecturer-analytics.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout userFallbackName="Lecturer" navItems={LECTURER_NAV}>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Analytics
            </h1>
            <p className="mt-1 text-[13px] text-white/45">
              Track student engagement and learning outcomes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-white/8 bg-[#151921] px-3 text-[12px] font-semibold text-white/75 hover:bg-[#1b2230] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              onClick={() =>
                setRange((r) => (r === 'Last 30 Days' ? 'Last 7 Days' : 'Last 30 Days'))
              }
            >
              <Icon name="calendar" className="text-white/55" />
              {range}
              <Icon name="chevron" className="text-white/45" />
            </button>

            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-white/8 bg-[#151921] px-3 text-[12px] font-semibold text-white/75 hover:bg-[#1b2230] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              onClick={onExportCsv}
            >
              <Icon name="download" className="text-white/55" />
              Export CSV
            </button>
          </div>
        </header>

        {loadError ? (
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-[12px] text-red-100/90">
            {loadError}
          </div>
        ) : null}

        <Card title="Quiz Score Trends">
          {isLoading ? (
            <div className="text-[12px] text-white/55">Loading…</div>
          ) : trendPoints.length ? (
            <LineChart points={trendPoints} labels={trendLabels} />
          ) : (
            <div className="text-[12px] text-white/55">No quiz trend data yet.</div>
          )}
        </Card>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Topic Performance">
            <div className="grid grid-cols-[1fr_110px_110px_70px] gap-2 border-b border-white/6 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
              <div>Topic</div>
              <div className="text-center">Avg score</div>
              <div className="text-center">Attempts</div>
              <div className="text-right">Trend</div>
            </div>

            {isLoading ? (
              <div className="text-[12px] text-white/55">Loading…</div>
            ) : topicRows.length ? (
              <div className="divide-y divide-white/6">
                {topicRows.map((r) => (
                  <div
                    key={r.topic}
                    className="grid grid-cols-[1fr_110px_110px_70px] items-center gap-2 py-4 text-[12px]"
                  >
                    <div className="text-white/75">{r.topic}</div>
                    <div
                      className={clsx(
                        'text-center font-semibold tabular-nums',
                        r.avg < 50
                          ? 'text-[#EF4444]'
                          : r.avg >= 70
                            ? 'text-[#10B981]'
                            : 'text-white/80',
                      )}
                    >
                      {r.avg}%
                    </div>
                    <div className="text-center tabular-nums text-white/55">
                      {r.attempts}
                    </div>
                    <div className="flex justify-end">
                      <span
                        className={clsx(
                          'inline-flex items-center justify-center',
                          r.trend === 'up' ? 'text-[#10B981]' : 'text-[#EF4444]',
                        )}
                        title={r.trend === 'up' ? 'Improving' : 'Declining'}
                      >
                        <Icon name={r.trend === 'up' ? 'trend-up' : 'trend-down'} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-white/55">No topic performance data yet.</div>
            )}
          </Card>

          <Card title="Feature Usage">
            {isLoading ? (
              <div className="text-[12px] text-white/55">Loading…</div>
            ) : totalEvents > 0 ? (
              <Donut segments={featureSegments} totalLabel={totalEventsLabel} />
            ) : (
              <div className="text-[12px] text-white/55">
                No activity yet.
              </div>
            )}
          </Card>
        </section>
      </div>
    </DashboardLayout>
  )
}
