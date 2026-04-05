'use client'

import { useRouter } from 'next/navigation'
import { FormSchemaEditor } from '@/components/form-builder/form-schema-editor'
import { updateTemplateFieldSchema, resetTemplateToDefault } from '@/app/(dashboard)/companies/[id]/templates/actions'
import type { FormSchema } from '@/types/form-schema'

interface Props {
  templateId: string
  companyId: string
  schema: FormSchema
  companyName: string
  hasSystemDefault: boolean
}

export function FieldEditorClient({ templateId, companyId, schema, companyName, hasSystemDefault }: Props) {
  const router = useRouter()

  async function handleSave(updatedSchema: FormSchema) {
    const result = await updateTemplateFieldSchema(templateId, updatedSchema, companyId)
    if (result?.error) {
      alert('儲存失敗：' + result.error)
    } else {
      router.refresh()
    }
  }

  async function handleReset() {
    const result = await resetTemplateToDefault(templateId, companyId)
    if (result?.error) {
      alert('重置失敗：' + result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <FormSchemaEditor
      schema={schema}
      onSave={handleSave}
      onReset={hasSystemDefault ? handleReset : undefined}
      companyName={companyName}
    />
  )
}
