'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ApprovalTimeline } from '@/components/approval/approval-timeline'
import { SignAction } from '@/components/approval/sign-action'

interface Signature {
  id: string; step_order: number; signer_role: string; signer_name: string | null
  signature_url: string | null; status: string; comment: string | null; signed_at: string | null
}
interface Approval { id: string; status: string; current_step: number }
interface Flow { id: string; name: string; is_default: boolean }

interface Props {
  meetingId: string
  companyId: string
  approval: Approval | null
  signatures: Signature[]
  flows: Flow[]
}

export function MeetingApprovalSection({ meetingId, companyId, approval, signatures, flows }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleInitiate() {
    const defaultFlow = flows.find(f => f.is_default) ?? flows[0]
    if (!defaultFlow) {
      alert('請先在企業設定中建立簽核流程')
      return
    }
    startTransition(async () => {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initiate', meeting_id: meetingId, flow_id: defaultFlow.id, company_id: companyId }),
      })
      const data = await res.json()
      if (data.error) alert('發起簽核失敗：' + data.error)
      else router.refresh()
    })
  }

  if (!approval) {
    return (
      <div className="text-center py-4">
        {flows.length > 0 ? (
          <button onClick={handleInitiate} disabled={pending}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50">
            {pending ? '發起中...' : '發起會議簽核'}
          </button>
        ) : (
          <p className="text-sm text-gray-400">請先在企業設定中建立簽核流程</p>
        )}
      </div>
    )
  }

  const currentSig = approval.status === 'in_progress'
    ? signatures.find(s => s.step_order === approval.current_step && s.status === 'pending')
    : null

  return (
    <div>
      {approval.status === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          簽核完成
        </div>
      )}
      {approval.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 mb-3">
          已退回
        </div>
      )}

      <ApprovalTimeline signatures={signatures} currentStep={approval.current_step} approvalStatus={approval.status} />

      {currentSig && (
        <div className="mt-3">
          <SignAction signatureId={currentSig.id} signerRole={currentSig.signer_role} signatureUrl={currentSig.signature_url} />
        </div>
      )}
    </div>
  )
}
