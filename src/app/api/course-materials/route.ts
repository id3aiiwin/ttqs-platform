import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

// GET: 取得課程教材列表
export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get('course_id')
  if (!courseId) return NextResponse.json({ error: '缺少 course_id' }, { status: 400 })

  const sc = createServiceClient()
  const { data } = await sc
    .from('course_materials')
    .select('*')
    .eq('course_id', courseId)
    .order('uploaded_at', { ascending: false })

  return NextResponse.json({ materials: data ?? [] })
}

// POST: 上傳教材 + LINE 通知顧問
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile) return NextResponse.json({ error: '找不到使用者' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const courseId = formData.get('course_id') as string
  const materialType = formData.get('material_type') as string

  if (!file || !courseId || !materialType) {
    return NextResponse.json({ error: '缺少必要參數' }, { status: 400 })
  }

  const validTypes = ['lesson_plan', 'presentation', 'teaching_log']
  if (!validTypes.includes(materialType)) {
    return NextResponse.json({ error: '無效的教材類型' }, { status: 400 })
  }

  const sc = createServiceClient()

  // 上傳檔案到 Supabase Storage
  const ext = file.name.split('.').pop()
  const storagePath = `course-materials/${courseId}/${materialType}_${Date.now()}.${ext}`

  const { data: uploadData, error: uploadError } = await sc.storage
    .from('documents')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: '檔案上傳失敗：' + uploadError.message }, { status: 500 })
  }

  const { data: urlData } = sc.storage.from('documents').getPublicUrl(uploadData.path)

  // 寫入資料庫
  const { error: insertError } = await sc.from('course_materials').insert({
    course_id: courseId,
    material_type: materialType,
    file_name: file.name,
    file_url: urlData.publicUrl,
    file_size: file.size,
    uploaded_by: user.id,
  })

  if (insertError) {
    return NextResponse.json({ error: '記錄失敗：' + insertError.message }, { status: 500 })
  }

  // 更新課程的繳交日期
  const dateField = materialType === 'teaching_log' ? 'teaching_log_submit_date' : 'material_submit_date'
  await sc.from('courses').update({ [dateField]: new Date().toISOString().slice(0, 10) }).eq('id', courseId)

  // LINE 通知顧問
  const { data: course } = await sc.from('courses').select('title, created_by').eq('id', courseId).single()

  if (course?.created_by) {
    const { data: consultant } = await sc
      .from('profiles')
      .select('line_user_id')
      .eq('id', course.created_by)
      .single()

    if (consultant?.line_user_id) {
      const typeLabels: Record<string, string> = {
        lesson_plan: '教案',
        presentation: '簡報',
        teaching_log: '教學日誌',
      }
      const msg = `📄 教材上傳通知\n\n講師「${profile.full_name}」已上傳【${typeLabels[materialType]}】\n課程：${course.title}\n檔案：${file.name}\n\n請至平台確認。`

      try {
        await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            to: consultant.line_user_id,
            messages: [{ type: 'text', text: msg }],
          }),
        })
      } catch {
        // LINE 通知失敗不影響上傳結果
      }
    }
  }

  return NextResponse.json({ ok: true, fileName: file.name, url: urlData.publicUrl })
}

// DELETE: 刪除教材
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const sc = createServiceClient()

  // 取得檔案路徑以刪除 storage
  const { data: material } = await sc.from('course_materials').select('file_url').eq('id', id).single()
  if (material?.file_url) {
    const path = material.file_url.split('/documents/')[1]
    if (path) await sc.storage.from('documents').remove([path])
  }

  await sc.from('course_materials').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
