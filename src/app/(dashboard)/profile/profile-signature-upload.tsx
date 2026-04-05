'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  profileId: string
  currentSignatureUrl: string | null
}

export function ProfileSignatureUpload({ profileId, currentSignatureUrl }: Props) {
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', `profiles/${profileId}/signature`)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.path) {
        // 更新 profile 的 signature_url
        await fetch('/api/profile-signature', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_id: profileId, signature_url: data.path }),
        })
        router.refresh()
      } else {
        alert(data.error || '上傳失敗')
      }
    } catch {
      alert('上傳失敗')
    }
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div>
      {currentSignatureUrl ? (
        <div className="flex items-center gap-4">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
            <img
              src={`/api/download?path=${encodeURIComponent(currentSignatureUrl)}`}
              alt="我的簽名"
              className="h-16 max-w-[200px] object-contain"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              已上傳簽名
            </span>
            <label className="text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer font-medium">
              {uploading ? '上傳中...' : '更換簽名'}
              <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>
      ) : (
        <label className={`flex items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors
          ${uploading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-sm text-gray-500">{uploading ? '上傳中...' : '點擊上傳簽名圖檔'}</p>
            <p className="text-xs text-gray-400">建議使用透明背景的 PNG 圖檔</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
        </label>
      )}
    </div>
  )
}
