import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { STUDENT_NAV } from '../config/studentNav'
import { useAuth } from '../context/useAuth'
import { getDetail as fetchHandoutDetail } from '../api/handouts.js'

function BackRow() {
  return (
    <Link
      to="/student"
      className="inline-flex items-center gap-2 text-[12px] font-medium text-[#3B82F6]/90 hover:text-[#3B82F6]"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
        <path
          d="M15 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Back to My Handouts
    </Link>
  )
}

function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase()
  const approved = s === 'approved'
  return (
    <span
      className={clsx(
        'rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-[0.12em]',
        approved
          ? 'border-emerald-500/40 text-emerald-400'
          : 'border-white/15 text-white/45',
      )}
    >
      {approved ? 'APPROVED' : s.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'}
    </span>
  )
}

function StudyModeCard({
  title,
  description,
  statLine,
  iconWrapClass,
  icon,
  buttonLabel,
  onAction,
  busy,
  disabled,
  bgIcon,
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#12141D] p-5 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.9)]">
      <div className="pointer-events-none absolute -right-4 -top-4 text-white/4" aria-hidden>
        {bgIcon}
      </div>
      <div
        className={clsx(
          'relative inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-white/10',
          iconWrapClass,
        )}
      >
        {icon}
      </div>
      <h3 className="relative mt-4 text-[15px] font-semibold text-white">{title}</h3>
      <p className="relative mt-2 text-[12px] leading-relaxed text-white/45">{description}</p>
      <p className="relative mt-3 text-[11px] text-white/50">{statLine}</p>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={onAction}
        className={clsx(
          'relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#3B82F6] py-2.5 text-[12px] font-semibold text-white',
          'shadow-[0_14px_40px_-18px_rgba(59,130,246,0.75)] transition hover:bg-[#3276EA]',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {busy ? 'Please wait…' : buttonLabel}
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <path
            d="M5 12h12M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </article>
  )
}

export function StudentHandoutDetailPage() {
  const { handoutId } = useParams()
  const id = Number(handoutId)
  const navigate = useNavigate()
  const { accessToken } = useAuth()

  const [detail, setDetail] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!accessToken || !Number.isFinite(id)) return
    let cancelled = false
    const ac = new AbortController()

    ;(async () => {
      try {
        await Promise.resolve()
        if (cancelled) return
        setLoadError('')
        const data = await fetchHandoutDetail(id, { accessToken, signal: ac.signal })
        if (!cancelled) setDetail(data)
      } catch (e) {
        if (cancelled) return
        if (ac.signal.aborted) return
        setLoadError(e?.message || 'Failed to load handout.')
        setDetail(null)
      }
    })()

    return () => {
      cancelled = true
      ac.abort()
    }
  }, [accessToken, id])

  const approved = String(detail?.status || '').toLowerCase() === 'approved'
  const topicTags = (detail?.topics || []).map((t) => t?.name).filter(Boolean)
  const created = detail?.created_at
    ? new Date(detail.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  const chunks = useMemo(() => {
    const rows = detail?.chunks
    if (!Array.isArray(rows)) return []
    return rows
      .map((c) => ({
        id: c?.id,
        text: typeof c?.text === 'string' ? c.text : '',
        confidence: Number(c?.confidence),
        page_number: c?.page_number,
      }))
      .filter((c) => c.text)
  }, [detail])

  const hasPdf = Boolean(detail?.file_url && typeof detail.file_url === 'string')
  const overallConfidence =
    Number.isFinite(Number(detail?.confidence)) ? Number(detail.confidence) : null

  return (
    <DashboardLayout userFallbackName="Student" navItems={STUDENT_NAV}>
      <div className="mx-auto max-w-[1100px] space-y-8">
        <BackRow />

        {loadError ? (
          <div
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-100/90"
            role="alert"
          >
            {loadError}
          </div>
        ) : null}

        {!detail ? (
          <div className="text-[13px] text-white/45">Loading handout…</div>
        ) : (
          <>
            <header className="flex flex-col gap-4 border-b border-white/6 pb-8 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 space-y-3">
                <h1 className="font-serif text-[1.75rem] font-normal tracking-tight text-white md:text-[2rem]">
                  {detail.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-[12px] text-white/50">
                  <span>{created}</span>
                  <StatusBadge status={detail.status} />
                  {overallConfidence != null ? (
                    <>
                      <span className="text-white/25">•</span>
                      <span className="tabular-nums">
                        Confidence {Math.round(overallConfidence * 100)}%
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              {topicTags.length ? (
                <div className="flex flex-wrap justify-end gap-2">
                  {topicTags.slice(0, 6).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 bg-white/3 px-3 py-1 text-[11px] font-medium text-white/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </header>

            <section>
              <h2 className="text-[10px] font-bold tracking-[0.2em] text-white/35">STUDY MODES</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <StudyModeCard
                  title="AI Chat"
                  description="Ask questions and get instant explanations based on this handout."
                  statLine="Unlimited access"
                  iconWrapClass="bg-[#1e2634] text-orange-400"
                  disabled={!approved}
                  onAction={() => navigate(`/student/handouts/${id}/chat`)}
                  buttonLabel="Open Chat"
                  bgIcon={
                    <svg viewBox="0 0 24 24" fill="none" className="h-28 w-28">
                      <path
                        d="M7 18l-3 3V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7Z"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </svg>
                  }
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                      <path
                        d="M7 18l-3 3V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                />
                <article className="rounded-2xl border border-white/8 bg-[#12141D] p-5">
                  <div className="text-[10px] font-bold tracking-[0.2em] text-white/35">
                    FILE
                  </div>
                  <p className="mt-3 text-[12px] leading-relaxed text-white/55">
                    Open the original document (PDF/image) provided by your lecturer.
                  </p>
                  <button
                    type="button"
                    disabled={!hasPdf}
                    onClick={() => {
                      const url = detail?.file_url
                      if (typeof url === 'string' && url) window.open(url, '_blank', 'noopener,noreferrer')
                    }}
                    className={clsx(
                      'mt-5 inline-flex w-full items-center justify-center rounded-lg py-2.5 text-[12px] font-semibold',
                      hasPdf
                        ? 'bg-[#151921] text-white/80 ring-1 ring-white/8 hover:bg-[#1b2230]'
                        : 'bg-[#0f131b] text-white/25 ring-1 ring-white/6 cursor-not-allowed',
                    )}
                  >
                    Open file
                  </button>
                </article>
              </div>
              {!approved ? (
                <p className="mt-3 text-[12px] text-white/40">
                  Study modes unlock when this handout is approved for students.
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-white/8 bg-[#12141D] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[12px] font-semibold text-white/85">Extracted text chunks</h2>
                <div className="text-[11px] text-white/45">
                  {chunks.length ? `${chunks.length} chunk(s)` : 'No extracted text yet'}
                </div>
              </div>

              {chunks.length ? (
                <div className="mt-4 space-y-3">
                  {chunks.slice(0, 6).map((c) => (
                    <div key={c.id ?? c.text.slice(0, 24)} className="rounded-xl border border-white/8 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3 text-[11px] text-white/45">
                        <div className="tabular-nums">
                          {c.page_number != null ? `Page ${c.page_number}` : '—'}
                        </div>
                        <div className="tabular-nums">
                          {Number.isFinite(c.confidence) ? `Conf ${Math.round(c.confidence * 100)}%` : ''}
                        </div>
                      </div>
                      <pre className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-white/70">
                        {c.text}
                      </pre>
                    </div>
                  ))}
                  {chunks.length > 6 ? (
                    <div className="text-[11px] text-white/45">
                      Showing 6 of {chunks.length} chunks.
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-[12px] text-white/45">
                  This handout doesn&apos;t have extracted text available yet.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
