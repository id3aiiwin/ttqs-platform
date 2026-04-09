'use client'

import { useState, useCallback, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateFieldValue, updateEntryStatus } from '@/app/(dashboard)/companies/[id]/competency/actions'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FieldDef {
  key: string
  label: string
  type: string
  required?: boolean
  placeholder?: string
  help?: string
}

interface ColumnDef {
  key: string
  label: string
  type: string
}

interface FieldOptions {
  fields?: FieldDef[]
  columns?: ColumnDef[]
  repeatable?: boolean
  add_label?: string
  min?: number
  description?: string
}

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
  fields: TemplateField[]
  values: FieldValue[]
  isConsultant: boolean
  readOnly?: boolean
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

export function JobAnalysisForm({ entryId, companyId, employeeName, fields, values, isConsultant, readOnly = false }: Props) {
  const router = useRouter()
  const [submitPending, startSubmitTransition] = useTransition()

  // Build a map: field_name -> { valueId, value }
  const valuesMap = useRef<Record<string, { valueId: string; value: unknown }>>({})
  values.forEach((v) => {
    valuesMap.current[v.field_name] = { valueId: v.id, value: extractValue(v.value) }
  })

  // Split fields into stage 1 (sort_order < 10) and stage 2 (sort_order >= 10)
  const stage1Fields = fields.filter((f) => f.sort_order < 10)
  const stage2Fields = fields.filter((f) => f.sort_order >= 10)

  function handleSubmit() {
    startSubmitTransition(async () => {
      await updateEntryStatus(entryId, 'submitted', companyId)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Stage 1 Header */}
      <div className="border-l-4 border-blue-500 pl-4">
        <h2 className="text-lg font-bold text-blue-800">第一階段：基礎盤點（必填）</h2>
        <p className="text-sm text-blue-600 mt-0.5">工作職務分析的核心內容</p>
      </div>

      {stage1Fields.map((field) => (
        <Stage1Section
          key={field.id}
          field={field}
          valueEntry={valuesMap.current[field.field_name]}
          companyId={companyId}
          readOnly={readOnly}
          employeeName={employeeName}
        />
      ))}

      {/* Stage 2 Header */}
      {stage2Fields.length > 0 && (
        <>
          <div className="border-l-4 border-purple-500 pl-4 mt-4">
            <h2 className="text-lg font-bold text-purple-800">第二階段：進階行為模式分析（選填）</h2>
            <p className="text-sm text-purple-600 mt-0.5">根據職務特性，選擇適用的分析表填寫</p>
          </div>

          {stage2Fields.map((field) => (
            <Stage2Section
              key={field.id}
              field={field}
              valueEntry={valuesMap.current[field.field_name]}
              companyId={companyId}
              readOnly={readOnly}
            />
          ))}
        </>
      )}

      {/* Submit */}
      {!readOnly && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="primary" loading={submitPending} onClick={handleSubmit}>
            送出審閱
          </Button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Stage 1 Sections                                                   */
/* ------------------------------------------------------------------ */

function Stage1Section({
  field,
  valueEntry,
  companyId,
  readOnly,
  employeeName,
}: {
  field: TemplateField
  valueEntry?: { valueId: string; value: unknown }
  companyId: string
  readOnly: boolean
  employeeName?: string
}) {
  const opts = field.options as FieldOptions | null
  const label = field.display_name || field.standard_name || field.field_name

  if (field.field_name === 'basic_info') {
    return (
      <BasicInfoSection
        label={label}
        description={field.description}
        fieldDefs={opts?.fields ?? []}
        valueEntry={valueEntry}
        companyId={companyId}
        readOnly={readOnly}
        employeeName={employeeName}
      />
    )
  }

  if (field.field_name === 'job_analysis_table' || field.field_name === 'duty_task_inventory') {
    return (
      <JobAnalysisTableSection
        label={label}
        description={field.description}
        addLabel={opts?.add_label ?? '新增職責'}
        valueEntry={valueEntry}
        companyId={companyId}
        readOnly={readOnly}
      />
    )
  }

  // legacy: task_breakdown (已合併，不再單獨顯示)
  if (field.field_name === 'task_breakdown') return null

  return null
}

/* ------------------------------------------------------------------ */
/*  Basic Info                                                         */
/* ------------------------------------------------------------------ */

function BasicInfoSection({
  label,
  description,
  fieldDefs,
  valueEntry,
  companyId,
  readOnly,
  employeeName,
}: {
  label: string
  description: string | null
  fieldDefs: FieldDef[]
  valueEntry?: { valueId: string; value: unknown }
  companyId: string
  readOnly: boolean
  employeeName?: string
}) {
  const raw = (valueEntry?.value ?? {}) as Record<string, string>
  // 自動帶入分析人姓名（如果尚未填寫）
  const initial = { ...raw }
  if (employeeName && !initial.analyst) {
    initial.analyst = employeeName
  }
  const [data, setData] = useState<Record<string, string>>(initial)
  const [autoFilled, setAutoFilled] = useState(false)

  // 首次載入時，如果有自動帶入就存一次
  const autoSaveRef = useRef(false)
  if (!autoSaveRef.current && employeeName && !raw.analyst && valueEntry?.valueId && !readOnly) {
    autoSaveRef.current = true
    // defer save to avoid setState during render
    setTimeout(() => {
      updateFieldValue(valueEntry.valueId, { v: initial }, companyId)
      setAutoFilled(true)
      setTimeout(() => setAutoFilled(false), 2000)
    }, 100)
  }
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saving, setSaving] = useState(false)

  const doSave = useCallback(
    (newData: Record<string, string>) => {
      if (!valueEntry?.valueId || readOnly) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setSaving(true)
        await updateFieldValue(valueEntry.valueId, { v: newData }, companyId)
        setSaving(false)
      }, 600)
    },
    [valueEntry?.valueId, companyId, readOnly]
  )

  function handleChange(key: string, val: string) {
    const next = { ...data, [key]: val }
    setData(next)
    doSave(next)
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">{label}</h3>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-4">
          {fieldDefs.map((fd) => (
            <div key={fd.key}>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {fd.label}
                {fd.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                type={fd.type === 'date' ? 'date' : 'text'}
                value={data[fd.key] ?? ''}
                onChange={(e) => handleChange(fd.key, e.target.value)}
                readOnly={readOnly}
                placeholder={fd.placeholder}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
          ))}
        </div>
        {saving && <p className="text-xs text-blue-500 mt-2">儲存中...</p>}
      </CardBody>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Job Analysis Table (unified: Duty → Task → Steps)                  */
/* ------------------------------------------------------------------ */

interface TaskItem {
  task_name: string
  steps: string[]
}

interface DutyWithTasks {
  duty_name: string
  tasks: TaskItem[]
}

function migrateToUnifiedFormat(raw: unknown): DutyWithTasks[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ duty_name: '', tasks: [{ task_name: '', steps: [''] }] }]
  }
  // Already new format
  const first = raw[0] as Record<string, unknown>
  if (first.tasks && Array.isArray(first.tasks) && first.tasks.length > 0 && typeof first.tasks[0] === 'object') {
    return raw as DutyWithTasks[]
  }
  // Old duty_task_inventory format: { duty_name, tasks: string[] }
  if (first.duty_name && Array.isArray(first.tasks)) {
    return (raw as { duty_name: string; tasks: string[] }[]).map((d) => ({
      duty_name: d.duty_name,
      tasks: d.tasks.map((t) => ({ task_name: t, steps: [''] })),
    }))
  }
  return [{ duty_name: '', tasks: [{ task_name: '', steps: [''] }] }]
}

function JobAnalysisTableSection({
  label,
  description,
  addLabel,
  valueEntry,
  companyId,
  readOnly,
}: {
  label: string
  description: string | null
  addLabel: string
  valueEntry?: { valueId: string; value: unknown }
  companyId: string
  readOnly: boolean
}) {
  const [duties, setDuties] = useState<DutyWithTasks[]>(() => migrateToUnifiedFormat(valueEntry?.value))
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSave = useCallback(
    (next: DutyWithTasks[]) => {
      if (!valueEntry?.valueId || readOnly) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        await updateFieldValue(valueEntry.valueId, { v: next }, companyId)
      }, 600)
    },
    [valueEntry?.valueId, companyId, readOnly]
  )

  function update(next: DutyWithTasks[]) {
    setDuties(next)
    doSave(next)
  }

  function updateDutyName(di: number, name: string) {
    const next = [...duties]; next[di] = { ...next[di], duty_name: name }; update(next)
  }
  function addDuty() {
    update([...duties, { duty_name: '', tasks: [{ task_name: '', steps: [''] }] }])
  }
  function removeDuty(di: number) {
    if (duties.length <= 1) return; update(duties.filter((_, i) => i !== di))
  }
  function updateTaskName(di: number, ti: number, name: string) {
    const next = [...duties]; const tasks = [...next[di].tasks]; tasks[ti] = { ...tasks[ti], task_name: name }; next[di] = { ...next[di], tasks }; update(next)
  }
  function addTask(di: number) {
    const next = [...duties]; next[di] = { ...next[di], tasks: [...next[di].tasks, { task_name: '', steps: [''] }] }; update(next)
  }
  function removeTask(di: number, ti: number) {
    if (duties[di].tasks.length <= 1) return
    const next = [...duties]; next[di] = { ...next[di], tasks: next[di].tasks.filter((_, i) => i !== ti) }; update(next)
  }
  function updateStep(di: number, ti: number, si: number, val: string) {
    const next = [...duties]; const tasks = [...next[di].tasks]; const steps = [...tasks[ti].steps]; steps[si] = val; tasks[ti] = { ...tasks[ti], steps }; next[di] = { ...next[di], tasks }; update(next)
  }
  function addStep(di: number, ti: number) {
    const next = [...duties]; const tasks = [...next[di].tasks]; tasks[ti] = { ...tasks[ti], steps: [...tasks[ti].steps, ''] }; next[di] = { ...next[di], tasks }; update(next)
  }
  function removeStep(di: number, ti: number, si: number) {
    if (duties[di].tasks[ti].steps.length <= 1) return
    const next = [...duties]; const tasks = [...next[di].tasks]; tasks[ti] = { ...tasks[ti], steps: tasks[ti].steps.filter((_, i) => i !== si) }; next[di] = { ...next[di], tasks }; update(next)
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">{label}</h3>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        <p className="text-xs text-gray-400 mt-1">
          範例 — 工作：家管 / 職責：準備餐點 / 任務：烤餅乾 / 步驟：買材料 → 看食譜 → 混合材料 → 調整烤箱熱度
        </p>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-6">
          {duties.map((duty, di) => (
            <div key={di} className="border border-blue-200 rounded-lg p-4 bg-blue-50/30">
              {/* Duty header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-blue-700">職責 #{di + 1}</span>
                {!readOnly && duties.length > 1 && (
                  <button onClick={() => removeDuty(di)} className="text-red-400 hover:text-red-600 text-xs">移除職責</button>
                )}
              </div>

              {/* Duty name */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  職責 (Duty)<span className="text-red-500 ml-0.5">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-1">相關任務的總稱，說明主要的工作面向</p>
                <input
                  type="text"
                  value={duty.duty_name}
                  onChange={(e) => updateDutyName(di, e.target.value)}
                  readOnly={readOnly}
                  placeholder="例：準備餐點"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Tasks */}
              <div className="ml-4 flex flex-col gap-4">
                {duty.tasks.map((task, ti) => (
                  <div key={ti} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500">任務 #{ti + 1}</span>
                      {!readOnly && duty.tasks.length > 1 && (
                        <button onClick={() => removeTask(di, ti)} className="text-red-400 hover:text-red-600 text-xs">移除</button>
                      )}
                    </div>

                    {/* Task name */}
                    <div className="mb-2">
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        任務 (Task)<span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        value={task.task_name}
                        onChange={(e) => updateTaskName(di, ti, e.target.value)}
                        readOnly={readOnly}
                        placeholder="例：烤餅乾"
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Steps */}
                    <div className="ml-4">
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        構成要素／步驟<span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <p className="text-xs text-gray-400 mb-1">完成該任務必須依序執行的詳細動作</p>
                      <div className="flex flex-col gap-1.5">
                        {task.steps.map((step, si) => (
                          <div key={si} className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-5 text-right">{si + 1}.</span>
                            <input
                              type="text"
                              value={step}
                              onChange={(e) => updateStep(di, ti, si, e.target.value)}
                              readOnly={readOnly}
                              placeholder={si === 0 ? '例：買材料' : si === 1 ? '例：看食譜或說明書' : '執行步驟'}
                              className="flex-1 text-sm border border-gray-300 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500"
                            />
                            {!readOnly && task.steps.length > 1 && (
                              <button onClick={() => removeStep(di, ti, si)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                            )}
                          </div>
                        ))}
                        {!readOnly && (
                          <button onClick={() => addStep(di, ti)} className="text-blue-600 hover:text-blue-800 text-xs self-start ml-7">
                            + 新增步驟
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {!readOnly && (
                  <button onClick={() => addTask(di)} className="text-blue-600 hover:text-blue-800 text-xs font-medium self-start">
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
              {addLabel}
            </button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Stage 2 Sections (Collapsible analysis tables)                     */
/* ------------------------------------------------------------------ */

function Stage2Section({
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
  const opts = field.options as FieldOptions | null
  const label = field.display_name || field.standard_name || field.field_name
  const desc = opts?.description ?? field.description ?? ''
  const columns = opts?.columns ?? []
  const addLabel = opts?.add_label ?? '新增'

  // Extract verb tags from description
  const verbMatch = desc.match(/適用動詞[：:](.+?)(?:\.|。|$)/)
  const verbs = verbMatch ? verbMatch[1].split('、').map((v) => v.trim()) : []

  const storedVal = valueEntry?.value as { v?: unknown } | null
  const [enabled, setEnabled] = useState(storedVal?.v != null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function toggleEnabled() {
    if (readOnly) return
    const next = !enabled
    setEnabled(next)
    if (!next && valueEntry?.valueId) {
      // Clear data when disabled
      updateFieldValue(valueEntry.valueId, { v: null }, companyId)
    }
  }

  // Data is stored as task groups: [{ task_name: "...", rows: [{col1: "", col2: ""}] }]
  type TaskGroup = { task_name: string; rows: Record<string, string>[] }
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>(() => {
    const raw = valueEntry?.value as { v?: unknown } | null
    const arr = raw?.v
    // Migrate from old flat format to grouped format
    if (Array.isArray(arr) && arr.length > 0 && !('task_name' in (arr[0] as Record<string, unknown>))) {
      // Old flat rows — wrap in a single task group
      return [{ task_name: '', rows: arr as Record<string, string>[] }]
    }
    return (arr as TaskGroup[] | null) ?? [{ task_name: '', rows: [Object.fromEntries(columns.map(c => [c.key, '']))] }]
  })

  function doSaveGroups(groups: TaskGroup[]) {
    if (!valueEntry?.valueId || readOnly) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await updateFieldValue(valueEntry.valueId, { v: groups }, companyId)
    }, 600)
  }

  function updateTaskName(gi: number, name: string) {
    const next = [...taskGroups]; next[gi] = { ...next[gi], task_name: name }; setTaskGroups(next); doSaveGroups(next)
  }
  function updateRow(gi: number, ri: number, key: string, val: string) {
    const next = [...taskGroups]; const rows2 = [...next[gi].rows]; rows2[ri] = { ...rows2[ri], [key]: val }; next[gi] = { ...next[gi], rows: rows2 }; setTaskGroups(next); doSaveGroups(next)
  }
  function addRow(gi: number) {
    const next = [...taskGroups]; next[gi] = { ...next[gi], rows: [...next[gi].rows, Object.fromEntries(columns.map(c => [c.key, '']))] }; setTaskGroups(next); doSaveGroups(next)
  }
  function removeRow(gi: number, ri: number) {
    if (taskGroups[gi].rows.length <= 1) return
    const next = [...taskGroups]; next[gi] = { ...next[gi], rows: next[gi].rows.filter((_, i) => i !== ri) }; setTaskGroups(next); doSaveGroups(next)
  }
  function addTaskGroup() {
    const next = [...taskGroups, { task_name: '', rows: [Object.fromEntries(columns.map(c => [c.key, '']))] }]
    setTaskGroups(next); doSaveGroups(next)
  }
  function removeTaskGroup(gi: number) {
    if (taskGroups.length <= 1) return
    const next = taskGroups.filter((_, i) => i !== gi); setTaskGroups(next); doSaveGroups(next)
  }

  const cleanDesc = desc.replace(/適用動詞[：:][^。.]+[。.]?\s*/, '').trim()
  const example = (opts as Record<string, unknown> | null)?.example as string | undefined

  return (
    <Card className={enabled ? 'ring-1 ring-purple-200' : 'opacity-75'}>
      <CardHeader>
        <div className="flex items-center justify-between cursor-pointer" onClick={toggleEnabled}>
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs transition-colors ${
                enabled
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'border-gray-300 text-transparent'
              }`}
            >
              {enabled ? '✓' : ''}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{label}</h3>
              {cleanDesc && <p className="text-xs text-gray-500 mt-0.5">{cleanDesc}</p>}
            </div>
          </div>
          {verbs.length > 0 && (
            <div className="flex gap-1 flex-wrap justify-end">
              {verbs.map((v) => (
                <span key={v} className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">{v}</span>
              ))}
            </div>
          )}
        </div>
        {example && (
          <div className="mt-2 ml-8 rounded-lg bg-purple-50 border border-purple-100 px-3 py-2">
            <p className="text-[10px] font-semibold text-purple-500 mb-1">填寫範例</p>
            <p className="text-xs text-purple-700 whitespace-pre-line leading-relaxed">{example}</p>
          </div>
        )}
      </CardHeader>

      {enabled && (
        <CardBody>
          <div className="space-y-4">
            {taskGroups.map((group, gi) => (
              <div key={gi} className="border border-purple-100 rounded-lg p-4 bg-purple-50/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-purple-600 whitespace-nowrap">任務 {gi + 1}</span>
                  <input type="text" value={group.task_name} onChange={(e) => updateTaskName(gi, e.target.value)}
                    readOnly={readOnly} placeholder="輸入任務名稱..."
                    className="flex-1 text-sm font-medium border border-purple-200 rounded px-2 py-1 focus:outline-none focus:border-purple-500 bg-white" />
                  {!readOnly && taskGroups.length > 1 && (
                    <button onClick={() => removeTaskGroup(gi)} className="text-xs text-red-400 hover:text-red-600">移除</button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-purple-200">
                        <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 w-8">#</th>
                        {columns.map((col) => (
                          <th key={col.key} className="text-left py-2 px-2 text-xs font-medium text-gray-500">{col.label}</th>
                        ))}
                        {!readOnly && <th className="w-8" />}
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-gray-100">
                          <td className="py-2 px-2 text-xs text-gray-400">{ri + 1}</td>
                          {columns.map((col) => (
                            <td key={col.key} className="py-2 px-2">
                              {col.type === 'textarea' ? (
                                <textarea value={row[col.key] ?? ''} onChange={(e) => updateRow(gi, ri, col.key, e.target.value)}
                                  readOnly={readOnly} rows={2}
                                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-purple-500 resize-y" />
                              ) : (
                                <input type="text" value={row[col.key] ?? ''} onChange={(e) => updateRow(gi, ri, col.key, e.target.value)}
                                  readOnly={readOnly}
                                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-purple-500" />
                              )}
                            </td>
                          ))}
                          {!readOnly && (
                            <td className="py-2 px-1">
                              {group.rows.length > 1 && (
                                <button onClick={() => removeRow(gi, ri)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!readOnly && (
                  <button onClick={() => addRow(gi)} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium mt-2">
                    + {addLabel}
                  </button>
                )}
              </div>
            ))}
          </div>

          {!readOnly && (
            <button onClick={addTaskGroup}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium mt-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增任務
            </button>
          )}
        </CardBody>
      )}
    </Card>
  )
}
