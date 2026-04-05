'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addProposal } from '@/app/(dashboard)/companies/[id]/contracts/actions'
import { Button } from '@/components/ui/button'

export function ProposalForm({ companyId }: { companyId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const currentYear = new Date().getFullYear()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addProposal(companyId, formData)
      router.refresh()
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">年度 *</label>
          <input name="year" type="number" required defaultValue={currentYear} min="2020" max="2040"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">計畫名稱 *</label>
          <input name="proposal_name" required placeholder="例：TTQS 企業機構版輔導計畫"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">計畫說明</label>
        <textarea name="description" rows={2} placeholder="計畫內容..."
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-y" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">申請金額</label>
          <input name="applied_amount" type="number" min="0" placeholder="0"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">核定金額</label>
          <input name="approved_amount" type="number" min="0" placeholder="0"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">核銷金額</label>
          <input name="reimbursed_amount" type="number" min="0" placeholder="0"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">備註</label>
        <input name="notes" placeholder="備註..." className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>新增提案</Button>
      </div>
    </form>
  )
}
