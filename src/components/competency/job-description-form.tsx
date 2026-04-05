'use client'

import { useState, useCallback, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateFieldValue, updateEntryStatus } from '@/app/(dashboard)/companies/[id]/competency/actions'

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
  steps: string[]
  kpi: string[]
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

export function JobDescriptionForm({ entryId, companyId, fields, values, isConsultant, readOnly = false }: Props) {
  const router = useRouter()
  const [submitPending, startSubmitTransition] = useTransition()

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

  return (
    <div className="flex flex-col gap-8">
      {/* Section 1: Basic Info */}
      {basicInfoField && (
        <JdBasicInfoSection
          field={basicInfoField}
          valueEntry={valuesMap.current[basicInfoField.field_name]}
          companyId={companyId}
          readOnly={readOnly}
        />
      )}

      {/* Section 2: Purpose */}
      {purposeField && (
        <JdPurposeSection
          field={purposeField}
          valueEntry={valuesMap.current[purposeField.field_name]}
          companyId={companyId}
          readOnly={readOnly}
        />
      )}

      {/* Section 3: TDR */}
      {tdrField && (
        <JdTdrSection
          field={tdrField}
          valueEntry={valuesMap.current[tdrField.field_name]}
          companyId={companyId}
          readOnly={readOnly}
        />
      )}

      {/* Section 4: SKA */}
      {skaField && (
        <JdSkaSection
          field={skaField}
          valueEntry={valuesMap.current[skaField.field_name]}
          companyId={companyId}
          readOnly={readOnly}
        />
      )}

      {/* Section 5: Environment */}
      {envField && (
        <JdEnvironmentSection
          field={envField}
          valueEntry={valuesMap.current[envField.field_name]}
          companyId={companyId}
          readOnly={readOnly}
        />
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
/*  Shared hook for debounced save                                     */
/* ------------------------------------------------------------------ */

function useDebouncedSave(
  valueId: string | undefined,
  companyId: string,
  readOnly: boolean,
) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saving, setSaving] = useState(false)

  const doSave = useCallback(
    (newValue: unknown) => {
      if (!valueId || readOnly) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setSaving(true)
        await updateFieldValue(valueId, { v: newValue }, companyId)
        setSaving(false)
      }, 600)
    },
    [valueId, companyId, readOnly],
  )

  return { doSave, saving }
}

/* ------------------------------------------------------------------ */
/*  Section 1: Basic Info                                              */
/* ------------------------------------------------------------------ */

const JD_BASIC_FIELDS = [
  { key: 'job_title', label: '工作職稱', type: 'text', required: true },
  { key: 'department', label: '所屬部門', type: 'text', required: true },
  { key: 'supervisor', label: '直屬主管', type: 'text' },
  { key: 'salary_grade', label: '薪資/職等', type: 'text' },
  { key: 'jd_number', label: '工作說明書編號', type: 'text' },
  { key: 'date', label: '日期', type: 'date' },
]

