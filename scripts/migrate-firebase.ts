/**
 * Firebase → Supabase 資料遷移腳本
 *
 * ��用方式：
 * 1. 先從 Firebase Console 匯出各 collection 為 JSON
 * 2. 放在 /tmp/firebase-export/ 目錄
 * 3. 執行: source <(grep -v '^#' .env.local | sed 's/^/export /') && npx tsx scripts/migrate-firebase.ts
 *
 * 或者直接用 Firebase Admin SDK 連線匯出（需要 service account key）
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }

import { readFileSync, existsSync } from 'fs'

const EXPORT_DIR = '/tmp/firebase-export'

function loadJson(filename: string) {
  const path = `${EXPORT_DIR}/${filename}`
  if (!existsSync(path)) { console.log(`Skip: ${filename} not found`); return null }
  return JSON.parse(readFileSync(path, 'utf-8'))
}

async function upsert(table: string, data: Record<string, unknown>[]) {
  if (data.length === 0) return
  // 分批 50 筆
  for (let i = 0; i < data.length; i += 50) {
    const batch = data.slice(i, i + 50)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(batch),
    })
    if (!res.ok) console.error(`Error inserting ${table}:`, await res.text())
  }
  console.log(`  Inserted ${data.length} rows into ${table}`)
}

async function main() {
  console.log('=== Firebase → Supabase Migration ===\n')

  // 1. Users → profiles
  const users = loadJson('users.json')
  if (users) {
    console.log('Migrating users...')
    const profiles = Object.entries(users).map(([id, u]: [string, any]) => ({
      id,
      email: u.email,
      full_name: u.name ?? null,
      role: u.roles?.includes('boss') ? 'consultant' : u.roles?.includes('admin') ? 'admin' : u.roles?.includes('instructor') ? 'instructor' : u.roles?.includes('analyst') ? 'analyst' : 'employee',
      roles: (u.roles ?? ['student']).map((r: string) => r === 'boss' ? 'consultant' : r),
      company_id: null, // 需要對映
      instructor_level: u.instructorLevel ?? null,
      accumulated_hours: u.accumulatedHours ?? u.totalHours ?? 0,
      analyst_level: u.analystLevel ?? null,
      is_personal_client: !u.company || u.company === '個人報名',
    }))
    await upsert('profiles', profiles)
  }

  // 2. Companies
  const companies = loadJson('companies.json')
  if (companies) {
    console.log('Migrating companies...')
    const rows = Object.entries(companies).map(([id, c]: [string, any]) => ({
      id,
      name: c.name,
      industry: null,
      contact_person: c.contactName ?? c.contact ?? null,
      contact_email: c.contactEmail ?? c.email ?? null,
      contact_phone: c.contactPhone ?? c.phone ?? null,
      address: c.address ?? null,
      status: 'active',
      annual_settings: c.annualSettings ?? {},
    }))
    await upsert('companies', rows)
  }

  // 3. Courses
  const courses = loadJson('courses.json')
  if (courses) {
    console.log('Migrating courses...')
    const rows = Object.entries(courses).map(([id, c]: [string, any]) => ({
      id,
      title: c.name,
      trainer: c.instructor ?? null,
      start_date: c.date ?? null,
      hours: c.hours ? Number(c.hours) : null,
      status: c.reviewStatus === 'approved' ? 'completed' : 'draft',
      course_type: c.type === '企業內訓' ? 'enterprise' : 'public',
      review_status: c.reviewStatus ?? 'pending',
      is_counted_in_hours: c.isCountedInHours ?? false,
      total_revenue: c.revenue ?? 0,
    }))
    await upsert('courses', rows)
  }

  // 4. Interactions
  const interactions = loadJson('interactions.json')
  if (interactions) {
    console.log('Migrating interactions...')
    const rows = Object.entries(interactions).map(([id, i]: [string, any]) => ({
      id,
      contact_date: i.contactDate ?? new Date().toISOString().split('T')[0],
      subject: i.subject ?? '（無主題）',
      contact_type: i.contactType ?? 'phone',
      contact_person: i.contactPerson ?? null,
      handler: i.handler ?? null,
      content: i.content ?? i.notes ?? null,
      target_type: i.targetType ?? null,
      target_name: i.targetName ?? i.personName ?? null,
      next_action: i.nextAction ?? null,
      next_action_date: i.nextActionDate ?? null,
    }))
    await upsert('interactions', rows)
  }

  // 5. Todos
  const todos = loadJson('todos.json')
  if (todos) {
    console.log('Migrating todos...')
    const rows = Object.entries(todos).map(([id, t]: [string, any]) => ({
      id,
      title: t.title,
      due_date: t.dueDate ?? null,
      status: t.status ?? 'pending',
      priority: t.priority ?? 'normal',
      type: t.type ?? 'manual',
      related_type: t.relatedType ?? null,
      related_name: t.relatedName ?? null,
    }))
    await upsert('todos', rows)
  }

  // 6. Products
  const products = loadJson('products.json')
  if (products) {
    console.log('Migrating products...')
    const rows = Object.entries(products).map(([id, p]: [string, any]) => ({
      id,
      title: p.name ?? p.title,
      description: p.description ?? null,
      type: p.type ?? 'course',
      price: p.price ?? 0,
      status: p.status ?? 'draft',
      cover_image: p.coverImage ?? null,
      content_type: p.contentType ?? null,
      content_url: p.contentEmbed ?? p.contentUrl ?? null,
      units: p.units ?? [],
    }))
    await upsert('products', rows)
  }

  // 7. Orders
  const orders = loadJson('orders.json')
  if (orders) {
    console.log('Migrating orders...')
    const rows = Object.entries(orders).map(([id, o]: [string, any]) => ({
      id,
      user_id: o.userId,
      user_name: o.userName ?? null,
      product_id: o.productId,
      product_name: o.productName ?? null,
      amount: o.amount ?? o.totalPrice ?? 0,
      status: o.status ?? 'pending',
      payment_note: o.paymentNote ?? o.note ?? null,
    }))
    await upsert('shop_orders', rows)
  }

  console.log('\n=== Migration Complete ===')
  console.log('Please verify data in Supabase Dashboard.')
}

main().catch(console.error)
