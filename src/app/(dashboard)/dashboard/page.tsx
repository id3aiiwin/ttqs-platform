import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { UnifiedDashboard } from '@/components/dashboard/unified-dashboard'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '儀表板 | ID3A 管理平台' }

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  const sc = createServiceClient()
  const roles = (profile.roles && profile.roles.length > 0) ? profile.roles : [profile.role]
  const data: Record<string, unknown> = {}

  // ===== consultant / admin =====
  if (roles.includes('consultant') || roles.includes('admin')) {
    // Pre-compute date boundaries (pure JS, no async)
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
    const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const today = now.toISOString().split('T')[0]

    // All independent queries in parallel
    const [
      companiesRes,
      allPeopleRes,
      allOrdersRes,
      allRegsRes,
      allCoursesRes,
      pendingOrdersRes,
      pendingTodosRes,
      monthOrdersRes,
      monthRegsRes,
      lastMonthOrdersRes,
      pendingApprovalsRes,
      surveyedRes,
      upcomingAssessmentsRes,
    ] = await Promise.all([
      sc.from('companies').select('*').order('updated_at', { ascending: false }),
      sc.from('profiles').select('id, full_name, email, role, roles, company_id, job_title, instructor_level, accumulated_hours, average_satisfaction, analyst_level, is_personal_client, created_at').order('created_at', { ascending: false }),
      sc.from('shop_orders').select('user_id, amount, status'),
      sc.from('course_registrations').select('student_id, fee, payment_status'),
      sc.from('courses').select('id, title, status, course_type, start_date, hours, trainer, company_id, review_status, is_counted_in_hours, total_revenue, created_at').order('created_at', { ascending: false }),
      sc.from('shop_orders').select('id').eq('status', 'pending'),
      sc.from('todos').select('id').eq('status', 'pending'),
      sc.from('shop_orders').select('amount').eq('status', 'paid').gte('created_at', monthStart),
      sc.from('course_registrations').select('fee').in('payment_status', ['paid', 'confirmed']).gte('registered_at', monthStart),
      sc.from('shop_orders').select('amount').eq('status', 'paid').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
      sc.from('document_approval_signatures').select('id').eq('status', 'pending'),
      sc.from('course_surveys').select('course_id'),
      sc.from('profiles')
        .select('id, full_name, email, company_id, scheduled_assessment_date, line_user_id')
        .not('scheduled_assessment_date', 'is', null)
        .gte('scheduled_assessment_date', today)
        .lte('scheduled_assessment_date', next7)
        .order('scheduled_assessment_date'),
    ])

    const companies = companiesRes.data
    const allPeople = allPeopleRes.data
    const allOrders = allOrdersRes.data
    const allRegs = allRegsRes.data
    const allCourses = allCoursesRes.data
    const pendingOrders = pendingOrdersRes.data
    const pendingTodos = pendingTodosRes.data
    const monthOrders = monthOrdersRes.data
    const monthRegs = monthRegsRes.data
    const lastMonthOrders = lastMonthOrdersRes.data
    const pendingApprovals = pendingApprovalsRes.data
    const surveyed = surveyedRes.data
    const upcomingAssessments = upcomingAssessmentsRes.data

    // Derive data from query results
    data.companies = companies ?? []

    // 計算每人的消費貢獻
    const spendingMap: Record<string, number> = {}
    allOrders?.forEach((o: { user_id: string; amount: number; status: string }) => {
      if (o.status === 'paid') spendingMap[o.user_id] = (spendingMap[o.user_id] ?? 0) + o.amount
    })
    allRegs?.forEach((r: { student_id: string | null; fee: number; payment_status: string }) => {
      if (r.student_id && (r.payment_status === 'paid' || r.payment_status === 'confirmed')) {
        spendingMap[r.student_id] = (spendingMap[r.student_id] ?? 0) + r.fee
      }
    })
    data.allPeople = (allPeople ?? []).map(p => ({ ...p, total_spending: spendingMap[p.id] ?? 0 }))

    data.allCourses = allCourses ?? []

    const cMap: Record<string, string> = {}
    ;(companies ?? []).forEach((c: { id: string; name: string }) => { cMap[c.id] = c.name })
    data.companyMap = cMap

    data.pendingReviewCount = (allCourses ?? []).filter((c: { review_status: string }) => c.review_status === 'pending').length

    data.pendingOrderCount = pendingOrders?.length ?? 0

    data.pendingTodoCount = pendingTodos?.length ?? 0

    // 本月營收
    const monthProductRevenue = (monthOrders ?? []).reduce((s, o) => s + (o.amount ?? 0), 0)
    const monthRegRevenue = (monthRegs ?? []).reduce((s, r) => s + (r.fee ?? 0), 0)
    const monthCourses = (allCourses ?? []).filter((c: { start_date: string | null }) => c.start_date && c.start_date >= monthStart)
    const monthCourseRevenue = monthCourses.reduce((s: number, c: { total_revenue: number }) => s + (c.total_revenue ?? 0), 0)
    data.monthRevenue = monthProductRevenue + monthRegRevenue + monthCourseRevenue

    // 上月營收（比較用）
    const lastMonthRev = (lastMonthOrders ?? []).reduce((s, o) => s + (o.amount ?? 0), 0)
    data.lastMonthRevenue = lastMonthRev

    // 近期課程（未來 7 天）
    data.upcomingCourses = (allCourses ?? []).filter((c: { start_date: string | null }) => c.start_date && c.start_date >= today && c.start_date <= next7)

    // 待簽核
    data.pendingApprovalCount = pendingApprovals?.length ?? 0

    // 未回填滿意度的已完成課程
    const completedCourses = (allCourses ?? []).filter((c: { status: string }) => c.status === 'completed')
    const surveyedIds = new Set((surveyed ?? []).map(s => s.course_id))
    data.noSurveyCount = completedCourses.filter((c: { id: string }) => !surveyedIds.has(c.id)).length

    // 講師本月工作量
    const trainerHours: Record<string, number> = {}
    monthCourses.forEach((c: { trainer: string | null; hours: number | null }) => {
      if (c.trainer) trainerHours[c.trainer] = (trainerHours[c.trainer] ?? 0) + (c.hours ?? 0)
    })
    data.trainerWorkload = Object.entries(trainerHours).sort((a, b) => b[1] - a[1])

    data.upcomingAssessments = upcomingAssessments ?? []
  }

  // ===== hr =====
  if (roles.includes('hr') && profile.company_id) {
    const [companyRes, employeesRes, hrCoursesRes, documentsRes] = await Promise.all([
      sc.from('companies').select('*').eq('id', profile.company_id).single(),
      sc.from('profiles').select('id, full_name, email, role, department_id').eq('company_id', profile.company_id),
      sc.from('courses').select('id, title, status, start_date, hours').eq('company_id', profile.company_id).order('created_at', { ascending: false }),
      sc.from('company_documents').select('id, title, tier, status').eq('company_id', profile.company_id),
    ])
    data.hrCompany = companyRes.data; data.hrEmployees = employeesRes.data ?? []; data.hrCourses = hrCoursesRes.data ?? []; data.hrDocuments = documentsRes.data ?? []
  }

  // ===== manager =====
  if (roles.includes('manager') && profile.company_id) {
    const [companyRes, deptEmployeesRes] = await Promise.all([
      sc.from('companies').select('name').eq('id', profile.company_id).single(),
      sc.from('profiles').select('id, full_name, email, role').eq('department_id', profile.department_id ?? ''),
    ])
    data.managerCompanyName = companyRes.data?.name ?? ''; data.managerEmployees = deptEmployeesRes.data ?? []
  }

  // ===== instructor / supervisor =====
  if (roles.includes('instructor') || roles.includes('supervisor')) {
    const { data: myCourses } = await sc.from('courses').select('id, title, status, start_date, hours, review_status, is_counted_in_hours').eq('trainer', profile.full_name ?? '').order('start_date', { ascending: false })
    data.instructorCourses = myCourses ?? []
  }

  // ===== analyst =====
  if (roles.includes('analyst')) {
    const [casesRes, countRes] = await Promise.all([
      sc.from('analyst_cases').select('id, case_title, case_date, case_type, status, client_name').eq('analyst_id', user.id).order('created_at', { ascending: false }),
      sc.from('analyst_cases').select('id', { count: 'exact', head: true }).eq('analyst_id', user.id),
    ])
    data.analystCases = casesRes.data ?? []; data.analystCaseCount = countRes.count ?? 0
  }

  // ===== employee / student =====
  if (roles.includes('employee') || roles.includes('student')) {
    // Enrollment fetch + optional company name fetch can start in parallel
    const enrollmentsPromise = sc.from('course_enrollments').select('id, status, completion_date, course_id, company_id').eq('employee_id', user.id)
    const companyPromise = profile.company_id
      ? sc.from('companies').select('name').eq('id', profile.company_id).single()
      : Promise.resolve({ data: null })

    const [enrollmentsRes, compRes] = await Promise.all([enrollmentsPromise, companyPromise])
    const enrollments = enrollmentsRes.data

    // Sequential: eCourses depends on enrollment results
    const courseIds = [...new Set((enrollments ?? []).map(e => e.course_id))]
    const { data: eCourses } = courseIds.length > 0
      ? await sc.from('courses').select('id, title, start_date, hours, trainer, company_id, course_type').in('id', courseIds)
      : { data: [] }
    type EC = NonNullable<typeof eCourses>[number]
    const ecMap: Record<string, EC> = {}
    eCourses?.forEach(c => { ecMap[c.id] = c })
    data.enrollments = (enrollments ?? []).map(e => ({
      id: e.id, status: e.status, completed_at: e.completion_date, company_id: e.company_id,
      course: ecMap[e.course_id] ?? null,
    }))
    data.employeeCompanyName = compRes.data?.name ?? ''
    data.employeeCompanyId = profile.company_id ?? ''

    // 取得同仁的職能表單（工作說明書等）
    if (profile.company_id) {
      const { data: myEntries } = await sc
        .from('competency_form_entries')
        .select('id, form_type, status, created_at')
        .eq('employee_id', user.id)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
      data.myFormEntries = myEntries ?? []
    }
  }

  return <UnifiedDashboard profile={profile} roles={roles} data={data} />
}
