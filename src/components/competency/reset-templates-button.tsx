'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { resetCompetencyTemplates } from '@/app/(dashboard)/companies/[id]/competency/actions'

export function ResetTemplatesButton({ companyId }: { companyId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleReset() {
    if (!confirm('確定重新載入公版模板？這會覆蓋現有的企業自訂模板。')) return
    startTransition(async () => {
      await resetCompetencyTemplates(companyId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleReset}
      disabled={pending}
      className="text-xs text-amber-600 hover:text-amber-700 border border-amber-200 rounded-lg px-3 py-1.5 disabled:opacity-50"
    >
      {pending ? '載入中...' : '重新載入公版'}
    </button>
  )
}
