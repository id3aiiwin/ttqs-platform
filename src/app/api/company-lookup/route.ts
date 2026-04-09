import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/** 公開 API：根據 company ID 回傳企業名稱（僅名稱，不洩漏其他資料） */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ name: null })

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('companies')
    .select('name')
    .eq('id', id)
    .single()

  return NextResponse.json({ name: data?.name ?? null })
}
