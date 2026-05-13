import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Blob } from '../components/Brand/Blob'
import { Wordmark } from '../components/Brand/Wordmark'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { RoleCard } from '../components/ui/RoleCard'
import { AuthLayout } from '../layouts/AuthLayout'
import { useAuth } from '../context/useAuth'
import { getApiErrorMessage } from '../utils/apiErrorMessage.js'
import {
  PASSWORD_MAX,
  toApiRole,
  validateEmail,
  validateNewPassword,
} from '../utils/authValidation.js'

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

export function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [role, setRole] = useState('student')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {{ email?: string; password?: string; full_name?: string }} */ ({}),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const roleCopy = useMemo(
    () => ({
      student: { title: 'Student', description: 'Study and learn' },
      lecturer: { title: 'Lecturer', description: 'Upload and manage' },
    }),
    [],
  )

  async function onSubmit(e) {
    e.preventDefault()
    const nextErrors = {}
    const emailResult = validateEmail(email)
    if (!emailResult.ok) nextErrors.email = emailResult.message
    const passResult = validateNewPassword(password)
    if (!passResult.ok) nextErrors.password = passResult.message
    const trimmedName = fullName.trim()
    if (trimmedName.length > 120) nextErrors.full_name = 'Name must be at most 120 characters.'

    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix the errors below.')
      return
    }

    setIsSubmitting(true)
    try {
      const user = await signUp({
        email: emailResult.ok ? emailResult.email : email,
        password: passResult.ok ? passResult.password : password,
        role: toApiRole(role),
        ...(trimmedName ? { full_name: trimmedName } : {}),
      })
      toast.success('Account created. You are signed in.')
      if (user?.role) navigate(dashboardPathForRole(user.role), { replace: true })
      else navigate('/login', { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <AuthSidebar
        title="Join the future of learning at ABU"
        description="Create an account to start uploading handouts or studying with AI-powered tools."
      />

      <AuthPanel>
        <div className="mx-auto w-full max-w-[520px]">
          <div className="space-y-1">
            <h1 className="text-[26px] font-semibold tracking-tight text-white/95">
              Create your account
            </h1>
            <p className="text-[12px] text-white/50">
              Fill in your details to get started
            </p>
          </div>

          <form className="mt-7 space-y-4" onSubmit={onSubmit} noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="FULL NAME (OPTIONAL)"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Amina Yusuf"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    if (fieldErrors.full_name) setFieldErrors((p) => ({ ...p, full_name: undefined }))
                  }}
                  aria-label="Full name"
                  maxLength={120}
                />
                {fieldErrors.full_name ? (
                  <p className="mt-1 text-[11px] text-red-300/90">{fieldErrors.full_name}</p>
                ) : null}
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
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }))
                  }}
                  aria-label="Password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  minLength={8}
                  maxLength={PASSWORD_MAX}
                />
                {fieldErrors.password ? (
                  <p className="mt-1 text-[11px] text-red-300/90">{fieldErrors.password}</p>
                ) : null}
              </div>
            </div>

            <div className="pt-2">
              <div className="text-[10px] font-semibold tracking-[0.2em] text-white/50">
                SELECT YOUR ROLE
              </div>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <RoleCard
                  title={roleCopy.student.title}
                  description={roleCopy.student.description}
                  selected={role === 'student'}
                  onSelect={() => setRole('student')}
                />
                <RoleCard
                  title={roleCopy.lecturer.title}
                  description={roleCopy.lecturer.description}
                  selected={role === 'lecturer'}
                  onSelect={() => setRole('lecturer')}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create Account'}
              </Button>
            </div>

            <p className="pt-1 text-center text-[11px] text-white/40">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-[#3B82F6]/90 hover:text-[#3B82F6]"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </AuthPanel>
    </AuthLayout>
  )
}
