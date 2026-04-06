import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { SurveyImportClient } from './survey-import-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '歷史問卷匯入 | ID3A 管理平台' }

export default async function SurveyImportPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) redirect('/dashboard')

  const sc = createServiceClient()

  const { data: companies } = await sc
    .from('companies')
    .select('id, name')
    .order('name')

  const { data: courses } = await sc
    .from('courses')
    .select('id, title, company_id, start_date')
    .order('start_date', { ascending: false })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">歷史問卷匯入</h1>
      <p className="text-gray-500 text-sm mb-6">上傳歷史課後問卷 CSV，回溯建立學員資料與滿意度紀錄</p>
      <SurveyImportClient
        companies={companies ?? []}
        courses={(courses ?? []).map(c => ({
          id: c.id,
          title: c.title,
          company_id: c.company_id,
          start_date: c.start_date,
        }))}
      />
    </div>
  )
}
