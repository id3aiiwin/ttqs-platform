'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addContract, updateContract, addTrainingPlan } from '@/app/(dashboard)/companies/[id]/contracts/actions'
import { Button } from '@/components/ui/button'

interface ContractData {
  id?: string
  contract_name?: string
  contract_type?: string
  plan_id?: string | null
  signed_date?: string | null
  start_date?: string | null
  end_date?: string | null
  amount?: number | null
  file_url?: string | null
  status?: string
  notes?: string | null
}

export function ContractForm({ companyId, defaultValues, onCancel, plans: initialPlans }: {
  companyId: string
  defaultValues?: ContractData
  onCancel?: () => void
  plans?: { id: string; name: string }[]
}) {
  const isEdit = !!defaultValues?.id
  const [pending, startTransition] = useTransition()
  const [fileUrl, setFileUrl] = useState(defaultValues?.file_url ?? '')
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [plans, setPlans] = useState(initialPlans ?? [])
  const [planId, setPlanId] = useState(defaultValues?.plan_id ?? '')
  const [addingPlan, setAddingPlan] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const [addingPlanLoading, setAddingPlanLoading] = useState(false)

  async function handleAddPlan() {
    if (!newPlanName.trim()) return
    setAddingPlanLoading(true)
    try {
      const result = await addTrainingPlan(newPlanName.trim())
      if (result && 'error' in result && result.error) {
        alert('新增計畫失敗：' + result.error)
      } else if (result?.id) {
        setPlans((prev) => [...prev, { id: result.id, name: result.name ?? newPlanName.trim() }])
        setPlanId(result.id)
        setNewPlanName('')
        setAddingPlan(false)
      }
    } catch (e) {
      alert('新增計畫失敗')
    }
    setAddingPlanLoading(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', `contracts/${companyId}`)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.path) { setFileUrl(data.path); setFileName(file.name) }
      else alert(data.error || '上傳失敗')
    } catch { alert('上傳失敗') }
    setUploading(false)
  }

  function handleSubmit(formData: FormData) {
    formData.set('file_url', fileUrl)
    formData.set('plan_id', planId)
    startTransition(async () => {
      if (isEdit) await updateContract(defaultValues!.id!, companyId, formData)
      else await addContract(companyId, formData)
      onCancel?.()
      router.refresh()
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">合約名稱 *</label>
          <input name="contract_name" required defaultValue={defaultValues?.contract_name ?? ''}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">合約類型</label>
          <select name="contract_type" defaultValue={defaultValues?.contract_type ?? 'consulting'}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
            <option value="consulting">輔導合約</option>
            <option value="advisory">顧問合約</option>
            <option value="training">訓練合約</option>
            <option value="other">其他</option>
          </select>
        </div>
      </div>
      {/* 計畫 */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">計畫</label>
        {addingPlan ? (
          <div className="flex items-center gap-2">
            <input value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPlan())}
              placeholder="新計畫名稱..." autoFocus
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
            <button type="button" onClick={handleAddPlan} disabled={addingPlanLoading || !newPlanName.trim()}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium px-2 disabled:text-gray-300">
              {addingPlanLoading ? '新增中...' : '新增'}
            </button>
            <button type="button" onClick={() => { setAddingPlan(false); setNewPlanName('') }}
              className="text-sm text-gray-400 hover:text-gray-600 px-2">取消</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <select value={planId} onChange={(e) => setPlanId(e.target.value)}
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <option value="">不指定計畫</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button type="button" onClick={() => setAddingPlan(true)}
              className="text-xs text-indigo-600 hover:text-indigo-700 whitespace-nowrap">+ 新增計畫</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">簽約日期</label>
          <input name="signed_date" type="date" defaultValue={defaultValues?.signed_date ?? ''}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">起始日</label>
          <input name="start_date" type="date" defaultValue={defaultValues?.start_date ?? ''}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">結束日</label>
          <input name="end_date" type="date" defaultValue={defaultValues?.end_date ?? ''}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">合約金額</label>
          <input name="amount" type="number" min="0" defaultValue={defaultValues?.amount ?? ''}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        {isEdit && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">狀態</label>
            <select name="status" defaultValue={defaultValues?.status ?? 'negotiating'}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <option value="negotiating">洽談中</option>
              <option value="signed">已簽約</option>
              <option value="active">執行中</option>
              <option value="closed">已結案</option>
              <option value="terminated">已終止</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">合約電子檔（PDF / 圖片）</label>
        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileUpload} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50">
            {uploading ? '上傳中...' : fileUrl ? '重新上傳' : '選擇檔案'}
          </button>
          {fileUrl && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {fileName || '已上傳'}
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">備註</label>
        <input name="notes" defaultValue={defaultValues?.notes ?? ''} placeholder="備註..."
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>取消</Button>}
        <Button type="submit" loading={pending}>{isEdit ? '儲存變更' : '新增合約'}</Button>
      </div>
    </form>
  )
}
