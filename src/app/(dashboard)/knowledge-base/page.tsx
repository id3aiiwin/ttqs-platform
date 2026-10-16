import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardBody } from '@/components/ui/card'
import { KbFilter } from '@/components/knowledge-base/kb-filter'
import { KbTemplateCard } from '@/components/knowledge-base/kb-template-card'
import { KbAddButton } from '@/components/knowledge-base/kb-add-button'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '知識庫管理 | 人才發展管理系統' }

const CATEGORY_LABELS: Record<string, string> = {
  ttqs: 'TTQS 文件範本',
  course_material: '課程教材',
  reference: '參考資料',
}

export default async function KnowledgeBasePage({
  searchParams,
}: { searchParams: Promise<{ category?: string; phase?: string; tier?: string; search?: string }> }) {
  const { category, phase, tier, search } = await searchParams

  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  const isConsultant = profile?.role === 'consultant'

  const sc = createServiceClient()

  let query = sc.from('knowledge_base_templates')
    .select('*')
    .order('category')
    .order('tier', { nullsFirst: false })
    .order('name')

  if (category) query = query.eq('category', category)
  if (phase && phase !== 'all') query = query.eq('pddro_phase', phase)
  if (tier) query = query.eq('tier', parseInt(tier))

  const { data: templates } = await query

  let filtered = templates ?? []
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter((t) =>
      t.name.toLowerCase().includes(s) ||
      t.ttqs_indicator?.toLowerCase().includes(s) ||
      t.doc_number_format?.toLowerCase().includes(s) ||
      t.description?.toLowerCase().includes(s)
    )
  }

  const { data: usageAll } = await sc.from('knowledge_base_usage').select('template_id')
  const usageCount: Record<string, number> = {}
  usageAll?.forEach((u) => { usageCount[u.template_id] = (usageCount[u.template_id] ?? 0) + 1 })

  const { data: companiesData } = await sc.from('companies').select('id, name').order('name')
  const companies = (companiesData ?? []).map((c) => ({ id: c.id, name: c.name }))

  const categoryLabel = category ? CATEGORY_LABELS[category] : '全部內容'

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">知識庫管理</h1>
          <p className="text-gray-500 text-sm mt-1">{categoryLabel} · {filtered.length} 個項目</p>
        </div>
        {isConsultant && <KbAddButton currentCategory={category ?? 'ttqs'} />}
      </div>

      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0">
          <KbFilter
            currentCategory={category ?? ''}
            currentPhase={phase ?? ''}
            currentTier={tier ?? ''}
            currentSearch={search ?? ''}
          />
        </div>

        <div className="flex-1">
          {filtered.length === 0 ? (
            <Card><CardBody>
              <p className="text-center text-sm text-gray-400 py-12">沒有符合條件的項目</p>
            </CardBody></Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((t) => (
                <KbTemplateCard
                  key={t.id}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  template={t as any}
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
