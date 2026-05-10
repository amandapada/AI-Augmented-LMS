import { useState } from 'react'
import { Link } from 'react-router-dom'
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

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [serverMessage, setServerMessage] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const data = await requestPasswordReset(email)
      setServerMessage(data.message || '')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <AuthSidebar
        title="Recover access to your account"
        description="We’ll email you a secure link to choose a new password. It only takes a moment."
      />

      <AuthPanel>
        <div className="mx-auto w-full max-w-[420px]">
          {!done ? (
            <>
              <div className="space-y-1">
                <h1 className="text-[26px] font-semibold tracking-tight text-white/95">
                  Forgot password
                </h1>
                <p className="text-[12px] text-white/50">
                  Enter your ABU email address and we&apos;ll send reset instructions.
                </p>
              </div>

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
                  label="EMAIL ADDRESS"
                  type="email"
                  autoComplete="email"
                  placeholder="name@student.abu.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label="Email address"
                />

                <div className="pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending…' : 'Send reset link'}
                  </Button>
                </div>

                <p className="pt-1 text-center text-[11px] text-white/40">
                  Remember your password?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-[#3B82F6]/90 hover:text-[#3B82F6]"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-[26px] font-semibold tracking-tight text-white/95">
                  Check your inbox
                </h1>
                <p className="text-[12px] leading-relaxed text-white/50">
                  {serverMessage ||
                    'If an account exists for that email, we sent instructions to reset your password.'}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-3 text-[12px] leading-relaxed text-emerald-100/90">
                Didn&apos;t see it? Look in spam or promotions. Links expire after about an hour for
                security.
              </div>
              {import.meta.env.DEV ? (
                <p className="text-[11px] leading-relaxed text-white/35">
                  Local dev: the API logs a reset URL with a <code className="text-white/50">token</code>{' '}
                  query you can paste into the address bar.
                </p>
              ) : null}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDone(false)
                    setEmail('')
                  }}
                >
                  Use a different email
                </Button>
              </div>
              <p className="text-center text-[11px] text-white/40">
                <Link to="/login" className="font-medium text-[#3B82F6]/90 hover:text-[#3B82F6]">
                  Back to sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </AuthPanel>
    </AuthLayout>
  )
}
