'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Company, Course } from '@/types/database'

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'planned', label: '已規劃' },
  { value: 'in_progress', label: '進行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

type FormState = { error?: string; fieldErrors?: Record<string, string> } | null

interface CourseFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  companies: Pick<Company, 'id' | 'name'>[]
  defaultValues?: Partial<Course>
  submitLabel?: string
  defaultCompanyId?: string
  pendingTemplatesByCompany?: Record<string, number>
}

export function CourseForm({ action, companies, defaultValues, submitLabel = '儲存', defaultCompanyId, pendingTemplatesByCompany }: CourseFormProps) {
  const [state, formAction, pending] = useActionState(action, null)
  const [courseType, setCourseType] = useState(defaultValues?.course_type ?? 'enterprise')
  const [selectedCompany, setSelectedCompany] = useState(defaultValues?.company_id ?? defaultCompanyId ?? '')

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }))
  const pendingCount = pendingTemplatesByCompany?.[selectedCompany] ?? 0

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* 課程類型 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">課程類型</label>
        <div className="flex gap-3">
          <button type="button" onClick={() => setCourseType('enterprise')}
            className={`flex-1 rounded-lg border-2 p-3 text-center text-sm transition-all ${courseType === 'enterprise' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            <span className="block text-base mb-0.5">🏢</span>
            企業內訓
          </button>
          <button type="button" onClick={() => { setCourseType('public'); setSelectedCompany('') }}
            className={`flex-1 rounded-lg border-2 p-3 text-center text-sm transition-all ${courseType === 'public' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            <span className="block text-base mb-0.5">🎓</span>
            公開課
          </button>
        </div>
        <input type="hidden" name="course_type" value={courseType} />
      </div>

      <Input
        id="title"
        name="title"
        label="課程名稱 *"
        placeholder="例：安全衛生教育訓練"
        defaultValue={defaultValues?.title ?? ''}
        error={state?.fieldErrors?.title}
        required
      />

      {courseType === 'enterprise' && (
        <Select
          id="company_id"
          name="company_id"
          label="企業 *"
          options={companyOptions}
          placeholder="請選擇企業"
          defaultValue={defaultValues?.company_id ?? defaultCompanyId ?? ''}
          error={state?.fieldErrors?.company_id}
          onChange={(e) => setSelectedCompany(e.target.value)}
        />
      )}

      {pendingCount > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span>此企業的表單模板有 {pendingCount} 個項目尚未確認，建議先至表單模板設定完成確認。</span>
        </div>
      )}

      <Textarea
        id="description"
        name="description"
        label="課程說明"
        placeholder="課程目標、內容概述..."
        defaultValue={defaultValues?.description ?? ''}
        rows={3}
      />

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">執行資訊</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="status"
            name="status"
            label="狀態"
            options={STATUS_OPTIONS}
            defaultValue={defaultValues?.status ?? 'draft'}
          />
          <Input
            id="trainer"
            name="trainer"
            label="講師"
            placeholder="講師姓名或機構"
            defaultValue={defaultValues?.trainer ?? ''}
          />
          <Input
            id="start_date"
            name="start_date"
            type="date"
            label="開始日期"
            defaultValue={defaultValues?.start_date ?? ''}
          />
          <Input
            id="end_date"
            name="end_date"
            type="date"
            label="結束日期"
            defaultValue={defaultValues?.end_date ?? ''}
          />
          <Input
            id="hours"
            name="hours"
            type="number"
            label="訓練時數"
            placeholder="0"
            step="0.5"
            min="0"
            defaultValue={defaultValues?.hours?.toString() ?? ''}
          />
          <Input
            id="budget"
            name="budget"
            type="number"
            label="預算（元）"
            placeholder="0"
            min="0"
            defaultValue={defaultValues?.budget?.toString() ?? ''}
          />
          {courseType === 'public' && (
            <Input
              id="default_fee"
              name="default_fee"
              type="number"
              label="預設報名費（元）"
              placeholder="0"
              min="0"
              defaultValue={defaultValues?.default_fee?.toString() ?? ''}
            />
          )}
        </div>
      </div>

      {courseType === 'enterprise' && (
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-3">
          建立課程後，系統會自動產生 PDDRO 五構面（Plan / Design / Do / Review / Outcome）的完整表單清單。
        </p>
      )}

      {courseType === 'public' && (
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-3">
          公開課不產生 PDDRO 表單，可設定預設費用並管理學員報名。
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => history.back()}>
          取消
        </Button>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
