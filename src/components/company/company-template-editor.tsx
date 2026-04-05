'use client'

import { useState } from 'react'
import { PDDRO_DEFAULT_FORMS, FORM_TYPE_LABELS } from '@/lib/pddro-defaults'
import { TemplateItem } from './template-item'
import { AddTemplateItem } from './add-template-item'
import type { CompanyFormTemplate } from '@/types/database'

const PHASE_BORDER: Record<string, string> = {
  P:  'border-l-blue-500',
  D:  'border-l-purple-500',
  DO: 'border-l-orange-500',
  R:  'border-l-yellow-500',
  O:  'border-l-green-500',
}

interface CompanyTemplateEditorProps {
  companyId: string
  templates: CompanyFormTemplate[]
}

export function CompanyTemplateEditor({ companyId, templates }: CompanyTemplateEditorProps) {
  const phases = ['P', 'D', 'DO', 'R', 'O'] as const

  const byPhase: Record<string, CompanyFormTemplate[]> = {}
  phases.forEach((p) => { byPhase[p] = [] })
  templates.forEach((t) => {
    if (!byPhase[t.pddro_phase]) byPhase[t.pddro_phase] = []
    byPhase[t.pddro_phase].push(t)
  })

  return (
    <div className="divide-y divide-gray-100">
      {phases.map((phase) => (
        <TemplatePhaseSection
          key={phase}
          phase={phase}
          companyId={companyId}
          items={byPhase[phase]}
        />
      ))}
    </div>
  )
}

function TemplatePhaseSection({
  phase,
  companyId,
  items,
}: {
  phase: typeof PDDRO_DEFAULT_FORMS extends Record<string, unknown> ? string : never
  companyId: string
  items: CompanyFormTemplate[]
}) {
  const [expanded, setExpanded] = useState(true)
  const phaseInfo = PDDRO_DEFAULT_FORMS[phase as keyof typeof PDDRO_DEFAULT_FORMS]

  return (
    <div className={`border-l-4 ${PHASE_BORDER[phase] ?? ''}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">{phase}</span>
          <span className="text-sm text-gray-500">{phaseInfo?.label}</span>
          <span className="text-xs text-gray-400">{items.length} 項</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="pb-2">
          {items.map((item) => (
            <TemplateItem key={item.id} item={item} companyId={companyId} />
          ))}
          <AddTemplateItem companyId={companyId} phase={phase as 'P' | 'D' | 'DO' | 'R' | 'O'} />
        </div>
      )}
    </div>
  )
}
