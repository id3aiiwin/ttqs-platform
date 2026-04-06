import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { CourseTemplatesClient } from './course-templates-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '課程模板 | ID3A 管理平台' }

export default async function CourseTemplatesPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) redirect('/dashboard')

  const sc = createServiceClient()
  const { data: templates } = await sc.from('course_templates_v2').select('*').order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">課程模板</h1>
      <p className="text-gray-500 text-sm mb-6">建立常用課程模板，快速開課</p>
      <CourseTemplatesClient templates={templates ?? []} />
    </div>
  )
}
