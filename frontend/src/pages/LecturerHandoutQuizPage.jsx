import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { LECTURER_NAV } from '../config/lecturerNav'
import { useAuth } from '../context/useAuth'
import { generate as generateQuiz, latestForHandout } from '../api/quizzes.js'
import { getDetail as getHandoutDetail } from '../api/handouts.js'

function BackRow() {
  return (
    <Link
      to="/lecturer"
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
      Back to Dashboard
    </Link>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="text-[10px] font-bold tracking-[0.2em] text-white/35">{children}</div>
  )
}

export function LecturerHandoutQuizPage() {
  const { handoutId } = useParams()
  const id = Number(handoutId)
  const { accessToken } = useAuth()

  const [title, setTitle] = useState('Handout')
  const [quizId, setQuizId] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!accessToken || !Number.isFinite(id)) return
    let cancelled = false
    const ac = new AbortController()

    ;(async () => {
      try {
        await Promise.resolve()
        if (cancelled) return
        setError('')
        setLoading(true)

        const d = await getHandoutDetail(id, { accessToken, signal: ac.signal })
        if (!cancelled) setTitle(d?.title || 'Handout')

        const latest = await latestForHandout(id, { accessToken, signal: ac.signal })
        if (cancelled) return
        const qid = Number(latest?.quiz_id)
        setQuizId(Number.isFinite(qid) ? qid : null)
        setQuiz(latest?.quiz || null)
      } catch (e) {
        // If no quiz exists yet, backend may return 404; treat as empty state.
        const msg = e?.message || ''
        if (/no quiz exists/i.test(msg) || /404/.test(msg)) {
          setQuizId(null)
          setQuiz(null)
          setError('')
        } else {
          setError(e?.message || 'Failed to load quiz.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      ac.abort()
    }
  }, [accessToken, id])

  const counts = useMemo(() => {
    const mcq = Array.isArray(quiz?.mcq) ? quiz.mcq.length : 0
    const sa = Array.isArray(quiz?.short_answer) ? quiz.short_answer.length : 0
    return { mcq, sa, total: mcq + sa }
  }, [quiz])

  async function onGenerate() {
    if (!accessToken || !Number.isFinite(id) || busy) return
    setBusy(true)
    try {
      const res = await generateQuiz(id, { accessToken })
      const qid = Number(res?.quiz_id)
      setQuizId(Number.isFinite(qid) ? qid : null)
      setQuiz(res?.quiz || null)
      setError('')
    } catch (e) {
      setError(e?.message || 'Failed to generate quiz.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardLayout userFallbackName="Lecturer" navItems={LECTURER_NAV}>
      <div className="mx-auto max-w-5xl space-y-6">
        <BackRow />

        <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-white/6 bg-[#151921] p-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Quiz
            </div>
            <h1 className="mt-2 text-[18px] font-semibold tracking-tight text-white/90">{title}</h1>
            <p className="mt-2 text-[12px] text-white/55">
              {quizId ? `Quiz #${quizId} • ` : ''}
              {counts.total ? `${counts.total} question(s)` : 'No quiz yet'}
            </p>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={busy}
            className={clsx(
              'inline-flex h-10 items-center justify-center rounded-lg px-4 text-[12px] font-semibold',
              'focus:outline-none focus:ring-2 focus:ring-sky-500/20',
              busy
                ? 'bg-[#0f131b] text-white/35 ring-1 ring-white/6 cursor-not-allowed'
                : 'bg-[#10B981] text-white hover:bg-[#0FA574]',
            )}
          >
            {busy ? 'Generating…' : quizId ? 'Regenerate' : 'Generate'}
          </button>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-100/90">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="text-[12px] text-white/55">Loading…</div>
        ) : quiz ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/8 bg-[#12141D] p-6">
              <SectionTitle>MULTIPLE CHOICE</SectionTitle>
              <div className="mt-4 space-y-4">
                {(quiz.mcq || []).map((q, idx) => (
                  <div key={idx} className="rounded-xl border border-white/8 bg-black/20 p-4">
                    <div className="text-[12px] font-semibold text-white/85">
                      {idx + 1}. {q.question}
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-[12px] text-white/70 md:grid-cols-2">
                      {(q.options || []).map((opt, i) => (
                        <div key={i} className="rounded-lg border border-white/8 bg-white/2 px-3 py-2">
                          <span className="font-semibold text-white/80">
                            {String.fromCharCode(65 + i)}.
                          </span>{' '}
                          {opt}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-[11px] text-white/55">
                      Correct: <span className="font-semibold text-emerald-300/90">{q.correct}</span>
                    </div>
                    {q.explanation ? (
                      <div className="mt-2 text-[11px] leading-relaxed text-white/55">
                        {q.explanation}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/8 bg-[#12141D] p-6">
              <SectionTitle>SHORT ANSWER</SectionTitle>
              <div className="mt-4 space-y-4">
                {(quiz.short_answer || []).map((q, idx) => (
                  <div key={idx} className="rounded-xl border border-white/8 bg-black/20 p-4">
                    <div className="text-[12px] font-semibold text-white/85">
                      {idx + 1}. {q.question}
                    </div>
                    {q.sample_answer ? (
                      <div className="mt-3 text-[12px] text-white/70">
                        <span className="text-white/50">Sample answer:</span> {q.sample_answer}
                      </div>
                    ) : null}
                    {Array.isArray(q.key_points) && q.key_points.length ? (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-[12px] text-white/65">
                        {q.key_points.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/6 bg-white/2 p-6 text-[13px] text-white/60">
            No quiz exists yet. Click “Generate” to create a quiz for this handout.
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

