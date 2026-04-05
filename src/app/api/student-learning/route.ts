import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

/**
 * GET /api/student-learning?user_id=xxx
 * Returns enrollments + quiz attempts for a specific user
 * Only consultant/admin can query other users
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile) return NextResponse.json({ error: '無權限' }, { status: 403 })

  const userId = request.nextUrl.searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: '缺少 user_id' }, { status: 400 })

  // Only consultant/admin can view other people's data
  if (userId !== user.id && !['consultant', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: '無權限查看他人資料' }, { status: 403 })
  }

  const sc = createServiceClient()

  const [enrollmentsRes, quizRes, licensesRes] = await Promise.all([
    sc.from('course_enrollments')
      .select('id, course_id, status, completion_date, created_at')
      .eq('employee_id', userId)
      .order('created_at', { ascending: false }),
    sc.from('quiz_attempts')
      .select('id, quiz_id, score, total, percentage, passed, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false }),
    sc.from('user_licenses')
      .select('id, product_id')
      .eq('user_id', userId),
  ])

  const enrollments = enrollmentsRes.data ?? []
  const quizAttempts = quizRes.data ?? []
  const licenses = licensesRes.data ?? []

  // Fetch related names
  const courseIds = [...new Set(enrollments.map(e => e.course_id))]
  const quizIds = [...new Set(quizAttempts.map(a => a.quiz_id))]
  const productIds = [...new Set(licenses.map(l => l.product_id))]

  const [coursesRes, quizzesRes, productsRes] = await Promise.all([
    courseIds.length > 0
      ? sc.from('courses').select('id, title, start_date, hours, trainer').in('id', courseIds)
      : { data: [] as { id: string; title: string; start_date: string | null; hours: number | null; trainer: string | null }[] },
    quizIds.length > 0
      ? sc.from('quizzes').select('id, title').in('id', quizIds)
      : { data: [] as { id: string; title: string }[] },
    productIds.length > 0
      ? sc.from('products').select('id, title, type').in('id', productIds)
      : { data: [] as { id: string; title: string; type: string }[] },
  ])

  const courseMap: Record<string, { title: string; start_date: string | null; hours: number | null; trainer: string | null }> = {}
  ;(coursesRes.data ?? []).forEach(c => { courseMap[c.id] = c })

  const quizMap: Record<string, string> = {}
  ;(quizzesRes.data ?? []).forEach(q => { quizMap[q.id] = q.title })

  const productMap: Record<string, { title: string; type: string }> = {}
  ;(productsRes.data ?? []).forEach(p => { productMap[p.id] = p })

  const enrichedEnrollments = enrollments.map(e => ({
    ...e,
    course_title: courseMap[e.course_id]?.title ?? '未知課程',
    course_date: courseMap[e.course_id]?.start_date ?? null,
    course_hours: courseMap[e.course_id]?.hours ?? null,
    course_trainer: courseMap[e.course_id]?.trainer ?? null,
  }))

  const enrichedQuizzes = quizAttempts.map(a => ({
    ...a,
    quiz_title: quizMap[a.quiz_id] ?? '未知測驗',
  }))

  const enrichedLicenses = licenses.map(l => ({
    ...l,
    product_title: productMap[l.product_id]?.title ?? '未知產品',
    product_type: productMap[l.product_id]?.type ?? 'course',
  }))

  return NextResponse.json({
    enrollments: enrichedEnrollments,
    quizAttempts: enrichedQuizzes,
    licenses: enrichedLicenses,
  })
}
