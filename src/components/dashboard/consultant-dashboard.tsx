import Link from 'next/link'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExportButton } from '@/components/ui/export-button'
import { TTQS_LEVELS } from '@/lib/utils'
import type { Profile, Company } from '@/types/database'

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <Card><CardBody>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </CardBody></Card>
  )
}

export function ConsultantDashboard({ profile, companies }: { profile: Profile; companies: Company[] }) {
  const total = companies.length
  const active = companies.filter(c => c.status === 'active').length
  const pending = companies.filter(c => c.status === 'pending').length
  const withTtqs = companies.filter(c => c.ttqs_level).length

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">早安，{profile.full_name ?? '顧問'}！</h1>
        <p className="text-gray-500 mt-1">以下是目前所有企業的輔導狀況</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="總企業數" value={total} color="text-gray-900" />
        <StatCard label="輔導中" value={active} sub="進行中的企業" color="text-green-600" />
        <StatCard label="待確認" value={pending} sub="尚未開始" color="text-yellow-600" />
        <StatCard label="已取得 TTQS" value={withTtqs} sub="銅/銀/金牌" color="text-indigo-600" />
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">企業列表</h2>
          <div className="flex items-center gap-3">
            <ExportButton type="courses" label="匯出課程" />
            <Link href="/companies/new" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">+ 新增企業</Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          {companies.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>尚無企業資料</p>
              <Link href="/companies/new" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">新增第一家企業</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">企業名稱</th>
                  <th className="px-6 py-3 text-left">產業</th>
                  <th className="px-6 py-3 text-left">聯絡人</th>
                  <th className="px-6 py-3 text-left">狀態</th>
                  <th className="px-6 py-3 text-left">TTQS 等級</th>
                  <th className="px-6 py-3 text-left">到期日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4"><Link href={`/companies/${c.id}`} className="font-medium text-gray-900 hover:text-indigo-600">{c.name}</Link></td>
                    <td className="px-6 py-4 text-gray-500">{c.industry ?? '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{c.contact_person ?? '-'}</td>
                    <td className="px-6 py-4">
                      {c.status === 'active' ? <Badge variant="success">輔導中</Badge> : c.status === 'pending' ? <Badge variant="warning">待確認</Badge> : <Badge variant="default">已結案</Badge>}
                    </td>
                    <td className="px-6 py-4">
                      {c.ttqs_level ? <Badge variant={c.ttqs_level === 'gold' ? 'warning' : 'info'}>{TTQS_LEVELS[c.ttqs_level].label}</Badge> : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{c.ttqs_expiry_date ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
