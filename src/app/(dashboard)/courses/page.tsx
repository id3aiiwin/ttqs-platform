import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { CourseListPanel } from '@/components/course/course-list-panel'
import { CourseDetailPanel } from '@/components/course/course-detail-panel'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '課程管理 | ID3A 管理平台' }

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>
}) {
  const { selected } = await searchParams
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)

  const serviceClient = createServiceClient()

  const { data: courses } = await serviceClient
    .from('courses')
    .select('id, title, status, start_date, hours, company_id')
    .order('created_at', { ascending: false })

  // 取得企業名稱
  const companyIds = [...new Set((courses ?? []).map((c) => c.company_id).filter(Boolean) as string[])]
  const { data: companies } = companyIds.length > 0
    ? await serviceClient.from('companies').select('id, name').in('id', companyIds)
    : { data: [] }

  const companyMap: Record<string, string> = {}
  companies?.forEach((c) => { companyMap[c.id] = c.name })

  const coursesWithCompany = (courses ?? []).map((c) => ({
    ...c,
    company_id: c.company_id ?? '',
    company_name: c.company_id ? (companyMap[c.company_id] ?? '-') : '公開課',
  }))

  // 所有企業列表（供篩選用）
  const { data: allCompanies } = await serviceClient.from('companies').select('id, name').order('name')
  const companyOptions = (allCompanies ?? []).map((c) => ({ id: c.id, name: c.name }))

  // 選中的課程詳情
  let selectedCourse = null
  let selectedForms = null
  let selectedPhotos: { id: string; file_url: string; created_at: string }[] = []
  let selectedCompanyId = ''
  if (selected) {
    const { data: course } = await serviceClient
      .from('courses')
      .select('*')
      .eq('id', selected)
      .single()
    selectedCourse = course

    if (course) {
      selectedCompanyId = course.company_id ?? ''
      if (course.company_id) {
      const { data: comp } = await serviceClient.from('companies').select('name').eq('id', course.company_id).single()
      if (comp) (selectedCourse as Record<string, unknown>).company_name = comp.name
      } else {
        (selectedCourse as Record<string, unknown>).company_name = '公開課'
      }

      const { data: forms } = await serviceClient
        .from('course_forms')
        .select('*')
        .eq('course_id', selected)
        .order('pddro_phase')
        .order('sort_order')
      selectedForms = forms

      const { data: photos } = await serviceClient
        .from('course_photos')
        .select('id, file_url, created_at')
        .eq('course_id', selected)
        .order('created_at')
      selectedPhotos = photos ?? []
    }
  }

  // 公開課報名資料
  let selectedRegistrations: { id: string; student_name: string | null; student_email: string | null; student_phone: string | null; fee: number; payment_status: string; payment_date: string | null; account_last5: string | null }[] = []
  if (selected && selectedCourse?.course_type === 'public') {
    const { data: regs } = await serviceClient.from('course_registrations')
      .select('id, student_name, student_email, student_phone, fee, payment_status, payment_date, account_last5')
      .eq('course_id', selected)
      .order('registered_at')
    selectedRegistrations = regs ?? []
  }

  // 課程紀錄（顧問/講師內部）
  let selectedNotes: { id: string; author_name: string | null; note_type: string; content: string; employee_id: string | null; employee_name: string | null; created_at: string }[] = []
  let selectedTracking: Record<string, unknown>[] = []
  let courseEmployees: { id: string; name: string }[] = []
  if (selected && profile?.role === 'consultant') {
    const { data: notes } = await serviceClient
      .from('course_notes')
      .select('id, author_name, note_type, content, employee_id, employee_name, created_at')
      .eq('course_id', selected)
      .order('created_at', { ascending: false })
    selectedNotes = notes ?? []

    // 取得課中追蹤紀錄
    const { data: trackingData } = await serviceClient
      .from('course_tracking')
      .select('*')
      .eq('course_id', selected)
      .order('tracking_date', { ascending: false })
    selectedTracking = trackingData ?? []

    // 取得該課程企業的員工（用於選擇個別學員）
    if (selectedCompanyId) {
      const { data: emps } = await serviceClient
        .from('profiles')
        .select('id, full_name, email')
        .eq('company_id', selectedCompanyId)
      courseEmployees = (emps ?? []).map(e => ({ id: e.id, name: e.full_name || e.email }))
    }
  }

  // 教材資料
  let selectedMaterials: { id: string; material_type: string; file_name: string; file_url: string; uploaded_at: string }[] = []
  if (selected) {
    const { data: mats } = await serviceClient
      .from('course_materials')
      .select('id, material_type, file_name, file_url, uploaded_at')
      .eq('course_id', selected)
      .order('uploaded_at', { ascending: false })
    selectedMaterials = mats ?? []
  }

  // 問卷資料
  let selectedSurvey: { id: string; is_active: boolean } | null = null
  let surveyResponseCount = 0
  if (selected) {
    const { data: survey } = await serviceClient
      .from('course_surveys')
      .select('id, is_active')
      .eq('course_id', selected)
      .single()
    selectedSurvey = survey

    if (survey) {
      const { count } = await serviceClient
        .from('course_survey_responses')
        .select('id', { count: 'exact', head: true })
        .eq('survey_id', survey.id)
      surveyResponseCount = count ?? 0
    }
  }

  return (
    <div className="flex h-full">
      {/* 列表面板：mobile 選中課程時隱藏 */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 md:flex-shrink-0`}>
        <CourseListPanel
          courses={coursesWithCompany}
          selectedId={selected ?? null}
          role={profile?.role ?? 'employee'}
          companies={companyOptions}
        />
      </div>
      {/* 詳情面板：mobile 未選中時隱藏 */}
      <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>
        {selected && (
          <div className="md:hidden flex-shrink-0 px-4 py-2 bg-white border-b border-gray-100">
            <a href="/courses" className="inline-flex items-center gap-1 text-sm text-indigo-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回列表
            </a>
          </div>
        )}
        <CourseDetailPanel
          course={selectedCourse}
          forms={selectedForms}
          photos={selectedPhotos}
          notes={selectedNotes}
          tracking={selectedTracking}
          registrations={selectedRegistrations}
          courseEmployees={courseEmployees}
          survey={selectedSurvey}
          surveyResponseCount={surveyResponseCount}
          materials={selectedMaterials}
          role={profile?.role ?? 'employee'}
          companyId={selectedCompanyId}
        />
      </div>
    </div>
  )
}
