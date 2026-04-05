'use client'

import { useState } from 'react'
import { PDDRO_DEFAULT_FORMS, FORM_TYPE_LABELS, FORM_STATUS_LABELS } from '@/lib/pddro-defaults'
import { PddroFormItem } from './pddro-form-item'
import { AddFormItem } from './add-form-item'
import type { CourseForm } from '@/types/database'

const PHASE_HEADER_COLOR: Record<string, string> = {
  P:  'border-l-blue-500',
  D:  'border-l-purple-500',
  DO: 'border-l-orange-500',
  R:  'border-l-yellow-500',
  O:  'border-l-green-500',
}

interface PddroFormSectionProps {
  phase: 'P' | 'D' | 'DO' | 'R' | 'O'
  forms: CourseForm[]
  courseId: string
  isConsultant: boolean
}

export function PddroFormSection({ phase, forms, courseId, isConsultant }: PddroFormSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const phaseInfo = PDDRO_DEFAULT_FORMS[phase]
  const completed = forms.filter((f) => f.status === 'completed').length

  return (
    <div className={`border-l-4 ${PHASE_HEADER_COLOR[phase]}`}>
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">
            {phase}
          </span>
          <span className="text-sm text-gray-500">{phaseInfo?.label}</span>
          <span className="text-xs text-gray-400">
            {completed}/{forms.length}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Forms list */}
      {expanded && (
        <div className="pb-2">
          {forms.map((form) => (
            <PddroFormItem
              key={form.id}
              form={form}
              courseId={courseId}
              isConsultant={isConsultant}
            />
          ))}
          {isConsultant && (
            <AddFormItem courseId={courseId} phase={phase} />
          )}
        </div>
      )}
    </div>
  )
}
