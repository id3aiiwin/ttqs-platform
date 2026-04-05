'use client'

import { useMemo } from 'react'
import { FormRenderer } from '@/components/form-renderer/form-renderer'
import { autoPopulateFormData } from '@/components/form-renderer/form-auto-populate'
import { saveFormData } from '@/app/(dashboard)/courses/form-actions'
import type { FormSchema, FormResponseData, FormAutoPopulateContext } from '@/types/form-schema'

interface Props {
  formId: string
  courseId: string
  schema: FormSchema
  initialData: FormResponseData
  companyName: string
  autoPopulateCtx: FormAutoPopulateContext
  isConsultant: boolean
}

export function FormFillingClient({
  formId,
  courseId,
  schema,
  initialData,
  companyName,
  autoPopulateCtx,
  isConsultant,
}: Props) {
  // 合併自動帶入的資料與已存的資料
  const mergedData = useMemo(
    () => autoPopulateFormData(schema, autoPopulateCtx, initialData),
    [schema, autoPopulateCtx, initialData]
  )

  async function handleSubmit(data: FormResponseData) {
    const result = await saveFormData(formId, courseId, data)
    if (result?.error) {
      alert('儲存失敗：' + result.error)
    }
  }

  return (
    <FormRenderer
      schema={schema}
      initialData={mergedData}
      onSubmit={handleSubmit}
      companyName={companyName}
    />
  )
}
