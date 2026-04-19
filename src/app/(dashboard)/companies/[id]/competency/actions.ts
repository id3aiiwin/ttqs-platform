'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type CompetencyFormType = 'job_analysis' | 'job_description' | 'competency_standard' | 'competency_assessment'

/** 從公版複製企業職能表單模板（冪等） */
export async function initCompetencyTemplates(companyId: string) {
  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('competency_form_templates')
    .select('id')
    .eq('company_id', companyId)
    .limit(1)

  if (existing && existing.length > 0) return

  const { data: defaults } = await supabase
    .from('competency_form_defaults')
    .select('*')
    .order('form_type')
    .order('sort_order')

  if (!defaults || defaults.length === 0) return

  const templates = defaults.map((d) => ({
    company_id: companyId,
    form_type: d.form_type,
    default_field_id: d.id,
    field_name: d.field_name,
    standard_name: d.standard_name,
    display_name: d.standard_name,
    field_type: d.field_type,
    is_required: d.is_required,
    options: d.options,
    sort_order: d.sort_order,
  }))

  await supabase.from('competency_form_templates').insert(templates)
  revalidatePath(`/companies/${companyId}/competency`)
}

/** 刪除員工表單實例 */
export async function deleteFormEntry(entryId: string, companyId: string) {
  const supabase = createServiceClient()

  // 先刪除欄位值
  await supabase.from('competency_form_entry_values').delete().eq('entry_id', entryId)
  // 再刪除 entry
  const { error } = await supabase.from('competency_form_entries').delete().eq('id', entryId)

  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/competency`)
  return {}
}

/** 重新載入公版模板（刪除舊的再重新複製） */
export async function resetCompetencyTemplates(companyId: string) {
  const supabase = createServiceClient()

  // 刪除企業現有模板
  await supabase.from('competency_form_templates').delete().eq('company_id', companyId)

  // 重新從公版複製
  const { data: defaults } = await supabase
    .from('competency_form_defaults')
    .select('*')
    .order('form_type')
    .order('sort_order')

  if (!defaults || defaults.length === 0) return

  const templates = defaults.map((d) => ({
    company_id: companyId,
    form_type: d.form_type,
    default_field_id: d.id,
    field_name: d.field_name,
    standard_name: d.standard_name,
    display_name: d.standard_name,
    field_type: d.field_type,
    is_required: d.is_required,
    options: d.options,
    sort_order: d.sort_order,
  }))

  await supabase.from('competency_form_templates').insert(templates)
  revalidatePath(`/companies/${companyId}/competency`)
}

/** 建立員工表單實例 */
export async function createFormEntry(
  companyId: string,
  employeeId: string,
  formType: CompetencyFormType
) {
  const supabase = createServiceClient()

  // 取得企業模板欄位
  const { data: templateFields } = await supabase
    .from('competency_form_templates')
    .select('id, field_name')
    .eq('company_id', companyId)
    .eq('form_type', formType as 'job_analysis')
    .order('sort_order')

  // 建立 entry
  const { data: entry, error } = await supabase
    .from('competency_form_entries')
    .insert({
      company_id: companyId,
      employee_id: employeeId,
      form_type: formType,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // 建立空白欄位值
  if (templateFields && templateFields.length > 0) {
    const values = templateFields.map((f) => ({
      entry_id: entry.id,
      template_field_id: f.id,
      field_name: f.field_name,
      value: null,
    }))
    await supabase.from('competency_form_entry_values').insert(values)
  }

  revalidatePath(`/companies/${companyId}/competency`)
  return { entryId: entry.id }
}

/** 更新欄位值 */
export async function updateFieldValue(
  valueId: string,
  value: unknown,
  companyId: string
) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('competency_form_entry_values')
    .update({ value: value as Record<string, unknown> })
    .eq('id', valueId)

  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/competency`)
}

