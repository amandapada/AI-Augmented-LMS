import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { apiFetch, formatApiError } from '../lib/apiClient'

const LETTERS = ['A', 'B', 'C', 'D']

export function StudentQuizPage() {
  const { handoutId, quizId } = useParams()
  const hid = Number(handoutId)
  const qid = Number(quizId)
  const navigate = useNavigate()
  const { accessToken } = useAuth()

  const [title, setTitle] = useState('')
  const [payload, setPayload] = useState(null)
  const [mcqAnswers, setMcqAnswers] = useState([])
  const [shortAnswers, setShortAnswers] = useState([])
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!accessToken || !Number.isFinite(qid) || !Number.isFinite(hid)) {
        await Promise.resolve()
        if (!cancelled) {
          setTitle('')
          setPayload(null)
          setMcqAnswers([])
          setShortAnswers([])
          setStep(0)
          setResult(null)
          setError('')
        }
        return
      }

      const d = await apiFetch(`/handouts/${hid}`, { token: accessToken })
      if (cancelled) return
      if (d.res.ok) setTitle(d.data?.title || 'Handout')

      const { res, data } = await apiFetch(`/quizzes/${qid}`, { token: accessToken })
      if (cancelled) return

      if (!res.ok) {
        setError(formatApiError(data, res.status, res.statusText))
        setPayload(null)
        return
      }
      setError('')
      setPayload(data)
      setMcqAnswers((data.mcq || []).map(() => ''))
      setShortAnswers((data.short_answer || []).map(() => ''))
      setStep(0)
      setResult(null)
    })()

    return () => {
      cancelled = true
    }
  }, [accessToken, hid, qid])

  const mcq = payload?.mcq || []
  const shorts = payload?.short_answer || []
  const totalSteps = mcq.length + shorts.length

  const phase = useMemo(() => {
    if (result) return 'done'
    if (step < mcq.length) return 'mcq'
    return 'short'
  }, [result, step, mcq.length])

  async function onSubmit() {
    if (!accessToken) return
    setSubmitting(true)
    setError('')
    try {
      const { res, data } = await apiFetch(`/quizzes/${qid}/submit`, {
        method: 'POST',
        token: accessToken,
        body: { mcq_answers: mcqAnswers, short_answers: shortAnswers },
      })
      if (!res.ok) throw new Error(formatApiError(data, res.status, res.statusText))
      setResult(data)
    } catch (e) {
      setError(e?.message || 'Submit failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const idxMcq = step
  const idxShort = step - mcq.length

  return (
    <div className="min-h-dvh bg-[#0B0E14] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(800px_500px_at_50%_0%,rgba(59,130,246,0.06),transparent_55%)]" />
      </div>

      <header className="relative border-b border-white/6 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(`/student/handouts/${hid}`)}
            className="inline-flex items-center gap-2 text-[12px] font-medium text-white/50 hover:text-white/80"
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
            Back
          </button>
          <div className="text-right text-[10px] font-bold tracking-[0.18em] text-white/35">QUIZ</div>
        </div>
        <div className="mx-auto mt-3 max-w-3xl">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/6">
            <div
              className="h-full rounded-full bg-emerald-500/90 transition-all"
              style={{
                width: `${result ? 100 : totalSteps ? Math.round(((step + 1) / totalSteps) * 100) : 0}%`,
              }}
            />
          </div>
          <h1 className="mt-4 font-serif text-[1.4rem] font-normal tracking-tight text-white md:text-[1.6rem]">
            {title}
          </h1>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-8">
        {error ? (
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-100/90">
            {error}
          </div>
        ) : null}

        {!payload ? (
          <p className="text-[13px] text-white/45">Loading quiz…</p>
        ) : result ? (
          <section className="space-y-6">
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-6 text-center">
              <div className="text-[11px] font-bold tracking-[0.2em] text-emerald-200/80">SCORE</div>
              <div className="mt-2 text-[2.5rem] font-semibold tabular-nums text-white">{result.score}%</div>
              <p className="mt-2 text-[12px] text-white/55">Based on multiple choice answers. Review short answers below.</p>
            </div>

            <div className="space-y-4">
              <h2 className="text-[11px] font-bold tracking-[0.18em] text-white/40">MCQ FEEDBACK</h2>
              {result.mcq_feedback?.map((f) => (
                <div
                  key={f.index}
                  className={clsx(
                    'rounded-xl border px-4 py-3 text-[13px]',
                    f.correct ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5',
                  )}
                >
                  <div className="font-semibold text-white/90">
                    Q{f.index + 1} — {f.correct ? 'Correct' : 'Incorrect'} (answer {f.correct_option})
                  </div>
                  <p className="mt-2 text-[12px] text-white/60">{f.explanation}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-[11px] font-bold tracking-[0.18em] text-white/40">SHORT ANSWER REFERENCE</h2>
              {result.short_answer_feedback?.map((f) => (
                <div
                  key={f.index}
                  className="rounded-xl border border-white/8 bg-[#12141D] px-4 py-3 text-[13px]"
                >
                  <div className="font-semibold text-white/90">Q{mcq.length + f.index + 1}</div>
                  <p className="mt-2 text-[12px] text-white/55">Your answer: {f.student_answer || '—'}</p>
                  <p className="mt-2 text-[12px] text-white/70">Sample: {f.sample_answer}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate(`/student/handouts/${hid}`)}
              className="w-full rounded-xl bg-[#3B82F6] py-3 text-[13px] font-semibold text-white hover:bg-[#3276EA]"
            >
              Back to handout
            </button>
          </section>
        ) : (
          <>
            <section className="space-y-6">
              {phase === 'mcq' && mcq[idxMcq] ? (
                <div className="rounded-2xl border border-white/8 bg-[#12141D] p-6">
                  <div className="text-[11px] font-bold text-[#3B82F6]">MULTIPLE CHOICE</div>
                  <h2 className="mt-2 text-[16px] font-semibold leading-snug text-white">
                    Q{idxMcq + 1}. {mcq[idxMcq].question}
                  </h2>
                  <div className="mt-5 grid gap-2">
                    {LETTERS.map((letter, i) => {
                      const opt = mcq[idxMcq].options[i]
                      if (!opt) return null
                      const selected = mcqAnswers[idxMcq] === letter
                      return (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => {
                            const next = [...mcqAnswers]
                            next[idxMcq] = letter
                            setMcqAnswers(next)
                          }}
                          className={clsx(
                            'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[13px] transition',
                            selected
                              ? 'border-[#3B82F6]/60 bg-[#3B82F6]/15 text-white'
                              : 'border-white/10 bg-white/2 text-white/80 hover:border-white/20',
                          )}
                        >
                          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/15 text-[11px] font-bold">
                            {letter}
                          </span>
                          <span>{opt}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {phase === 'short' && shorts[idxShort] ? (
                <div className="rounded-2xl border border-white/8 bg-[#12141D] p-6">
                  <div className="text-[11px] font-bold text-emerald-400/90">SHORT ANSWER</div>
                  <h2 className="mt-2 text-[16px] font-semibold leading-snug text-white">
                    Q{mcq.length + idxShort + 1}. {shorts[idxShort].question}
                  </h2>
                  <textarea
                    value={shortAnswers[idxShort] || ''}
                    onChange={(e) => {
                      const next = [...shortAnswers]
                      next[idxShort] = e.target.value
                      setShortAnswers(next)
                    }}
                    rows={5}
                    className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:border-[#3B82F6]/40 focus:outline-none"
                    placeholder="Type your answer…"
                  />
                </div>
              ) : null}
            </section>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={step <= 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="flex-1 rounded-xl border border-white/10 py-3 text-[13px] font-semibold text-white/70 hover:bg-white/5 disabled:opacity-30"
              >
                Previous
              </button>
              {step + 1 < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="flex-1 rounded-xl bg-[#3B82F6] py-3 text-[13px] font-semibold text-white hover:bg-[#3276EA]"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onSubmit}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-[13px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
                >
                  {submitting ? 'Submitting…' : 'Submit quiz'}
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
