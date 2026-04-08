'use client'

import { useState, useEffect } from 'react'

interface Student {
  id: string
  name: string
  bound: boolean
}

interface LineBindQRCodeProps {
  courseId?: string
  companyId?: string
  label: string
}

export function LineBindQRCode({ courseId, companyId, label }: LineBindQRCodeProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'menu' | 'single' | 'print'>('menu')
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID

  function buildUrl(profileId?: string) {
    const params = new URLSearchParams()
    if (profileId) {
      params.set('pid', profileId)
    } else {
      if (courseId) params.set('course_id', courseId)
      if (companyId) params.set('company_id', companyId)
    }
    return liffId
      ? `https://liff.line.me/${liffId}?${params}`
      : `${window.location.origin}/liff-bind?${params}`
  }

  function qrImgUrl(url: string, size = 200) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=4`
  }

  async function loadStudents() {
    if (students.length > 0) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (courseId) params.set('course_id', courseId)
      if (companyId) params.set('company_id', companyId)
      const res = await fetch(`/api/line-bind-list?${params}`)
      const data = await res.json()
      setStudents(data.students ?? [])
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    loadStudents().then(() => setMode('print'))
  }

  // 列印模式啟動瀏覽器列印
  useEffect(() => {
    if (mode === 'print' && students.length > 0 && !loading) {
      // 等圖片載入後列印
      const timer = setTimeout(() => window.print(), 800)
      return () => clearTimeout(timer)
    }
  }, [mode, students, loading])

  const groupQrUrl = buildUrl()

  return (
    <>
      <button
        onClick={() => { setOpen(true); setMode('menu') }}
        className="text-xs text-green-600 hover:text-green-700 border border-green-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
        LINE 綁定
      </button>

      {/* Modal */}
      {open && mode !== 'print' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">LINE 綁定</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {mode === 'menu' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">{label}</p>

                {/* 選項 1：團體 QR Code */}
                <button
                  onClick={() => setMode('single')}
                  className="w-full text-left bg-green-50 border border-green-200 rounded-xl p-4 hover:bg-green-100 transition-colors"
                >
                  <p className="text-sm font-semibold text-green-800">投影用 QR Code</p>
                  <p className="text-xs text-green-600 mt-1">一個 QR Code，學員掃碼後選自己的名字</p>
                </button>

                {/* 選項 2：個人 QR Code 列印 */}
                <button
                  onClick={handlePrint}
                  className="w-full text-left bg-indigo-50 border border-indigo-200 rounded-xl p-4 hover:bg-indigo-100 transition-colors"
                >
                  <p className="text-sm font-semibold text-indigo-800">列印個人 QR Code</p>
                  <p className="text-xs text-indigo-600 mt-1">每人一個專屬 QR Code，掃碼直接綁定，零操作</p>
                </button>
              </div>
            )}

            {mode === 'single' && (
              <>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <img
                    src={qrImgUrl(groupQrUrl, 240)}
                    alt="QR Code"
                    width={240}
                    height={240}
                    className="mx-auto rounded-lg"
                  />
                </div>
                <div className="text-center space-y-2 mb-4">
                  <p className="text-xs text-gray-500">請學員用 LINE 掃描此 QR Code</p>
                  <p className="text-xs text-gray-400">掃碼後選擇自己的名字即可綁定</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('menu')}
                    className="flex-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg py-2 transition-colors"
                  >
                    返回
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(groupQrUrl)}
                    className="flex-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg py-2 transition-colors"
                  >
                    複製連結
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 列印專用頁面 - 覆蓋全螢幕，列印後自動顯示 */}
      {mode === 'print' && (
        <div className="fixed inset-0 z-[100] bg-white overflow-auto print-qr-sheet">
          <style>{`
            @media print {
              body > *:not(.print-qr-sheet) { display: none !important; }
              .print-qr-sheet { position: static !important; }
              .no-print { display: none !important; }
            }
          `}</style>

          {/* 關閉按鈕（不列印） */}
          <div className="no-print fixed top-4 right-4 z-10">
            <button
              onClick={() => { setMode('menu') }}
              className="bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 shadow"
            >
              關閉
            </button>
          </div>

          <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-xl font-bold text-gray-900 mb-1">LINE 綁定 QR Code</h1>
            <p className="text-sm text-gray-500 mb-6">請用 LINE 掃描您姓名旁的 QR Code 完成綁定</p>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">載入中...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {students.filter(s => !s.bound).map(student => (
                  <div key={student.id} className="border border-gray-200 rounded-xl p-4 text-center">
                    <img
                      src={qrImgUrl(buildUrl(student.id), 150)}
                      alt={student.name}
                      width={150}
                      height={150}
                      className="mx-auto mb-2"
                    />
                    <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                  </div>
                ))}
              </div>
            )}

            {!loading && students.filter(s => s.bound).length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400 mb-2">
                  以下 {students.filter(s => s.bound).length} 位已綁定，不需重複掃碼
                </p>
                <div className="flex flex-wrap gap-2">
                  {students.filter(s => s.bound).map(s => (
                    <span key={s.id} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">{s.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
