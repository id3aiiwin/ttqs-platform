'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { initCompetencyTemplates } from '@/app/(dashboard)/companies/[id]/competency/actions'
import { Button } from '@/components/ui/button'

export function InitCompetencyButton({ companyId }: { companyId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          await initCompetencyTemplates(companyId)
          router.refresh()
        })
      }
    >
      載入公版職能表單
    </Button>
  )
}
