'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  saveIndicator, submitIndicator, addAnnotation, importSingleIndicator, saveIndicatorFileUrls,
  consultantSaveAndApprove,
} from '@/app/(dashboard)/companies/[id]/ttqs-plan/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { IndicatorGuide } from '@/lib/ttqs-indicator-guides'

const IND_STATUS: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  empty: { label: '未填寫', variant: 'default' }, draft: { label: '填寫中', variant: 'info' },
  submitted: { label: '待審閱', variant: 'warning' }, needs_revision: { label: '需修改', variant: 'danger' },
  approved: { label: '已確認', variant: 'success' },
}

interface FileItem { name: string; url: string; uploaded_at: string; evidence_idx?: number }
interface Annotation { id: string; annotator_id: string; content: string; annotation_type: string; created_at: string }
interface Indicator { id: string; indicator_number: string; guided_answers: Record<string, string>; free_text: string | null; file_urls: FileItem[] | string[]; status: string }
interface CourseFormLink { courseName: string; formName: string; status: string }

export function IndicatorSection({ guide, indicator, annotations, nameMap, companyId, year, isLocked, isConsultant, jdStatus, courseFormData }: {
  guide: IndicatorGuide; indicator: Indicator | null; annotations: Annotation[]; nameMap: Record<string, string>
  companyId: string; year: number; isLocked: boolean; isConsultant: boolean
  jdStatus?: { total: number; approved: number }; courseFormData?: CourseFormLink[]
}) {
  const [expanded, setExpanded] = useState(false)
  const [showCourseLinks, setShowCourseLinks] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>(
    (indicator?.guided_answers as Record<string, string>) ?? {}
  )
  const [freeText, setFreeText] = useState(indicator?.free_text ?? '')
  const [files, setFiles] = useState<FileItem[]>(
    Array.isArray(indicator?.file_urls) ? (indicator.file_urls as FileItem[]).filter((f) => typeof f === 'object' && f.name) : []
  )
  const [showInputMap, setShowInputMap] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {}
    guide.evidences.forEach((_, idx) => {
      const has = (indicator?.guided_answers as Record<string, string>)?.[`evidence_${idx}_text`]?.trim()
      if (has) init[idx] = true
    })
    return init
  })
  const [comment, setComment] = useState('')
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState<number | null>(null)
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const router = useRouter()

  const status = indicator ? IND_STATUS[indicator.status] ?? IND_STATUS.empty : IND_STATUS.empty
  // 顧問永遠可編輯；HR 在任何狀態都可以修改（修改後自動回 submitted）
  const readOnly = !indicator

  // 每個佐證項目的完成狀態
  function evidenceStatus(idx: number): 'empty' | 'text' | 'file' {
    if (files.some((f) => f.evidence_idx === idx)) return 'file'
    if (answers[`evidence_${idx}_text`]?.trim()) return 'text'
    return 'empty'
  }

  function handleSave() {
    if (!indicator) return
    startTransition(async () => {
      await saveIndicator(indicator.id, companyId, { guided_answers: answers, free_text: freeText })
      await saveIndicatorFileUrls(indicator.id, companyId, files)
      router.refresh()
    })
  }
  function handleSubmit() {
    if (!indicator) return
    startTransition(async () => {
      await saveIndicator(indicator.id, companyId, { guided_answers: answers, free_text: freeText })
      await saveIndicatorFileUrls(indicator.id, companyId, files)
      await submitIndicator(indicator.id, companyId)
      router.refresh()
    })
  }
  function handleAnnotation(type: 'comment' | 'needs_revision' | 'approved') {
    if (!indicator || !comment.trim()) return
    startTransition(async () => {
      await addAnnotation(indicator.id, companyId, comment.trim(), type)
      setComment(''); router.refresh()
    })
  }
  function handleImportSingle() {
    if (!indicator || !confirm(`確定匯入 ${year - 1} 年指標 ${guide.number} 的內容？`)) return
    startTransition(async () => {
      await importSingleIndicator(companyId, year, guide.number, indicator.id)
      router.refresh()
    })
  }
  async function handleFileUpload(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(idx)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', `ttqs-plan/${companyId}/${year}/${guide.id}`)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.path) {
        const newFile: FileItem = { name: file.name, url: data.path, uploaded_at: new Date().toISOString().split('T')[0], evidence_idx: idx }
        setFiles((prev) => [...prev.filter((f) => f.evidence_idx !== idx), newFile])
      } else alert(data.error || '上傳失敗')
    } catch { alert('上傳失敗') }
    setUploading(null)
    if (e.target) e.target.value = ''
  }

  const cfCompleted = courseFormData?.filter((c) => c.status === 'completed').length ?? 0
  const cfTotal = courseFormData?.length ?? 0
  const evidencesDone = guide.evidences.filter((_, i) => evidenceStatus(i) !== 'empty').length

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
        <span className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-xs font-bold text-blue-600">
          {guide.number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{guide.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">佐證 {evidencesDone}/{guide.evidences.length}</p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-100">
          {/* 內涵說明（直接顯示） */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1.5">內涵說明</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
              {guide.description.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>

          {/* 特殊連結 */}
          {guide.specialLink && (
            <div className="px-5 py-2 bg-indigo-50/50 text-sm flex items-center gap-2 border-b border-gray-100">
              {guide.specialLink.type === 'system' ? (
                <span className="text-indigo-700">{guide.specialLink.label}</span>
              ) : (
                <>
                  <span className="text-indigo-700">{guide.specialLink.label}</span>
                  <Link href={`/companies/${companyId}${guide.specialLink.href}`}
                    className="text-indigo-600 hover:underline text-xs">前往 →</Link>
                </>
              )}
              {jdStatus && <Badge variant={jdStatus.approved > 0 ? 'success' : 'default'}>JD {jdStatus.approved}/{jdStatus.total}</Badge>}
            </div>
          )}

          {/* 佐證清單 */}
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">佐證項目清單</p>
            <div className="flex flex-col gap-3">
              {guide.evidences.map((ev, idx) => {
                const evSt = evidenceStatus(idx)
                const evText = answers[`evidence_${idx}_text`] ?? ''
                const evFile = files.find((f) => f.evidence_idx === idx)
                const showInput = showInputMap[idx] ?? false

                return (
                  <div key={idx} className={`rounded-lg border p-3 ${
                    evSt !== 'empty' ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      {evSt !== 'empty' ? (
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{ev}</p>

                        {!readOnly && (
                          <div className="flex items-center gap-2 mt-2">
                            <button type="button"
                              onClick={() => setShowInputMap((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                              className={`text-xs px-2 py-1 rounded border transition-colors ${
                                showInput || evSt === 'text'
                                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                                  : 'border-gray-200 text-gray-500 hover:border-indigo-200'
                              }`}>
                              填寫文字
                            </button>
                            <input
                              ref={(el) => { fileRefs.current[idx] = el }}
                              type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                              onChange={(e) => handleFileUpload(idx, e)} className="hidden" />
                            <button type="button"
                              onClick={() => fileRefs.current[idx]?.click()}
                              disabled={uploading === idx}
                              className={`text-xs px-2 py-1 rounded border transition-colors ${
                                evFile ? 'border-green-200 bg-green-50 text-green-600' : 'border-gray-200 text-gray-500 hover:border-indigo-200'
                              }`}>
                              {uploading === idx ? '上傳中...' : evFile ? '重新上傳' : '上傳文件'}
                            </button>
                          </div>
                        )}

                        {/* 文字輸入 */}
                        {(showInput || evSt === 'text') && (
                          <textarea value={evText} readOnly={readOnly} rows={3} placeholder="請填寫此佐證的說明..."
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [`evidence_${idx}_text`]: e.target.value }))}
                            className="w-full mt-2 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 resize-y" />
                        )}

                        {/* 已上傳文件 */}
                        {evFile && (
                          <div className="flex items-center gap-2 mt-2 text-xs">
                            <span className="text-green-600">已上傳：{evFile.name}</span>
                            <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${evFile.url}`}
                              target="_blank" className="text-indigo-600 hover:underline">下載</a>
                            {!readOnly && (
                              <button onClick={() => { setFiles((prev) => prev.filter((f) => f.evidence_idx !== idx)) }}
                                className="text-red-400 hover:text-red-600">移除</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 其他補充 */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="text-sm font-medium text-gray-700 block mb-1">其他補充</label>
              <textarea value={freeText} readOnly={readOnly} rows={3} placeholder="清單以外的補充資料..."
                onChange={(e) => setFreeText(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 resize-y" />
            </div>

            {/* 課程佐證連結 */}
            {courseFormData && courseFormData.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => setShowCourseLinks(!showCourseLinks)}
                  className="flex items-center justify-between w-full text-left">
                  <span className="text-sm font-medium text-gray-700">課程相關佐證</span>
                  <span className="text-xs text-gray-400">
                    {cfCompleted}/{cfTotal} 已完成
                    {cfTotal - cfCompleted > 0 && <span className="text-amber-600 ml-1">（{cfTotal - cfCompleted} 待補）</span>}
                  </span>
                </button>
                {showCourseLinks && (
                  <div className="mt-2">
                    {guide.courseFormLinks && <p className="text-xs text-gray-500 mb-2">{guide.courseFormLinks.description}</p>}
                    <div className="flex flex-col gap-1">
                      {courseFormData.map((cf, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm py-1">
                          <span className="text-gray-700 flex-1 truncate">{cf.courseName} · {cf.formName}</span>
                          <Badge variant={cf.status === 'completed' ? 'success' : cf.status === 'in_progress' ? 'warning' : 'default'}>
                            {cf.status === 'completed' ? '已完成' : cf.status === 'in_progress' ? '進行中' : '待處理'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {courseFormData && courseFormData.length === 0 && guide.courseFormLinks && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">{guide.courseFormLinks.description}</p>
                <p className="text-xs text-amber-500 mt-1">目前無對應課程表單（請先建立課程）</p>
              </div>
            )}

            {/* 操作按鈕 */}
            {indicator && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                {isConsultant ? (
                  /* 顧問操作：儲存 + 儲存並確認 */
                  <>
                    <div className="flex items-center gap-3">
                      <Button size="sm" variant="secondary" loading={pending} onClick={handleSave}>儲存</Button>
                      <span className="text-xs text-gray-400">儲存草稿</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Button size="sm" loading={pending} onClick={() => {
                        startTransition(async () => {
                          await consultantSaveAndApprove(indicator.id, companyId, { guided_answers: answers, free_text: freeText })
                          await saveIndicatorFileUrls(indicator.id, companyId, files)
                          router.refresh()
                        })
                      }}>儲存並確認通過</Button>
                      <span className="text-xs text-gray-400">顧問修改後直接確認，記錄修改歷史</span>
                    </div>
                  </>
                ) : (
                  /* HR 操作：儲存 + 送審 */
                  <>
                    {(indicator.status === 'approved' || indicator.status === 'submitted') && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 mb-3">
                        此指標{indicator.status === 'approved' ? '已確認' : '已送審'}。修改後將自動重新送審通知顧問。
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Button size="sm" variant="secondary" loading={pending} onClick={handleSave}>儲存</Button>
                      <span className="text-xs text-gray-400">儲存為草稿，可繼續編輯</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Button size="sm" loading={pending} onClick={handleSubmit}>送審</Button>
                      <span className="text-xs text-gray-400">送審後等待顧問批閱</span>
                    </div>
                  </>
                )}
                <button type="button" onClick={handleImportSingle}
                  className="text-xs text-gray-400 hover:text-indigo-600 mt-3">匯入 {year - 1} 年此指標</button>
              </div>
            )}
          </div>

          {/* 批註 */}
          {(isConsultant || annotations.length > 0) && (
            <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">顧問批註</p>
              {annotations.map((a) => (
                <div key={a.id} className={`text-sm rounded-lg px-3 py-2 mb-2 ${
                  a.annotation_type === 'approved' ? 'bg-green-50 text-green-800' :
                  a.annotation_type === 'needs_revision' ? 'bg-red-50 text-red-800' :
                  'bg-white text-gray-700 border border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium">{nameMap[a.annotator_id] ?? '顧問'}</span>
                    <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('zh-TW')}</span>
                  </div>
                  <p>{a.content}</p>
                </div>
              ))}
              {isConsultant && indicator && indicator.status !== 'empty' && (
                <div>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="輸入批註..." rows={2}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 resize-y mb-2" />
                  <div className="flex gap-2">
                    <Button size="sm" loading={pending} onClick={() => handleAnnotation('approved')} disabled={!comment.trim()}>確認通過</Button>
                    <Button size="sm" variant="danger" loading={pending} onClick={() => handleAnnotation('needs_revision')} disabled={!comment.trim()}>退回修改</Button>
                    <Button size="sm" variant="ghost" loading={pending} onClick={() => handleAnnotation('comment')} disabled={!comment.trim()}>一般意見</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
