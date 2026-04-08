'use client'

import { useState, useRef, useEffect } from 'react'

// Minimal QR code generation using Canvas + external API fallback
function QRCodeImage({ url, size = 240 }: { url: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [useImg, setUseImg] = useState(false)

  useEffect(() => {
    // Try to draw using a simple QR code via img
    setUseImg(true)
  }, [])

  if (useImg) {
    return (
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=8`}
        alt="QR Code"
        width={size}
        height={size}
        className="mx-auto rounded-lg"
      />
    )
  }

  return <canvas ref={canvasRef} width={size} height={size} className="mx-auto" />
}

interface LineBindQRCodeProps {
  courseId?: string
  companyId?: string
  label: string
}

export function LineBindQRCode({ courseId, companyId, label }: LineBindQRCodeProps) {
  const [open, setOpen] = useState(false)
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID

  const params = new URLSearchParams()
  if (courseId) params.set('course_id', courseId)
  if (companyId) params.set('company_id', companyId)

  // LIFF URL or fallback to direct page URL
  const bindUrl = liffId
    ? `https://liff.line.me/${liffId}?${params}`
    : `${window.location.origin}/liff-bind?${params}`

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-green-600 hover:text-green-700 border border-green-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
        LINE 綁定
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">LINE 綁定 QR Code</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">{label}</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <QRCodeImage url={bindUrl} />
            </div>

            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">請學員用 LINE 掃描此 QR Code</p>
              <p className="text-xs text-gray-400">掃碼後選擇自己的名字即可完成綁定</p>
            </div>

            {/* Copy URL fallback */}
            <button
              onClick={() => { navigator.clipboard.writeText(bindUrl) }}
              className="w-full mt-4 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg py-2 transition-colors"
            >
              複製綁定連結
            </button>
          </div>
        </div>
      )}
    </>
  )
}
