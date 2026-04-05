import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { ShopClient } from './shop-client'

export const metadata = { title: '課程商店 | ID3A 管理平台' }

export default async function ShopPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  const sc = createServiceClient()

  const { data: products } = await sc.from('products').select('*').eq('status', 'published').order('created_at', { ascending: false })

  // 取得使用者已有的授權
  const { data: licenses } = await sc.from('user_licenses').select('product_id, status').eq('user_id', user.id)
  const licensedProductIds = new Set((licenses ?? []).filter(l => l.status === 'active').map(l => l.product_id))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">課程商店</h1>
      <p className="text-gray-500 text-sm mb-6">瀏覽並購買線上課程、測驗、電子書</p>

      <ShopClient products={products ?? []} licensedProductIds={[...licensedProductIds]} userId={user.id} />
    </div>
  )
}
