'use server'

import { createServiceClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ALL_INDICATOR_IDS } from '@/lib/ttqs-indicator-guides'

function planPath(companyId: string) { return `/companies/${companyId}/ttqs-plan` }

/** 建立或取得某年度計畫 + 五個空白指標 */
export async function ensurePlan(companyId: string, year: number) {
  const sc = createServiceClient()

  const { data: existing } = await sc
    .from('company_ttqs_plans')
    .select('id')
    .eq('company_id', companyId)
    .eq('year', year)
    .single()

  if (existing) return { planId: existing.id }

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const { data: plan, error } = await sc.from('company_ttqs_plans').insert({
    company_id: companyId,
    year,
    created_by: user?.id ?? null,
  }).select('id').single()

  if (error) return { error: error.message }

  const indicators = ALL_INDICATOR_IDS.map((id) => ({
    plan_id: plan.id,
    indicator_number: id,
  }))
  await sc.from('company_ttqs_indicators').insert(indicators)

  revalidatePath(planPath(companyId))
  return { planId: plan.id }
}

/** 儲存指標佐證文件 */
export async function saveIndicatorFileUrls(
  indicatorId: string,
  companyId: string,
  fileUrls: { name: string; url: string; uploaded_at: string }[]
) {
  const sc = createServiceClient()
  await sc.from('company_ttqs_indicators').update({
    file_urls: fileUrls as unknown as string[],
  }).eq('id', indicatorId)
  revalidatePath(planPath(companyId))
}

/** 儲存指標內容（HR 用：狀態改為 draft，若原為 approved/locked 則自動改為 submitted 通知顧問） */
export async function saveIndicator(
  indicatorId: string,
  companyId: string,
  data: { guided_answers: Record<string, string>; free_text: string }
) {
  const sc = createServiceClient()

  // 查目前狀態
  const { data: current } = await sc.from('company_ttqs_indicators')
    .select('status').eq('id', indicatorId).single()

  const wasApprovedOrLocked = current?.status === 'approved' || current?.status === 'submitted'
  const newStatus = wasApprovedOrLocked ? 'submitted' : 'draft'

  const { error } = await sc.from('company_ttqs_indicators').update({
    guided_answers: data.guided_answers,
    free_text: data.free_text || null,
    status: newStatus,
  }).eq('id', indicatorId)

  if (error) return { error: error.message }

  // 如果原本已確認/已送審，自動加一條通知批註
  if (wasApprovedOrLocked && current?.status === 'approved') {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    await sc.from('company_ttqs_annotations').insert({
      indicator_id: indicatorId,
      annotator_id: user?.id ?? indicatorId, // fallback
      content: '內容已更新，請重新審閱',
      annotation_type: 'comment',
    })
  }

  revalidatePath(planPath(companyId))
}

/** 顧問直接儲存並確認（不需要退回 HR） */
export async function consultantSaveAndApprove(
  indicatorId: string,
  companyId: string,
  data: { guided_answers: Record<string, string>; free_text: string },
  note?: string
) {
  const sc = createServiceClient()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  // 更新內容 + 狀態直接 approved
  await sc.from('company_ttqs_indicators').update({
    guided_answers: data.guided_answers,
    free_text: data.free_text || null,
    status: 'approved',
  }).eq('id', indicatorId)

  // 記錄顧問修改批註
  if (user) {
    await sc.from('company_ttqs_annotations').insert({
      indicator_id: indicatorId,
      annotator_id: user.id,
      content: note || '顧問已修改內容並確認通過',
      annotation_type: 'approved',
    })
  }

  revalidatePath(planPath(companyId))
}

/** 送審指標 */
export async function submitIndicator(indicatorId: string, companyId: string) {
  const sc = createServiceClient()
  await sc.from('company_ttqs_indicators').update({ status: 'submitted' }).eq('id', indicatorId)
  revalidatePath(planPath(companyId))
}

/** 顧問批註 */
export async function addAnnotation(
  indicatorId: string,
  companyId: string,
  content: string,
  type: 'comment' | 'needs_revision' | 'approved'
) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { error: '請先登入' }

  const sc = createServiceClient()
  await sc.from('company_ttqs_annotations').insert({
    indicator_id: indicatorId,
    annotator_id: user.id,
    content,
    annotation_type: type,
  })

  // 更新指標狀態
  if (type === 'approved') {
    await sc.from('company_ttqs_indicators').update({ status: 'approved' }).eq('id', indicatorId)
  } else if (type === 'needs_revision') {
    await sc.from('company_ttqs_indicators').update({ status: 'needs_revision' }).eq('id', indicatorId)
  }

  revalidatePath(planPath(companyId))
}

/** 鎖定整份計畫 */
export async function lockPlan(planId: string, companyId: string) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const sc = createServiceClient()
  await sc.from('company_ttqs_plans').update({
    status: 'locked',
    approved_by: user?.id ?? null,
    locked_at: new Date().toISOString(),
  }).eq('id', planId)

  revalidatePath(planPath(companyId))
}

/** 解鎖計畫 */
export async function unlockPlan(planId: string, companyId: string) {
  const sc = createServiceClient()
  await sc.from('company_ttqs_plans').update({
    status: 'draft',
    locked_at: null,
  }).eq('id', planId)
  revalidatePath(planPath(companyId))
}

/** 從去年匯入全部指標 */
export async function importFromLastYear(companyId: string, targetYear: number) {
  const sc = createServiceClient()
  const lastYear = targetYear - 1

  const { data: lastPlan } = await sc.from('company_ttqs_plans')
    .select('id').eq('company_id', companyId).eq('year', lastYear).single()
  if (!lastPlan) return { error: `找不到 ${lastYear} 年的資料` }

  const { data: lastIndicators } = await sc.from('company_ttqs_indicators')
    .select('indicator_number, guided_answers, free_text, file_urls')
    .eq('plan_id', lastPlan.id)

  if (!lastIndicators || lastIndicators.length === 0) return { error: `${lastYear} 年無指標資料` }

  // 確保目標年度存在
  const result = await ensurePlan(companyId, targetYear)
  if ('error' in result) return result

  // 逐一更新
  for (const li of lastIndicators) {
    await sc.from('company_ttqs_indicators').update({
      guided_answers: li.guided_answers,
      free_text: li.free_text,
      file_urls: li.file_urls,
      status: 'draft',
    }).eq('plan_id', result.planId).eq('indicator_number', li.indicator_number)
  }

  revalidatePath(planPath(companyId))
  return { imported: lastIndicators.length }
}

/** 從去年匯入單一指標 */
export async function importSingleIndicator(
  companyId: string, targetYear: number, indicatorNumber: string, targetIndicatorId: string
) {
  const sc = createServiceClient()
  const lastYear = targetYear - 1

  const { data: lastPlan } = await sc.from('company_ttqs_plans')
    .select('id').eq('company_id', companyId).eq('year', lastYear).single()
  if (!lastPlan) return { error: `找不到 ${lastYear} 年的資料` }

  const { data: lastInd } = await sc.from('company_ttqs_indicators')
    .select('guided_answers, free_text, file_urls')
    .eq('plan_id', lastPlan.id).eq('indicator_number', indicatorNumber).single()
  if (!lastInd) return { error: `${lastYear} 年無指標 ${indicatorNumber} 資料` }

  await sc.from('company_ttqs_indicators').update({
    guided_answers: lastInd.guided_answers,
    free_text: lastInd.free_text,
    file_urls: lastInd.file_urls,
    status: 'draft',
  }).eq('id', targetIndicatorId)

  revalidatePath(planPath(companyId))
  return { imported: true }
}
