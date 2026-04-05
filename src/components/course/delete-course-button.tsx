'use client'

import { useState, useTransition } from 'react'
import { deleteCourse } from '@/app/(dashboard)/courses/actions'
import { Button } from '@/components/ui/button'

export function DeleteCourseButton({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [confirm, setConfirm] = useState(false)
  const [pending, startTransition] = useTransition()

  if (!confirm) {
    return <Button variant="danger" size="sm" onClick={() => setConfirm(true)}>刪除課程</Button>
  }

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-red-600">確定刪除「{courseTitle}」？</p>
      <Button variant="danger" size="sm" loading={pending}
        onClick={() => startTransition(async () => { await deleteCourse(courseId) })}>
        確認刪除
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>取消</Button>
    </div>
  )
}
