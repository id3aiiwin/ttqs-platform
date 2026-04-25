'use client'

import { useState, useCallback, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateFieldValue, updateEntryStatus, resyncJdFromAnalysis, resyncAnalysisFromJd } from '@/app/(dashboard)/companies/[id]/competency/actions'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TemplateField {
  id: string
  field_name: string
  display_name: string | null
  standard_name: string | null
  field_type: string
  is_required: boolean
  options: Record<string, unknown> | null
  description: string | null
  sort_order: number
}

interface FieldValue {
  id: string
  field_name: string
  value: unknown
}

interface Props {
  entryId: string
  companyId: string
  employeeName?: string
  linkedAnalysisData?: Record<string, string> | null
  analysisEntryId?: string | null
  fields: TemplateField[]
  values: FieldValue[]
  isConsultant: boolean
  readOnly?: boolean
}

/* ------------------------------------------------------------------ */
/*  TDR data types                                                     */
/* ------------------------------------------------------------------ */

interface TdrTask {
  task_name: string
  work_output: string[]        // 工作產出
  behavior_indicators: string[] // 行為指標
  competency_level: string     // 職能級別 (1-7)
  knowledge: string[]          // K = Knowledge 知識
  skills: string[]             // S = Skills 技能
  // legacy fields (preserved for backward compat)
  steps?: string[]
  kpi?: string[]
  output_indicators?: string[]
}

interface TdrDuty {
  duty_name: string
  duty_percentage: string
  tasks: TdrTask[]
}

/* ------------------------------------------------------------------ */
/*  Helper: extract stored value from the {v: ...} wrapper or raw     */
/* ------------------------------------------------------------------ */

