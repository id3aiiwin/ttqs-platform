'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleAuth() {
      const supabase = createClient()

      // Check for hash fragment (Supabase email links use this)
      const hash = window.location.hash
      if (hash) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            setError(error.message)
            return
          }

          if (type === 'recovery') {
            router.push('/auth/reset-password')
            return
          }

          router.push('/dashboard')
          return
        }
      }

      // Check for code in search params
      const code = searchParams.get('code')
      const type = searchParams.get('type')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          // 若已有 session（例如 code 已被使用過但 session 還在），仍可進行重設
          const { data: { session } } = await supabase.auth.getSession()
          if (session && type === 'recovery') {
            router.push('/auth/reset-password')
            return
          }
          setError(`${error.message}（連結可能已過期或被使用過，請重新申請）`)
          return
        }

        if (type === 'recovery') {
          router.push('/auth/reset-password')
          return
        }

        router.push('/dashboard')
        return
      }

      // 無 code 但已有 session 且是 recovery → 直接送去重設密碼
      if (type === 'recovery') {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push('/auth/reset-password')
          return
        }
      }

      // Try to get existing session
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
        return
      }

      setError('驗證連結無效或已過期，請重新操作。')
    }

    handleAuth()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">驗證失敗</h1>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <a href="/auth/login" className="text-sm text-indigo-600 hover:text-indigo-700">返回登入頁</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">驗證中...</p>
      </div>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">驗證中...</p>
        </div>
      </div>
    }>
      <AuthConfirmInner />
    </Suspense>
  )
}
