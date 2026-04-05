'use client'

import { useState, useTransition } from 'react'
import { deleteCompany } from '@/app/(dashboard)/companies/actions'
import { Button } from '@/components/ui/button'

interface DeleteCompanyButtonProps {
  companyId: string
  companyName: string
}

export function DeleteCompanyButton({ companyId, companyName }: DeleteCompanyButtonProps) {
  const [confirm, setConfirm] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteCompany(companyId)
    })
  }

  if (!confirm) {
    return (
      <Button variant="danger" size="sm" onClick={() => setConfirm(true)}>
        刪除企業
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-red-600">確定要刪除「{companyName}」？</p>
      <Button variant="danger" size="sm" loading={pending} onClick={handleDelete}>
        確認刪除
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>
        取消
      </Button>
    </div>
  )
}