function extractValue(raw: unknown): unknown {
  if (raw != null && typeof raw === 'object' && 'v' in (raw as Record<string, unknown>)) {
    return (raw as Record<string, unknown>).v
  }
  return raw ?? null
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function JobDescriptionForm({ entryId, companyId, employeeName, linkedAnalysisData, analysisEntryId, fields, values, isConsultant, readOnly = false }: Props) {
  const router = useRouter()
  const [submitPending, startSubmitTransition] = useTransition()
  const [syncPending, setSyncPending] = useState(false)
  const [syncBackPending, setSyncBackPending] = useState(false)
  const [syncResult, setSyncResult] = useState<{ ok?: boolean; error?: string } | null>(null)
  const [pendingSaves, setPendingSaves] = useState(0)
  const onSaveStart = useCallback(() => setPendingSaves(n => n + 1), [])
  const onSaveEnd = useCallback(() => setPendingSaves(n => Math.max(0, n - 1)), [])

  // Build a map: field_name -> { valueId, value }
  const valuesMap = useRef<Record<string, { valueId: string; value: unknown }>>({})
  values.forEach((v) => {
    valuesMap.current[v.field_name] = { valueId: v.id, value: extractValue(v.value) }
  })

  // Find each section field
  const basicInfoField = fields.find((f) => f.field_name === 'jd_basic_info')
  const purposeField = fields.find((f) => f.field_name === 'jd_purpose')
  const tdrField = fields.find((f) => f.field_name === 'jd_tdr')
  const skaField = fields.find((f) => f.field_name === 'jd_ska')
  const envField = fields.find((f) => f.field_name === 'jd_environment')

  function handleSubmit() {
    startSubmitTransition(async () => {
      await updateEntryStatus(entryId, 'submitted', companyId)
      router.refresh()
    })
  }

  async function handleSync() {
    if (!confirm('確定要從工作分析重新同步？\n\n這將更新：工作職稱、部門、主管、日期、職位目的，以及工作職掌 TDR 的職責/任務結構。\n\n相同任務名稱的工作產出、行為指標、KSA 填寫內容將自動保留。')) return
    setSyncPending(true)
    setSyncResult(null)
    try {
      const res = await resyncJdFromAnalysis(entryId, companyId)
      if (res?.error) {
        setSyncResult({ error: res.error })
        setSyncPending(false)
      } else {
        setSyncResult({ ok: true })
        window.location.reload()
      }
    } catch {
      setSyncResult({ error: '同步失敗，請稍後再試' })
      setSyncPending(false)
    }
  }

  async function handleSyncBack() {
    if (!analysisEntryId) return
    if (!confirm('確定要將工作說明書的修改同步回工作分析？\n\n這將更新工作分析的：職稱、部門、主管、日期、職位目的，以及職責/任務名稱結構。\n\n工作分析的衡量指標、步驟等內容將自動保留（相同任務名稱）。')) return
    setSyncBackPending(true)
    setSyncResult(null)
    try {
      const res = await resyncAnalysisFromJd(analysisEntryId, entryId, companyId)
      if (res?.error) {
        setSyncResult({ error: res.error })
      } else {
        setSyncResult({ ok: true })
        window.location.reload()
      }
    } catch {
      setSyncResult({ error: '同步失敗，請稍後再試' })
    } finally {
      setSyncBackPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 雙向同步橫幅 */}
      {!readOnly && linkedAnalysisData && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-blue-800">工作分析已連動</p>
              <p className="text-xs text-blue-600 mt-0.5">修改任一份後可雙向同步，相同任務的填寫內容自動保留</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 分析 → JD */}
              <button
                onClick={handleSync}
                disabled={syncPending || syncBackPending}
                title="將最新工作分析套用到此工作說明書"
                className="flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {syncPending ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                分析 → 說明書
              </button>

              <span className="text-blue-300 text-sm">|</span>

              {/* JD → 分析 */}
              {analysisEntryId && (
                <button
                  onClick={handleSyncBack}
                  disabled={syncPending || syncBackPending}
                  title="將工作說明書的修改回寫至工作分析"
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {syncBackPending ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                  說明書 → 分析
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {syncResult?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{syncResult.error}</div>
      )}

      {/* Section 1: Basic Info (includes 職位目的) */}
      {basicInfoField && (
        <JdBasicInfoSection
          field={basicInfoField}
          valueEntry={valuesMap.current[basicInfoField.field_name]}
          purposeValueEntry={purposeField ? valuesMap.current[purposeField.field_name] : undefined}
          companyId={companyId}
          readOnly={readOnly}
          employeeName={employeeName}
          linkedAnalysisData={linkedAnalysisData}
          onSaveStart={onSaveStart}
          onSaveEnd={onSaveEnd}
        />
      )}

      {/* Section 3: TDR */}
      {tdrField && (
        <JdTdrSection
          field={tdrField}
          valueEntry={valuesMap.current[tdrField.field_name]}
          companyId={companyId}
          readOnly={readOnly}
          linkedAnalysisData={linkedAnalysisData}
          onSaveStart={onSaveStart}
          onSaveEnd={onSaveEnd}
        />
      )}

      {/* Section 4: SKA (選填) */}
      {skaField && (
        <JdSkaSection
          field={skaField}
          valueEntry={valuesMap.current[skaField.field_name]}
          companyId={companyId}
          readOnly={readOnly}
          onSaveStart={onSaveStart}
          onSaveEnd={onSaveEnd}
        />
      )}

      {/* Save + Submit */}
      {!readOnly && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">編輯時自動儲存</p>
          <div className="flex items-center gap-3">
            {pendingSaves > 0 ? (
              <span className="flex items-center gap-1.5 text-xs text-blue-500 px-3 py-1.5">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                儲存中...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-gray-400 px-3 py-1.5">
                ✓ 已儲存至雲端
              </span>
            )}
            <Button variant="primary" loading={submitPending} onClick={handleSubmit}>
              送出審閱
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Shared hook for debounced save                                     */
/* ------------------------------------------------------------------ */

function useDebouncedSave(
  valueId: string | undefined,
  companyId: string,
  readOnly: boolean,
  onSaveStart?: () => void,
  onSaveEnd?: () => void,
) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saving, setSaving] = useState(false)

  const doSave = useCallback(
    (newValue: unknown) => {
      if (!valueId || readOnly) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        onSaveStart?.()
        setSaving(true)
        await updateFieldValue(valueId, { v: newValue }, companyId)
        setSaving(false)
        onSaveEnd?.()
      }, 600)
    },
    [valueId, companyId, readOnly, onSaveStart, onSaveEnd],
  )

  return { doSave, saving }
}

/* ------------------------------------------------------------------ */
/*  Section 1: Basic Info (3-column grid + 職位目的)                    */
/* ------------------------------------------------------------------ */

// 從工作分析連動的欄位 mapping: jd key -> analysis key
const LINKED_FIELD_MAP: Record<string, string> = {
  job_title: 'job_title',
  department: 'department',
  supervisor: 'supervisor',
  date: 'date',
}

function JdBasicInfoSection({
  field,
  valueEntry,
  purposeValueEntry,
  companyId,
  readOnly,
  employeeName,
  linkedAnalysisData,
  onSaveStart,
  onSaveEnd,
}: {
  field: TemplateField
  valueEntry?: { valueId: string; value: unknown }
  purposeValueEntry?: { valueId: string; value: unknown }
  companyId: string
  readOnly: boolean
  employeeName?: string
  linkedAnalysisData?: Record<string, string> | null
  onSaveStart?: () => void
  onSaveEnd?: () => void
}) {
  const label = field.display_name || field.standard_name || '基本資料'

  // 初始化：合併已存的值 + 從工作分析連動的值
  const raw = (valueEntry?.value ?? {}) as Record<string, string>
  const initial = { ...raw }
  // 從工作分析帶入尚未填寫的欄位
  if (linkedAnalysisData) {
    Object.entries(LINKED_FIELD_MAP).forEach(([jdKey, analysisKey]) => {
      if (!initial[jdKey] && linkedAnalysisData[analysisKey]) {
        initial[jdKey] = linkedAnalysisData[analysisKey]
      }
    })
  }
  // 自動帶入填寫人
  if (employeeName && !initial.analyst) {
    initial.analyst = employeeName
  }
  // 帶入職位目的
  const rawPurpose = (purposeValueEntry?.value as string) ?? ''
  if (!initial.job_purpose && linkedAnalysisData?.job_purpose) {
    initial.job_purpose = linkedAnalysisData.job_purpose
  }
  if (!initial.job_purpose && rawPurpose) {
    initial.job_purpose = rawPurpose
  }

  const [data, setData] = useState<Record<string, string>>(initial)
  const { doSave, saving } = useDebouncedSave(valueEntry?.valueId, companyId, readOnly, onSaveStart, onSaveEnd)
  const { doSave: doSavePurpose } = useDebouncedSave(purposeValueEntry?.valueId, companyId, readOnly, onSaveStart, onSaveEnd)

  // 首次載入時，如果有連動帶入就存一次
  const autoSaveRef = useRef(false)
  if (!autoSaveRef.current && valueEntry?.valueId && !readOnly) {
    const hasNewData = Object.keys(initial).some(k => initial[k] && !raw[k])
    if (hasNewData) {
      autoSaveRef.current = true
      setTimeout(() => {
        updateFieldValue(valueEntry.valueId, { v: initial }, companyId)
        if (purposeValueEntry?.valueId && initial.job_purpose && !rawPurpose) {
          updateFieldValue(purposeValueEntry.valueId, { v: initial.job_purpose }, companyId)
        }
      }, 100)
    }
  }

  function handleChange(key: string, val: string) {
    const next = { ...data, [key]: val }
    setData(next)
    doSave(next)
    // 同步儲存 purpose 到獨立欄位
    if (key === 'job_purpose' && purposeValueEntry?.valueId) {
      doSavePurpose(val)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">{label}</h3>
        {field.description && <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>}
        {linkedAnalysisData && (
          <p className="text-xs text-blue-500 mt-1">部分欄位已從工作分析自動帶入</p>
        )}
      </CardHeader>
      <CardBody>
        {/* Row 1: 工作職稱、填寫人、日期 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">工作職稱<span className="text-red-500 ml-0.5">*</span></label>
            <input type="text" value={data.job_title ?? ''} onChange={(e) => handleChange('job_title', e.target.value)}
              readOnly={readOnly} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">填寫人<span className="text-red-500 ml-0.5">*</span></label>
            <input type="text" value={data.analyst ?? ''} onChange={(e) => handleChange('analyst', e.target.value)}
              readOnly={readOnly} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">日期<span className="text-red-500 ml-0.5">*</span></label>
            <input type="date" value={data.date ?? ''} onChange={(e) => handleChange('date', e.target.value)}
              readOnly={readOnly} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Row 2: 部門、職務代理人、主管 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">部門<span className="text-red-500 ml-0.5">*</span></label>
            <input type="text" value={data.department ?? ''} onChange={(e) => handleChange('department', e.target.value)}
              readOnly={readOnly} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">職務代理人</label>
            <input type="text" value={data.deputy ?? ''} onChange={(e) => handleChange('deputy', e.target.value)}
              readOnly={readOnly} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">主管</label>
            <input type="text" value={data.supervisor ?? ''} onChange={(e) => handleChange('supervisor', e.target.value)}
              readOnly={readOnly} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Row 3: 職位目的 */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">職位目的<span className="text-red-500 ml-0.5">*</span></label>
          <textarea value={data.job_purpose ?? ''} onChange={(e) => handleChange('job_purpose', e.target.value)}
            readOnly={readOnly} rows={3} placeholder="請簡述此職位存在的主要目的與價值"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-y" />
        </div>

        {saving && <p className="text-xs text-blue-500 mt-2">儲存中...</p>}
      </CardBody>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 2: Purpose                                                 */
/* ------------------------------------------------------------------ */

function JdPurposeSection({
  field,
  valueEntry,
  companyId,
  readOnly,
}: {
  field: TemplateField
  valueEntry?: { valueId: string; value: unknown }
  companyId: string
  readOnly: boolean
}) {
  const label = field.display_name || field.standard_name || '工作目的與使命'
  const initial = (valueEntry?.value as string) ?? ''
  const [text, setText] = useState(initial)
  const { doSave, saving } = useDebouncedSave(valueEntry?.valueId, companyId, readOnly)

  function handleChange(val: string) {
    setText(val)
    doSave(val)
  }

  return (
    <Card className="ring-1 ring-blue-100">
      <CardHeader>
        <h3 className="font-semibold text-blue-800">{label}</h3>
        {field.description && <p className="text-xs text-blue-500 mt-0.5">{field.description}</p>}
      </CardHeader>
      <CardBody>
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          readOnly={readOnly}
          rows={4}
          placeholder="請描述此職位的主要工作目的與使命..."
          className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-y"
        />
        {saving && <p className="text-xs text-blue-500 mt-2">儲存中...</p>}
      </CardBody>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 3: TDR (Duty -> Task -> Steps + KPI)                       */
/* ------------------------------------------------------------------ */

function emptyTask(): TdrTask {
  return { task_name: '', work_output: [''], behavior_indicators: [''], competency_level: '', knowledge: [''], skills: [''] }
}

const COMPETENCY_LEVELS = ['', '1', '2', '3', '4', '5', '6', '7'] as const

function emptyDuty(): TdrDuty {
  return { duty_name: '', duty_percentage: '', tasks: [emptyTask()] }
}

function migrateFromAnalysis(raw: unknown): TdrDuty[] | null {
  if (!raw) return null
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(arr) || arr.length === 0) return null
    return arr.map((d: { duty_name?: string; tasks?: Array<{ task_name?: string; metrics?: Array<{ metric_name?: string; standard_value?: string }>; steps?: string[] }> }) => ({
      duty_name: d.duty_name ?? '',
      duty_percentage: '',
      tasks: (d.tasks ?? []).map(t => ({
        task_name: t.task_name ?? '',
        work_output: [''],
        behavior_indicators: (t.metrics ?? []).map(m => m.metric_name && m.standard_value ? `${m.metric_name}：${m.standard_value}` : m.metric_name || '').filter(Boolean).concat(['']).slice(0, Math.max((t.metrics ?? []).length, 1)),
        competency_level: '',
        knowledge: [''],
        skills: [''],
      })),
    }))
  } catch { return null }
}

function JdTdrSection({
  field,
  valueEntry,
  companyId,
  readOnly,
  linkedAnalysisData,
  onSaveStart,
  onSaveEnd,
}: {
  field: TemplateField
  valueEntry?: { valueId: string; value: unknown }
  companyId: string
  readOnly: boolean
  linkedAnalysisData?: Record<string, string> | null
  onSaveStart?: () => void
  onSaveEnd?: () => void
}) {
  const label = field.display_name || field.standard_name || '工作職掌與任務 TDR'
  const hasExistingData = Array.isArray(valueEntry?.value) && (valueEntry!.value as TdrDuty[]).length > 0
  const linkedTdr = !hasExistingData && linkedAnalysisData?._analysis_tdr
    ? migrateFromAnalysis(linkedAnalysisData._analysis_tdr)
    : null
  // Ensure existing data has new fields (migrate from old format)
  const migrateExisting = (duties: TdrDuty[]) => duties.map(d => ({
    ...d,
    tasks: d.tasks.map(t => ({
      ...t,
      work_output: t.work_output ?? [''],
      behavior_indicators: t.behavior_indicators ?? t.output_indicators ?? t.kpi ?? [''],
      competency_level: t.competency_level ?? '',
      knowledge: t.knowledge ?? [''],
      skills: t.skills ?? [''],
    })),
  }))
  const initial = hasExistingData
    ? migrateExisting(valueEntry!.value as TdrDuty[])
    : linkedTdr ?? [emptyDuty()]
  const [duties, setDuties] = useState<TdrDuty[]>(initial)

  // 首次從工作分析帶入時自動存檔
  const autoSaveRef = useRef(false)
  if (!autoSaveRef.current && linkedTdr && valueEntry?.valueId && !readOnly) {
    autoSaveRef.current = true
    setTimeout(() => {
      updateFieldValue(valueEntry.valueId, { v: linkedTdr }, companyId)
    }, 200)
  }
  const { doSave, saving } = useDebouncedSave(valueEntry?.valueId, companyId, readOnly, onSaveStart, onSaveEnd)

  const DUTY_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  /* ---- mutation helpers ---- */

  function update(newDuties: TdrDuty[]) {
    setDuties(newDuties)
    doSave(newDuties)
  }

  function updateDuty(di: number, patch: Partial<TdrDuty>) {
    const next = [...duties]
    next[di] = { ...next[di], ...patch }
    update(next)
  }

  function removeDuty(di: number) {
    if (duties.length <= 1) return
    update(duties.filter((_, i) => i !== di))
  }

  function addDuty() {
    update([...duties, emptyDuty()])
  }

  function updateTask(di: number, ti: number, patch: Partial<TdrTask>) {
    const next = [...duties]
    const tasks = [...next[di].tasks]
    tasks[ti] = { ...tasks[ti], ...patch }
    next[di] = { ...next[di], tasks }
    update(next)
  }

  function removeTask(di: number, ti: number) {
    if (duties[di].tasks.length <= 1) return
    const next = [...duties]
    next[di] = { ...next[di], tasks: next[di].tasks.filter((_, i) => i !== ti) }
    update(next)
  }

  function addTask(di: number) {
    const next = [...duties]
    next[di] = { ...next[di], tasks: [...next[di].tasks, emptyTask()] }
    update(next)
  }

  type ListKey = 'work_output' | 'behavior_indicators' | 'knowledge' | 'skills'
  function updateListItem(di: number, ti: number, listKey: ListKey, si: number, val: string) {
    const next = [...duties]
    const tasks = [...next[di].tasks]
    const list = [...tasks[ti][listKey]]
    list[si] = val
    tasks[ti] = { ...tasks[ti], [listKey]: list }
    next[di] = { ...next[di], tasks }
    update(next)
  }

  function removeListItem(di: number, ti: number, listKey: ListKey, si: number) {
    const task = duties[di].tasks[ti]
    if (task[listKey].length <= 1) return
    const next = [...duties]
    const tasks = [...next[di].tasks]
    tasks[ti] = { ...tasks[ti], [listKey]: tasks[ti][listKey].filter((_, i) => i !== si) }
    next[di] = { ...next[di], tasks }
    update(next)
  }

  function addListItem(di: number, ti: number, listKey: ListKey) {
    const next = [...duties]
    const tasks = [...next[di].tasks]
    tasks[ti] = { ...tasks[ti], [listKey]: [...tasks[ti][listKey], ''] }
    next[di] = { ...next[di], tasks }
    update(next)
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">{label}</h3>
        {field.description && <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>}
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-6">
          {duties.map((duty, di) => (
            <div key={di} className="border border-gray-200 rounded-lg p-4 bg-white">
              {/* Duty header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-bold text-blue-700 whitespace-nowrap">
                  職能 {DUTY_LABELS[di] ?? di + 1}:
                </span>
                <input
                  type="text"
                  value={duty.duty_name}
                  onChange={(e) => updateDuty(di, { duty_name: e.target.value })}
                  readOnly={readOnly}
                  placeholder="職能名稱"
                  className="flex-1 text-sm font-medium border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">佔比</span>
                <input
                  type="text"
                  value={duty.duty_percentage}
                  onChange={(e) => updateDuty(di, { duty_percentage: e.target.value })}
                  readOnly={readOnly}
                  placeholder="0"
                  className="w-16 text-sm text-center border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500"
                />
                <span className="text-sm text-gray-500">%</span>
                {!readOnly && duties.length > 1 && (
                  <button
                    onClick={() => removeDuty(di)}
                    className="text-red-400 hover:text-red-600 text-xs whitespace-nowrap"
                  >
                    移除職責
                  </button>
                )}
              </div>

              {/* Tasks */}
              <div className="ml-4 flex flex-col gap-4">
                {duty.tasks.map((task, ti) => (
                  <div key={ti} className="bg-gray-50 rounded-lg p-3 border-l-2 border-blue-300">
                    {/* Task header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                        任務 {ti + 1}:
                      </span>
                      <input
                        type="text"
                        value={task.task_name}
                        onChange={(e) => updateTask(di, ti, { task_name: e.target.value })}
                        readOnly={readOnly}
                        placeholder="任務名稱 (行動動詞 + 目標名詞)"
                        className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 bg-white"
                      />
                      {!readOnly && duty.tasks.length > 1 && (
                        <button
                          onClick={() => removeTask(di, ti)}
                          className="text-red-400 hover:text-red-600 text-xs whitespace-nowrap"
                        >
                          移除任務
                        </button>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col gap-3">
                      {/* 工作產出 */}
                      <div>
                        <label className="text-xs font-medium text-blue-700 block mb-1">工作產出</label>
                        <div className="flex flex-col gap-1.5">
                          {task.work_output.map((item, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <span className="text-xs text-blue-400 w-5 text-right">{oi + 1}.</span>
                              <input type="text" value={item} onChange={(e) => updateListItem(di, ti, 'work_output', oi, e.target.value)}
                                readOnly={readOnly} placeholder="例：業務發展規劃書、績效考核表"
                                className="flex-1 text-sm border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500 bg-white" />
                              {!readOnly && task.work_output.length > 1 && (
                                <button onClick={() => removeListItem(di, ti, 'work_output', oi)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                              )}
                            </div>
                          ))}
                          {!readOnly && (
                            <button onClick={() => addListItem(di, ti, 'work_output')} className="text-blue-600 hover:text-blue-800 text-xs self-start ml-7">+ 新增產出</button>
                          )}
                        </div>
                      </div>

                      {/* 行為指標 */}
                      <div>
                        <label className="text-xs font-medium text-green-700 block mb-1">行為指標</label>
                        <div className="flex flex-col gap-1.5">
                          {task.behavior_indicators.map((item, bi) => (
                            <div key={bi} className="flex items-center gap-2">
                              <span className="text-xs text-green-500 w-5 text-right">{bi + 1}.</span>
                              <input type="text" value={item} onChange={(e) => updateListItem(di, ti, 'behavior_indicators', bi, e.target.value)}
                                readOnly={readOnly} placeholder="例：提升信用卡主要部門營業情況或轉投資事業投資收益"
                                className="flex-1 text-sm border border-green-200 rounded px-2 py-1 focus:outline-none focus:border-green-500 bg-white" />
                              {!readOnly && task.behavior_indicators.length > 1 && (
                                <button onClick={() => removeListItem(di, ti, 'behavior_indicators', bi)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                              )}
                            </div>
                          ))}
                          {!readOnly && (
                            <button onClick={() => addListItem(di, ti, 'behavior_indicators')} className="text-green-600 hover:text-green-800 text-xs self-start ml-7">+ 新增指標</button>
                          )}
                        </div>
                      </div>

                      {/* K = Knowledge 知識 */}
                      <div>
                        <label className="text-xs font-medium text-purple-700 block mb-1">K — Knowledge 知識</label>
                        <div className="flex flex-col gap-1.5">
                          {task.knowledge.map((item, ki) => (
                            <div key={ki} className="flex items-center gap-2">
                              <span className="text-xs text-purple-500 w-5 text-right">{ki + 1}.</span>
                              <input type="text" value={item} onChange={(e) => updateListItem(di, ti, 'knowledge', ki, e.target.value)}
                                readOnly={readOnly} placeholder="例：會計、財務、金融市場"
                                className="flex-1 text-sm border border-purple-200 rounded px-2 py-1 focus:outline-none focus:border-purple-500 bg-white" />
                              {!readOnly && task.knowledge.length > 1 && (
                                <button onClick={() => removeListItem(di, ti, 'knowledge', ki)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                              )}
                            </div>
                          ))}
                          {!readOnly && (
                            <button onClick={() => addListItem(di, ti, 'knowledge')} className="text-purple-600 hover:text-purple-800 text-xs self-start ml-7">+ 新增知識</button>
                          )}
                        </div>
                      </div>

                      {/* S = Skills 技能 */}
                      <div>
                        <label className="text-xs font-medium text-teal-700 block mb-1">S — Skills 技能</label>
                        <div className="flex flex-col gap-1.5">
                          {task.skills.map((item, si) => (
                            <div key={si} className="flex items-center gap-2">
                              <span className="text-xs text-teal-500 w-5 text-right">{si + 1}.</span>
                              <input type="text" value={item} onChange={(e) => updateListItem(di, ti, 'skills', si, e.target.value)}
                                readOnly={readOnly} placeholder="例：人脈拓展、價值判斷、分析與解讀能力"
                                className="flex-1 text-sm border border-teal-200 rounded px-2 py-1 focus:outline-none focus:border-teal-500 bg-white" />
                              {!readOnly && task.skills.length > 1 && (
                                <button onClick={() => removeListItem(di, ti, 'skills', si)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                              )}
                            </div>
                          ))}
                          {!readOnly && (
                            <button onClick={() => addListItem(di, ti, 'skills')} className="text-teal-600 hover:text-teal-800 text-xs self-start ml-7">+ 新增技能</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {!readOnly && (
                  <button
                    onClick={() => addTask(di)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium self-start"
                  >
                    + 新增任務
                  </button>
                )}
              </div>
            </div>
          ))}

          {!readOnly && (
            <button
              onClick={addDuty}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium self-start"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增職責
            </button>
          )}
        </div>
        {saving && <p className="text-xs text-blue-500 mt-2">儲存中...</p>}
      </CardBody>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 4: SKA (Textareas)                                         */
/* ------------------------------------------------------------------ */

const JD_SKA_FIELDS = [
  { key: 'education', label: '學歷與科系' },
  { key: 'experience', label: '工作經歷' },
  { key: 'knowledge', label: '專業知識' },
  { key: 'skills', label: '專業技能' },
  { key: 'core_competency', label: '核心能力與特質' },
]

function JdSkaSection({
  field,
  valueEntry,
  companyId,
  readOnly,
  onSaveStart,
  onSaveEnd,
}: {
  field: TemplateField
  valueEntry?: { valueId: string; value: unknown }
  companyId: string
  readOnly: boolean
  onSaveStart?: () => void
  onSaveEnd?: () => void
}) {
  const label = field.display_name || field.standard_name || '工作規範與資格條件 SKA'
  const initial = (valueEntry?.value ?? {}) as Record<string, string>
  const [data, setData] = useState<Record<string, string>>(initial)
  const { doSave, saving } = useDebouncedSave(valueEntry?.valueId, companyId, readOnly, onSaveStart, onSaveEnd)

  function handleChange(key: string, val: string) {
    const next = { ...data, [key]: val }
    setData(next)
    doSave(next)
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">{label} <span className="text-xs font-normal text-gray-400">（選填）</span></h3>
        {field.description && <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>}
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-4">
          {JD_SKA_FIELDS.map((fd) => (
            <div key={fd.key}>
              <label className="text-sm font-medium text-gray-700 block mb-1">{fd.label}</label>
              <textarea
                value={data[fd.key] ?? ''}
                onChange={(e) => handleChange(fd.key, e.target.value)}
                readOnly={readOnly}
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-y"
              />
            </div>
          ))}
        </div>
        {saving && <p className="text-xs text-blue-500 mt-2">儲存中...</p>}
      </CardBody>
    </Card>
  )
}

