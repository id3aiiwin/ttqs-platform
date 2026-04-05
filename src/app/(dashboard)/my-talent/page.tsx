import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { BrainVisualization } from '@/components/talent/brain-visualization'
import { TalentInputForm } from '@/components/talent/talent-input-form'
import { TalentSearchClient } from './talent-search-client'

export const metadata = { title: '天賦評量報告 | ID3A 管理平台' }

export default async function MyTalentPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view: viewUserId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  const sc = createServiceClient()
  const isAdmin = profile.role === 'consultant' || profile.role === 'admin'

  // 決定查看誰的報告
  const targetUserId = (isAdmin && viewUserId) ? viewUserId : user.id

  // 取得目標的 profile
  let targetProfile = profile
  if (targetUserId !== user.id) {
    const { data: tp } = await sc.from('profiles').select('full_name, email').eq('id', targetUserId).single()
    if (tp) targetProfile = { ...profile, full_name: tp.full_name, email: tp.email }
  }

  const { data: assessment } = await sc.from('talent_assessments')
    .select('*')
    .eq('profile_id', targetUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // 管理員：取得所有有天賦評量的人（供搜尋）
  let allAssessedUsers: { id: string; name: string }[] = []
  if (isAdmin) {
    const { data: assessed } = await sc.from('talent_assessments').select('profile_id')
    const profileIds = [...new Set((assessed ?? []).map(a => a.profile_id))]
    if (profileIds.length > 0) {
      const { data: profiles } = await sc.from('profiles').select('id, full_name, email').in('id', profileIds)
      allAssessedUsers = (profiles ?? []).map(p => ({ id: p.id, name: p.full_name || p.email }))
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">天賦評量報告</h1>

      {/* 管理員搜尋 */}
      {isAdmin && (
        <div className="mb-6">
          <TalentSearchClient users={allAssessedUsers} currentViewId={viewUserId ?? null} />
        </div>
      )}

      <p className="text-gray-500 text-sm mb-6">
        {targetUserId !== user.id ? `查看：${targetProfile.full_name ?? targetProfile.email}` : (profile.full_name ?? '我的報告')}
      </p>

      {assessment ? (
        <div className="space-y-6">
          <Card>
            <CardBody>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400">評量日期</p>
                  <p className="text-gray-700">{assessment.assessment_date ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">評量版本</p>
                  <p className="text-gray-700">{assessment.assessment_version ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">分析師</p>
                  <p className="text-gray-700">{assessment.assessor_name ?? '—'}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <BrainVisualization drives={assessment.drives as { id: number; name: string; description: string; percentage: number; pattern: string }[]} />
            </CardBody>
          </Card>

          {assessment.notes && (
            <Card>
              <CardHeader><p className="font-semibold text-gray-900">分析師備註</p></CardHeader>
              <CardBody>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{assessment.notes}</p>
              </CardBody>
            </Card>
          )}

          {/* 顧問/admin 可編輯評量 */}
          {isAdmin && (
            <Card>
              <CardHeader><p className="font-semibold text-gray-900">編輯評量資料</p></CardHeader>
              <CardBody>
                <TalentInputForm
                  profileId={targetUserId}
                  profileName={targetProfile.full_name ?? targetProfile.email}
                  existingAssessment={assessment ? {
                    drives: assessment.drives as { id: number; name: string; percentage: number; pattern: string; description: string }[],
                    assessment_date: assessment.assessment_date,
                    assessment_version: assessment.assessment_version,
                    assessment_spending: assessment.assessment_spending,
                    notes: assessment.notes,
                  } : null}
                />
              </CardBody>
            </Card>
          )}
        </div>
      ) : (
        <>
          {/* 無評量：顧問可直接輸入 */}
          {isAdmin ? (
            <Card>
              <CardBody>
                <TalentInputForm
                  profileId={targetUserId}
                  profileName={targetProfile.full_name ?? targetProfile.email}
                  existingAssessment={null}
                />
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody>
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🧠</div>
                  <p className="text-gray-500 mb-2">
                    {targetUserId !== user.id ? '此用戶尚未進行天賦評量' : '尚未進行天賦評量'}
                  </p>
                  <p className="text-sm text-gray-400">請聯繫皮紋評量分析師安排評量</p>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
