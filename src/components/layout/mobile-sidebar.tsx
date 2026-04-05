'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from './sidebar'
import type { UserRole } from '@/types/database'

export function MobileSidebar({ role, roles, fullName, email }: {
  role: UserRole; roles?: string[]; fullName: string | null; email: string
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    const handler = () => setOpen(prev => !prev)
    window.addEventListener('toggle-mobile-menu', handler)
    return () => window.removeEventListener('toggle-mobile-menu', handler)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar role={role} roles={roles} fullName={fullName} email={email} onLogout={handleLogout} />
      </div>
    </>
  )
}

export function MobileMenuButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event('toggle-mobile-menu'))}
      className="md:hidden p-2 text-gray-500 hover:text-gray-700"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  )
}
