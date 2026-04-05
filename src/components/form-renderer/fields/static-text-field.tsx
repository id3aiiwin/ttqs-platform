import type { FormFieldDefinition } from '@/types/form-schema'

interface Props {
  field: FormFieldDefinition
}

export function StaticTextField({ field }: Props) {
  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-sm text-blue-700">{field.label}</p>
      {field.description && <p className="text-xs text-blue-500 mt-1">{field.description}</p>}
    </div>
  )
}
