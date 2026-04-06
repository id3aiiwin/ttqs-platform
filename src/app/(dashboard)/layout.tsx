import { redirect } from 'next/navigation'
import { getUser } from '@/lib/get-user'
import { getProfile } from '@/lib/get-profile'
import { SidebarWrapper } from '@/components/layout/sidebar-wrapper'
import { NotificationBell } from '@/components/layout/notification-bell'
import { MobileSidebar, MobileMenuButton } from '@/components/layout/mobile-sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const profile = await getProfile(user.id)

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md text-center px-6">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">帳號設定未完成</h1>
          <p className="text-gray-500 text-sm mb-1">
            您的帳號尚未建立使用者檔案（profiles）。
          </p>
          <p className="text-gray-400 text-xs mb-6">
            請聯繫管理員，或至 Supabase SQL Editor 執行：
          </p>
          <pre className="text-left bg-gray-100 rounded-lg p-4 text-xs text-gray-700 overflow-auto mb-6">
{`insert into profiles (id, email, role)
values (
  '${user.id}',
  '${user.email}',
  'consultant'
);`}
          </pre>
          <a href="/auth/login" className="text-sm text-indigo-600 hover:underline">
            返回登入頁
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex" style={{ height: '100dvh' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <SidebarWrapper
          role={profile.role}
          roles={profile.roles}
          fullName={profile.full_name}
          email={profile.email}
        />
      </div>
      {/* Mobile sidebar */}
      <MobileSidebar role={profile.role} roles={profile.roles} fullName={profile.full_name} email={profile.email} />
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header bar */}
        <div className="flex-shrink-0 h-12 bg-white border-b border-gray-100 flex items-center justify-between px-4 gap-2">
          {/* Mobile hamburger */}
          <MobileMenuButton />
          <div className="flex items-center gap-2">
            <NotificationBell userId={user.id} />
          </div>
        </div>
        <main className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
