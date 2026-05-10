import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Blob } from '../components/Brand/Blob'
import { Wordmark } from '../components/Brand/Wordmark'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { RoleCard } from '../components/ui/RoleCard'
import { AuthLayout } from '../layouts/AuthLayout'

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

export function RegisterPage() {
  const [role, setRole] = useState('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    setIsSubmitting(true)
    try {
      // Placeholder for real registration integration
      await new Promise((r) => setTimeout(r, 800))
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

          <form className="mt-7 space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Password"
              />
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

