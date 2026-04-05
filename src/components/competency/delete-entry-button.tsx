'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteFormEntry } from '@/app/(dashboard)/companies/[id]/competency/actions'

export function DeleteEntryButton({ entryId, companyId, employeeName }: {
  entryId: string
  companyId: string
  employeeName: string
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`確定刪除「${employeeName}」的表單？此操作無法復原。`)) return
    startTransition(async () => {
      await deleteFormEntry(entryId, companyId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 px-2 py-1"
    >
      {pending ? '...' : '刪除'}
    </button>
  )
}
