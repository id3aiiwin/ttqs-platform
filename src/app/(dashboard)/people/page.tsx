import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { PeopleManagement } from '@/components/dashboard/people-management'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '人員管理 | ID3A 管理平台' }

export default async function PeoplePage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) redirect('/dashboard')

  const sc = createServiceClient()

  const [allPeopleRes, allOrdersRes, allRegsRes, companiesRes, coursesRes] = await Promise.all([
    sc.from('profiles').select('id, full_name, email, role, roles, company_id, job_title, instructor_level, accumulated_hours, average_satisfaction, analyst_level, is_personal_client, created_at, birthday, phone, gender, customer_level, r1_pattern, l2_pattern').order('created_at', { ascending: false }),
    sc.from('shop_orders').select('user_id, amount, status'),
    sc.from('course_registrations').select('student_id, fee, payment_status'),
    sc.from('companies').select('id, name'),
    sc.from('courses').select('id, title, start_date, hours, trainer, company_id, review_status, total_revenue').order('created_at', { ascending: false }),
  ])

  const allPeople = allPeopleRes.data ?? []
  const allOrders = allOrdersRes.data ?? []
  const allRegs = allRegsRes.data ?? []
  const companies = companiesRes.data ?? []
  const courses = coursesRes.data ?? []

  // Compute spending per person
  const spendingMap: Record<string, number> = {}
  allOrders.forEach((o: { user_id: string; amount: number; status: string }) => {
    if (o.status === 'paid') spendingMap[o.user_id] = (spendingMap[o.user_id] ?? 0) + o.amount
  })
  allRegs.forEach((r: { student_id: string | null; fee: number; payment_status: string }) => {
    if (r.student_id && (r.payment_status === 'paid' || r.payment_status === 'confirmed')) {
      spendingMap[r.student_id] = (spendingMap[r.student_id] ?? 0) + r.fee
    }
  })

  const people = allPeople.map(p => ({ ...p, total_spending: spendingMap[p.id] ?? 0 }))

  const companyMap: Record<string, string> = {}
  companies.forEach(c => { companyMap[c.id] = c.name })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">學員資料管理</h1>
      <p className="text-gray-500 text-sm mb-6">查看所有學員的基本資料、消費、R1/L2、天賦評量、學習履歷、測驗結果</p>
      <PeopleManagement people={people} companyMap={companyMap} courses={courses} />
    </div>
  )
}
