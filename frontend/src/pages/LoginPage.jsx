import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Blob } from '../components/Brand/Blob'
import { Wordmark } from '../components/Brand/Wordmark'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AuthLayout } from '../layouts/AuthLayout'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { useAuth } from '../context/useAuth'
import { getApiErrorMessage } from '../utils/apiErrorMessage.js'
import { validateEmail, validateNewPassword } from '../utils/authValidation.js'

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

function dashboardPathForRole(role) {
  if (role === 'student') return '/student'
  if (role === 'lecturer' || role === 'admin') return '/lecturer'
  return '/login'
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'
  const { signIn } = useAuth()
  const [roleHint, setRoleHint] = useState('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {{ email?: string; password?: string }} */ ({}),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    const nextErrors = {}
    const emailResult = validateEmail(email)
    if (!emailResult.ok) nextErrors.email = emailResult.message
    const passResult = validateNewPassword(password)
    if (!passResult.ok) nextErrors.password = passResult.message
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix the errors below.')
      return
    }

    setIsSubmitting(true)
    try {
      const user = await signIn({
        email: emailResult.ok ? emailResult.email : email,
        password: passResult.ok ? passResult.password : password,
      })
      if (!user?.role) {
        toast.error('Invalid response from server.')
        return
      }
      if (user.role !== roleHint) {
        toast.info(`Signed in as ${user.role}. Redirecting to the right workspace.`)
      } else {
        toast.success('Signed in successfully.')
      }
      navigate(dashboardPathForRole(user.role), { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
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

          <form className="mt-7 space-y-4" onSubmit={onSubmit} noValidate>
            {resetSuccess ? (
              <div
                className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-100/90"
                role="status"
              >
                Password updated successfully. Sign in with your new password.
              </div>
            ) : null}
            <div className="pb-1">
              <SegmentedControl
                value={roleHint}
                onChange={setRoleHint}
                options={[
                  { label: 'Student', value: 'student' },
                  { label: 'Lecturer', value: 'lecturer' },
                ]}
              />
              <p className="mt-2 text-[11px] leading-relaxed text-white/40">
                Your account role comes from the server; this choice is only used to highlight a
                mismatch after sign-in.
              </p>
            </div>
            <div>
              <Input
                label="EMAIL ADDRESS"
                type="email"
                autoComplete="email"
                placeholder="name@student.abu.edu.ng"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }))
                }}
                aria-label="Email address"
                aria-invalid={Boolean(fieldErrors.email)}
                maxLength={254}
              />
              {fieldErrors.email ? (
                <p className="mt-1 text-[11px] text-red-300/90">{fieldErrors.email}</p>
              ) : null}
            </div>

            <div>
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
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }))
                }}
                aria-label="Password"
                aria-invalid={Boolean(fieldErrors.password)}
                minLength={8}
                maxLength={128}
              />
              {fieldErrors.password ? (
                <p className="mt-1 text-[11px] text-red-300/90">{fieldErrors.password}</p>
              ) : null}
            </div>

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
