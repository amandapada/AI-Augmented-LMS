import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Blob } from '../components/Brand/Blob'
import { Wordmark } from '../components/Brand/Wordmark'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AuthLayout } from '../layouts/AuthLayout'
import { SegmentedControl } from '../components/ui/SegmentedControl'
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

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'
  const { signIn } = useAuth()
  const [role, setRole] = useState('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setLoginError('')
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setLoginError('Please enter your email address (include @ and your domain).')
      return
    }
    setIsSubmitting(true)
    try {
      const session = await signIn({ email: trimmedEmail, password })
      const r = session?.role
      if (r === 'lecturer' || r === 'admin') navigate('/lecturer', { replace: true })
      else navigate('/student', { replace: true })
    } catch (err) {
      setLoginError(err?.message || 'Sign in failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <AuthSidebar
        title="AI-powered study tools for ABU Computer Engineering"
        description="Transform your handouts into interactive flashcards, quizzes, and AI-guided study sessions."
      />

      <AuthPanel>
        <div className="mx-auto w-full max-w-[420px]">
          <div className="space-y-1">
            <h1 className="text-[26px] font-semibold tracking-tight text-white/95">
              Welcome back
            </h1>
            <p className="text-[12px] text-white/50">
              Enter your credentials to access your study portal
            </p>
          </div>

          <form className="mt-7 space-y-4" onSubmit={onSubmit}>
            {resetSuccess ? (
              <div
                className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-100/90"
                role="status"
              >
                Password updated successfully. Sign in with your new password.
              </div>
            ) : null}
            {loginError ? (
              <div
                className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12px] text-red-100/90"
                role="alert"
              >
                {loginError}
              </div>
            ) : null}
            <div className="pb-1">
              <SegmentedControl
                value={role}
                onChange={setRole}
                options={[
                  { label: 'Student', value: 'student' },
                  { label: 'Lecturer', value: 'lecturer' },
                ]}
              />
            </div>
            <Input
              label="EMAIL ADDRESS"
              type="email"
              autoComplete="email"
              placeholder="name@student.abu.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
            />

            <Input
              label="PASSWORD"
              labelRight={
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-medium text-[#3B82F6]/90 hover:text-[#3B82F6]"
                >
                  Forgot password?
                </Link>
              }
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password"
            />

            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </Button>
            </div>

            <p className="pt-1 text-center text-[11px] text-white/40">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-[#3B82F6]/90 hover:text-[#3B82F6]"
              >
                Register
              </Link>
            </p>
          </form>
        </div>
      </AuthPanel>
    </AuthLayout>
  )
}
