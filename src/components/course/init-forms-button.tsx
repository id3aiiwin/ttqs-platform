'use client'

import { useTransition } from 'react'
import { initCourseForms } from '@/app/(dashboard)/courses/form-actions'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function InitFormsButton({ courseId }: { courseId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button
      size="sm"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          await initCourseForms(courseId)
          router.refresh()
        })
      }
    >
      載入預設表單
    </Button>
  )
}
