import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { getUser } from '@/lib/get-user'
import { InstructorCourseList } from '@/components/instructor/instructor-course-list'

export const metadata = { title: '我的授課 | ID3A 管理平台' }

export default async function MyCoursesPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  const roles = profile.roles?.length > 0 ? profile.roles : [profile.role]
  if (!roles.includes('instructor') && !roles.includes('supervisor') && !roles.includes('consultant')) {
    redirect('/dashboard')
  }

  const sc = createServiceClient()

  // 取得講師的課程
  const { data: courses } = await sc
    .from('courses')
    .select('id, title, status, start_date, end_date, hours, company_id, material_submit_date, teaching_log_submit_date')
    .eq('trainer', profile.full_name ?? '')
    .order('start_date', { ascending: false })

  // 取得企業名稱
  const companyIds = [...new Set((courses ?? []).map(c => c.company_id).filter(Boolean) as string[])]
  const { data: companies } = companyIds.length > 0
    ? await sc.from('companies').select('id, name').in('id', companyIds)
    : { data: [] }
  const companyMap: Record<string, string> = {}
  companies?.forEach(c => { companyMap[c.id] = c.name })

  // 取得所有教材上傳紀錄
  const courseIds = (courses ?? []).map(c => c.id)
  const { data: materials } = courseIds.length > 0
    ? await sc.from('course_materials').select('*').in('course_id', courseIds)
    : { data: [] }

  type MaterialRow = NonNullable<typeof materials>[number]
  const materialsByCourse: Record<string, MaterialRow[]> = {}
  materials?.forEach(m => {
    if (!materialsByCourse[m.course_id]) materialsByCourse[m.course_id] = []
    materialsByCourse[m.course_id]!.push(m)
  })

  const coursesWithInfo = (courses ?? []).map(c => ({
    ...c,
    company_name: c.company_id ? (companyMap[c.company_id] ?? '-') : '公開課',
    materials: materialsByCourse[c.id] ?? [],
  }))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">我的授課</h1>
      <InstructorCourseList courses={coursesWithInfo} />
    </div>
  )
}
