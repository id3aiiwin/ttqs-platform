'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Signer {
  id: string
  signer_role: string
  signer_name: string | null
  signature_url: string | null
  profile_id: string | null
}

interface Props {
  companyId: string
  signers: Signer[]
  isConsultant: boolean
}

const DEFAULT_ROLES = ['承辦人', '主管', '總經理']

export function SignatureManager({ companyId, signers, isConsultant }: Props) {
  const [uploading, setUploading] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  async function handleUploadSignature(signerId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(signerId)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', `companies/${companyId}/signatures`)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.path) {
        await fetch('/api/company-signers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: signerId, signature_url: data.path }),
        })
        router.refresh()
      } else {
        alert(data.error || '上傳失敗')
      }
    } catch { alert('上傳失敗') }
    setUploading(null)
    e.target.value = ''
  }

  async function handleUpdateName(signerId: string, name: string) {
    await fetch('/api/company-signers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: signerId, signer_name: name }),
    })
    router.refresh()
  }

  async function handleAddRole(role: string) {
    startTransition(async () => {
      await fetch('/api/company-signers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, signer_role: role }),
      })
      router.refresh()
    })
  }

  async function handleInitDefaults() {
    startTransition(async () => {
      for (const role of DEFAULT_ROLES) {
        if (!signers.find((s) => s.signer_role === role)) {
          await fetch('/api/company-signers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: companyId, signer_role: role, sort_order: DEFAULT_ROLES.indexOf(role) }),
          })
        }
      }
      router.refresh()
    })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (signers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400 mb-3">尚未設定簽核人</p>
        {isConsultant && (
          <button onClick={handleInitDefaults} disabled={pending}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            {pending ? '建立中...' : '建立預設簽核人（承辦人、主管、總經理）'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {signers.map((s) => (
        <div key={s.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {/* 簽核角色 */}
          <span className="text-sm font-medium text-gray-700 w-16 flex-shrink-0">{s.signer_role}</span>

          {/* 簽核人姓名 */}
          <input
            type="text"
            defaultValue={s.signer_name ?? ''}
            onBlur={(e) => e.target.value !== (s.signer_name ?? '') && handleUpdateName(s.id, e.target.value)}
            placeholder="姓名"
            disabled={!isConsultant}
            className="w-24 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-white"
          />

          {/* 簽名圖檔 */}
          <div className="flex-1">
            {s.signature_url ? (
              <div className="flex items-center gap-3">
                <div className="h-12 bg-white border border-gray-200 rounded px-2 flex items-center">
                  <img
                    src={`/api/download?path=${encodeURIComponent(s.signature_url)}`}
                    alt={`${s.signer_role}簽名`}
                    className="h-10 max-w-[120px] object-contain"
                  />
                </div>
                {isConsultant && (
                  <label className="text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer">
                    {uploading === s.id ? '上傳中...' : '更換'}
                    <input type="file" className="hidden" accept="image/*"
                      onChange={(e) => handleUploadSignature(s.id, e)} disabled={uploading === s.id} />
                  </label>
                )}
              </div>
            ) : (
              <label className={`flex items-center gap-2 p-2 border-2 border-dashed rounded cursor-pointer transition-colors
                ${isConsultant ? 'border-gray-300 hover:border-indigo-300' : 'border-gray-200 cursor-not-allowed'}`}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                </svg>
                <span className="text-xs text-gray-400">
                  {uploading === s.id ? '上傳中...' : '上傳簽名圖檔'}
                </span>
                {isConsultant && (
                  <input type="file" className="hidden" accept="image/*"
                    onChange={(e) => handleUploadSignature(s.id, e)} disabled={uploading === s.id} />
                )}
              </label>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
