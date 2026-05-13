import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { LECTURER_NAV } from '../config/lecturerNav'
import { useAuth } from '../context/useAuth'
import { getStatus, upload as uploadHandout } from '../api/handouts.js'

const HANDOUT_FILE_ACCEPT = 'application/pdf,image/jpeg,image/png'

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let u = 0
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024
    u += 1
  }
  return `${n.toFixed(u === 0 ? 0 : 1)} ${units[u]}`
}

function Icon({ name, className }) {
  const common = 'h-5 w-5'
  switch (name) {
    case 'cloud':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M7 18a4 4 0 0 1-.4-7.98A6 6 0 0 1 18.8 9.3 3.5 3.5 0 0 1 18 18H7Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M12 10v6M9.5 12.5 12 10l2.5 2.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'file':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M14 3v4h4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'check':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'spinner':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, 'animate-spin', className)}
          aria-hidden="true"
        >
          <path
            d="M21 12a9 9 0 1 1-2.64-6.36"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'arrow':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={clsx(common, className)}
          aria-hidden="true"
        >
          <path
            d="M5 12h12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M13 6l6 6-6 6"
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

function Step({ label, state }) {
  const isActive = state === 'active'
  const isDone = state === 'done'
  const circleClass = isDone
    ? 'bg-[#10B981] text-white'
    : isActive
      ? 'bg-[#3B82F6]/15 text-[#60A5FA] ring-1 ring-[#3B82F6]/25'
      : 'bg-white/5 text-white/35 ring-1 ring-white/10'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={clsx('inline-flex h-10 w-10 items-center justify-center rounded-full', circleClass)}>
        {isDone ? <Icon name="check" className="h-5 w-5" /> : isActive ? <Icon name="spinner" className="h-5 w-5" /> : <Icon name="check" className="h-5 w-5" />}
      </div>
      <div
        className={clsx(
          'text-[10px] font-semibold uppercase tracking-[0.16em]',
          isDone ? 'text-[#10B981]' : isActive ? 'text-[#60A5FA]' : 'text-white/30',
        )}
      >
        {label}
      </div>
    </div>
  )
}

