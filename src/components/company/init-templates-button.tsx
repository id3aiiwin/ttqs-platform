'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { initCompanyTemplates } from '@/app/(dashboard)/companies/[id]/templates/actions'
import { Button } from '@/components/ui/button'

export function InitTemplatesButton({ companyId }: { companyId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          await initCompanyTemplates(companyId)
          router.refresh()
        })
      }
    >
      載入公版 PDDRO 表單
    </Button>
  )
}
