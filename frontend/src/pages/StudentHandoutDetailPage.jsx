import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { STUDENT_NAV } from '../config/studentNav'
import { useAuth } from '../context/useAuth'
import { apiFetch, formatApiError } from '../lib/apiClient'

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
  const [flashcards, setFlashcards] = useState([])
  const [quizMeta, setQuizMeta] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [busyKey, setBusyKey] = useState('')

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!accessToken || !Number.isFinite(id)) {
        await Promise.resolve()
        if (!cancelled) {
          setDetail(null)
          setFlashcards([])
          setQuizMeta(null)
          setLoadError('')
        }
        return
      }

      const { res, data } = await apiFetch(`/handouts/${id}`, { token: accessToken })
      if (cancelled) return
      if (!res.ok) {
        setLoadError(formatApiError(data, res.status, res.statusText))
        setDetail(null)
        return
      }
      setLoadError('')
      setDetail(data)

      const fc = await apiFetch(`/handouts/${id}/flashcards`, { token: accessToken })
      if (cancelled) return
      if (fc.res.ok) setFlashcards(fc.data || [])
      else setFlashcards([])

      const qz = await apiFetch(`/handouts/${id}/quiz`, { token: accessToken })
      if (cancelled) return
      if (qz.res.ok) setQuizMeta(qz.data)
      else setQuizMeta(null)
    })()

    return () => {
      cancelled = true
    }
  }, [accessToken, id])

  async function ensureFlashcardsThenGo() {
    if (!accessToken) return
    setBusyKey('fc')
    try {
      let list = flashcards
      if (!list.length) {
        const gen = await apiFetch(`/handouts/${id}/generate-flashcards`, {
          method: 'POST',
          token: accessToken,
        })
        if (!gen.res.ok) throw new Error(formatApiError(gen.data, gen.res.status, gen.res.statusText))
        list = gen.data?.flashcards || []
        setFlashcards(list)
      }
      if (!list.length) throw new Error('No flashcards available yet.')
      navigate(`/student/handouts/${id}/flashcards`)
    } catch (e) {
      setLoadError(e?.message || 'Could not start flashcards.')
    } finally {
      setBusyKey('')
    }
  }

  async function ensureQuizThenGo() {
    if (!accessToken) return
    setBusyKey('qz')
    try {
      let meta = quizMeta
      if (!meta?.quiz_id) {
        const gen = await apiFetch(`/handouts/${id}/generate-quiz`, {
          method: 'POST',
          token: accessToken,
        })
        if (!gen.res.ok) throw new Error(formatApiError(gen.data, gen.res.status, gen.res.statusText))
        meta = gen.data
        setQuizMeta(meta)
      }
      if (!meta?.quiz_id) throw new Error('No quiz available.')
      navigate(`/student/handouts/${id}/quiz/${meta.quiz_id}`)
    } catch (e) {
      setLoadError(e?.message || 'Could not start quiz.')
    } finally {
      setBusyKey('')
    }
  }

  const approved = String(detail?.status || '').toLowerCase() === 'approved'
  const topicTags = (detail?.topics || []).map((t) => t.name).filter(Boolean)
  const created = detail?.created_at
    ? new Date(detail.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  const quizCount =
    quizMeta?.quiz?.mcq?.length != null && quizMeta?.quiz?.short_answer?.length != null
      ? quizMeta.quiz.mcq.length + quizMeta.quiz.short_answer.length
      : null

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
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#3B82F6] text-[11px] font-bold text-white">
                    IN
                  </span>
                  <span>Instructor</span>
                  <span className="text-white/25">•</span>
                  <span>{created}</span>
                  <StatusBadge status={detail.status} />
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
                  title="Flashcards"
                  description="Master key definitions and concepts through active recall."
                  statLine={`${flashcards.length || '—'} flashcards`}
                  iconWrapClass="bg-[#1e2634] text-[#3B82F6]"
                  busy={busyKey === 'fc'}
                  disabled={!approved}
                  onAction={ensureFlashcardsThenGo}
                  buttonLabel="Start Session"
                  bgIcon={
                    <svg viewBox="0 0 24 24" fill="none" className="h-28 w-28" strokeWidth="1">
                      <path
                        d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                        stroke="currentColor"
                      />
                    </svg>
                  }
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                      <path
                        d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                      <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                    </svg>
                  }
                />
                <StudyModeCard
                  title="Quiz"
                  description="Test your knowledge with AI-generated multiple choice questions."
                  statLine={`${quizCount != null ? quizCount : 7} questions`}
                  iconWrapClass="bg-[#1e2634] text-emerald-400"
                  busy={busyKey === 'qz'}
                  disabled={!approved}
                  onAction={ensureQuizThenGo}
                  buttonLabel="Start Quiz"
                  bgIcon={
                    <svg viewBox="0 0 24 24" fill="none" className="h-28 w-28">
                      <path
                        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </svg>
                  }
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                      <path
                        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M9 12l2 2 4-4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                />
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
              </div>
              {!approved ? (
                <p className="mt-3 text-[12px] text-white/40">
                  Study modes unlock when this handout is approved for students.
                </p>
              ) : null}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
