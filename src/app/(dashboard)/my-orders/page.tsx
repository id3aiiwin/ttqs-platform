import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '我的訂單 | ID3A 管理平台' }

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'danger' }> = {
  pending: { label: '待確認付款', variant: 'warning' },
  paid: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'danger' },
}

export default async function MyOrdersPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const sc = createServiceClient()
  const { data: orders } = await sc.from('shop_orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">我的訂單</h1>

      <Card>
        <div className="divide-y divide-gray-100">
          {(!orders || orders.length === 0) ? (
            <p className="text-center text-gray-400 text-sm py-16">尚無訂單紀錄</p>
          ) : orders.map(o => {
            const st = STATUS_MAP[o.status] ?? STATUS_MAP.pending
            return (
              <div key={o.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{o.product_name ?? '產品'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleDateString('zh-TW')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">NT$ {o.amount.toLocaleString()}</p>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {orders && orders.some(o => o.status === 'pending') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 text-xs text-blue-700">
          <p className="font-medium mb-1">匯款資訊</p>
          <p>銀行：土地銀行（005）分行：0142</p>
          <p>帳號：014001357663</p>
          <p>戶名：社團法人國際評量應用發展協會</p>
          <p className="mt-1 text-blue-600">匯款後管理員將盡快確認您的訂單。</p>
        </div>
      )}
    </div>
  )
}
