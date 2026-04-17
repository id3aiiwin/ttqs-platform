import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ActionItemsList } from '@/components/meeting/action-items-list'
import { MeetingApprovalSection } from './meeting-approval-section'
import { getUser } from '@/lib/get-user'

const TYPE_LABELS: Record<string, string> = { onsite: '現場', online: '視訊', phone: '電話' }

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') redirect('/dashboard')

  const sc = createServiceClient()

  const { data: meeting } = await sc.from('meetings').select('*').eq('id', id).single()
  if (!meeting) notFound()

  const approvalId = (meeting as Record<string, unknown>).approval_id as string | null

  const [
    { data: company },
    { data: consultants },
    { data: actionItems },
    approvalRes,
    sigsRes,
    { data: approvalFlows },
  ] = await Promise.all([
    sc.from('companies').select('name').eq('id', meeting.company_id).single(),
    sc.from('profiles').select('id, full_name, email').eq('role', 'consultant' as never),
    sc.from('meeting_action_items').select('*').eq('meeting_id', id).order('created_at'),
    approvalId
      ? sc.from('document_approvals').select('*').eq('id', approvalId).single()
      : Promise.resolve({ data: null }),
    approvalId
      ? sc.from('document_approval_signatures').select('*').eq('approval_id', approvalId).order('step_order')
      : Promise.resolve({ data: [] as { id: string; step_order: number; signer_role: string; signer_name: string | null; signature_url: string | null; status: string; comment: string | null; signed_at: string | null }[] }),
    sc.from('approval_flows').select('id, name, is_default').eq('company_id', meeting.company_id),
  ])
  const meetingApproval = approvalRes.data
  const meetingApprovalSigs = sigsRes.data ?? []

  const consultantMap: Record<string, string> = {}
  consultants?.forEach((c) => { consultantMap[c.id] = c.full_name || c.email })

  const attendees = Array.isArray(meeting.attendees_consultant)
    ? (meeting.attendees_consultant as string[]).map((cid) => consultantMap[cid] ?? '?')
    : []

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/meetings" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回會議列表
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info">{company?.name ?? '未知'}</Badge>
            <Badge variant="default">{TYPE_LABELS[meeting.meeting_type]}</Badge>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {meeting.meeting_date}
            {meeting.meeting_time && ` ${(meeting.meeting_time as string).slice(0, 5)}`}
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* 出席人員 */}
        <Card>
          <CardHeader><p className="font-medium text-gray-900">出席人員</p></CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-1">顧問</p>
                <p className="text-gray-700">{attendees.join('、') || '未記錄'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">企業</p>
                <p className="text-gray-700">{meeting.attendees_company || '未記錄'}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 討論重點 */}
        {meeting.discussion_points && (
          <Card>
            <CardHeader><p className="font-medium text-gray-900">討論重點與決議</p></CardHeader>
            <CardBody>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{meeting.discussion_points}</p>
            </CardBody>
          </Card>
        )}

        {/* Action Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">Action Items</p>
              {actionItems && actionItems.length > 0 && (
                <span className="text-xs text-gray-400">
                  {actionItems.filter((a) => a.is_completed).length}/{actionItems.length} 完成
                </span>
              )}
            </div>
          </CardHeader>
          <CardBody>
            <ActionItemsList
              items={actionItems ?? []}
              consultantMap={consultantMap}
            />
          </CardBody>
        </Card>
        {/* 簽核 */}
        <Card>
          <CardHeader><p className="font-medium text-gray-900">會議簽核</p></CardHeader>
          <CardBody>
            <MeetingApprovalSection
              meetingId={id}
              companyId={meeting.company_id}
              approval={meetingApproval ? { id: meetingApproval.id, status: meetingApproval.status, current_step: meetingApproval.current_step } : null}
              signatures={meetingApprovalSigs}
              flows={(approvalFlows ?? []).map(f => ({ id: f.id, name: f.name, is_default: f.is_default }))}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
