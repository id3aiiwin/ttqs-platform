'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateDocument, deleteDocument } from '@/app/(dashboard)/companies/[id]/documents/actions'
import { Badge } from '@/components/ui/badge'
import { DocumentRevisionHistory } from './document-revision-history'
import { DocumentContentForm } from './document-content-form'
import { ApprovalTimeline } from '@/components/approval/approval-timeline'
import { SignAction } from '@/components/approval/sign-action'
import type { CompanyDocument } from '@/types/database'
import type { FormSchema } from '@/types/form-schema'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'warning' | 'success' }> = {
  draft:          { label: '草稿',   variant: 'default' },
  pending_review: { label: '待審閱', variant: 'warning' },
  approved:       { label: '已確認', variant: 'success' },
}

const SOURCE_LABELS: Record<string, string> = {
  template:       '公版套用',
  upload:         '自有上傳',
  auto_generated: '自動產出',
}

interface VersionData { id: string; version: string; change_note: string | null; changed_by: string | null; changed_at: string; file_url: string | null; changer_name?: string }
interface ReviewData { id: string; status: 'needs_revision' | 'approved'; comment: string | null; reviewed_at: string; reviewer_name?: string }
interface ApprovalData { id: string; status: string; current_step: number }
interface ApprovalSigData { id: string; step_order: number; signer_role: string; signer_name: string | null; signature_url: string | null; status: string; comment: string | null; signed_at: string | null }
interface FlowOption { id: string; name: string; is_default: boolean }

