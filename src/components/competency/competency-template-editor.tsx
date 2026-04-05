'use client'

import { CompetencyFieldItem } from './competency-field-item'
import { AddCompetencyField } from './add-competency-field'

interface Field {
  id: string
  field_name: string
  standard_name: string | null
  display_name: string | null
  field_type: string
  is_required: boolean
  default_field_id: string | null
  sort_order: number
}

interface CompetencyTemplateEditorProps {
  companyId: string
  formType: string
  fields: Field[]
  isConsultant: boolean
}

export function CompetencyTemplateEditor({ companyId, formType, fields, isConsultant }: CompetencyTemplateEditorProps) {
  return (
    <div>
      {fields.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">
          此表單類型尚無欄位
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {fields.map((field, idx) => (
            <CompetencyFieldItem
              key={field.id}
              field={field}
              index={idx}
              companyId={companyId}
              isConsultant={isConsultant}
            />
          ))}
        </div>
      )}
      {isConsultant && (
        <div className="p-4 border-t border-gray-100">
          <AddCompetencyField companyId={companyId} formType={formType} />
        </div>
      )}
    </div>
  )
}
