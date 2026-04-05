import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { ProfileSignatureUpload } from './profile-signature-upload'
import { LineBindingSection } from './line-binding-section'
import { ProfileTabs } from './profile-tabs'

export const metadata = { title: '個人設定 | ID3A 管理平台' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  const ROLE_LABELS: Record<string, string> = { consultant: '顧問', hr: 'HR', manager: '主管', employee: '員工' }

  /* Fetch additional data with service client (bypasses RLS) */
  const serviceClient = createServiceClient()

  const [enrollmentsRes, quizAttemptsRes, licensesRes] = await Promise.all([
    serviceClient
      .from('course_enrollments')
      .select('id, course_id, status, completion_date, created_at')
      .eq('employee_id', user.id)
      .order('created_at', { ascending: false }),
    serviceClient
      .from('quiz_attempts')
      .select('id, quiz_id, score, total, percentage, passed, completed_at, answers')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false }),
    serviceClient
      .from('user_licenses')
      .select('id, product_id, purchased_at')
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false }),
  ])

  const enrollments = enrollmentsRes.data ?? []
  const quizAttempts = quizAttemptsRes.data ?? []
  const licenses = licensesRes.data ?? []

  /* Fetch related entities for display names */
  const courseIds = [...new Set(enrollments.map(e => e.course_id))]
  const quizIds = [...new Set(quizAttempts.map(a => a.quiz_id))]
  const productIds = [...new Set(licenses.map(l => l.product_id))]

  const [coursesRes, quizzesRes, productsRes] = await Promise.all([
    courseIds.length > 0
      ? serviceClient.from('courses').select('id, title, course_type, hours').in('id', courseIds)
      : Promise.resolve({ data: [] as { id: string; title: string; course_type: string; hours: number | null }[] }),
    quizIds.length > 0
      ? serviceClient.from('quizzes').select('id, title').in('id', quizIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    productIds.length > 0
      ? serviceClient.from('products').select('id, title, type').in('id', productIds)
      : Promise.resolve({ data: [] as { id: string; title: string; type: string }[] }),
  ])

  const courseMap = new Map((coursesRes.data ?? []).map(c => [c.id, c]))
  const quizMap = new Map((quizzesRes.data ?? []).map(q => [q.id, q]))
  const productMap = new Map((productsRes.data ?? []).map(p => [p.id, p]))

  /* Merge display data */
  const enrichedEnrollments = enrollments.map(e => {
    const course = courseMap.get(e.course_id)
    return {
      ...e,
      course_title: course?.title ?? '未知課程',
      course_type: course?.course_type ?? 'internal',
      hours: course?.hours ?? null,
    }
  })

  const enrichedAttempts = quizAttempts.map(a => {
    const quiz = quizMap.get(a.quiz_id)
    return {
      ...a,
      quiz_title: quiz?.title ?? '未知測驗',
    }
  })

  const enrichedLicenses = licenses.map(l => {
    const product = productMap.get(l.product_id)
    return {
      ...l,
      product_title: product?.title ?? '未知商品',
      product_type: product?.type ?? 'course',
    }
  })

  /* Basic info content (first tab) */
  const basicInfoContent = (
    <>
      <Card className="mb-6">
        <CardHeader><p className="font-semibold text-gray-900">基本資料</p></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400">姓名</p>
              <p className="text-gray-900">{profile.full_name || '未填寫'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-gray-900">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">角色</p>
              <p className="text-gray-900">{ROLE_LABELS[profile.role] ?? profile.role}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div>
            <p className="font-semibold text-gray-900">電子簽章</p>
            <p className="text-xs text-gray-400 mt-0.5">上傳您的電子簽名圖檔，用於文件簽核</p>
          </div>
        </CardHeader>
        <CardBody>
          <ProfileSignatureUpload
            profileId={profile.id}
            currentSignatureUrl={(profile as Record<string, unknown>).signature_url as string | null}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <p className="font-semibold text-gray-900">LINE 綁定</p>
            <p className="text-xs text-gray-400 mt-0.5">綁定 LINE 帳號以接收上課通知</p>
          </div>
        </CardHeader>
        <CardBody>
          <LineBindingSection profileId={profile.id} lineUserId={profile.line_user_id} />
        </CardBody>
      </Card>
    </>
  )

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">個人設定</h1>

      <ProfileTabs
        basicInfoContent={basicInfoContent}
        enrollments={enrichedEnrollments}
        quizAttempts={enrichedAttempts}
        licenses={enrichedLicenses}
      />
    </div>
  )
}
