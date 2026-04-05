'use client'

import { useTransition } from 'react'
import { duplicateCourse } from '@/app/(dashboard)/courses/actions'

export function DuplicateCourseButton({ courseId }: { courseId: string }) {
  const [pending, startTransition] = useTransition()

  function handleDuplicate() {
    if (!confirm('確定要複製此課程？將建立一個草稿副本。')) return
    startTransition(() => duplicateCourse(courseId))
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={pending}
      className="text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1 disabled:opacity-50"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      {pending ? '複製中...' : '複製課程'}
    </button>
  )
}
