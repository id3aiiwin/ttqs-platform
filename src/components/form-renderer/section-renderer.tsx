'use client'

import type { FormSection, FormResponseData } from '@/types/form-schema'
import { FieldRenderer } from './field-renderer'

interface SectionRendererProps {
  section: FormSection
  formData: FormResponseData
  onChange: (fieldId: string, value: unknown) => void
  disabled?: boolean
  companyName?: string
}

export function SectionRenderer({ section, formData, onChange, disabled, companyName }: SectionRendererProps) {
  return (
    <div className="space-y-4">
      {section.title && (
        <div className="border-b border-gray-200 pb-2">
          <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
          {section.description && (
            <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {section.fields.map((field) => {
          const colSpan = field.columns
            ? `md:col-span-${field.columns}`
            : field.type === 'repeating_group' || field.type === 'textarea' || field.type === 'signature'
              ? 'md:col-span-4'
              : 'md:col-span-4'

          return (
            <div key={field.id} className={colSpan}>
              <FieldRenderer
                field={field}
                value={formData[field.id]}
                onChange={(val) => onChange(field.id, val)}
                disabled={disabled}
                formData={formData}
                companyName={companyName}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
