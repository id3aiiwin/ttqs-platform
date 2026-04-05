/**
 * PDDRO 表單欄位定義型別系統
 * 用於定義表單結構（field_schema）和儲存表單回應（form_data）
 */

export type PddroFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'rating'
  | 'repeating_group'
  | 'file_upload'
  | 'signature'
  | 'section_header'
  | 'static_text'

export interface FormFieldOption {
  label: string
  value: string
}

export interface FormFieldDefinition {
  id: string
  label: string
  type: PddroFieldType
  required?: boolean
  placeholder?: string
  description?: string
  default_value?: unknown
  /** 自動帶入課程資料，如 "course.title", "course.start_date", "course.trainer" */
  auto_populate?: string
  /** radio / checkbox / select 的選項 */
  options?: FormFieldOption[]
  /** number / rating 的最小值 */
  min?: number
  /** number / rating 的最大值 */
  max?: number
  /** repeating_group 的子欄位 */
  fields?: FormFieldDefinition[]
  /** repeating_group 最少列數 */
  min_rows?: number
  /** repeating_group 最多列數 */
  max_rows?: number
  /** 版面提示：佔幾欄（1-4 grid columns） */
  columns?: number
  /** 條件顯示 */
  condition?: {
    field_id: string
    operator: 'eq' | 'neq' | 'in'
    value: unknown
  }
  /** signature 欄位的簽核人 */
  signers?: string[]
}

export interface FormSection {
  id: string
  title?: string
  description?: string
  fields: FormFieldDefinition[]
}

export interface FormSchema {
  /** 表單標題，可含 {company_name} placeholder */
  title: string
  /** 表單副標題，如表號 */
  subtitle?: string
  /** 表單區段 */
  sections: FormSection[]
}

/** 表單回應資料，存入 course_forms.form_data */
export type FormResponseData = Record<string, unknown>

/** 自動帶入的課程上下文 */
export interface FormAutoPopulateContext {
  company_name?: string
  course_title?: string
  course_start_date?: string
  course_end_date?: string
  course_hours?: number
  course_time?: string
  course_trainer?: string
  course_venue?: string
  course_target?: string
}
