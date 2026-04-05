import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { ProfileSignatureUpload } from './profile-signature-upload'
import { LineBindingSection } from './line-binding-section'
import { ChangePassword } from './change-password'
import { ROLE_LABELS } from '@/lib/utils'

export const metadata = { title: '個人設定 | ID3A 管理平台' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  const roles = (profile.roles && profile.roles.length > 0) ? profile.roles : [profile.role]

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">個人設定</h1>

      <Card className="mb-6">
        <CardHeader><p className="font-semibold text-gray-900">基本資料</p></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400">姓名</p>
              <p className="text-gray-900">{profile.full_name || '未填寫'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-gray-900">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">角色</p>
              <p className="text-gray-900">{roles.map(r => ROLE_LABELS[r] ?? r).join('、')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">電話</p>
              <p className="text-gray-900">{profile.phone || '未填寫'}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div>
            <p className="font-semibold text-gray-900">修改密碼</p>
            <p className="text-xs text-gray-400 mt-0.5">更新您的登入密碼</p>
          </div>
        </CardHeader>
        <CardBody>
          <ChangePassword />
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div>
            <p className="font-semibold text-gray-900">電子簽章</p>
            <p className="text-xs text-gray-400 mt-0.5">上傳您的電子簽名圖檔，用於文件簽核</p>
          </div>
        </CardHeader>
        <CardBody>
          <ProfileSignatureUpload
            profileId={profile.id}
            currentSignatureUrl={(profile as Record<string, unknown>).signature_url as string | null}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <p className="font-semibold text-gray-900">LINE 綁定</p>
            <p className="text-xs text-gray-400 mt-0.5">綁定 LINE 帳號以��收上課通知</p>
          </div>
        </CardHeader>
        <CardBody>
          <LineBindingSection profileId={profile.id} lineUserId={profile.line_user_id} />
        </CardBody>
      </Card>
    </div>
  )
}
