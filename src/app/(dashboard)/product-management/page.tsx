import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductManagementClient } from './product-management-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '產品管理 | ID3A 管理平台' }

export default async function ProductManagementPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) redirect('/dashboard')

  const sc = createServiceClient()

  const [{ data: products }, { data: orders }, { data: courseRegs }, { data: courses }] = await Promise.all([
    sc.from('products').select('*').order('created_at', { ascending: false }),
    sc.from('shop_orders').select('*').order('created_at', { ascending: false }),
    sc.from('course_registrations').select('fee, payment_status, course_id'),
    sc.from('courses').select('id, trainer, total_revenue, course_type'),
  ])
  const courseRevenue = (courses ?? []).reduce((sum, c) => sum + (c.total_revenue ?? 0), 0)
  const regRevenue = (courseRegs ?? []).filter(r => r.payment_status === 'paid' || r.payment_status === 'confirmed').reduce((sum, r) => sum + (r.fee ?? 0), 0)

  // 講師營收排名
  const trainerRevenue: Record<string, number> = {}
  ;(courses ?? []).forEach(c => {
    if (c.trainer && c.total_revenue > 0) trainerRevenue[c.trainer] = (trainerRevenue[c.trainer] ?? 0) + c.total_revenue
  })
  const trainerRanking = Object.entries(trainerRevenue).sort((a, b) => b[1] - a[1]).slice(0, 10)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">產品 / 訂單管理</h1>
      <ProductManagementClient products={products ?? []} orders={orders ?? []} userId={user.id}
        courseRevenue={courseRevenue + regRevenue} trainerRanking={trainerRanking} />
    </div>
  )
}
