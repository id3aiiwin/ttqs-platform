'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from './sidebar'
import type { UserRole } from '@/types/database'

interface SidebarWrapperProps {
  role: UserRole
  roles?: string[]
  fullName: string | null
  email: string
}

export function SidebarWrapper({ role, roles, fullName, email }: SidebarWrapperProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <Sidebar
      role={role}
      roles={roles}
      fullName={fullName}
      email={email}
      onLogout={handleLogout}
    />
  )
}
