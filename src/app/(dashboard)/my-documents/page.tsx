import { redirect } from 'next/navigation'
import { getUser } from '@/lib/get-user'
import { getProfile } from '@/lib/get-profile'

export default async function MyDocumentsPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')
  const profile = await getProfile(user.id)
  if (!profile?.company_id) redirect('/dashboard')
  redirect(`/companies/${profile.company_id}/documents`)
}
