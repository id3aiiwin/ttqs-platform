'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 5 * 60 * 1000 // 5 minutes
const WARNING_THRESHOLD = 3

function getLoginAttempts(): { count: number; lockedUntil: number | null } {
  try {
    const raw = localStorage.getItem('login_attempts')
    if (!raw) return { count: 0, lockedUntil: null }
    return JSON.parse(raw)
  } catch { return { count: 0, lockedUntil: null } }
}

function setLoginAttempts(count: number, lockedUntil: number | null) {
  localStorage.setItem('login_attempts', JSON.stringify({ count, lockedUntil }))
}

function clearLoginAttempts() {
  localStorage.removeItem('login_attempts')
}

function getPasswordStrength(password: string): { level: 'weak' | 'medium' | 'strong'; label: string; color: string; width: string } {
  if (password.length === 0) return { level: 'weak', label: '', color: 'bg-gray-200', width: 'w-0' }
  if (password.length < 6) return { level: 'weak', label: '弱', color: 'bg-red-500', width: 'w-1/3' }
  if (password.length < 8) return { level: 'medium', label: '中等', color: 'bg-amber-500', width: 'w-2/3' }
  const hasMix = /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password)
  if (hasMix) return { level: 'strong', label: '強', color: 'bg-green-500', width: 'w-full' }
  return { level: 'medium', label: '中等', color: 'bg-amber-500', width: 'w-2/3' }
}

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)
  const [password, setPassword] = useState('')

  const checkLockout = useCallback(() => {
    const { lockedUntil } = getLoginAttempts()
    if (lockedUntil && lockedUntil > Date.now()) {
      setLockoutRemaining(Math.ceil((lockedUntil - Date.now()) / 1000))
      return true
    }
    if (lockedUntil) {
      // Lockout expired, clear
      clearLoginAttempts()
      setLockoutRemaining(0)
    }
    return false
  }, [])

  useEffect(() => {
    checkLockout()
  }, [checkLockout])

  useEffect(() => {
    if (lockoutRemaining <= 0) return
    const timer = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) {
          clearLoginAttempts()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [lockoutRemaining])

  const isLocked = lockoutRemaining > 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'login' && checkLockout()) {
      setError(`帳號已暫時鎖定，請 ${Math.ceil(lockoutRemaining / 60)} 分鐘後再試。`)
      setLoading(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const pwd = formData.get('password') as string
    const supabase = createClient()

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('密碼重設信已發送，請查看您的信箱。')
      }
      setLoading(false)
      return
    }

    if (mode === 'register') {
      const name = formData.get('name') as string

      const { error } = await supabase.auth.signUp({
        email,
        password: pwd,
        options: { data: { full_name: name } },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError('此 Email 已經註冊過，請直接登入。')
        } else {
          setError(error.message)
        }
        setLoading(false)
        return
      }

      setSuccess('註冊成功！請查看信箱確認郵件，或直接登入。')
      setMode('login')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd })
    if (error) {
      const attempts = getLoginAttempts()
      const newCount = attempts.count + 1
      if (newCount >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCKOUT_DURATION
        setLoginAttempts(newCount, lockedUntil)
        setLockoutRemaining(Math.ceil(LOCKOUT_DURATION / 1000))
        setError(`登入失敗次數過多，帳號已鎖定 5 分鐘。`)
      } else {
        setLoginAttempts(newCount, null)
        const remaining = MAX_ATTEMPTS - newCount
        if (newCount >= WARNING_THRESHOLD) {
          setError(`電子郵件或密碼錯誤。還剩 ${remaining} 次嘗試機會。`)
        } else {
          setError('電子郵件或密碼錯誤，請重試。')
        }
      }
      setLoading(false)
      return
    }

    clearLoginAttempts()
    router.push('/dashboard')
    router.refresh()
  }

  const passwordStrength = getPasswordStrength(password)
  const lockoutMinutes = Math.floor(lockoutRemaining / 60)
  const lockoutSeconds = lockoutRemaining % 60

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {mode === 'register' && (
        <Input id="name" name="name" type="text" label="姓名" placeholder="您的姓名" required autoComplete="name" />
      )}
      <Input id="email" name="email" type="email" label="電子郵件" placeholder="your@email.com" required autoComplete="email" />
      {mode !== 'forgot' && (
        <div>
          <Input id="password" name="password" type="password" label="密碼" placeholder="••••••••" required
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)} />
          {mode === 'register' && password.length > 0 && (
            <div className="mt-1.5">
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${passwordStrength.color} ${passwordStrength.width} transition-all duration-300 rounded-full`} />
              </div>
              {passwordStrength.label && (
                <p className={`text-xs mt-0.5 ${
                  passwordStrength.level === 'weak' ? 'text-red-600' :
                  passwordStrength.level === 'medium' ? 'text-amber-600' : 'text-green-600'
                }`}>
                  密碼強度：{passwordStrength.label}
                </p>
              )}
            </div>
          )}
          {mode === 'login' && (
            <button type="button" onClick={() => { setMode('forgot'); setError(null); setSuccess(null) }}
              className="text-xs text-gray-400 hover:text-indigo-600 mt-1.5 block">忘記密碼？</button>
          )}
        </div>
      )}

      {mode === 'forgot' && (
        <p className="text-sm text-gray-500">請輸入您的電子郵件，我們將發送密碼重設連結。</p>
      )}

      {isLocked && mode === 'login' && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          帳號已暫時鎖定，請等待 {lockoutMinutes}:{lockoutSeconds.toString().padStart(2, '0')} 後再試。
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{success}</div>}

      <Button type="submit" loading={loading} disabled={isLocked && mode === 'login'} className="w-full mt-2">
        {mode === 'login' ? '登入' : mode === 'register' ? '註冊' : '發送重設連結'}
      </Button>

      <div className="text-center space-y-1">
        {mode === 'login' && (
          <button type="button" onClick={() => { setMode('register'); setError(null); setSuccess(null); setPassword('') }}
            className="text-sm text-indigo-600 hover:text-indigo-700 block w-full">還沒有帳號？立即註冊</button>
        )}
        {mode === 'register' && (
          <button type="button" onClick={() => { setMode('login'); setError(null); setSuccess(null); setPassword('') }}
            className="text-sm text-indigo-600 hover:text-indigo-700 block w-full">已有帳號？返回登入</button>
        )}
        {mode === 'forgot' && (
          <button type="button" onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
            className="text-sm text-indigo-600 hover:text-indigo-700 block w-full">返回登入</button>
        )}
      </div>
    </form>
  )
}
