import type { FormSchema, FormResponseData, FormAutoPopulateContext, FormFieldDefinition } from '@/types/form-schema'

const POPULATE_MAP: Record<string, keyof FormAutoPopulateContext> = {
  'course.title': 'course_title',
  'course.start_date': 'course_start_date',
  'course.end_date': 'course_end_date',
  'course.hours': 'course_hours',
  'course.time': 'course_time',
  'course.trainer': 'course_trainer',
  'course.venue': 'course_venue',
  'course.target': 'course_target',
  'company.name': 'company_name',
}

function populateFields(fields: FormFieldDefinition[], ctx: FormAutoPopulateContext, data: FormResponseData) {
  for (const field of fields) {
    if (field.auto_populate && !data[field.id]) {
      const key = POPULATE_MAP[field.auto_populate]
      if (key && ctx[key] != null) {
        data[field.id] = String(ctx[key])
      }
    }
    // repeating_group 不自動帶入（每列由使用者新增）
  }
}

/** 根據課程資料自動帶入表單欄位的預設值 */
export function autoPopulateFormData(
  schema: FormSchema,
  ctx: FormAutoPopulateContext,
  existingData?: FormResponseData
): FormResponseData {
  const data: FormResponseData = { ...existingData }

  for (const section of schema.sections) {
    populateFields(section.fields, ctx, data)
  }

  return data
}
