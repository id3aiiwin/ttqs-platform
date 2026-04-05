'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSurvey, toggleSurvey } from '@/app/(dashboard)/courses/survey-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SurveyManagerProps {
  courseId: string; companyId: string
  survey: { id: string; is_active: boolean } | null
  responseCount: number
}

export function SurveyManager({ courseId, companyId, survey, responseCount }: SurveyManagerProps) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleCreate() {
    startTransition(async () => {
      await createSurvey(courseId)
      router.refresh()
    })
  }

  function handleToggle() {
    if (!survey) return
    startTransition(async () => {
      await toggleSurvey(survey.id, !survey.is_active)
      router.refresh()
    })
  }

  const surveyUrl = survey ? `${typeof window !== 'undefined' ? window.location.origin : ''}/survey/${survey.id}` : ''

  if (!survey) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-400 mb-3">尚未建立課後問卷</p>
        <Button size="sm" loading={pending} onClick={handleCreate}>建立問卷</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={survey.is_active ? 'success' : 'default'}>
            {survey.is_active ? '開放中' : '已關閉'}
          </Badge>
          <span className="text-sm text-gray-500">已收 {responseCount} 份</span>
        </div>
        <Button size="sm" variant="secondary" loading={pending} onClick={handleToggle}>
          {survey.is_active ? '關閉問卷' : '重新開放'}
        </Button>
      </div>

      {/* QR Code 連結 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-1">問卷連結（可生成 QR Code）</p>
        <div className="flex items-center gap-2">
          <input readOnly value={surveyUrl}
            className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-700" />
          <button onClick={() => { navigator.clipboard.writeText(surveyUrl); alert('已複製連結') }}
            className="text-xs text-indigo-600 hover:text-indigo-700 whitespace-nowrap">
            複製
          </button>
        </div>
      </div>

      <a href={`/companies/${companyId}/courses/${courseId}/survey-results`}
        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
        查看問卷統計 →
      </a>
    </div>
  )
}
