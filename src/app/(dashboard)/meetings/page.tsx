import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MeetingFilter } from '@/components/meeting/meeting-filter'

export const metadata = { title: '會議記錄 | ID3A 管理平台' }

const TYPE_LABELS: Record<string, string> = { onsite: '現場', online: '視訊', phone: '電話' }

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>
}) {
  const { company: filterCompanyId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') redirect('/dashboard')

  const sc = createServiceClient()

  // 所有企業（用於篩選下拉）
  const { data: companies } = await sc.from('companies').select('id, name').order('name')

  // 所有顧問
  const { data: consultants } = await sc.from('profiles').select('id, full_name, email').eq('role', 'consultant' as never)
  const consultantMap: Record<string, string> = {}
  consultants?.forEach((c) => { consultantMap[c.id] = c.full_name || c.email })

  // 企業名稱 map
  const companyMap: Record<string, string> = {}
  companies?.forEach((c) => { companyMap[c.id] = c.name })

  // 查詢會議（篩選或全部）
  let query = sc.from('meetings').select('*').order('meeting_date', { ascending: false })
  if (filterCompanyId) {
    query = query.eq('company_id', filterCompanyId)
  }
  const { data: meetings } = await query

  // Action items 統計
  const meetingIds = meetings?.map((m) => m.id) ?? []
  const { data: actionItems } = meetingIds.length > 0
    ? await sc.from('meeting_action_items').select('meeting_id, is_completed').in('meeting_id', meetingIds)
    : { data: [] }

  const aiCountMap: Record<string, { total: number; done: number }> = {}
  actionItems?.forEach((ai) => {
    if (!aiCountMap[ai.meeting_id]) aiCountMap[ai.meeting_id] = { total: 0, done: 0 }
    aiCountMap[ai.meeting_id].total++
    if (ai.is_completed) aiCountMap[ai.meeting_id].done++
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">會議記錄</h1>
          <p className="text-gray-500 text-sm mt-1">顧問團隊內部輔導日誌</p>
        </div>
        <Link href="/meetings/new">
          <Button>+ 新增會議</Button>
        </Link>
      </div>

      {/* 企業篩選 */}
      <MeetingFilter
        companies={companies ?? []}
        currentCompanyId={filterCompanyId ?? ''}
      />

      {/* 會議列表 */}
      <div className="flex flex-col gap-3 mt-5">
        {!meetings || meetings.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <p className="text-sm text-gray-400 mb-1">尚無會議記錄</p>
              <Link href="/meetings/new" className="text-indigo-600 hover:underline text-sm">新增第一筆會議</Link>
            </div>
          </Card>
        ) : (
          meetings.map((meeting) => {
            const ai = aiCountMap[meeting.id]
            const attendees = Array.isArray(meeting.attendees_consultant)
              ? (meeting.attendees_consultant as string[]).map((id) => consultantMap[id] ?? '?')
              : []

            return (
              <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="info">{companyMap[meeting.company_id] ?? '未知'}</Badge>
                        <Badge variant="default">{TYPE_LABELS[meeting.meeting_type] ?? meeting.meeting_type}</Badge>
                        {ai && ai.total > 0 && (
                          <span className="text-xs text-gray-400">
                            待辦 {ai.done}/{ai.total}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {meeting.discussion_points?.slice(0, 120) || '（無討論記錄）'}
                        {(meeting.discussion_points?.length ?? 0) > 120 && '...'}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>出席：{attendees.join('、') || '未記錄'}</span>
                        {meeting.attendees_company && (
                          <span>企業：{meeting.attendees_company}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-700">{meeting.meeting_date}</p>
                      {meeting.meeting_time && (
                        <p className="text-xs text-gray-400">{meeting.meeting_time.slice(0, 5)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
