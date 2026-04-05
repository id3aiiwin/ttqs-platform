'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  course: { label: '線��課程', icon: '🎓' },
  quiz: { label: '測驗', icon: '🧪' },
  ebook: { label: '電子書', icon: '📚' },
}

interface Product {
  id: string; title: string; description: string | null; type: string
  price: number; cover_image: string | null
}

interface Props {
  products: Product[]
  licensedProductIds: string[]
  userId: string
}

export function ShopClient({ products, licensedProductIds, userId }: Props) {
  const [orderModal, setOrderModal] = useState<Product | null>(null)
  const [paymentNote, setPaymentNote] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleOrder(product: Product) {
    startTransition(async () => {
      await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_order',
          user_id: userId,
          product_id: product.id,
          product_name: product.title,
          amount: product.price,
          payment_note: paymentNote || null,
        }),
      })
      setOrderModal(null)
      setPaymentNote('')
      alert('訂單已建立！請依匯款資訊完成付款。')
      router.refresh()
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.length === 0 ? (
          <p className="text-gray-400 col-span-3 text-center py-16">目前沒有上架的產品</p>
        ) : products.map(p => {
          const owned = licensedProductIds.includes(p.id)
          const typeInfo = TYPE_LABELS[p.type] ?? TYPE_LABELS.course
          return (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-200 transition-colors">
              {p.cover_image ? (
                <img src={p.cover_image} alt={p.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <span className="text-5xl">{typeInfo.icon}</span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info">{typeInfo.label}</Badge>
                  {owned && <Badge variant="success">已購買</Badge>}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{p.title}</h3>
                {p.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{p.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-indigo-600">NT$ {p.price.toLocaleString()}</span>
                  {owned ? (
                    <span className="text-xs text-green-600 font-medium">已擁有</span>
                  ) : (
                    <button onClick={() => setOrderModal(p)}
                      className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2 font-medium">
                      立即購買
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 訂單 Modal */}
      {orderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setOrderModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">確認購買</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-900">{orderModal.title}</p>
              <p className="text-lg font-bold text-indigo-600 mt-1">NT$ {orderModal.price.toLocaleString()}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-700">
              <p className="font-medium mb-1">匯款資訊</p>
              <p>銀行：土地銀行（005）</p>
              <p>分行代碼：0142</p>
              <p>帳號：014001357663</p>
              <p>戶名：社團法人國際評量應用發展協會</p>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500">備註（選填）</label>
              <input value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="匯款備註..."
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 mt-1" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => handleOrder(orderModal)} disabled={pending}
                className="flex-1 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {pending ? '建立中...' : '確認訂購'}
              </button>
              <button onClick={() => setOrderModal(null)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">取消</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
