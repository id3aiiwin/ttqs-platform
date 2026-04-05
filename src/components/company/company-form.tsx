'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Company } from '@/types/database'

const STATUS_OPTIONS = [
  { value: 'pending', label: '待確認' },
  { value: 'active', label: '輔導中' },
  { value: 'inactive', label: '已結案' },
]

const TTQS_OPTIONS = [
  { value: '', label: '無' },
  { value: 'bronze', label: '銅牌' },
  { value: 'silver', label: '銀牌' },
  { value: 'gold', label: '金牌' },
]

type FormState = { error?: string; fieldErrors?: Record<string, string> } | null

interface CompanyFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  defaultValues?: Partial<Company>
  submitLabel?: string
}

export function CompanyForm({ action, defaultValues, submitLabel = '儲存' }: CompanyFormProps) {
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <Input
        id="name"
        name="name"
        label="企業名稱 *"
        placeholder="例：台灣科技股份有限公司"
        defaultValue={defaultValues?.name ?? ''}
        error={state?.fieldErrors?.name}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="industry"
          name="industry"
          label="產業別"
          placeholder="例：製造業、服務業"
          defaultValue={defaultValues?.industry ?? ''}
        />
        <Select
          id="status"
          name="status"
          label="輔導狀態"
          options={STATUS_OPTIONS}
          defaultValue={defaultValues?.status ?? 'pending'}
        />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">聯絡資訊</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="contact_person"
            name="contact_person"
            label="聯絡人"
            placeholder="姓名"
            defaultValue={defaultValues?.contact_person ?? ''}
          />
          <Input
            id="contact_phone"
            name="contact_phone"
            label="電話"
            placeholder="0x-xxxxxxxx"
            defaultValue={defaultValues?.contact_phone ?? ''}
          />
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            label="Email"
            placeholder="contact@company.com"
            defaultValue={defaultValues?.contact_email ?? ''}
            error={state?.fieldErrors?.contact_email}
            className="sm:col-span-2"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">TTQS 認證</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="ttqs_level"
            name="ttqs_level"
            label="認證等級"
            options={TTQS_OPTIONS}
            defaultValue={defaultValues?.ttqs_level ?? ''}
          />
          <Input
            id="ttqs_expiry_date"
            name="ttqs_expiry_date"
            type="date"
            label="到期日"
            defaultValue={defaultValues?.ttqs_expiry_date ?? ''}
          />
        </div>
      </div>

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