/** 更新 entry 狀態 */
export async function updateEntryStatus(
  entryId: string,
  status: string,
  companyId: string
) {
  const supabase = createServiceClient()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const updates: Record<string, unknown> = { status }
  if (status === 'submitted') updates.submitted_at = new Date().toISOString()
  if (status === 'reviewed' || status === 'approved') {
    updates.reviewed_by = user?.id
    updates.reviewed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('competency_form_entries')
    .update(updates)
    .eq('id', entryId)

  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/competency`)
}

/* ------------------------------------------------------------------ */
/*  Helper: replicate client-side migrateFromAnalysis logic server-side */
/* ------------------------------------------------------------------ */

interface TdrTaskServer {
  task_name: string
  work_output: string[]
  behavior_indicators: string[]
  competency_level: string
  knowledge: string[]
  skills: string[]
}

interface TdrDutyServer {
  duty_name: string
  duty_percentage: string
  tasks: TdrTaskServer[]
}

function migrateAnalysisToDuties(raw: unknown): TdrDutyServer[] | null {
  try {
    const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : null)
    if (!Array.isArray(arr) || arr.length === 0) return null
    return arr.map((d: { duty_name?: string; tasks?: Array<{ task_name?: string; metrics?: Array<{ metric_name?: string; standard_value?: string }> }> }) => ({
      duty_name: d.duty_name ?? '',
      duty_percentage: '',
      tasks: (d.tasks ?? []).map(t => ({
        task_name: t.task_name ?? '',
        work_output: [''],
        behavior_indicators: (t.metrics ?? [])
          .map(m => (m.metric_name && m.standard_value ? `${m.metric_name}：${m.standard_value}` : m.metric_name || ''))
          .filter(Boolean)
          .concat([''])
          .slice(0, Math.max((t.metrics ?? []).length, 1)),
        competency_level: '',
        knowledge: [''],
        skills: [''],
      })),
    }))
  } catch { return null }
}

/** 智慧合併：新結構（來自分析）+ 現有 JD 填寫資料（按任務名稱配對保留） */
function smartMergeTdr(newDuties: TdrDutyServer[], existingDuties: TdrDutyServer[]): TdrDutyServer[] {
  // 以任務名稱建索引，保留現有 JD 填寫的 KSA 等資料
  const taskDataMap = new Map<string, Omit<TdrTaskServer, 'task_name'>>()
  const dutyPctMap = new Map<string, string>()
  for (const duty of existingDuties) {
    if (duty.duty_name && duty.duty_percentage) dutyPctMap.set(duty.duty_name, duty.duty_percentage)
    for (const task of duty.tasks) {
      if (task.task_name) {
        taskDataMap.set(task.task_name, {
          work_output: task.work_output ?? [''],
          behavior_indicators: task.behavior_indicators ?? [''],
          competency_level: task.competency_level ?? '',
          knowledge: task.knowledge ?? [''],
          skills: task.skills ?? [''],
        })
      }
    }
  }
  return newDuties.map(duty => ({
    ...duty,
    duty_percentage: dutyPctMap.get(duty.duty_name) ?? duty.duty_percentage,
    tasks: duty.tasks.map(task => {
      const preserved = taskDataMap.get(task.task_name)
      return preserved ? { ...task, ...preserved } : task
    }),
  }))
}

/** 從工作分析重新同步工作說明書（基本資料 + TDR） */
export async function resyncJdFromAnalysis(jdEntryId: string, companyId: string) {
  const supabase = createServiceClient()

  // 1. 取得 JD entry 的 employee_id
  const { data: jdEntry } = await supabase
    .from('competency_form_entries')
    .select('employee_id, status')
    .eq('id', jdEntryId)
    .single()
  if (!jdEntry) return { error: '找不到工作說明書資料' }
  if (jdEntry.status === 'approved') return { error: '已核准的工作說明書不可同步' }

  // 2. 找最新工作分析 entry
  const { data: analysisEntry } = await supabase
    .from('competency_form_entries')
    .select('id')
    .eq('employee_id', jdEntry.employee_id)
    .eq('company_id', companyId)
    .eq('form_type', 'job_analysis')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!analysisEntry) return { error: '找不到工作分析資料，請先完成工作分析' }

  // 3. 讀取工作分析欄位值
  const { data: analysisValues } = await supabase
    .from('competency_form_entry_values')
    .select('field_name, value')
    .eq('entry_id', analysisEntry.id)
    .in('field_name', ['basic_info', 'job_analysis_table'])

  const analysisBasic = (analysisValues?.find(v => v.field_name === 'basic_info')?.value as { v?: Record<string, string> } | null)?.v ?? null
  const analysisTdrRaw = (analysisValues?.find(v => v.field_name === 'job_analysis_table')?.value as { v?: unknown } | null)?.v ?? null

  // 4. 取得 JD 現有欄位值
  const { data: jdValues } = await supabase
    .from('competency_form_entry_values')
    .select('id, field_name, value')
    .eq('entry_id', jdEntryId)
    .in('field_name', ['jd_basic_info', 'jd_tdr'])

  const jdBasicRow = jdValues?.find(v => v.field_name === 'jd_basic_info')
  const jdTdrRow = jdValues?.find(v => v.field_name === 'jd_tdr')

  const updates: PromiseLike<unknown>[] = []

  // 5a. 同步基本資料（只覆蓋分析連動欄位，保留 deputy、analyst 等 JD 專屬欄位）
  if (jdBasicRow && analysisBasic) {
    const existing = (jdBasicRow.value as { v?: Record<string, string> } | null)?.v ?? {}
    const merged: Record<string, string> = {
      ...existing,
      job_title: analysisBasic.job_title ?? existing.job_title ?? '',
      department: analysisBasic.department ?? existing.department ?? '',
      supervisor: analysisBasic.supervisor ?? existing.supervisor ?? '',
      date: analysisBasic.date ?? existing.date ?? '',
      job_purpose: analysisBasic.job_purpose ?? existing.job_purpose ?? '',
    }
    updates.push(
      supabase.from('competency_form_entry_values').update({ value: { v: merged } }).eq('id', jdBasicRow.id)
    )
  }

  // 5b. 同步 TDR：重新從分析遷移，智慧保留現有 JD 填寫資料
  if (jdTdrRow && analysisTdrRaw) {
    const newDuties = migrateAnalysisToDuties(analysisTdrRaw)
    if (newDuties) {
      const existingDuties = (Array.isArray(jdTdrRow.value) ? jdTdrRow.value : (jdTdrRow.value as { v?: unknown } | null)?.v) as TdrDutyServer[] | null
      const merged = existingDuties && existingDuties.length > 0
        ? smartMergeTdr(newDuties, existingDuties)
        : newDuties
      updates.push(
        supabase.from('competency_form_entry_values').update({ value: { v: merged } }).eq('id', jdTdrRow.id)
      )
    }
  }

  if (updates.length === 0) return { error: '工作分析尚無可同步的資料' }

  await Promise.all(updates)
  revalidatePath(`/companies/${companyId}/competency/entries/${jdEntryId}`)
  return { ok: true }
}

/** 新增批閱意見 */
export async function addEntryReview(
  entryId: string,
  companyId: string,
  comment: string,
  status: 'needs_revision' | 'approved'
) {
  const supabase = createServiceClient()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) return { error: '請先登入' }

  // 寫入審閱歷史
  await supabase.from('competency_form_reviews').insert({
    entry_id: entryId,
    reviewer_id: user.id,
    comment: comment.trim(),
    action: status,
  })

  // 更新 entry 狀態
  await supabase
    .from('competency_form_entries')
    .update({
      status: status === 'approved' ? 'approved' : 'in_progress',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', entryId)

  revalidatePath(`/companies/${companyId}/competency`)
  revalidatePath(`/companies/${companyId}/competency/entries/${entryId}`)
  return {}
}
