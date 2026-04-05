'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteContract } from '@/app/(dashboard)/companies/[id]/contracts/actions'
import { ContractForm } from './contract-form'
import { Badge } from '@/components/ui/badge'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  negotiating: { label: '洽談中', variant: 'default' },
  signed: { label: '已簽約', variant: 'info' },
  active: { label: '執行中', variant: 'success' },
  closed: { label: '已結案', variant: 'default' },
  terminated: { label: '已終止', variant: 'danger' },
}
const TYPE_MAP: Record<string, string> = { consulting: '輔導合約', advisory: '顧問合約', training: '訓練合約', other: '其他' }

interface Contract {
  id: string
  contract_name: string
  contract_type: string
  plan_id: string | null
  signed_date: string | null
  start_date: string | null
  end_date: string | null
  amount: number | null
  file_url: string | null
  status: string
  notes: string | null
}

export function ContractListItem({ contract: c, companyId, plans, planMap }: {
  contract: Contract
  companyId: string
  plans: { id: string; name: string }[]
  planMap: Record<string, string>
}) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const st = STATUS_MAP[c.status] ?? STATUS_MAP.negotiating
  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 86400000)
  const isExpiring = c.end_date && new Date(c.end_date) <= in30 && new Date(c.end_date) > now
  const isExpired = c.end_date && new Date(c.end_date) < now

  function handleDelete() {
    if (!confirm(`確定刪除「${c.contract_name}」？`)) return
    startTransition(async () => { await deleteContract(c.id, companyId); router.refresh() })
  }

  if (editing) {
    return (
      <div className="px-6 py-4">
        <ContractForm companyId={companyId} defaultValues={c} plans={plans} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className="px-6 py-4 group">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900">{c.contract_name}</p>
            <Badge variant={st.variant}>{st.label}</Badge>
            {isExpiring && <Badge variant="warning">即將到期</Badge>}
            {isExpired && <Badge variant="danger">已到期</Badge>}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span>{TYPE_MAP[c.contract_type] ?? c.contract_type}</span>
            {c.plan_id && planMap[c.plan_id] && <span className="text-indigo-500">{planMap[c.plan_id]}</span>}
            {c.start_date && c.end_date && <span>{c.start_date} ~ {c.end_date}</span>}
            {c.amount && <span>NT$ {Number(c.amount).toLocaleString()}</span>}
          </div>
        </div>

        {/* 檔案下載 */}
        {c.file_url && (
          <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${c.file_url}`}
            target="_blank" rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            下載
          </a>
        )}

        <button onClick={() => setEditing(true)}
          className="text-xs text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity">
          編輯
        </button>
        <button onClick={handleDelete} disabled={pending}
          className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
          刪除
        </button>
      </div>
    </div>
  )
}
