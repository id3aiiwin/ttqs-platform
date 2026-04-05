'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function OrgChartUpload({ companyId }: { companyId: string }) {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const router = useRouter()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', `companies/${companyId}/org-chart`)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.path) {
        setImageUrl(data.path)
        // 存到 company 的 annual_settings
        await fetch('/api/company-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_id: companyId, org_chart_url: data.path }),
        })
        router.refresh()
      }
    } catch { alert('上傳失敗') }
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div>
      {imageUrl ? (
        <div>
          <img src={`/api/download?path=${encodeURIComponent(imageUrl)}`} alt="組織圖" className="max-w-full rounded-lg border border-gray-200" />
          <label className="text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer mt-2 inline-block">
            {uploading ? '上傳中...' : '更換組織圖'}
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
          </label>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors">
          <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-gray-500">{uploading ? '上傳中...' : '點擊上傳組織圖'}</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
        </label>
      )}
    </div>
  )
}
