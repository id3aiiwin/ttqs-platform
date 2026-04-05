import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { MeetingForm } from '@/components/meeting/meeting-form'

export const metadata = { title: '新增會議 | ID3A 管理平台' }

export default async function NewMeetingPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>
}) {
  const { company: defaultCompanyId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') redirect('/dashboard')

  const sc = createServiceClient()
  const { data: companies } = await sc.from('companies').select('id, name').order('name')
  const { data: consultants } = await sc.from('profiles').select('id, full_name, email').eq('role', 'consultant' as never)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/meetings" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回會議列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">新增會議記錄</h1>
      </div>
      <Card>
        <CardHeader><p className="text-sm text-gray-500">記錄輔導會議內容</p></CardHeader>
        <CardBody>
          <MeetingForm
            companies={companies ?? []}
            consultants={consultants ?? []}
            defaultCompanyId={defaultCompanyId}
          />
        </CardBody>
      </Card>
    </div>
  )
}
