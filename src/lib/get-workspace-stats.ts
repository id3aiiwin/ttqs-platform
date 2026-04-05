import { createServiceClient } from '@/lib/supabase/server'

// 每個構面對應的指標 ID 和總數
const PHASE_INDICATORS: Record<string, { ids: string[]; total: number }> = {
  P:  { ids: ['1', '2', '3', '4', '5', '6'], total: 6 },
  D:  { ids: ['7', '8', '9', '10', '11'], total: 5 },
  DO: { ids: ['12', '13', '14'], total: 3 },
  R:  { ids: ['15', '16'], total: 2 },
  O:  { ids: ['17a', '17b', '17c', '17d', '18', '19'], total: 6 },
}

export async function getWorkspaceStats(companyId: string) {
  const sc = createServiceClient()

  // 課程
  const { data: courses } = await sc
    .from('courses')
    .select('id')
    .eq('company_id', companyId)

  const courseIds = courses?.map((c) => c.id) ?? []

  // 課程表單（用於待辦統計）
  const { data: courseForms } = courseIds.length > 0
    ? await sc.from('course_forms').select('id, status').in('course_id', courseIds)
    : { data: [] }

  // 四階文件
  const { data: documents } = await sc
    .from('company_documents')
    .select('id, status')
    .eq('company_id', companyId)

  // 職能表單
  const { data: competencyEntries } = await sc
    .from('competency_form_entries')
    .select('id, status')
    .eq('company_id', companyId)

  // PDDRO 進度：從當年度 TTQS 指標計算
  const currentYear = new Date().getFullYear()
  const { data: plan } = await sc
    .from('company_ttqs_plans')
    .select('id')
    .eq('company_id', companyId)
    .eq('year', currentYear)
    .single()

  const { data: ttqsIndicators } = plan
    ? await sc.from('company_ttqs_indicators').select('indicator_number, status').eq('plan_id', plan.id)
    : { data: null }

  const phases = ['P', 'D', 'DO', 'R', 'O'] as const
  const pddroProgress: Record<string, { total: number; completed: number; pct: number }> = {}

  phases.forEach((p) => {
    const config = PHASE_INDICATORS[p]
    const total = config.total

    if (!ttqsIndicators) {
      pddroProgress[p] = { total, completed: 0, pct: 0 }
      return
    }

    const phaseInds = ttqsIndicators.filter((i) => config.ids.includes(i.indicator_number))
    const completed = phaseInds.filter((i) => i.status === 'approved').length
    pddroProgress[p] = { total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 }
  })

  const totalInds = 22 // 6+5+3+2+6
  const approvedInds = ttqsIndicators?.filter((i) => i.status === 'approved').length ?? 0
  const overallPddro = totalInds > 0 ? Math.round((approvedInds / totalInds) * 100) : 0

  // 整體輔導進度 = PDDRO 指標(40%) + 文件確認(30%) + 表單完成(30%)
  const totalDocs = documents?.length ?? 0
  const approvedDocs = documents?.filter((d) => d.status === 'approved').length ?? 0
  const docPct = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0

  const totalFormCount = courseForms?.length ?? 0
  const completedFormCount = courseForms?.filter((f) => f.status === 'completed').length ?? 0
  const formPct = totalFormCount > 0 ? Math.round((completedFormCount / totalFormCount) * 100) : 0

  const coachingProgress = Math.round(overallPddro * 0.4 + docPct * 0.3 + formPct * 0.3)

  // 未完成的 action items（從最近會議）
  const { data: recentActions } = await sc.from('meeting_action_items')
    .select('id, content, is_completed, due_date')
    .eq('is_completed', false)
    .order('due_date', { ascending: true })
    .limit(5)

  return {
    courseCount: courses?.length ?? 0,
    overallPddro,
    pddroProgress,
    totalDocs,
    approvedDocs,
    docPct,
    formPct,
    coachingProgress,
    competencyEntryCount: competencyEntries?.length ?? 0,
    pendingJd: competencyEntries?.filter((e) => e.status === 'submitted').length ?? 0,
    pendingReviewDocs: documents?.filter((d) => d.status === 'pending_review').length ?? 0,
    incompleteForms: courseForms?.filter((f) => f.status === 'pending').length ?? 0,
    pendingActions: recentActions ?? [],
  }
}
