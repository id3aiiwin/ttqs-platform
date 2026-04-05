'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addEntryReview, updateEntryStatus } from '@/app/(dashboard)/companies/[id]/competency/actions'
import { Button } from '@/components/ui/button'

interface ReviewPanelProps {
  entryId: string
  companyId: string
  status: string
  isConsultant: boolean
  reviewedBy: string | null
  reviewedAt: string | null
}

export function ReviewPanel({ entryId, companyId, status, isConsultant, reviewedBy, reviewedAt }: ReviewPanelProps) {
  const [comment, setComment] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleReview(reviewStatus: 'needs_revision' | 'approved') {
    startTransition(async () => {
      await addEntryReview(entryId, companyId, comment, reviewStatus)
      setComment('')
      router.refresh()
    })
  }

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      await updateEntryStatus(entryId, newStatus, companyId)
      router.refresh()
    })
  }

  return (
    <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col h-full">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">批閱區</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* 狀態 */}
        <div>
          <p className="text-xs text-gray-400 mb-1">目前狀態</p>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              status === 'approved' ? 'bg-green-100 text-green-700' :
              status === 'submitted' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {status === 'draft' && '草稿'}
              {status === 'in_progress' && '填寫中'}
              {status === 'submitted' && '已送審'}
              {status === 'reviewed' && '已審閱'}
              {status === 'approved' && '已核准'}
            </span>
          </div>
        </div>

        {/* 審閱時間 */}
        {reviewedAt && (
          <div>
            <p className="text-xs text-gray-400 mb-1">最後審閱</p>
            <p className="text-sm text-gray-700">
              {new Date(reviewedAt).toLocaleDateString('zh-TW')}
            </p>
          </div>
        )}

        {/* 顧問批閱功能 */}
        {isConsultant && status === 'submitted' && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 mb-2">審閱意見</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="輸入批閱意見..."
              rows={4}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 resize-y mb-3"
            />
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                loading={pending}
                onClick={() => handleReview('approved')}
                className="w-full"
              >
                核准通過
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={pending}
                onClick={() => handleReview('needs_revision')}
                className="w-full"
              >
                退回修改
              </Button>
            </div>
          </div>
        )}

        {/* 狀態操作 */}
        {isConsultant && status !== 'submitted' && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 mb-2">狀態操作</p>
            <div className="flex flex-col gap-2">
              {status === 'draft' && (
                <Button size="sm" variant="secondary" loading={pending}
                  onClick={() => handleStatusChange('in_progress')} className="w-full">
                  開始填寫
                </Button>
              )}
              {status === 'approved' && (
                <Button size="sm" variant="secondary" loading={pending}
                  onClick={() => handleStatusChange('in_progress')} className="w-full">
                  退回重新填寫
                </Button>
              )}
              {status === 'in_progress' && (
                <Button size="sm" variant="secondary" loading={pending}
                  onClick={() => handleStatusChange('submitted')} className="w-full">
                  送出審閱
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 已核准提示 */}
        {status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
            此表單已核准通過
          </div>
        )}
      </div>
    </div>
  )
}
