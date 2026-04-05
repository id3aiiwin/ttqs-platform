'use server'

import { createServiceClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createMeeting(formData: FormData) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { error: '請先登入' }

  const sc = createServiceClient()

  const companyId = formData.get('company_id') as string
  const meetingDate = formData.get('meeting_date') as string
  const meetingTime = (formData.get('meeting_time') as string) || null
  const meetingType = (formData.get('meeting_type') as string) || 'onsite'
  const attendeesCompany = (formData.get('attendees_company') as string) || null
  const discussionPoints = (formData.get('discussion_points') as string) || null

  // 顧問出席（checkbox）
  const consultantIds = formData.getAll('attendees_consultant') as string[]

  const { data: meeting, error } = await sc.from('meetings').insert({
    company_id: companyId,
    meeting_date: meetingDate,
    meeting_time: meetingTime,
    meeting_type: meetingType as 'onsite' | 'online' | 'phone',
    attendees_consultant: consultantIds,
    attendees_company: attendeesCompany,
    discussion_points: discussionPoints,
    created_by: user.id,
  }).select('id').single()

  if (error) return { error: error.message }

  // Action items
  const aiContents = formData.getAll('ai_content') as string[]
  const aiAssignees = formData.getAll('ai_assignee') as string[]
  const aiDueDates = formData.getAll('ai_due_date') as string[]
  const aiTodos = formData.getAll('ai_todo') as string[]

  const actionItems = aiContents
    .map((content, i) => ({
      meeting_id: meeting.id,
      content: content.trim(),
      assignee_id: aiAssignees[i] || null,
      due_date: aiDueDates[i] || null,
      is_added_to_todo: aiTodos[i] === 'true',
    }))
    .filter((ai) => ai.content)

  if (actionItems.length > 0) {
    await sc.from('meeting_action_items').insert(actionItems)
  }

  redirect(`/meetings/${meeting.id}`)
}

export async function toggleActionItemTodo(itemId: string, isAdded: boolean) {
  const sc = createServiceClient()
  await sc.from('meeting_action_items').update({ is_added_to_todo: isAdded }).eq('id', itemId)
  revalidatePath('/meetings')
  revalidatePath('/dashboard')
}

export async function toggleActionItemComplete(itemId: string, isCompleted: boolean) {
  const sc = createServiceClient()
  await sc.from('meeting_action_items').update({
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
  }).eq('id', itemId)
  revalidatePath('/meetings')
  revalidatePath('/dashboard')
}

export async function deleteMeeting(meetingId: string) {
  const sc = createServiceClient()
  await sc.from('meetings').delete().eq('id', meetingId)
  redirect('/meetings')
}
