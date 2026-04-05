'use client'

interface Signature {
  id: string
  step_order: number
  signer_role: string
  signer_name: string | null
  signature_url: string | null
  status: string
  comment: string | null
  signed_at: string | null
}

interface Props {
  signatures: Signature[]
  currentStep: number
  approvalStatus: string
}

export function ApprovalTimeline({ signatures, currentStep, approvalStatus }: Props) {
  const sorted = [...signatures].sort((a, b) => a.step_order - b.step_order)

  return (
    <div className="space-y-0">
      {sorted.map((sig, i) => {
        const isCurrent = sig.step_order === currentStep && approvalStatus === 'in_progress'
        const isSigned = sig.status === 'signed'
        const isRejected = sig.status === 'rejected'

        return (
          <div key={sig.id} className="flex gap-3 py-2">
            {/* 時間軸指示器 */}
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                isSigned ? 'bg-green-500' :
                isRejected ? 'bg-red-500' :
                isCurrent ? 'bg-indigo-500 ring-2 ring-indigo-200' :
                'bg-gray-300'
              }`} />
              {i < sorted.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
            </div>

            {/* 內容 */}
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-900">{sig.step_order}. {sig.signer_role}</span>
                {sig.signer_name && <span className="text-xs text-gray-400">{sig.signer_name}</span>}

                {isSigned && (
                  <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">已簽署</span>
                )}
                {isRejected && (
                  <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">已退回</span>
                )}
                {isCurrent && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 animate-pulse">待簽核</span>
                )}
              </div>

              {/* 簽名圖檔 */}
              {isSigned && sig.signature_url && (
                <div className="mt-1 flex items-center gap-2">
                  <img
                    src={`/api/download?path=${encodeURIComponent(sig.signature_url)}`}
                    alt={`${sig.signer_role}簽名`}
                    className="h-8 max-w-[100px] object-contain border border-gray-200 rounded px-1"
                  />
                  {sig.signed_at && (
                    <span className="text-xs text-gray-400">
                      {new Date(sig.signed_at).toLocaleDateString('zh-TW')} {new Date(sig.signed_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              )}

              {/* 退回原因 */}
              {isRejected && sig.comment && (
                <p className="text-xs text-red-600 mt-1 bg-red-50 rounded px-2 py-1">{sig.comment}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
