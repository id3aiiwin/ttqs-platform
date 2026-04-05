'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ensurePlan, lockPlan, unlockPlan, importFromLastYear } from '@/app/(dashboard)/companies/[id]/ttqs-plan/actions'
import { Button } from '@/components/ui/button'

export function PlanActions({ companyId, year, planId, planStatus, isConsultant }: {
  companyId: string; year: number; planId: string | null; planStatus: string | null; isConsultant: boolean
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleCreate() {
    startTransition(async () => {
      await ensurePlan(companyId, year)
      router.refresh()
    })
  }

  function handleImport() {
    if (!confirm(`確定要匯入 ${year - 1} 年的填寫內容嗎？匯入後可以繼續修改。`)) return
    startTransition(async () => {
      const result = await importFromLastYear(companyId, year) as { error?: string; imported?: number }
      if (result.error) alert(result.error)
      else alert(`已匯入 ${result.imported ?? 0} 個指標`)
      router.refresh()
    })
  }

  function handleLock() {
    if (!planId || !confirm('確定鎖定？鎖定後 HR 無法修改。')) return
    startTransition(async () => { await lockPlan(planId, companyId); router.refresh() })
  }

  function handleUnlock() {
    if (!planId) return
    startTransition(async () => { await unlockPlan(planId, companyId); router.refresh() })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {!planId && (
          <>
            <Button size="sm" loading={pending} onClick={handleCreate}>建立本年度</Button>
            <Button size="sm" variant="secondary" loading={pending} onClick={handleImport}>
              從 {year - 1} 年匯入
            </Button>
          </>
        )}
        {planId && isConsultant && planStatus !== 'locked' && (
          <Button size="sm" variant="secondary" loading={pending} onClick={handleLock}>鎖定歸檔</Button>
        )}
        {planId && isConsultant && planStatus === 'locked' && (
          <Button size="sm" variant="ghost" loading={pending} onClick={handleUnlock}>解鎖</Button>
        )}
        {planId && planStatus !== 'locked' && (
          <Button size="sm" variant="secondary" loading={pending} onClick={handleImport}>
            從 {year - 1} 年匯入
          </Button>
        )}
      </div>
      {planId && isConsultant && planStatus !== 'locked' && (
        <p className="text-xs text-gray-400">鎖定後 HR 無法修改，確保評核文件為最終版本。顧問可隨時解鎖。</p>
      )}
    </div>
  )
}
