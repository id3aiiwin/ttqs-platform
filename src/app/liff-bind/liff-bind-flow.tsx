'use client'

import { useEffect, useState, useCallback } from 'react'

interface Student {
  id: string
  name: string
  bound: boolean
}

interface LiffProfile {
  userId: string
  displayName: string
  pictureUrl?: string
}

declare global {
  interface Window {
    liff: {
      init: (config: { liffId: string }) => Promise<void>
      isLoggedIn: () => boolean
      login: () => void
      getProfile: () => Promise<LiffProfile>
      isInClient: () => boolean
    }
  }
}

interface Props {
  courseId?: string
  companyId?: string
  profileId?: string // 個人專屬 QR Code 用：掃碼即綁定
}

export function LiffBindFlow({ courseId, companyId, profileId }: Props) {
  const [phase, setPhase] = useState<'loading' | 'liff-error' | 'select' | 'binding' | 'success' | 'error'>('loading')
  const [students, setStudents] = useState<Student[]>([])
  const [lineProfile, setLineProfile] = useState<LiffProfile | null>(null)
  const [message, setMessage] = useState('')
  const [boundName, setBoundName] = useState('')
  const [search, setSearch] = useState('')

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID
  const isAutoMode = !!profileId

  const doBind = useCallback(async (targetProfileId: string, lineUserId: string) => {
    setPhase('binding')
    try {
      const res = await fetch('/api/line-bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: targetProfileId, line_user_id: lineUserId }),
      })
      const data = await res.json()
      if (data.ok) {
        setBoundName(data.name || '')
        setPhase('success')
      } else {
        setMessage(data.error || '綁定失敗')
        setPhase('error')
      }
    } catch {
      setMessage('網路錯誤，請稍後重試')
      setPhase('error')
    }
  }, [])

  const initLiff = useCallback(async () => {
    if (!liffId) {
      setMessage('LIFF 尚未設定，請聯繫管理員')
      setPhase('liff-error')
      return
    }

    try {
      // Load LIFF SDK
      await new Promise<void>((resolve, reject) => {
        if (window.liff) { resolve(); return }
        const script = document.createElement('script')
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('無法載入 LIFF SDK'))
        document.head.appendChild(script)
      })

      await window.liff.init({ liffId })

      if (!window.liff.isLoggedIn()) {
        window.liff.login()
        return
      }

      const profile = await window.liff.getProfile()
      setLineProfile(profile)

      // 個人模式：自動綁定
      if (profileId) {
        await doBind(profileId, profile.userId)
        return
      }

      // 名單模式：載入學員清單
      const params = new URLSearchParams()
      if (courseId) params.set('course_id', courseId)
      if (companyId) params.set('company_id', companyId)

      const res = await fetch(`/api/line-bind-list?${params}`)
      const data = await res.json()

      if (data.students?.length > 0) {
        setStudents(data.students)
        setPhase('select')
      } else {
        setMessage('找不到學員名單，請確認連結是否正確')
        setPhase('error')
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '初始化失敗')
      setPhase('liff-error')
    }
  }, [liffId, courseId, companyId, profileId, doBind])

  useEffect(() => { initLiff() }, [initLiff])

  function handleSelect(student: Student) {
    if (!lineProfile) return
    doBind(student.id, lineProfile.userId)
  }

  const filtered = search
    ? students.filter(s => s.name.includes(search))
    : students

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white px-4 py-8">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">LINE 快速綁定</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAutoMode ? '綁定中，請稍候...' : '點選您的姓名即可完成綁定'}
          </p>
        </div>

        {/* Loading */}
        {(phase === 'loading' || phase === 'binding') && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {phase === 'loading' ? '正在連接 LINE...' : '綁定中...'}
            </p>
          </div>
        )}

        {/* LINE profile info */}
        {lineProfile && phase === 'select' && (
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4">
            {lineProfile.pictureUrl ? (
              <img src={lineProfile.pictureUrl} alt="" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-700 font-bold">{lineProfile.displayName.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{lineProfile.displayName}</p>
              <p className="text-xs text-gray-400">LINE 帳號</p>
            </div>
          </div>
        )}

        {/* Student selection */}
        {phase === 'select' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-700">請點選您的姓名</p>
              {students.length > 8 && (
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="搜尋姓名..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {filtered.map(student => (
                <button
                  key={student.id}
                  onClick={() => handleSelect(student)}
                  disabled={student.bound}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-600">{student.name.charAt(0)}</span>
                    </div>
                    <span className="text-sm text-gray-900">{student.name}</span>
                  </div>
                  {student.bound && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">已綁定</span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">找不到符合的姓名</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success */}
        {phase === 'success' && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-green-700">
              {boundName ? `${boundName}，綁定成功！` : '綁定成功！'}
            </p>
            <p className="text-sm text-gray-500 mt-2">之後會透過 LINE 通知您課程相關資訊</p>
            <p className="text-xs text-gray-400 mt-3">可以關閉此頁面了</p>
          </div>
        )}

        {/* Error */}
        {(phase === 'error' || phase === 'liff-error') && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm text-red-600">{message}</p>
            {phase === 'liff-error' && (
              <p className="text-xs text-gray-400 mt-2">請確認是否在 LINE App 中開啟此頁面</p>
            )}
            {phase === 'error' && !isAutoMode && (
              <button
                onClick={() => setPhase('select')}
                className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                返回重試
              </button>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">ID3A 管理平台</p>
      </div>
    </div>
  )
}
