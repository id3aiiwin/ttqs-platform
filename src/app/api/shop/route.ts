import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

/** 產品 CRUD */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action } = body
  const sc = createServiceClient()

  if (action === 'create_product') {
    const { error } = await sc.from('products').insert({
      title: body.title, description: body.description, type: body.type,
      price: body.price ?? 0, status: body.status ?? 'draft',
      cover_image: body.cover_image, content_type: body.content_type,
      content_url: body.content_url, units: body.units ?? [],
      created_by: body.created_by,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'update_product') {
    const { id, ...updates } = body
    delete updates.action
    const { error } = await sc.from('products').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete_product') {
    const { error } = await sc.from('products').delete().eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  /** 建立訂單 */
  if (action === 'create_order') {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    const { data: profile } = await sc.from('profiles').select('full_name').eq('id', user?.id ?? '').single()

    const { error } = await sc.from('shop_orders').insert({
      user_id: user?.id ?? body.user_id,
      user_name: profile?.full_name ?? null,
      product_id: body.product_id,
      product_name: body.product_name,
      amount: body.amount,
      payment_note: body.payment_note ?? null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  /** 確認付款 */
  if (action === 'confirm_order') {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    // 更新訂單狀態
    const { error: oErr } = await sc.from('shop_orders').update({
      status: 'paid',
      payment_date: new Date().toISOString().split('T')[0],
      confirmed_by: user?.id ?? null,
    }).eq('id', body.order_id)
    if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 })

    // 建立授權
    const { data: order } = await sc.from('shop_orders').select('user_id, product_id').eq('id', body.order_id).single()
    if (order) {
      await sc.from('user_licenses').upsert({
        user_id: order.user_id,
        product_id: order.product_id,
        status: 'active',
      }, { onConflict: 'user_id,product_id' })
    }

    return NextResponse.json({ ok: true })
  }

  /** 取消訂單 */
  if (action === 'cancel_order') {
    const { error } = await sc.from('shop_orders').update({ status: 'cancelled' }).eq('id', body.order_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
