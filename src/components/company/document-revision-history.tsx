'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addDocumentVersion } from '@/app/(dashboard)/companies/[id]/documents/actions'

interface Version {
  id: string
  version: string
  change_note: string | null
  changed_by: string | null
  changed_at: string
  file_url: string | null
  changer_name?: string
}

interface Review {
  id: string
  status: 'needs_revision' | 'approved'
  comment: string | null
  reviewed_at: string
  reviewer_name?: string
}

interface Props {
  documentId: string
  companyId: string
  versions: Version[]
  reviews: Review[]
  isConsultant: boolean
  /** 文件目前狀態，核准後企業也可新增修編紀錄 */
  documentStatus?: string
}

export function DocumentRevisionHistory({ documentId, companyId, versions, reviews, isConsultant, documentStatus }: Props) {
  const [addingVersion, setAddingVersion] = useState(false)
  const [newVersion, setNewVersion] = useState('')
  const [newNote, setNewNote] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleAddVersion() {
    if (!newVersion.trim()) return
    startTransition(async () => {
      await addDocumentVersion(documentId, companyId, {
        version: newVersion.trim(),
        change_note: newNote.trim() || undefined,
      })
      setNewVersion('')
      setNewNote('')
      setAddingVersion(false)
      router.refresh()
    })
  }

  // 合併版本和審核紀��，按時間排序
  const timeline = [
    ...versions.map((v) => ({ type: 'version' as const, time: v.changed_at, data: v })),
    ...reviews.map((r) => ({ type: 'review' as const, time: r.reviewed_at, data: r })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">修訂履歷</p>
        {(isConsultant || documentStatus === 'approved') && !addingVersion && (
          <button onClick={() => setAddingVersion(true)}
            className="text-xs text-indigo-600 hover:text-indigo-700">+ 新增修編紀錄</button>
        )}
      </div>

      {/* 新增���本表單 */}
      {addingVersion && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 space-y-2">
          <div className="flex gap-2">
            <input
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder="版本號（如 1.1、B）"
              className="w-28 text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddVersion()}
              placeholder="修訂內容說明..."
              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddVersion} disabled={pending || !newVersion.trim()}
              className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1 disabled:opacity-50">
              新增
            </button>
            <button onClick={() => { setAddingVersion(false); setNewVersion(''); setNewNote('') }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">取消</button>
          </div>
        </div>
      )}

      {/* 時間軸 */}
      {timeline.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-2">尚無修訂紀錄</p>
      ) : (
        <div className="space-y-0">
          {timeline.map((item, i) => (
            <div key={item.data.id} className="flex gap-3 py-2">
              {/* 時間軸指示器 */}
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  item.type === 'review'
                    ? item.data.status === 'approved' ? 'bg-green-500' : 'bg-amber-500'
                    : 'bg-indigo-500'
                }`} />
                {i < timeline.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
              </div>

              {/* 內容 */}
              <div className="flex-1 min-w-0 pb-1">
                {item.type === 'version' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900">版本 {item.data.version}</span>
                      {item.data.changer_name && (
                        <span className="text-xs text-gray-400">{item.data.changer_name}</span>
                      )}
                      <span className="text-xs text-gray-300">
                        {new Date(item.data.changed_at).toLocaleDateString('zh-TW')}
                      </span>
                    </div>
                    {item.data.change_note && (
                      <p className="text-xs text-gray-600 mt-0.5">{item.data.change_note}</p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${
                        item.data.status === 'approved' ? 'text-green-700' : 'text-amber-700'
                      }`}>
                        {item.data.status === 'approved' ? '審核通過' : '需修訂'}
                      </span>
                      {item.data.reviewer_name && (
                        <span className="text-xs text-gray-400">{item.data.reviewer_name}</span>
                      )}
                      <span className="text-xs text-gray-300">
                        {new Date(item.data.reviewed_at).toLocaleDateString('zh-TW')}
                      </span>
                    </div>
                    {item.data.comment && (
                      <p className="text-xs text-gray-600 mt-0.5">{item.data.comment}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