export function DocumentItem({
  document: doc,
  companyId,
  isConsultant,
  versions = [],
  reviews = [],
  approval,
  approvalSigs,
  approvalFlows,
  templateSchema,
  filledContent,
  companyName,
}: {
  document: CompanyDocument
  companyId: string
  isConsultant: boolean
  versions?: VersionData[]
  reviews?: ReviewData[]
  approval?: ApprovalData
  approvalSigs?: ApprovalSigData[]
  approvalFlows?: FlowOption[]
  templateSchema?: FormSchema
  filledContent?: Record<string, unknown>
  companyName?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [editTitle, setEditTitle] = useState(doc.title)
  const [editDocNumber, setEditDocNumber] = useState(doc.doc_number ?? '')
  const [editVersion, setEditVersion] = useState(doc.version ?? '')
  const [editNotes, setEditNotes] = useState(doc.notes ?? '')
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const status = STATUS_MAP[doc.status] ?? STATUS_MAP.draft
  const isLinked = doc.linked_to_course_form
  const isJD = doc.auto_generated_from === 'JD'
  const isCourseForm = doc.source === 'template' && doc.linked_to_course_form

  function handleSave() {
    startTransition(async () => {
      await updateDocument(doc.id, companyId, {
        title: editTitle,
        doc_number: editDocNumber,
        version: editVersion,
        notes: editNotes,
      })
      setEditing(false)
      router.refresh()
    })
  }

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      await updateDocument(doc.id, companyId, { status: newStatus })
      router.refresh()
    })
  }

  async function handleInitiateApproval() {
    const defaultFlow = approvalFlows?.find(f => f.is_default) ?? approvalFlows?.[0]
    if (!defaultFlow) {
      alert('請先在企業設定中建立簽核流程')
      return
    }
    startTransition(async () => {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initiate', document_id: doc.id, flow_id: defaultFlow.id, company_id: companyId }),
      })
      const data = await res.json()
      if (data.error) alert('發起簽核失敗：' + data.error)
      else router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm(`確定刪除「${doc.title}」？`)) return
    startTransition(async () => {
      await deleteDocument(doc.id, companyId)
      router.refresh()
    })
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', `companies/${companyId}/documents`)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.path) {
        await updateDocument(doc.id, companyId, { file_url: data.path } as Record<string, string>)
        router.refresh()
      } else {
        alert(data.error || '上傳失敗')
      }
    } catch {
      alert('檔案上傳失敗')
    }
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div className="group px-5 py-3 hover:bg-gray-50 transition-colors">
      {/* Main row */}
      <div className="flex items-center gap-3">
        {/* 展開按鈕 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 文件編號 */}
        <span className="flex-shrink-0 text-xs font-mono text-gray-400 w-24 truncate" title={doc.doc_number ?? ''}>
          {doc.doc_number || '—'}
        </span>

        {/* 文件名稱 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {isLinked && (
              <span className="text-xs text-indigo-500">課程表單 · {doc.pddro_phase}</span>
            )}
            {isJD && (
              <span className="text-xs text-purple-500">待 JD 模組產出</span>
            )}
            {!isLinked && !isJD && doc.source !== 'template' && (
              <span className="text-xs text-gray-400">{SOURCE_LABELS[doc.source] ?? doc.source}</span>
            )}
            {doc.ttqs_indicator && (
              <span className="text-xs text-gray-400">指標 {doc.ttqs_indicator}</span>
            )}
          </div>
        </div>

        {/* 版本 */}
        <span className="flex-shrink-0 text-xs text-gray-400 w-12 text-center">
          {doc.version || '—'}
        </span>

        {/* 狀態 */}
        <Badge variant={status.variant}>{status.label}</Badge>

        {/* 操作按鈕 */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 下載（從知識庫模板） */}
          {doc.template_id && (
            <a href={`/api/download-with-replace?template_id=${doc.template_id}&company_id=${companyId}`}
              target="_blank" rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-700 px-1" title="下載模板文件">
              下載
            </a>
          )}
          {/* 下載（自有檔案） */}
          {doc.file_url && !doc.template_id && (
            <a href={`/api/download?path=${encodeURIComponent(doc.file_url)}`}
              target="_blank" rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-700 px-1" title="下載檔案">
              下載
            </a>
          )}
          <button onClick={() => { setExpanded(true); setEditing(true) }}
            className="text-xs text-indigo-600 hover:text-indigo-700 px-1">編輯</button>
          {isConsultant && (
            <button onClick={handleDelete} disabled={pending}
              className="text-xs text-red-400 hover:text-red-600 px-1">刪除</button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="ml-8 mt-3 bg-gray-50 rounded-lg p-4 space-y-4">
          {editing ? (
            /* ===== 編輯模式 ===== */
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">文件名稱</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">文件編號</label>
                  <input
                    value={editDocNumber}
                    onChange={(e) => setEditDocNumber(e.target.value)}
                    placeholder="企業自訂編號"
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">版本號</label>
                  <input
                    value={editVersion}
                    onChange={(e) => setEditVersion(e.target.value)}
                    placeholder="例：1.0、A、2024-01"
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">備註</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="備註說明..."
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 檔案上傳 */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">文件檔案</label>
                {doc.file_url ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600 text-xs">已上傳</span>
                    <a href={`/api/download?path=${encodeURIComponent(doc.file_url)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-700">下載</a>
                    <label className="text-xs text-gray-500 hover:text-indigo-600 cursor-pointer">
                      重新上傳
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                  </div>
                ) : (
                  <label className={`flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${uploading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-indigo-400'}`}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-xs text-gray-500">{uploading ? '上傳中...' : '點擊上傳文件'}</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={pending}
                  className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1.5 disabled:opacity-50">
                  儲存
                </button>
                <button onClick={() => { setEditing(false); setEditTitle(doc.title); setEditDocNumber(doc.doc_number ?? ''); setEditVersion(doc.version ?? ''); setEditNotes(doc.notes ?? '') }}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">
                  取消
                </button>
              </div>
            </div>
          ) : (
            /* ===== 查看模式 ===== */
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">文件編號</p>
                  <p className="text-gray-700 font-mono">{doc.doc_number || '未填'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">版本</p>
                  <p className="text-gray-700">{doc.version || '未填'}</p>
                </div>
                {doc.source !== 'template' && (
                <div>
                  <p className="text-xs text-gray-400">來源</p>
                  <p className="text-gray-700">{SOURCE_LABELS[doc.source] ?? doc.source}</p>
                </div>
                )}
                <div>
                  <p className="text-xs text-gray-400">狀態</p>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </div>

              {doc.notes && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">備註</p>
                  <p className="text-sm text-gray-600 bg-white rounded p-2 border border-gray-200">{doc.notes}</p>
                </div>
              )}

              {/* 檔案狀態 */}
              <div>
                <p className="text-xs text-gray-400 mb-1">文件檔案</p>
                {doc.file_url ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <a href={`/api/download?path=${encodeURIComponent(doc.file_url)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-700">下載檔案</a>
                  </div>
                ) : doc.template_id ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <a href={`/api/download-with-replace?template_id=${doc.template_id}&company_id=${companyId}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-700">下載知識庫模板</a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-gray-400">尚未上傳</span>
                    <label className="text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer">
                      上傳檔案
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                  </div>
                )}
              </div>

              {/* 模板填寫內容 */}
              {templateSchema && (
                <div className="pt-2 border-t border-gray-200">
                  <button onClick={() => setShowContent(!showContent)}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium mb-2">
                    <svg className={`w-3.5 h-3.5 transition-transform ${showContent ? 'rotate-90' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {showContent ? '收合模板內容' : '填寫模板內容'}
                  </button>
                  {showContent && (
                    <DocumentContentForm
                      documentId={doc.id}
                      companyId={companyId}
                      companyName={companyName ?? ''}
                      schema={templateSchema as FormSchema}
                      filledContent={filledContent ?? {}}
                    />
                  )}
                </div>
              )}

              {/* 操作列 */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <button onClick={() => setEditing(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  編輯
                </button>

                {isConsultant && (
                  <>
                    <span className="text-gray-300">|</span>
                    {doc.status === 'draft' && !approval && (
                      approvalFlows && approvalFlows.length > 0 ? (
                        <button onClick={handleInitiateApproval} disabled={pending}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">發起簽核</button>
                      ) : (
                        <button onClick={() => handleStatusChange('pending_review')} disabled={pending}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium">送審</button>
                      )
                    )}
                    {doc.status === 'pending_review' && !approval && (
                      <button onClick={() => handleStatusChange('approved')} disabled={pending}
                        className="text-xs text-green-600 hover:text-green-700 font-medium">確認通過</button>
                    )}
                    {doc.status === 'approved' && (
                      <button onClick={() => handleStatusChange('draft')} disabled={pending}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium">退回草稿</button>
                    )}
                    <span className="text-gray-300">|</span>
                    <button onClick={handleDelete} disabled={pending}
                      className="text-xs text-red-400 hover:text-red-600">刪除</button>
                  </>
                )}
              </div>

              {/* 簽核流程 */}
              {approval && approvalSigs && approvalSigs.length > 0 && (
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">簽核流程</p>
                  <ApprovalTimeline
                    signatures={approvalSigs}
                    currentStep={approval.current_step}
                    approvalStatus={approval.status}
                  />
                  {/* 當前步驟的簽署動作 */}
                  {approval.status === 'in_progress' && (() => {
                    const currentSig = approvalSigs.find(s => s.step_order === approval.current_step && s.status === 'pending')
                    if (!currentSig) return null
                    return (
                      <div className="mt-3">
                        <SignAction
                          signatureId={currentSig.id}
                          signerRole={currentSig.signer_role}
                          signatureUrl={currentSig.signature_url}
                        />
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* 修訂履歷 */}
              <div className="pt-3 mt-3 border-t border-gray-200">
                <DocumentRevisionHistory
                  documentId={doc.id}
                  companyId={companyId}
                  versions={versions}
                  reviews={reviews}
                  isConsultant={isConsultant}
                  documentStatus={doc.status}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
