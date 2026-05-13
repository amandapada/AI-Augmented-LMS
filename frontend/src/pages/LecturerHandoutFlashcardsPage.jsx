import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { LECTURER_NAV } from '../config/lecturerNav'
import { useAuth } from '../context/useAuth'
import { generate as generateFlashcards, list as listFlashcards } from '../api/flashcards.js'
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

function Card({ q, a }) {
  return (
    <article className="rounded-2xl border border-white/8 bg-[#12141D] p-5">
      <div className="text-[11px] font-semibold tracking-[0.16em] text-white/40">QUESTION</div>
      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-white/85">{q}</p>
      <div className="mt-4 text-[11px] font-semibold tracking-[0.16em] text-white/40">ANSWER</div>
      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-white/70">{a}</p>
    </article>
  )
}

export function LecturerHandoutFlashcardsPage() {
  const { handoutId } = useParams()
  const id = Number(handoutId)
  const { accessToken } = useAuth()

  const [title, setTitle] = useState('Handout')
  const [cards, setCards] = useState([])
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

        const list = await listFlashcards(id, { accessToken, signal: ac.signal })
        if (cancelled) return
        setCards(Array.isArray(list) ? list : [])
      } catch (e) {
        if (cancelled) return
        if (ac.signal.aborted) return
        setError(e?.message || 'Failed to load flashcards.')
        setCards([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      ac.abort()
    }
  }, [accessToken, id])

  const hasCards = cards.length > 0

  const countLabel = useMemo(() => {
    if (!hasCards) return '0'
    return String(cards.length)
  }, [hasCards, cards.length])

  async function onGenerate() {
    if (!accessToken || !Number.isFinite(id) || busy) return
    setBusy(true)
    try {
      const res = await generateFlashcards(id, { accessToken })
      const list = Array.isArray(res?.flashcards) ? res.flashcards : []
      setCards(list)
      setError('')
    } catch (e) {
      setError(e?.message || 'Failed to generate flashcards.')
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
              Flashcards
            </div>
            <h1 className="mt-2 text-[18px] font-semibold tracking-tight text-white/90">{title}</h1>
            <p className="mt-2 text-[12px] text-white/55">{countLabel} card(s)</p>
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
                : 'bg-[#3B82F6] text-white hover:bg-[#3276EA]',
            )}
          >
            {busy ? 'Generating…' : hasCards ? 'Regenerate' : 'Generate'}
          </button>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-100/90">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="text-[12px] text-white/55">Loading…</div>
        ) : hasCards ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {cards.map((c) => (
              <Card key={c.id} q={c.question} a={c.answer} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/6 bg-white/2 p-6 text-[13px] text-white/60">
            No flashcards yet. Click “Generate” to create flashcards for this handout.
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

