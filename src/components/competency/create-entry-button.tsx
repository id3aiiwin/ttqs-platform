'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createFormEntry } from '@/app/(dashboard)/companies/[id]/competency/actions'
import { Button } from '@/components/ui/button'

interface CreateEntryButtonProps {
  companyId: string
  formType: 'job_analysis' | 'job_description' | 'competency_standard' | 'competency_assessment'
  people: { id: string; name: string }[]
}

export function CreateEntryButton({ companyId, formType, people }: CreateEntryButtonProps) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleCreate() {
    if (!selectedId) return
    startTransition(async () => {
      const result = await createFormEntry(companyId, selectedId, formType)
      if (result?.entryId) {
        router.push(`/companies/${companyId}/competency/entries/${result.entryId}`)
      } else {
        router.refresh()
      }
      setOpen(false)
      setSelectedId('')
    })
  }

  if (!open) {
    return <Button size="sm" onClick={() => setOpen(true)}>+ 新增</Button>
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
      >
        <option value="">選擇人員...</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <Button size="sm" loading={pending} onClick={handleCreate} disabled={!selectedId}>
        建立
      </Button>
      <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setSelectedId('') }}>
        取消
      </Button>
    </div>
  )
}
