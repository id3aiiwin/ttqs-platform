import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/get-profile'
import { DataExportClient } from './data-export-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '資料匯出 | ID3A 管理平台' }

export default async function DataExportPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) redirect('/dashboard')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">資料匯出</h1>
      <p className="text-gray-500 text-sm mb-6">手動匯出重要資料為 CSV 檔案</p>
      <DataExportClient />
    </div>
  )
}
