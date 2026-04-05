import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { company_id, annual_settings, org_chart_url } = body
  if (!company_id) return NextResponse.json({ error: 'missing company_id' }, { status: 400 })

  const sc = createServiceClient()

  if (annual_settings) {
    // 合併現有設定
    const { data: company } = await sc.from('companies').select('annual_settings').eq('id', company_id).single()
    const merged = { ...((company?.annual_settings as Record<string, unknown>) ?? {}), ...annual_settings }
    await sc.from('companies').update({ annual_settings: merged }).eq('id', company_id)
  }

  if (org_chart_url !== undefined) {
    const { data: company } = await sc.from('companies').select('annual_settings').eq('id', company_id).single()
    const settings = { ...((company?.annual_settings as Record<string, unknown>) ?? {}), orgChartUrl: org_chart_url }
    await sc.from('companies').update({ annual_settings: settings }).eq('id', company_id)
  }

  return NextResponse.json({ ok: true })
}
