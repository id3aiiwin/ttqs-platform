import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader } from '@/components/ui/card'
import { DocumentTierView } from '@/components/company/document-tier-view'
import { InitDocumentsButton } from '@/components/company/init-documents-button'

export const metadata = { title: '四階管理文件 | ID3A 管理平台' }

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tier?: string }>
}) {
  const { id } = await params
  const { tier: tierParam } = await searchParams
  const activeTier = parseInt(tierParam || '1', 10)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  const isConsultant = profile?.role === 'consultant'

  const serviceClient = createServiceClient()

  const { data: company } = await serviceClient
    .from('companies')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!company) notFound()

  const { data: documents } = await serviceClient
    .from('company_documents')
    .select('*')
    .eq('company_id', id)
    .order('tier')
    .order('title')

  // 取得企業的課程（歸入四階表單）
  const { data: companyCourses } = await serviceClient
    .from('courses')
    .select('id, title, status, start_date')
    .eq('company_id', id)
    .order('created_at', { ascending: false })

  // 取得課程表單
  const courseIds = companyCourses?.map((c) => c.id) ?? []
  const { data: allCourseForms } = courseIds.length > 0
    ? await serviceClient
        .from('course_forms')
        .select('id, course_id, name, standard_name, pddro_phase, form_type, status, ttqs_indicator')
        .in('course_id', courseIds)
        .order('pddro_phase')
        .order('sort_order')
    : { data: [] }

  type CourseFormRow = NonNullable<typeof allCourseForms>[number]
  const formsByCourse: Record<string, CourseFormRow[]> = {}
  allCourseForms?.forEach((f) => {
    if (!formsByCourse[f.course_id]) formsByCourse[f.course_id] = []
    formsByCourse[f.course_id].push(f)
  })

  const courses = (companyCourses ?? []).map((c) => ({
    ...c,
    course_forms: formsByCourse[c.id] ?? [],
  }))

  // 取得所有版本和審核紀錄
  const docIds = documents?.map((d) => d.id) ?? []
  const { data: allVersions } = docIds.length > 0
    ? await serviceClient.from('company_document_versions').select('*').in('document_id', docIds).order('changed_at', { ascending: false })
    : { data: [] }
  const { data: allReviews } = docIds.length > 0
    ? await serviceClient.from('company_document_reviews').select('*').in('document_id', docIds).order('reviewed_at', { ascending: false })
    : { data: [] }

  // 取得相關人員名稱
  const personIds = [
    ...(allVersions ?? []).map((v) => v.changed_by).filter(Boolean),
    ...(allReviews ?? []).map((r) => r.reviewer_id).filter(Boolean),
  ] as string[]
  const { data: personProfiles } = personIds.length > 0
    ? await serviceClient.from('profiles').select('id, full_name, email').in('id', [...new Set(personIds)])
    : { data: [] }
  const personMap: Record<string, string> = {}
  personProfiles?.forEach((p) => { personMap[p.id] = p.full_name || p.email })

  type VersionRow = NonNullable<typeof allVersions>[number] & { changer_name?: string }
  type ReviewRow = NonNullable<typeof allReviews>[number] & { reviewer_name?: string }
  const versionsByDoc: Record<string, VersionRow[]> = {}
  allVersions?.forEach((v) => {
    if (!versionsByDoc[v.document_id]) versionsByDoc[v.document_id] = []
    versionsByDoc[v.document_id].push({ ...v, changer_name: personMap[v.changed_by ?? ''] ?? undefined })
  })
  const reviewsByDoc: Record<string, ReviewRow[]> = {}
  allReviews?.forEach((r) => {
    if (!reviewsByDoc[r.document_id]) reviewsByDoc[r.document_id] = []
    reviewsByDoc[r.document_id].push({ ...r, reviewer_name: personMap[r.reviewer_id] ?? undefined })
  })

  // 取得簽核資料
  const approvalIds = documents?.map(d => d.approval_id).filter(Boolean) as string[] ?? []
  const { data: allApprovals } = approvalIds.length > 0
    ? await serviceClient.from('document_approvals').select('*').in('id', approvalIds)
    : { data: [] }
  const { data: allApprovalSigs } = approvalIds.length > 0
    ? await serviceClient.from('document_approval_signatures').select('*').in('approval_id', approvalIds).order('step_order')
    : { data: [] }

  type ApprovalRow = NonNullable<typeof allApprovals>[number]
  type SigRow = NonNullable<typeof allApprovalSigs>[number]
  const approvalMap: Record<string, ApprovalRow> = {}
  allApprovals?.forEach(a => { approvalMap[a.id] = a })
  const sigsByApproval: Record<string, SigRow[]> = {}
  allApprovalSigs?.forEach(s => {
    if (!sigsByApproval[s.approval_id]) sigsByApproval[s.approval_id] = []
    sigsByApproval[s.approval_id].push(s)
  })

  // 取得企業的簽核流程
  const { data: approvalFlows } = await serviceClient.from('approval_flows').select('id, name, is_default').eq('company_id', id)

  const hasDocuments = documents && documents.length > 0

  // 按 tier 分組
  const docsByTier: Record<number, typeof documents> = { 1: [], 2: [], 3: [], 4: [] }
  documents?.forEach((d) => {
    if (!docsByTier[d.tier]) docsByTier[d.tier] = []
    docsByTier[d.tier]!.push(d)
  })

  // 統計
  const tierLabels = ['', '一階：管理手冊', '二階：程序文件', '三階：工作指導書', '四階：表單']
  const totalDocs = documents?.length ?? 0
  const approvedDocs = documents?.filter((d) => d.status === 'approved').length ?? 0

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/companies/${id}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回企業詳情
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">四階管理文件</h1>
        <p className="text-gray-500 text-sm mt-1">{company.name}</p>
      </div>

      {!hasDocuments ? (
        <Card>
          <div className="text-center py-16 px-4">
            <svg className="w-14 h-14 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-gray-500 mb-1">尚未建立四階文件</p>
            <p className="text-xs text-gray-400 mb-4">載入公版文件清單後，可依企業需求自訂</p>
            {isConsultant && <InitDocumentsButton companyId={id} />}
          </div>
        </Card>
      ) : (
        <>
          {/* 進度 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                文件完成度 {approvedDocs}/{totalDocs}
              </p>
              <p className="text-xs text-gray-400">
                {totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0}%
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all"
                style={{ width: `${totalDocs > 0 ? (approvedDocs / totalDocs) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* 從知識庫新增 */}
          {isConsultant && (
            <div className="mb-4">
              <InitDocumentsButton companyId={id} />
            </div>
          )}

          {/* Tier Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
            {[1, 2, 3, 4].map((tier) => (
              <Link
                key={tier}
                href={`/companies/${id}/documents?tier=${tier}`}
                className={`flex-1 text-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTier === tier
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                第{['', '一', '二', '三', '四'][tier]}階
                <span className="ml-1 text-xs text-gray-400">({docsByTier[tier]?.length ?? 0})</span>
              </Link>
            ))}
          </div>

          {/* Active tier content */}
          <Card>
            <CardHeader>
              <p className="font-semibold text-gray-900">{tierLabels[activeTier]}</p>
            </CardHeader>
            <DocumentTierView
              documents={docsByTier[activeTier] ?? []}
              companyId={id}
              tier={activeTier}
              isConsultant={isConsultant}
              versionsByDoc={versionsByDoc as Record<string, { id: string; version: string; change_note: string | null; changed_by: string | null; changed_at: string; file_url: string | null; changer_name?: string }[]>}
              reviewsByDoc={reviewsByDoc as Record<string, { id: string; status: 'needs_revision' | 'approved'; comment: string | null; reviewed_at: string; reviewer_id: string; reviewer_name?: string }[]>}
              approvalMap={approvalMap as Record<string, { id: string; status: string; current_step: number }>}
              sigsByApproval={sigsByApproval as Record<string, { id: string; step_order: number; signer_role: string; signer_name: string | null; signature_url: string | null; status: string; comment: string | null; signed_at: string | null }[]>}
              approvalFlows={(approvalFlows ?? []).map(f => ({ id: f.id, name: f.name, is_default: f.is_default }))}
            />
          </Card>

          {/* 四階：課程表單區塊 */}
          {activeTier === 4 && courses && courses.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <p className="font-semibold text-gray-900">課程表單（PDDRO）</p>
                <p className="text-xs text-gray-400">各課程的 PDDRO 表單，點擊可進入填寫</p>
              </CardHeader>
              <div className="divide-y divide-gray-100">
                {courses.map((course) => {
                  const forms = course.course_forms ?? []
                  const completed = forms.filter((f) => f.status === 'completed').length
                  return (
                    <div key={course.id} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{course.title}</p>
                          <p className="text-xs text-gray-400">
                            {course.start_date ?? '未排期'} · {forms.length} 份表單 · {completed} 完成
                          </p>
                        </div>
                        <Link
                          href={`/courses?selected=${course.id}`}
                          className="text-xs text-indigo-600 hover:text-indigo-700"
                        >
                          查看課程
                        </Link>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {forms.map((f) => (
                          <Link
                            key={f.id}
                            href={f.form_type === 'online' ? `/courses/${course.id}/forms/${f.id}` : `/courses?selected=${course.id}`}
                            className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border transition-colors hover:border-indigo-300
                              ${f.status === 'completed'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : f.status === 'in_progress'
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  : 'bg-gray-50 text-gray-600 border-gray-200'
                              }`}
                            title={`${f.pddro_phase} · ${f.name}`}
                          >
                            <span className="font-mono text-[10px] text-gray-400">{f.pddro_phase}</span>
                            {f.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
