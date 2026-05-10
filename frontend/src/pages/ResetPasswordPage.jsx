import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Blob } from '../components/Brand/Blob'
import { Wordmark } from '../components/Brand/Wordmark'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AuthLayout } from '../layouts/AuthLayout'
import { useAuth } from '../context/useAuth'

function AuthSidebar({ title, description }) {
  return (
    <section className="relative hidden h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden border-r border-white/5 bg-white/2 p-8 md:flex">
      <div className="flex items-center justify-between">
        <Wordmark />
      </div>

      <div className="mt-12 max-w-[420px] space-y-4">
        <h2 className="text-balance text-[34px] font-semibold leading-[1.08] tracking-tight text-white/95">
          {title}
        </h2>
        <p className="max-w-[380px] text-[13px] leading-relaxed text-white/50">
          {description}
        </p>
      </div>

      <div className="mt-auto pt-10">
        <div className="relative h-[280px] w-full max-w-[520px]">
          <Blob className="absolute -left-16 -bottom-10 h-[360px] w-[560px] opacity-95" />
        </div>
        <div className="mt-10 text-[11px] text-white/35">
          © 2024 Ahmadu Bello University. All rights reserved.
        </div>
      </div>
    </section>
  )
}

function AuthPanel({ children }) {
  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-1 items-center justify-center overflow-y-auto border border-white/5 bg-black/20 px-6 py-10 backdrop-blur-md md:border-l-0 md:px-10">
      {children}
    </section>
  )
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPasswordWithToken } = useAuth()

  const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams])

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setIsSubmitting(true)
    try {
      await resetPasswordWithToken(token, password)
      navigate('/login?reset=success', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const missingToken = !token

  return (
    <AuthLayout>
      <AuthSidebar
        title="Set a new password"
        description="Choose a strong password you haven’t used elsewhere. You’ll sign in with it right away."
      />

      <AuthPanel>
        <div className="mx-auto w-full max-w-[420px]">
          <div className="space-y-1">
            <h1 className="text-[26px] font-semibold tracking-tight text-white/95">
              Reset password
            </h1>
            <p className="text-[12px] text-white/50">
              Enter and confirm your new password below.
            </p>
          </div>

          {missingToken ? (
            <div className="mt-7 space-y-4">
              <div
                className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-3 text-[12px] text-amber-100/90"
                role="alert"
              >
                This link is missing a reset token. Open the link from your email, or request a new
                reset.
              </div>
              <Button type="button" className="w-full" onClick={() => navigate('/forgot-password')}>
                Request reset link
              </Button>
              <p className="text-center text-[11px] text-white/40">
                <Link to="/login" className="font-medium text-[#3B82F6]/90 hover:text-[#3B82F6]">
                  Back to sign in
                </Link>
              </p>
            </div>
          ) : (
            <form className="mt-7 space-y-4" onSubmit={onSubmit}>
              {error ? (
                <div
                  className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12px] text-red-200/90"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <Input
                label="NEW PASSWORD"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                aria-label="New password"
              />

              <Input
                label="CONFIRM PASSWORD"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                aria-label="Confirm password"
              />

              <div className="pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating…' : 'Update password'}
                </Button>
              </div>

              <p className="pt-1 text-center text-[11px] text-white/40">
                <Link to="/login" className="font-medium text-[#3B82F6]/90 hover:text-[#3B82F6]">
                  Cancel and sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </AuthPanel>
    </AuthLayout>
  )
}
