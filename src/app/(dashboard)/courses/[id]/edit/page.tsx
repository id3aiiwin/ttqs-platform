import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { CourseForm } from '@/components/course/course-form'
import { updateCourse, deleteCourse } from '../../actions'
import { DeleteCourseButton } from '@/components/course/delete-course-button'

export const metadata = { title: '編輯課程 | ID3A 管理平台' }

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: course }, { data: companies }] = await Promise.all([
    supabase.from('courses').select('*').eq('id', id).single(),
    supabase.from('companies').select('id, name').order('name'),
  ])

  if (!course) notFound()

  const updateWithId = updateCourse.bind(null, id)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/courses/${id}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回課程詳情
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">編輯課程</h1>
        <p className="text-gray-500 text-sm mt-1">{course.title}</p>
      </div>

      <Card>
        <CardHeader><p className="text-sm text-gray-500">修改課程資料</p></CardHeader>
        <CardBody>
          <CourseForm
            action={updateWithId}
            companies={companies ?? []}
            defaultValues={course}
            submitLabel="儲存變更"
          />
        </CardBody>
      </Card>

      <div className="mt-6 border border-red-200 rounded-xl p-5">
        <p className="text-sm font-medium text-red-700 mb-1">危險區域</p>
        <p className="text-xs text-gray-500 mb-3">刪除課程後無法復原。</p>
        <DeleteCourseButton courseId={id} courseTitle={course.title} />
      </div>
    </div>
  )
}
