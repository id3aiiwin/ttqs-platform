'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function DocCodeSetting({ companyId, currentCode }: { companyId: string; currentCode: string | null }) {
  const [code, setCode] = useState(currentCode ?? '')
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  function handleSave() {
    startTransition(async () => {
      const res = await fetch('/api/company-doc-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, doc_code: code.trim().toUpperCase() }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); router.refresh() }
      else alert('儲存失敗')
    })
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-3">
        企業代碼用於文件編號中的 [企業代碼] 位置。
        例如設定「AE」，文件編號就會顯示為 1QM-AE-001。
      </p>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 block mb-1">企業文件代碼</label>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="例如：AE、WF、TR"
            maxLength={10}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono uppercase" />
        </div>
        <div className="pt-6">
          <Button size="sm" loading={pending} onClick={handleSave} disabled={!code.trim()}>儲存</Button>
        </div>
      </div>
      {saved && <p className="text-xs text-green-600 mt-1">已儲存</p>}
      {!currentCode && (
        <p className="text-xs text-amber-500 mt-2">尚未設定企業代碼，套用知識庫範本時文件編號會顯示 [請設定企業代碼]</p>
      )}
      {currentCode && (
        <p className="text-xs text-gray-400 mt-2">
          文件編號範例：1QM-{currentCode}-001、3WI-{currentCode}-4-1-1
        </p>
      )}
    </div>
  )
}