function JdBasicInfoSection({
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
  const label = field.display_name || field.standard_name || '基本資料'
  const initial = (valueEntry?.value ?? {}) as Record<string, string>
  const [data, setData] = useState<Record<string, string>>(initial)
  const { doSave, saving } = useDebouncedSave(valueEntry?.valueId, companyId, readOnly)

  function handleChange(key: string, val: string) {
    const next = { ...data, [key]: val }
    setData(next)
    doSave(next)
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">{label}</h3>
        {field.description && <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>}
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-4">
          {JD_BASIC_FIELDS.map((fd) => (
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
  return { task_name: '', steps: [''], kpi: [''] }
}

function emptyDuty(): TdrDuty {
  return { duty_name: '', duty_percentage: '', tasks: [emptyTask()] }
}

function JdTdrSection({
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
  const label = field.display_name || field.standard_name || '工作職掌與任務 TDR'
  const initial = (Array.isArray(valueEntry?.value) ? valueEntry!.value : [emptyDuty()]) as TdrDuty[]
  const [duties, setDuties] = useState<TdrDuty[]>(initial)
  const { doSave, saving } = useDebouncedSave(valueEntry?.valueId, companyId, readOnly)

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

  function updateListItem(di: number, ti: number, listKey: 'steps' | 'kpi', si: number, val: string) {
    const next = [...duties]
    const tasks = [...next[di].tasks]
    const list = [...tasks[ti][listKey]]
    list[si] = val
    tasks[ti] = { ...tasks[ti], [listKey]: list }
    next[di] = { ...next[di], tasks }
    update(next)
  }

  function removeListItem(di: number, ti: number, listKey: 'steps' | 'kpi', si: number) {
    const task = duties[di].tasks[ti]
    if (task[listKey].length <= 1) return
    const next = [...duties]
    const tasks = [...next[di].tasks]
    tasks[ti] = { ...tasks[ti], [listKey]: tasks[ti][listKey].filter((_, i) => i !== si) }
    next[di] = { ...next[di], tasks }
    update(next)
  }

  function addListItem(di: number, ti: number, listKey: 'steps' | 'kpi') {
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
                  核心職責 {DUTY_LABELS[di] ?? di + 1}:
                </span>
                <input
                  type="text"
                  value={duty.duty_name}
                  onChange={(e) => updateDuty(di, { duty_name: e.target.value })}
                  readOnly={readOnly}
                  placeholder="核心職責名稱"
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
                      {/* Steps */}
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">執行步驟</label>
                        <div className="flex flex-col gap-1.5">
                          {task.steps.map((step, si) => (
                            <div key={si} className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-5 text-right">{si + 1}.</span>
                              <input
                                type="text"
                                value={step}
                                onChange={(e) => updateListItem(di, ti, 'steps', si, e.target.value)}
                                readOnly={readOnly}
                                placeholder="執行步驟"
                                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 bg-white"
                              />
                              {!readOnly && task.steps.length > 1 && (
                                <button
                                  onClick={() => removeListItem(di, ti, 'steps', si)}
                                  className="text-red-400 hover:text-red-600 text-xs"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          {!readOnly && (
                            <button
                              onClick={() => addListItem(di, ti, 'steps')}
                              className="text-blue-600 hover:text-blue-800 text-xs self-start ml-7"
                            >
                              + 新增步驟
                            </button>
                          )}
                        </div>
                      </div>

                      {/* KPI */}
                      <div>
                        <label className="text-xs font-medium text-green-700 block mb-1">衡量標準 (KPI)</label>
                        <div className="flex flex-col gap-1.5">
                          {task.kpi.map((k, ki) => (
                            <div key={ki} className="flex items-center gap-2">
                              <span className="text-xs text-green-500 w-5 text-right">{ki + 1}.</span>
                              <input
                                type="text"
                                value={k}
                                onChange={(e) => updateListItem(di, ti, 'kpi', ki, e.target.value)}
                                readOnly={readOnly}
                                placeholder="衡量標準 KPI"
                                className="flex-1 text-sm border border-green-200 rounded px-2 py-1 focus:outline-none focus:border-green-500 bg-white"
                              />
                              {!readOnly && task.kpi.length > 1 && (
                                <button
                                  onClick={() => removeListItem(di, ti, 'kpi', ki)}
                                  className="text-red-400 hover:text-red-600 text-xs"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          {!readOnly && (
                            <button
                              onClick={() => addListItem(di, ti, 'kpi')}
                              className="text-green-600 hover:text-green-800 text-xs self-start ml-7"
                            >
                              + 新增 KPI
                            </button>
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
}: {
  field: TemplateField
  valueEntry?: { valueId: string; value: unknown }
  companyId: string
  readOnly: boolean
}) {
  const label = field.display_name || field.standard_name || '工作規範與資格條件 SKA'
  const initial = (valueEntry?.value ?? {}) as Record<string, string>
  const [data, setData] = useState<Record<string, string>>(initial)
  const { doSave, saving } = useDebouncedSave(valueEntry?.valueId, companyId, readOnly)

  function handleChange(key: string, val: string) {
    const next = { ...data, [key]: val }
    setData(next)
    doSave(next)
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">{label}</h3>
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

/* ------------------------------------------------------------------ */
/*  Section 5: Environment                                             */
/* ------------------------------------------------------------------ */

const JD_ENV_FIELDS = [
  { key: 'tools_equipment', label: '使用工具/設備' },
  { key: 'work_conditions', label: '工作環境/條件' },
]

function JdEnvironmentSection({
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
  const label = field.display_name || field.standard_name || '工作環境與資源'
  const initial = (valueEntry?.value ?? {}) as Record<string, string>
  const [data, setData] = useState<Record<string, string>>(initial)
  const { doSave, saving } = useDebouncedSave(valueEntry?.valueId, companyId, readOnly)

  function handleChange(key: string, val: string) {
    const next = { ...data, [key]: val }
    setData(next)
    doSave(next)
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">{label}</h3>
        {field.description && <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>}
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-4">
          {JD_ENV_FIELDS.map((fd) => (
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
