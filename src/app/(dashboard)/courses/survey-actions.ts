'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSurvey(courseId: string) {
  const sc = createServiceClient()
  const { data, error } = await sc.from('course_surveys').insert({
    course_id: courseId,
    is_active: true,
  }).select('id').single()
  if (error) return { error: error.message }
  revalidatePath('/courses')
  return { surveyId: data.id }
}

export async function toggleSurvey(surveyId: string, isActive: boolean) {
  const sc = createServiceClient()
  await sc.from('course_surveys').update({ is_active: isActive }).eq('id', surveyId)

  // 關閉問卷 → PDDRO 滿意度調查改為 completed
  if (!isActive) {
    const { data: survey } = await sc.from('course_surveys').select('course_id').eq('id', surveyId).single()
    if (survey) {
      await sc.from('course_forms')
        .update({ status: 'completed' })
        .eq('course_id', survey.course_id)
        .eq('standard_name', '滿意度調查')
    }
  }

  revalidatePath('/courses')
}
