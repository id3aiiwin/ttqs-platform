'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteTemplate, updateTemplate } from '@/app/(dashboard)/knowledge-base/actions'
import { Badge } from '@/components/ui/badge'

const PHASE_LABELS: Record<string, string> = { P: 'Plan', D: 'Design', DO: 'Do', R: 'Review', O: 'Outcome', general: '通用' }
const PHASE_COLORS: Record<string, string> = {
  P: 'bg-blue-100 text-blue-700', D: 'bg-purple-100 text-purple-700', DO: 'bg-orange-100 text-orange-700',
  R: 'bg-yellow-100 text-yellow-700', O: 'bg-green-100 text-green-700', general: 'bg-gray-100 text-gray-700',
}
const TIER_LABELS: Record<number, string> = { 1: '一階', 2: '二階', 3: '三階', 4: '四階' }
const ACCESS_LABELS: Record<string, string> = { all: '全部企業', specific: '指定企業', internal: '顧問內部' }

interface ReplaceRule { placeholder: string; field: string }
interface ReviewReminder { section: string; description: string }

interface Template {
  id: string; name: string; doc_number_format: string | null; pddro_phase: string
  tier: number | null; version: string | null; ttqs_indicator: string | null
  description: string | null; content: string | null; structured_content: Record<string, unknown> | null
  access_level: string; is_system: boolean; file_url: string | null; allowed_companies: string[]
  auto_replace_rules: ReplaceRule[]; review_reminders: ReviewReminder[]
  document_type: string
}

interface CompanyOption { id: string; name: string }

