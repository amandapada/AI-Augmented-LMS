import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { STUDENT_NAV } from '../config/studentNav'
import { useAuth } from '../context/useAuth'
import { apiFetch, formatApiError } from '../lib/apiClient'

function formatTime(d) {
  try {
    return new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  } catch {
    return ''
  }
}

function mapHistoryPayload(data) {
  const list = Array.isArray(data) ? data : []
  return list.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    created_at: m.created_at,
    sources: m.sources || [],
  }))
}

export function StudentHandoutChatPage() {
  const { handoutId } = useParams()
  const id = Number(handoutId)
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const bottomRef = useRef(null)

  const [title, setTitle] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [rateWaitSec, setRateWaitSec] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!accessToken || !Number.isFinite(id)) {
        await Promise.resolve()
        if (!cancelled) {
          setTitle('')
          setMessages([])
          setError('')
        }
        return
      }

      const detail = await apiFetch(`/handouts/${id}`, { token: accessToken })
      if (cancelled) return
      if (detail.res.ok) setTitle(detail.data?.title || 'Handout')

      const { res, data } = await apiFetch(`/handouts/${id}/chat/history`, { token: accessToken })
      if (cancelled) return

      if (!res.ok) {
        setError(formatApiError(data, res.status, res.statusText))
        return
      }
      setError('')
      setMessages(mapHistoryPayload(data))
    })()

    return () => {
      cancelled = true
    }
  }, [accessToken, id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    if (rateWaitSec <= 0) return
    const t = setInterval(() => {
      setRateWaitSec((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [rateWaitSec])

  async function sendQuestion(text) {
    const q = String(text || '').trim()
    if (!q || !accessToken) return
    setError('')
    setSending(true)
    setInput('')
    const optimistic = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: q,
      created_at: new Date().toISOString(),
      sources: [],
    }
    setMessages((prev) => [...prev, optimistic])

    const { res, data } = await apiFetch(`/handouts/${id}/chat`, {
      method: 'POST',
      token: accessToken,
      body: { question: q },
    })

    if (res.status === 429) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      const w = Number(data?.details?.window_seconds) || 60
      setRateWaitSec(w)
      setSending(false)
      return
    }

    if (!res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setError(formatApiError(data, res.status, res.statusText))
      setSending(false)
      return
    }

    const hist = await apiFetch(`/handouts/${id}/chat/history`, { token: accessToken })
    if (hist.res.ok) setMessages(mapHistoryPayload(hist.data))
    setSending(false)
  }

  const chips = useMemo(
    () => [
      { label: 'Summarize Handout', q: 'Summarize this handout in clear sections.' },
      { label: 'Key Formulas', q: 'List the key formulas from this handout with a one-line explanation each.' },
      { label: 'Exam Tips', q: 'What should I focus on for an exam based on this handout?' },
    ],
    [],
  )

  return (
    <DashboardLayout userFallbackName="Student" navItems={STUDENT_NAV}>
      <div className="mx-auto flex h-[min(720px,calc(100dvh-8rem))] max-w-[900px] flex-col">
        <header className="mb-4 flex shrink-0 items-start justify-between gap-4 border-b border-white/6 pb-4">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate(`/student/handouts/${id}`)}
              className="inline-flex items-center gap-2 text-[12px] font-medium text-white/50 hover:text-white/75"
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
            </button>
            <div className="mt-2 text-[10px] font-bold tracking-[0.2em] text-[#3B82F6]">AI CHAT MODE</div>
            <h1 className="truncate font-serif text-[1.35rem] font-normal tracking-tight text-white md:text-[1.5rem]">
              {title || 'Handout'}
            </h1>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/3 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-white/50">
            ACTIVE SESSION
          </span>
        </header>

        {error ? (
          <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-100/90">
            {error}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div key={m.id} className={clsx(m.role === 'user' ? 'flex justify-end' : 'flex justify-start')}>
              {m.role === 'user' ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#3B82F6] px-4 py-3 text-[13px] leading-relaxed text-white shadow-lg">
                  <p>{m.content}</p>
                  <div className="mt-2 text-[10px] font-medium text-white/70">{formatTime(m.created_at)}</div>
                </div>
              ) : (
                <div className="w-full max-w-[95%] space-y-2 md:max-w-[90%]">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1e2634] text-[#3B82F6] ring-1 ring-white/10">
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                        <path
                          d="M4 12h4l2-6 4 12 2-6h4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1 rounded-2xl rounded-bl-md border border-white/8 bg-[#12141D] px-4 py-3 text-[13px] leading-relaxed text-white/85">
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.sources?.length ? (
                        <div className="mt-4 border-t border-white/6 pt-3">
                          <div className="text-[10px] font-bold tracking-[0.16em] text-white/40">
                            SOURCES FROM HANDOUT
                          </div>
                          {m.sources.map((s, i) => (
                            <div
                              key={i}
                              className="mt-2 rounded-lg border border-white/6 bg-black/25 px-3 py-2 text-[12px] text-white/70"
                            >
                              <span className="text-white/85">&ldquo;{s.text}</span>
                              {s.page_number != null ? (
                                <span className="text-white/45">&rdquo; — Page {s.page_number}</span>
                              ) : (
                                <span className="text-white/45">&rdquo;</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-3 flex items-center gap-3 text-[10px] font-semibold tracking-[0.12em] text-white/35">
                        <span>AI RESPONSE</span>
                        <button type="button" className="text-white/40 hover:text-white/60" aria-label="Thumbs up">
                          👍
                        </button>
                        <button type="button" className="text-white/40 hover:text-white/60" aria-label="Thumbs down">
                          👎
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {sending ? (
            <div className="flex items-start gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e2634] text-[#3B82F6] ring-1 ring-white/10">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                  <path
                    d="M4 12h4l2-6 4 12 2-6h4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="rounded-2xl border border-white/8 bg-[#12141D] px-4 py-3 text-[13px] text-white/45">
                …
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 shrink-0 space-y-3 border-t border-white/6 pt-4">
          {rateWaitSec > 0 ? (
            <div className="rounded-lg border border-orange-500/35 bg-orange-500/10 px-3 py-2 text-center text-[11px] font-semibold tracking-wide text-orange-200/90">
              RATE LIMIT REACHED — {rateWaitSec} SEC WAIT
            </div>
          ) : null}
          <form
            className="relative"
            onSubmit={(e) => {
              e.preventDefault()
              sendQuestion(input)
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this handout..."
              disabled={sending || rateWaitSec > 0}
              className="w-full rounded-xl border border-white/8 bg-[#12141D] py-3.5 pl-4 pr-14 text-[13px] text-white placeholder:text-white/30 focus:border-[#3B82F6]/50 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || rateWaitSec > 0 || !input.trim()}
              className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg bg-[#3B82F6] text-white shadow-lg transition hover:bg-[#3276EA] disabled:opacity-40"
              aria-label="Send"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                <path
                  d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
          <div className="flex flex-wrap justify-center gap-2">
            {chips.map((c) => (
              <button
                key={c.label}
                type="button"
                disabled={sending || rateWaitSec > 0}
                onClick={() => sendQuestion(c.q)}
                className="rounded-full border border-white/10 bg-white/3 px-3 py-1.5 text-[11px] font-medium text-white/60 transition hover:border-white/20 hover:text-white/85 disabled:opacity-40"
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] text-white/30">
            Need the full handout page?{' '}
            <Link to={`/student/handouts/${id}`} className="text-[#3B82F6]/90 hover:text-[#3B82F6]">
              Open handout detail
            </Link>
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
