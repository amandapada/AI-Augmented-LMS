import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { apiFetch, formatApiError } from '../lib/apiClient'

const DIFFICULTY_MAP = {
  1: 'hard',
  2: 'good',
  3: 'easy',
}

export function StudentFlashcardSessionPage() {
  const { handoutId } = useParams()
  const id = Number(handoutId)
  const navigate = useNavigate()
  const { accessToken } = useAuth()

  const [title, setTitle] = useState('')
  const [cards, setCards] = useState([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!accessToken || !Number.isFinite(id)) {
        await Promise.resolve()
        if (!cancelled) {
          setTitle('')
          setCards([])
          setIndex(0)
          setFlipped(false)
          setError('')
        }
        return
      }

      const d = await apiFetch(`/handouts/${id}`, { token: accessToken })
      if (cancelled) return
      if (d.res.ok) setTitle(d.data?.title || 'Handout')

      const { res, data } = await apiFetch(`/handouts/${id}/flashcards`, { token: accessToken })
      if (cancelled) return

      if (!res.ok) {
        setError(formatApiError(data, res.status, res.statusText))
        return
      }
      const list = Array.isArray(data) ? data : []
      setError('')
      setCards(list)
      setIndex(0)
      setFlipped(false)
    })()

    return () => {
      cancelled = true
    }
  }, [accessToken, id])

  const submitRating = useCallback(
    async (difficulty) => {
      const c = cards[index]
      if (!c || !accessToken || submitting) return
      setSubmitting(true)
      try {
        const { res, data } = await apiFetch(`/flashcards/${c.id}/review`, {
          method: 'POST',
          token: accessToken,
          body: { difficulty },
        })
        if (!res.ok) throw new Error(formatApiError(data, res.status, res.statusText))
        if (index + 1 >= cards.length) {
          navigate(`/student/handouts/${id}`)
          return
        }
        setIndex((i) => i + 1)
        setFlipped(false)
      } catch (err) {
        setError(err?.message || 'Could not save rating.')
      } finally {
        setSubmitting(false)
      }
    },
    [cards, index, accessToken, submitting, id, navigate],
  )

  useEffect(() => {
    function onKey(e) {
      if (e.code === 'Space') {
        e.preventDefault()
        setFlipped((f) => !f)
      }
      const d = DIFFICULTY_MAP[e.key]
      if (d && flipped) {
        submitRating(d)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flipped, submitRating])

  const card = cards[index]
  const total = cards.length
  const progress = total ? (index + (flipped ? 0.5 : 0)) / total : 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B0E14] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(700px_500px_at_50%_0%,rgba(59,130,246,0.07),transparent_55%)]" />
      </div>

      <header className="relative flex items-center justify-between gap-3 border-b border-white/6 px-4 py-4 md:px-8">
        <button
          type="button"
          onClick={() => navigate(`/student/handouts/${id}`)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/5 hover:text-white/80"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="min-w-0 flex-1 text-center">
          <div className="text-[10px] font-bold tracking-[0.2em] text-white/35">
            {total ? `CARD ${index + 1} OF ${total}` : 'NO CARDS'}
          </div>
          <div className="truncate text-[15px] font-semibold text-white">{title}</div>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white/70"
          aria-label="Settings"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
            <path
              d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.09.22.14.45.14.69 0 .24-.05.47-.14.69a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
              stroke="currentColor"
              strokeWidth="1.1"
            />
          </svg>
        </button>
      </header>

      <div className="relative px-4 md:px-8">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/6">
          <div
            className="h-full rounded-full bg-[#3B82F6] transition-all duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8">
        {error ? (
          <div className="mb-4 max-w-md rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-[13px] text-red-100/90">
            {error}
          </div>
        ) : null}

        {!total ? (
          <p className="text-[13px] text-white/45">No flashcards for this handout yet.</p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => !flipped && setFlipped(true)}
              className="relative w-full max-w-lg rounded-2xl border border-white/8 bg-[#12141D] px-8 py-14 text-center shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)] transition hover:border-white/15"
            >
              <span className="absolute left-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/25">
                ?
              </span>
              {!flipped ? (
                <>
                  <p className="text-[18px] font-semibold leading-snug text-white md:text-[20px]">{card.question}</p>
                  <p className="mt-6 text-[10px] font-bold tracking-[0.2em] text-[#3B82F6]/90">
                    CLICK TO REVEAL ANSWER
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-[14px] font-medium text-white/55">Answer</p>
                  <p className="text-[17px] font-semibold leading-relaxed text-white md:text-[18px]">{card.answer}</p>
                </div>
              )}
            </button>

            {!flipped ? (
              <button
                type="button"
                onClick={() => setFlipped(true)}
                className="mt-8 inline-flex w-full max-w-lg items-center justify-center gap-2 rounded-xl bg-[#3B82F6] py-3.5 text-[13px] font-semibold text-white shadow-[0_16px_40px_-16px_rgba(59,130,246,0.9)] transition hover:bg-[#3276EA]"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                  <path
                    d="M4 12a8 8 0 0 1 8-8v3M20 12a8 8 0 0 1-8 8v-3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
                Reveal Answer
              </button>
            ) : (
              <div className="mt-8 flex w-full max-w-lg flex-col gap-3">
                <p className="text-center text-[11px] font-medium text-white/40">How well did you know it?</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { k: 1, label: 'Hard' },
                    { k: 2, label: 'Good' },
                    { k: 3, label: 'Easy' },
                  ].map((r) => (
                    <button
                      key={r.k}
                      type="button"
                      disabled={submitting}
                      onClick={() => submitRating(DIFFICULTY_MAP[r.k])}
                      className="rounded-xl border border-white/10 bg-white/4 py-3 text-[12px] font-semibold text-white/80 transition hover:border-[#3B82F6]/40 hover:bg-[#3B82F6]/10 disabled:opacity-40"
                    >
                      {r.k} — {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="relative pb-6 text-center text-[10px] text-white/30">
        <span className="rounded border border-white/10 bg-white/3 px-1.5 py-0.5 font-mono">SPACE</span> Flip
        <span className="mx-2 text-white/15">|</span>
        <span className="rounded border border-white/10 bg-white/3 px-1 py-0.5 font-mono">1</span>{' '}
        <span className="rounded border border-white/10 bg-white/3 px-1 py-0.5 font-mono">2</span>{' '}
        <span className="rounded border border-white/10 bg-white/3 px-1 py-0.5 font-mono">3</span> Rate
      </footer>
    </div>
  )
}
