import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KbFilter } from '@/components/knowledge-base/kb-filter'
import { KbTemplateCard } from '@/components/knowledge-base/kb-template-card'
import { KbAddButton } from '@/components/knowledge-base/kb-add-button'

export const metadata = { title: '顧問知識庫 | ID3A 管理平台' }

const TIER_LABELS: Record<number, string> = { 1: '一階', 2: '二階', 3: '三階', 4: '四階' }

export default async function KnowledgeBasePage({
  searchParams,
}: { searchParams: Promise<{ phase?: string; tier?: string; search?: string }> }) {
  const { phase, tier, search } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  const isConsultant = profile?.role === 'consultant'

  const sc = createServiceClient()

  let query = sc.from('knowledge_base_templates')
    .select('*')
    .order('tier')
    .order('name')

  if (phase && phase !== 'all') query = query.eq('pddro_phase', phase)
  if (tier) query = query.eq('tier', parseInt(tier))

  const { data: templates } = await query

  // 搜尋過濾（client-side 就好，資料量小）
  let filtered = templates ?? []
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter((t) =>
      t.name.toLowerCase().includes(s) ||
      t.ttqs_indicator?.toLowerCase().includes(s) ||
      t.doc_number_format?.toLowerCase().includes(s)
    )
  }

  // 使用次數統計
  const { data: usageAll } = await sc.from('knowledge_base_usage').select('template_id')
  const usageCount: Record<string, number> = {}
  usageAll?.forEach((u) => { usageCount[u.template_id] = (usageCount[u.template_id] ?? 0) + 1 })

  // 企業列表（供「指定企業」選擇用）
  const { data: companiesData } = await sc.from('companies').select('id, name').order('name')
  const companies = (companiesData ?? []).map((c) => ({ id: c.id, name: c.name }))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">顧問知識庫</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} 個範本</p>
        </div>
        {isConsultant && <KbAddButton />}
      </div>

      <div className="flex gap-6">
        {/* 左側篩選 */}
        <div className="w-56 flex-shrink-0">
          <KbFilter currentPhase={phase ?? ''} currentTier={tier ?? ''} currentSearch={search ?? ''} />
        </div>

        {/* 右側範本列表 */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <Card><CardBody>
              <p className="text-center text-sm text-gray-400 py-12">沒有符合條件的範本</p>
            </CardBody></Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((t) => (
                <KbTemplateCard
                  key={t.id}
                  template={t}
                  usageCount={usageCount[t.id] ?? 0}
                  isConsultant={isConsultant}
                  companies={companies}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
