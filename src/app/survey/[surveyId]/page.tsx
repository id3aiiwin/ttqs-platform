import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { SurveyForm } from '@/components/survey/survey-form'

export const metadata = { title: '課後問卷' }

export default async function SurveyPage({ params }: { params: Promise<{ surveyId: string }> }) {
  const { surveyId } = await params
  const sc = createServiceClient()

  const { data: survey } = await sc.from('course_surveys')
    .select('id, is_active, course_id').eq('id', surveyId).single()

  if (!survey) notFound()

  const { data: course } = await sc.from('courses')
    .select('title, start_date, trainer').eq('id', survey.course_id).single()

  if (!survey.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">此問卷已關閉</h1>
          <p className="text-gray-500">感謝您的參與！</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SurveyForm
        surveyId={surveyId}
        courseName={course?.title ?? ''}
        courseDate={course?.start_date ?? ''}
        instructor={course?.trainer ?? ''}
      />
    </div>
  )
}