export function KbTemplateCard({ template: t, usageCount, isConsultant, companies }: {
  template: Template; usageCount: number; isConsultant: boolean; companies?: CompanyOption[]
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // 編輯狀態
  const [editName, setEditName] = useState(t.name)
  const [editDocNum, setEditDocNum] = useState(t.doc_number_format ?? '')
  const [editPhase, setEditPhase] = useState(t.pddro_phase)
  const [editTier, setEditTier] = useState(t.tier?.toString() ?? '')
  const [editVersion, setEditVersion] = useState(t.version ?? '')
  const [editIndicator, setEditIndicator] = useState(t.ttqs_indicator ?? '')
  const [editAccess, setEditAccess] = useState(t.access_level)
  const [editDesc, setEditDesc] = useState(t.description ?? '')
  const [editContent, setEditContent] = useState(t.content ?? '')
  const [editRules, setEditRules] = useState<ReplaceRule[]>(Array.isArray(t.auto_replace_rules) ? t.auto_replace_rules : [])
  const [editReminders, setEditReminders] = useState<ReviewReminder[]>(Array.isArray(t.review_reminders) ? t.review_reminders : [])
  const [editAllowed, setEditAllowed] = useState<string[]>(Array.isArray(t.allowed_companies) ? t.allowed_companies : [])

  const rules = Array.isArray(t.auto_replace_rules) ? t.auto_replace_rules : []
  const reminders = Array.isArray(t.review_reminders) ? t.review_reminders : []

  function handleDelete() {
    if (t.is_system) { alert('系統內建範本不可刪除'); return }
    if (!confirm(`確定刪除「${t.name}」？`)) return
    startTransition(async () => { await deleteTemplate(t.id); router.refresh() })
  }

  function handleSave() {
    const fd = new FormData()
    fd.set('name', editName)
    fd.set('doc_number_format', editDocNum)
    fd.set('pddro_phase', editPhase)
    fd.set('tier', editTier)
    fd.set('version', editVersion)
    fd.set('ttqs_indicator', editIndicator)
    fd.set('access_level', editAccess)
    fd.set('description', editDesc)
    startTransition(async () => {
      await updateTemplate(t.id, fd)
      await fetch('/api/knowledge-base-templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: t.id,
          auto_replace_rules: editRules,
          review_reminders: editReminders,
          allowed_companies: editAllowed,
        }),
      })
      setEditing(false)
      router.refresh()
    })
  }

  function handleSaveContent() {
    startTransition(async () => {
      await fetch('/api/knowledge-base-templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, content: editContent }),
      })
      setEditingContent(false)
      router.refresh()
    })
  }

  /** 套用替換規則：將內容中的實際企業名稱等替換為占位符 */
  function applyRulesToContent() {
    let processed = editContent
    for (const rule of editRules) {
      if (rule.field && rule.placeholder) {
        // 用 field 的值作為搜尋目標不合理，這裡是反向：用戶先貼上含企業名稱的文字
        // 我們提供一個輸入框讓用戶填入要被替換的文字
      }
    }
    setEditContent(processed)
  }

  function cancelEdit() {
    setEditing(false)
    setEditName(t.name); setEditDocNum(t.doc_number_format ?? ''); setEditPhase(t.pddro_phase)
    setEditTier(t.tier?.toString() ?? ''); setEditVersion(t.version ?? '')
    setEditIndicator(t.ttqs_indicator ?? ''); setEditAccess(t.access_level)
    setEditDesc(t.description ?? ''); setEditContent(t.content ?? '')
    setEditRules(Array.isArray(t.auto_replace_rules) ? t.auto_replace_rules : [])
    setEditReminders(Array.isArray(t.review_reminders) ? t.review_reminders : [])
    setEditAllowed(Array.isArray(t.allowed_companies) ? t.allowed_companies : [])
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-indigo-200 transition-colors">
      {/* 卡片標題列 */}
      <button onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-gray-600">{t.tier ? TIER_LABELS[t.tier] : '—'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{t.name}</h3>
            {t.is_system && <Badge variant="info">系統內建</Badge>}
            {t.content && <span className="text-xs text-green-500">有內容</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className={`rounded-full px-2 py-0.5 ${PHASE_COLORS[t.pddro_phase] ?? PHASE_COLORS.general}`}>
              {PHASE_LABELS[t.pddro_phase] ?? t.pddro_phase}
            </span>
            {t.doc_number_format && <span className="text-gray-400 font-mono">{t.doc_number_format}</span>}
            {t.ttqs_indicator && <span className="text-gray-400">指標 {t.ttqs_indicator}</span>}
            {t.version && <span className="text-gray-400">v{t.version}</span>}
            <span className="text-gray-300">|</span>
            <span className="text-gray-400">{ACCESS_LABELS[t.access_level]}</span>
            {usageCount > 0 && <span className="text-gray-400">已套用 {usageCount} 次</span>}
          </div>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 mt-2 ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 展開內容 */}
      {expanded && (
        <div className="border-t border-gray-100">
          {editing ? (
            /* ===== 設定編輯模式 ===== */
            <div className="px-4 py-4 bg-gray-50/50 space-y-3">
              <div>
                <label className="text-xs text-gray-500">範本名稱</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">文件編號格式</label>
                  <input value={editDocNum} onChange={(e) => setEditDocNum(e.target.value)} placeholder="如 1QM-[企業代碼]"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">TTQS 指標</label>
                  <input value={editIndicator} onChange={(e) => setEditIndicator(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500">PDDRO</label>
                  <select value={editPhase} onChange={(e) => setEditPhase(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
                    <option value="general">通用</option>
                    <option value="P">Plan</option><option value="D">Design</option>
                    <option value="DO">Do</option><option value="R">Review</option><option value="O">Outcome</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">階層</label>
                  <select value={editTier} onChange={(e) => setEditTier(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
                    <option value="">無</option>
                    <option value="1">一階</option><option value="2">二階</option>
                    <option value="3">三階</option><option value="4">四階</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">版本</label>
                  <input value={editVersion} onChange={(e) => setEditVersion(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">開放權限</label>
                  <select value={editAccess} onChange={(e) => setEditAccess(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
                    <option value="all">全部企業</option>
                    <option value="specific">指定企業</option>
                    <option value="internal">顧問內部</option>
                  </select>
                </div>
              </div>

              {/* 指定企業勾選 */}
              {editAccess === 'specific' && companies && companies.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">開放給以下企業</label>
                  <div className="bg-white border border-gray-200 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                    {companies.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={editAllowed.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) setEditAllowed([...editAllowed, c.id])
                            else setEditAllowed(editAllowed.filter((id) => id !== c.id))
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                  {editAllowed.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">已選 {editAllowed.length} 家企業</p>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500">說明</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
              </div>

              {/* 自動替換規則 */}
              <div>
                <p className="text-xs text-gray-500 mb-1">自動替換規則（套用到企業時，占位符會被替換）</p>
                {editRules.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <input value={r.placeholder} onChange={(e) => { const u = [...editRules]; u[i] = { ...u[i], placeholder: e.target.value }; setEditRules(u) }}
                      placeholder="{{占位符}}" className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 font-mono" />
                    <span className="text-xs text-gray-400">→</span>
                    <input value={r.field} onChange={(e) => { const u = [...editRules]; u[i] = { ...u[i], field: e.target.value }; setEditRules(u) }}
                      placeholder="對應欄位說明" className="flex-1 text-xs border border-gray-300 rounded px-2 py-1" />
                    <button type="button" onClick={() => setEditRules(editRules.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">x</button>
                  </div>
                ))}
                <button type="button" onClick={() => setEditRules([...editRules, { placeholder: '', field: '' }])}
                  className="text-xs text-indigo-600 hover:text-indigo-700">+ 新增規則</button>
              </div>

              {/* 需提醒修改項目 */}
              <div>
                <p className="text-xs text-gray-500 mb-1">需提醒企業修改的項目</p>
                {editReminders.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <input value={r.section} onChange={(e) => { const u = [...editReminders]; u[i] = { ...u[i], section: e.target.value }; setEditReminders(u) }}
                      placeholder="區段" className="w-28 text-xs border border-gray-300 rounded px-2 py-1" />
                    <input value={r.description} onChange={(e) => { const u = [...editReminders]; u[i] = { ...u[i], description: e.target.value }; setEditReminders(u) }}
                      placeholder="說明" className="flex-1 text-xs border border-gray-300 rounded px-2 py-1" />
                    <button type="button" onClick={() => setEditReminders(editReminders.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">x</button>
                  </div>
                ))}
                <button type="button" onClick={() => setEditReminders([...editReminders, { section: '', description: '' }])}
                  className="text-xs text-indigo-600 hover:text-indigo-700">+ 新增提醒</button>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <button onClick={handleSave} disabled={pending}
                  className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-1.5 disabled:opacity-50">
                  {pending ? '儲存中...' : '儲存設定'}
                </button>
                <button onClick={cancelEdit} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">取消</button>
              </div>
            </div>
          ) : (
            /* ===== 查看模式 ===== */
            <div className="px-4 py-4 bg-gray-50/50">
              {/* 基本資訊 */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-xs text-gray-400">文件編號格式</p>
                  <p className="text-gray-700 font-mono">{t.doc_number_format || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">PDDRO / TTQS</p>
                  <p className="text-gray-700">{PHASE_LABELS[t.pddro_phase] ?? t.pddro_phase}{t.ttqs_indicator ? ` · 指標 ${t.ttqs_indicator}` : ''}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">開放權限</p>
                  <p className="text-gray-700">{ACCESS_LABELS[t.access_level]}
                    {t.access_level === 'specific' && t.allowed_companies?.length > 0 && (
                      <span className="text-gray-400 ml-1">({t.allowed_companies.length} 家)</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">類型</p>
                  <p className="text-gray-700">{t.document_type === 'course_form' ? '課程表單' : '文件'}</p>
                </div>
              </div>

              {t.description && (
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1">說明</p>
                  <p className="text-sm text-gray-700">{t.description}</p>
                </div>
              )}

              {/* 文件內容 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400">文件內容</p>
                  <div className="flex items-center gap-2">
                    {(t.content || t.structured_content) && (
                      <Link
                        href={`/knowledge-base/${t.id}/preview`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 px-2 py-1 rounded border border-gray-200 hover:border-indigo-200 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        預覽
                      </Link>
                    )}
                    {isConsultant && (
                      <Link
                        href={`/knowledge-base/${t.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded border border-indigo-200 hover:border-indigo-300 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        編輯表單欄位
                      </Link>
                    )}
                  </div>
                </div>

                {/* 純文字內容（完整文件） */}
                {t.content && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">文件內文</p>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{t.content}</pre>
                    </div>
                    {isConsultant && (
                      <button onClick={() => { setEditContent(t.content ?? ''); setEditingContent(true) }}
                        className="text-xs text-indigo-600 hover:text-indigo-700 mt-1">編輯文件內文</button>
                    )}
                  </div>
                )}

                {/* 純文字編輯 */}
                {editingContent && (
                  <div className="mb-3 space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={15}
                      placeholder="請貼上文件的文字內容...&#10;使用 {{公司名稱}} 等占位符標記需要替換的位置。"
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSaveContent} disabled={pending}
                        className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1.5 disabled:opacity-50">
                        {pending ? '儲存中...' : '儲存內文'}
                      </button>
                      <button onClick={() => setEditingContent(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">取消</button>
                    </div>
                  </div>
                )}

                {/* 結構化內容預覽 */}
                {t.structured_content && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">表單欄位結構</p>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                      {((t.structured_content as { sections?: { id: string; title?: string; fields?: { id: string; label: string; type: string }[] }[] }).sections ?? []).map((section) => (
                        <div key={section.id} className="mb-2 last:mb-0">
                          {section.title && (
                            <p className="text-xs font-semibold text-gray-500 mb-0.5">{section.title}</p>
                          )}
                          <div className="space-y-0.5 ml-2">
                            {(section.fields ?? []).map((field) => (
                              <div key={field.id} className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="w-14 text-gray-400 flex-shrink-0">{field.type}</span>
                                <span>{field.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!t.content && !t.structured_content && (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-400 italic mb-2">尚未建立文件內容</p>
                    {isConsultant && (
                      <button onClick={() => { setEditContent(''); setEditingContent(true) }}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">新增文件內文</button>
                    )}
                  </div>
                )}
              </div>

              {/* 替換規則 */}
              {rules.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1">自動替換規則</p>
                  <div className="flex flex-col gap-1">
                    {rules.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-blue-50 rounded px-2 py-1">
                        <span className="font-mono text-blue-700">{r.placeholder}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-blue-600">{r.field}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 需提醒修改項目 */}
              {reminders.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1">需提醒企業修改的項目</p>
                  <div className="flex flex-col gap-1">
                    {reminders.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs bg-amber-50 rounded px-2 py-1.5">
                        <span className="text-amber-600 font-medium flex-shrink-0">{r.section}</span>
                        <span className="text-amber-700">{r.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 操作列 */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                {t.file_url ? (
                  <a href={`/api/download?path=${encodeURIComponent(t.file_url)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1">下載檔案</a>
                ) : (
                  <span className="text-xs text-gray-400 px-2 py-1">尚未上傳文件</span>
                )}
                {isConsultant && <UploadFileButton templateId={t.id} currentUrl={t.file_url} />}
                {isConsultant && (
                  <button onClick={() => setEditing(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1">編輯設定</button>
                )}
                {isConsultant && !t.is_system && (
                  <button onClick={handleDelete} disabled={pending}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1 ml-auto">刪除</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function UploadFileButton({ templateId, currentUrl }: { templateId: string; currentUrl: string | null }) {
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('template_id', templateId)
      const res = await fetch('/api/upload-kb', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.path) {
        if (data.cleaned && data.detectedNames?.length > 0) {
          alert(`已自動將以下企業名稱替換為 {{公司名稱}}：\n${data.detectedNames.join('\n')}`)
        }
        router.refresh()
      } else alert(data.error || '上傳失敗')
    } catch { alert('上傳失敗') }
    setUploading(false)
    e.target.value = ''
  }

  return (
    <>
      <input type="file" id={`upload-${templateId}`} onChange={handleUpload} className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png" />
      <label htmlFor={`upload-${templateId}`}
        className={`text-xs px-2 py-1 cursor-pointer ${uploading ? 'text-gray-400' : 'text-indigo-600 hover:text-indigo-700 font-medium'}`}>
        {uploading ? '上傳中...' : currentUrl ? '重新上傳' : '上傳文件'}
      </label>
    </>
  )
}