export function LecturerUploadPage() {
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const inputRef = useRef(null)
  const uploadAbortRef = useRef(null)

  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [handoutId, setHandoutId] = useState(null)
  const [phase, setPhase] = useState('idle') // idle | uploading | processing | ready | error
  const [error, setError] = useState('')
  const [autoPoll, setAutoPoll] = useState(true)

  const meta = useMemo(() => {
    if (!file) return null
    return {
      name: file.name,
      size: formatBytes(file.size),
    }
  }, [file])

  function pickFile() {
    inputRef.current?.click()
  }

  function acceptAndUpload(nextFile) {
    setError('')
    setHandoutId(null)
    setFile(nextFile)
    setPhase('uploading')
    setAutoPoll(true)

    if (!accessToken) {
      setError('You are not signed in.')
      setPhase('error')
      return
    }

    if (uploadAbortRef.current) {
      uploadAbortRef.current.abort()
    }
    const ac = new AbortController()
    uploadAbortRef.current = ac

    ;(async () => {
      try {
        const res = await uploadHandout(nextFile, { accessToken, signal: ac.signal })
        const id = Number(res?.id)
        if (!Number.isFinite(id)) {
          throw new Error('Upload succeeded but no handout id returned.')
        }
        setHandoutId(id)
        setPhase('processing')
      } catch (e) {
        if (ac.signal.aborted) return
        setError(e?.message || 'Upload failed.')
        setPhase('error')
      }
    })()
  }

  function onFiles(files) {
    const next = files?.[0]
    if (!next) return

    const ok =
      next.type === 'application/pdf' ||
      next.type === 'image/jpeg' ||
      next.type === 'image/png'

    if (!ok) {
      setError('Only PDF, JPG, or PNG files are allowed.')
      setPhase('error')
      return
    }

    if (next.size > 20 * 1024 * 1024) {
      setError('Max file size is 20MB.')
      setPhase('error')
      return
    }

    acceptAndUpload(next)
  }

  useEffect(() => {
    if (!handoutId) return
    if (phase !== 'processing') return
    if (!autoPoll) return

    let cancelled = false
    const startedAt = Date.now()
    const ac = new AbortController()

    async function tick() {
      try {
        if (!accessToken) throw new Error('You are not signed in.')
        const data = await getStatus(handoutId, { accessToken, signal: ac.signal })
        const status = String(data?.status || '').toUpperCase()

        if (cancelled) return

        if (status === 'FAILED') {
          setError(data?.error_message || 'Processing failed.')
          setPhase('error')
          return
        }

        if (status === 'READY' || status === 'APPROVED') {
          setPhase('ready')
          return
        }

        // Current backend behavior can stay in "uploaded" for a long time.
        // Treat it as UI-ready so the user can move on, but still allow a manual re-check.
        if (status === 'UPLOADED') {
          setAutoPoll(false)
          setPhase('ready')
          return
        }

        setPhase('processing')
      } catch (e) {
        if (cancelled) return
        if (ac.signal.aborted) return
        // Keep polling through transient errors, but surface a hint after some time.
        if (Date.now() - startedAt > 15000) {
          setError(e?.message || 'Having trouble checking status. Retrying…')
        }
      }

      if (cancelled) return
      if (Date.now() - startedAt > 2 * 60 * 1000) return
      window.setTimeout(() => void tick(), 2000)
    }

    void tick()
    return () => {
      cancelled = true
      ac.abort()
    }
  }, [handoutId, phase, accessToken, autoPoll])

  const uploadedState =
    phase === 'processing' || phase === 'ready'
      ? 'done'
      : phase === 'uploading'
        ? 'active'
        : 'idle'
  const processingState =
    phase === 'processing' && autoPoll
      ? 'active'
      : phase === 'ready'
        ? 'done'
        : 'idle'
  const readyState = phase === 'ready' ? 'done' : 'idle'

  const showFileRow = Boolean(file)

  return (
    <DashboardLayout userFallbackName="Lecturer" navItems={LECTURER_NAV}>
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Upload Handout
          </h1>
          <p className="mt-2 text-[13px] text-white/45">
            Add your course materials to generate AI study tools
          </p>
        </div>

        <div className="mt-8 w-full rounded-lg border border-white/6 bg-[#151921] p-8 shadow-sm">
          <input
            ref={inputRef}
            type="file"
            accept={HANDOUT_FILE_ACCEPT}
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                pickFile()
              }
            }}
            onClick={pickFile}
            onDragEnter={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setDragOver(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              onFiles(e.dataTransfer.files)
            }}
            className={clsx(
              'flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center transition',
              dragOver ? 'border-[#3B82F6]/60 bg-[#3B82F6]/5' : 'border-white/12 bg-black/5 hover:border-white/18',
            )}
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0B0E14] ring-1 ring-white/6">
              <Icon name="cloud" className="text-[#60A5FA]" />
            </div>
            <div className="mt-5 text-[13px] font-semibold text-white/85">
              Drag PDF or image here
            </div>
            <div className="mt-1 text-[12px] text-white/45">
              or click to{' '}
              <span className="text-[#60A5FA]">browse</span> files
            </div>
            <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
              PDF, JPG, PNG — MAX 20MB
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-7 flex w-full max-w-xl items-center justify-between px-2">
          <Step label="Uploaded" state={uploadedState} />
          <Step label="Processing" state={processingState} />
          <Step label="Ready" state={readyState} />
        </div>

        {showFileRow ? (
          <div className="mt-6 w-full max-w-2xl rounded-lg border border-white/6 bg-[#151921] p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B0E14] ring-1 ring-white/6 text-white/60">
                <Icon name="file" className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold text-white/85">
                  {meta?.name}
                </div>
                <div className="mt-0.5 text-[11px] text-white/45">
                  {meta?.size}
                  {phase === 'uploading' ? ' • uploading' : null}
                  {phase === 'processing' && autoPoll ? ' • processing' : null}
                  {phase === 'processing' && !autoPoll ? ' • uploaded (queued)' : null}
                  {phase === 'ready' ? ' • ready' : null}
                </div>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/6">
                  <div
                    className={clsx(
                      'h-1 rounded-full',
                      phase === 'ready' ? 'bg-[#10B981]' : 'bg-[#3B82F6]',
                    )}
                    style={{ width: `${phase === 'ready' ? 100 : phase === 'idle' ? 0 : 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {phase === 'processing' && !autoPoll ? (
          <button
            type="button"
            onClick={() => setAutoPoll(true)}
            className="mt-4 inline-flex h-10 w-full max-w-2xl items-center justify-center rounded-lg bg-[#151921] text-[12px] font-semibold text-white/80 ring-1 ring-white/8 transition hover:bg-[#1b2230] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            Check status
          </button>
        ) : null}

        <button
          type="button"
          disabled={phase !== 'ready'}
          onClick={() => navigate('/lecturer')}
          className={clsx(
            'mt-8 inline-flex h-11 w-full max-w-2xl items-center justify-center gap-2 rounded-lg px-4 text-[12px] font-semibold',
            'transition focus:outline-none focus:ring-2 focus:ring-sky-500/20',
            phase === 'ready'
              ? 'bg-[#151921] text-white/80 ring-1 ring-white/8 hover:bg-[#1b2230]'
              : 'bg-[#0f131b] text-white/25 ring-1 ring-white/6 cursor-not-allowed',
          )}
        >
          Back to Dashboard
          <Icon name="arrow" className="h-4 w-4" />
        </button>

        {phase === 'ready' && !autoPoll && handoutId ? (
          <button
            type="button"
            onClick={() => {
              setPhase('processing')
              setAutoPoll(true)
            }}
            className="mt-3 inline-flex h-10 w-full max-w-2xl items-center justify-center rounded-lg bg-[#0f131b] text-[12px] font-semibold text-white/65 ring-1 ring-white/6 transition hover:bg-[#141a24] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            Re-check processing status
          </button>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
