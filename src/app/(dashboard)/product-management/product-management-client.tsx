'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PrintReportButton } from '@/components/ui/print-report'

interface Product {
  id: string; title: string; type: string; price: number; status: string; created_at: string
}

interface Order {
  id: string; user_name: string | null; product_name: string | null; amount: number
  status: string; payment_note: string | null; created_at: string
}

interface Props { products: Product[]; orders: Order[]; userId: string; courseRevenue?: number; trainerRanking?: [string, number][] }

export function ProductManagementClient({ products, orders, userId, courseRevenue, trainerRanking }: Props) {
  const [tab, setTab] = useState<'products' | 'orders' | 'reports'>('products')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'course', price: '0', description: '' })
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const [reportPeriod, setReportPeriod] = useState<'month' | 'quarter' | 'year' | '6m' | '12m' | 'custom'>('6m')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  function handleCreateProduct() {
    if (!form.title.trim()) return
    startTransition(async () => {
      await fetch('/api/shop', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_product', ...form, price: Number(form.price), created_by: userId }),
      })
      setForm({ title: '', type: 'course', price: '0', description: '' })
      setAdding(false)
      router.refresh()
    })
  }

  function handleToggleStatus(productId: string, currentStatus: string) {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    startTransition(async () => {
      await fetch('/api/shop', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_product', id: productId, status: newStatus }),
      })
      router.refresh()
    })
  }

  function handleConfirmOrder(orderId: string) {
    startTransition(async () => {
      await fetch('/api/shop', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_order', order_id: orderId }),
      })
      router.refresh()
    })
  }

  function handleCancelOrder(orderId: string) {
    if (!confirm('確定取消此訂單？')) return
    startTransition(async () => {
      await fetch('/api/shop', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_order', order_id: orderId }),
      })
      router.refresh()
    })
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')

  return (
    <div>
      {/* Tab */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('products')} className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'products' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
          產品 ({products.length})
        </button>
        <button onClick={() => setTab('orders')} className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'orders' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
          訂單 ({orders.length})
          {pendingOrders.length > 0 && <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1.5">{pendingOrders.length}</span>}
        </button>
        <button onClick={() => setTab('reports')} className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'reports' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
          報表
        </button>
      </div>

      {tab === 'products' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">產品列表</p>
              <button onClick={() => setAdding(true)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ 新增產品</button>
            </div>
          </CardHeader>

          {adding && (
            <div className="px-6 pb-4">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 space-y-2">
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="產品名稱 *" autoFocus
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
                <div className="grid grid-cols-3 gap-2">
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white">
                    <option value="course">線上課程</option>
                    <option value="quiz">測驗</option>
                    <option value="ebook">電子書</option>
                  </select>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="價格"
                    className="text-sm border border-gray-300 rounded px-2 py-1.5" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateProduct} disabled={pending || !form.title.trim()}
                    className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1.5 disabled:opacity-50">建立</button>
                  <button onClick={() => setAdding(false)} className="text-xs text-gray-400 px-2">取消</button>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {products.map(p => (
              <div key={p.id} className="px-6 py-3 flex items-center justify-between group">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{p.title}</p>
                    <Badge variant={p.type === 'course' ? 'info' : p.type === 'quiz' ? 'warning' : 'default'}>
                      {p.type === 'course' ? '課程' : p.type === 'quiz' ? '測驗' : '電子書'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">NT$ {p.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.status === 'published' ? 'success' : 'default'}>
                    {p.status === 'published' ? '已上架' : '草稿'}
                  </Badge>
                  <button onClick={() => handleToggleStatus(p.id, p.status)} disabled={pending}
                    className="text-xs text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100">
                    {p.status === 'published' ? '下架' : '上架'}
                  </button>
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無產品</p>}
          </div>
        </Card>
      )}

      {tab === 'orders' && (
        <Card>
          <CardHeader><p className="font-semibold text-gray-900">訂單列表</p></CardHeader>
          <div className="divide-y divide-gray-100">
            {orders.map(o => (
              <div key={o.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{o.product_name ?? '產品'}</p>
                  <p className="text-xs text-gray-400">{o.user_name ?? '用戶'} · {new Date(o.created_at).toLocaleDateString('zh-TW')}</p>
                  {o.payment_note && <p className="text-xs text-gray-500 mt-0.5">備註：{o.payment_note}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">NT$ {o.amount.toLocaleString()}</span>
                  <Badge variant={o.status === 'paid' ? 'success' : o.status === 'cancelled' ? 'danger' : 'warning'}>
                    {o.status === 'paid' ? '已完成' : o.status === 'cancelled' ? '已取消' : '待確認'}
                  </Badge>
                  {o.status === 'pending' && (
                    <div className="flex gap-1">
                      <button onClick={() => handleConfirmOrder(o.id)} disabled={pending}
                        className="text-xs text-green-600 hover:text-green-700 font-medium">確認</button>
                      <button onClick={() => handleCancelOrder(o.id)} disabled={pending}
                        className="text-xs text-red-400 hover:text-red-600">取消</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無訂單</p>}
          </div>
        </Card>
      )}

      {tab === 'reports' && (() => {
        // Compute date range based on reportPeriod
        const now = new Date()
        let periodStart: Date
        let periodEnd: Date = now
        switch (reportPeriod) {
          case 'month':
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case 'quarter': {
            const qMonth = Math.floor(now.getMonth() / 3) * 3
            periodStart = new Date(now.getFullYear(), qMonth, 1)
            break
          }
          case 'year':
            periodStart = new Date(now.getFullYear(), 0, 1)
            break
          case '6m':
            periodStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
            break
          case '12m':
            periodStart = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate())
            break
          case 'custom':
            periodStart = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
            periodEnd = customEnd ? new Date(customEnd) : now
            break
        }

        const allPaidOrders = orders.filter(o => o.status === 'paid')
        const paidOrders = allPaidOrders.filter(o => {
          const od = new Date(o.created_at)
          return od >= periodStart && od <= periodEnd
        })
        const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0)
        const publishedCount = products.filter(p => p.status === 'published').length

        // 月營收（根據選定區間）
        const months: { label: string; revenue: number }[] = []
        const monthDiff = (periodEnd.getFullYear() - periodStart.getFullYear()) * 12 + periodEnd.getMonth() - periodStart.getMonth()
        const monthCount = Math.max(monthDiff + 1, 1)
        for (let i = monthCount - 1; i >= 0; i--) {
          const d = new Date(periodEnd.getFullYear(), periodEnd.getMonth() - i, 1)
          const label = `${d.getFullYear()}/${d.getMonth() + 1}`
          const monthOrders = paidOrders.filter(o => {
            const od = new Date(o.created_at)
            return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth()
          })
          months.push({ label, revenue: monthOrders.reduce((s, o) => s + o.amount, 0) })
        }
        const maxMonth = Math.max(...months.map(m => m.revenue), 1)

        // 產品排名
        const productRevenue: Record<string, { name: string; revenue: number; count: number }> = {}
        paidOrders.forEach(o => {
          if (!productRevenue[o.product_name ?? '']) productRevenue[o.product_name ?? ''] = { name: o.product_name ?? '—', revenue: 0, count: 0 }
          productRevenue[o.product_name ?? ''].revenue += o.amount
          productRevenue[o.product_name ?? ''].count++
        })
        const ranked = Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue)
        const maxRev = ranked[0]?.revenue ?? 1

        const periodOptions: { value: typeof reportPeriod; label: string }[] = [
          { value: 'month', label: '本月' },
          { value: 'quarter', label: '本季' },
          { value: 'year', label: '本年' },
          { value: '6m', label: '近6月' },
          { value: '12m', label: '近12月' },
          { value: 'custom', label: '自訂' },
        ]

        return (
          <div className="space-y-6">
            {/* Time period selector */}
            <div className="flex flex-wrap items-center gap-2">
              {periodOptions.map(opt => (
                <button key={opt.value} onClick={() => setReportPeriod(opt.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium ${reportPeriod === opt.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {opt.label}
                </button>
              ))}
              <div className="flex-1" />
              <PrintReportButton
                title="產品營收報表"
                subtitle="Product Management Report"
                getContent={() => {
                  const productRows = ranked.map((r, i) =>
                    `<tr>
                      <td style="text-align:center">${i + 1}</td>
                      <td>${r.name}</td>
                      <td style="text-align:right">NT$ ${r.revenue.toLocaleString()}</td>
                      <td style="text-align:right">${r.count} 筆</td>
                    </tr>`
                  ).join('')

                  return `
                    <div class="stat-grid">
                      <div class="stat-card"><div class="value">NT$ ${totalRevenue.toLocaleString()}</div><div class="label">總營收</div></div>
                      <div class="stat-card"><div class="value" style="color:#16a34a">${paidOrders.length}</div><div class="label">已付訂單</div></div>
                      <div class="stat-card"><div class="value" style="color:#d97706">${pendingOrders.length}</div><div class="label">待確認</div></div>
                      <div class="stat-card"><div class="value" style="color:#1a1a1a">${publishedCount}</div><div class="label">上架產品</div></div>
                    </div>

                    <div class="section">
                      <h2>產品銷售排名</h2>
                      <table>
                        <thead><tr><th style="text-align:center">排名</th><th>產品</th><th style="text-align:right">營收</th><th style="text-align:right">訂單數</th></tr></thead>
                        <tbody>${productRows || '<tr><td colspan="4" style="text-align:center;color:#9ca3af">尚無銷售資料</td></tr>'}</tbody>
                      </table>
                    </div>
                  `
                }}
              />
              {reportPeriod === 'custom' && (
                <div className="flex items-center gap-2 ml-2">
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1.5" />
                  <span className="text-xs text-gray-400">~</span>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1.5" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">總營收</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">NT$ {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">已付訂單</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{paidOrders.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">待確認</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{pendingOrders.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">上架產品</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{publishedCount}</p>
              </div>
            </div>

            <Card>
              <CardHeader><p className="font-semibold text-gray-900">月營收趨勢</p></CardHeader>
              <div className="px-6 pb-4">
                <div className="flex items-end gap-3 h-40">
                  {months.map(m => (
                    <div key={m.label} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-indigo-100 rounded-t" style={{ height: `${(m.revenue / maxMonth) * 120}px`, minHeight: m.revenue > 0 ? '4px' : '0' }}>
                        <div className="w-full h-full bg-indigo-500 rounded-t" />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{m.label}</p>
                      {m.revenue > 0 && <p className="text-[10px] text-gray-600 font-medium">${(m.revenue / 1000).toFixed(0)}K</p>}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {ranked.length > 0 && (
              <Card>
                <CardHeader><p className="font-semibold text-gray-900">產品銷售排名</p></CardHeader>
                <div className="px-6 pb-4 space-y-2">
                  {ranked.map((r, i) => (
                    <div key={r.name} className="flex items-center gap-3">
                      <span className="text-sm w-6 text-center">{i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{r.name}</p>
                        <div className="h-2 bg-gray-100 rounded-full mt-1">
                          <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${(r.revenue / maxRev) * 100}%` }} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">NT$ {r.revenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{r.count} 筆</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* 營收來源分布 */}
            {(courseRevenue ?? 0) > 0 && (
              <Card>
                <CardHeader><p className="font-semibold text-gray-900">營收來源分布</p></CardHeader>
                <div className="px-6 pb-4">
                  {(() => {
                    const prodRev = paidOrders.reduce((s, o) => s + o.amount, 0)
                    const cRev = courseRevenue ?? 0
                    const total = prodRev + cRev
                    const items = [
                      { label: '課程營收（內訓+公開課）', amount: cRev, pct: total > 0 ? Math.round((cRev / total) * 100) : 0, color: 'bg-indigo-500' },
                      { label: '產品銷售', amount: prodRev, pct: total > 0 ? Math.round((prodRev / total) * 100) : 0, color: 'bg-violet-500' },
                    ]
                    return (
                      <div className="space-y-3">
                        <p className="text-2xl font-bold text-gray-900">NT$ {total.toLocaleString()}</p>
                        {items.map(i => (
                          <div key={i.label}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">{i.label}</span>
                              <span className="font-medium">NT$ {i.amount.toLocaleString()} ({i.pct}%)</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full">
                              <div className={`h-3 rounded-full ${i.color}`} style={{ width: `${i.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </Card>
            )}

            {/* 講師貢獻排名 */}
            {trainerRanking && trainerRanking.length > 0 && (
              <Card>
                <CardHeader><p className="font-semibold text-gray-900">講師貢獻排名</p></CardHeader>
                <div className="px-6 pb-4 space-y-2">
                  {trainerRanking.map(([name, rev], i) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-sm w-6 text-center">{i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`}</span>
                      <span className="flex-1 text-sm text-gray-900">{name}</span>
                      <span className="text-sm font-bold text-gray-900">NT$ {rev.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )
      })()}
    </div>
  )
}
