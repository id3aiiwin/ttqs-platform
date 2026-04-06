'use client'

import { useState } from 'react'

export function LineBindClient({ lineUserId }: { lineUserId: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleBind(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    try {
      const res = await fetch('/api/line-bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), line_user_id: lineUserId }),
      })
      const data = await res.json()
      if (data.ok) {
        setStatus('success')
        setMessage(data.name ? `${data.name}，綁定成功！` : '綁定成功！')
      } else {
        setStatus('error')
        setMessage(data.error || '綁定失敗')
      }
    } catch {
      setStatus('error')
      setMessage('網路錯誤，請稍後重試')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white px-4">
      <div className="w-full max-w-sm">
        {/* LINE Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">LINE 帳號綁定</h1>
          <p className="text-sm text-gray-500 mt-1">綁定後即可接收課程通知</p>
        </div>

        {status === 'success' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-green-700">{message}</p>
            <p className="text-sm text-gray-500 mt-2">您現在可以關閉此頁面，回到 LINE 聊天室。</p>
          </div>
        ) : (
          <form onSubmit={handleBind} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                請輸入您在平台上的 Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1.5">
                請使用您註冊 ID3A 管理平台時的 Email
              </p>
            </div>

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                <p className="text-sm text-red-600">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !email.trim()}
              className="w-full py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {status === 'loading' ? '綁定中...' : '確認綁定'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          ID3A 管理平台
        </p>
      </div>
    </div>
  )
}
