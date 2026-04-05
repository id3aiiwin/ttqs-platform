'use client'

import { useState } from 'react'
import type { FormFieldDefinition } from '@/types/form-schema'

interface Props {
  field: FormFieldDefinition
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function FileUploadField({ field, value, onChange, disabled }: Props) {
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('上傳失敗')

      const data = await res.json()
      onChange(data.url || data.path || file.name)
    } catch {
      alert('檔案上傳失敗，請重試')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-green-800 truncate flex-1">{value}</span>
          {!disabled && (
            <button type="button" onClick={() => onChange('')} className="text-xs text-red-500 hover:text-red-700">
              移除
            </button>
          )}
        </div>
      ) : (
        <label className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
          {uploading ? (
            <span className="text-sm text-gray-500">上傳中...</span>
          ) : (
            <>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-gray-500">點擊上傳檔案</span>
            </>
          )}
          <input type="file" className="hidden" onChange={handleUpload} disabled={disabled || uploading} />
        </label>
      )}
      {field.description && <p className="text-xs text-gray-400 mt-1">{field.description}</p>}
    </div>
  )
}
