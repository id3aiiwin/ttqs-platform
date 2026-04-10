import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/get-profile'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '職能管理 | ID3A 管理平台' }

export default async function MyCompetencyPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  if (!profile.company_id) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">職能管理</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-14 h-14 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-500">您尚未被指派到任何企業</p>
          <p className="text-xs text-gray-400 mt-1">請聯繫管理員將您加入企業</p>
        </div>
      </div>
    )
  }

  redirect(`/companies/${profile.company_id}/competency`)
}
