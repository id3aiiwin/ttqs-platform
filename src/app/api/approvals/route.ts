import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action } = body
  const sc = createServiceClient()

  // ===== 流程管理 =====
  if (action === 'create_flow') {
    const { error } = await sc.from('approval_flows').insert({
      company_id: body.company_id,
      name: body.name,
      steps: body.steps,
      is_default: body.is_default ?? false,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'update_flow') {
    const { error } = await sc.from('approval_flows').update({
      name: body.name,
      steps: body.steps,
    }).eq('id', body.flow_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete_flow') {
    const { error } = await sc.from('approval_flows').delete().eq('id', body.flow_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ===== 發起簽核（文件或會議） =====
  if (action === 'initiate') {
    const { document_id, meeting_id, flow_id, company_id } = body

    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    // 取得流程定義
    let flow
    if (flow_id) {
      const { data } = await sc.from('approval_flows').select('*').eq('id', flow_id).single()
      flow = data
    } else {
      // 用預設流程
      const { data } = await sc.from('approval_flows').select('*').eq('company_id', company_id).eq('is_default', true).single()
      flow = data
    }

    if (!flow || !flow.steps || (flow.steps as { order: number; signer_role: string }[]).length === 0) {
      return NextResponse.json({ error: '找不到簽核流程或流程無步驟' }, { status: 400 })
    }

    const steps = flow.steps as { order: number; signer_role: string }[]

    // 取得企業簽核人
    const { data: signers } = await sc.from('company_signers').select('*').eq('company_id', company_id)
    const signerMap: Record<string, { signer_name: string | null; signature_url: string | null; profile_id: string | null }> = {}
    signers?.forEach(s => { signerMap[s.signer_role] = s })

    // 建立 approval
    const { data: approval, error: aErr } = await sc.from('document_approvals').insert({
      document_id: document_id ?? null,
      meeting_id: meeting_id ?? null,
      flow_id: flow.id,
      status: 'in_progress',
      current_step: 1,
      initiated_by: user?.id ?? null,
    }).select('id').single()

    if (aErr || !approval) return NextResponse.json({ error: aErr?.message ?? 'failed' }, { status: 500 })

    // 建立每步的簽名紀錄
    const sigs = steps.map(step => ({
      approval_id: approval.id,
      step_order: step.order,
      signer_role: step.signer_role,
      signer_id: signerMap[step.signer_role]?.profile_id ?? null,
      signer_name: signerMap[step.signer_role]?.signer_name ?? null,
      signature_url: signerMap[step.signer_role]?.signature_url ?? null,
      status: 'pending',
    }))

    await sc.from('document_approval_signatures').insert(sigs)

    // 更新文件或會議
    if (document_id) {
      await sc.from('company_documents').update({
        status: 'pending_review',
        approval_id: approval.id,
      }).eq('id', document_id)
    }
    if (meeting_id) {
      await sc.from('meetings').update({ approval_id: approval.id } as Record<string, unknown>).eq('id', meeting_id)
    }

    return NextResponse.json({ ok: true, approval_id: approval.id })
  }

  // ===== 簽署 =====
  if (action === 'sign') {
    const { signature_id } = body

    // 取得簽名紀錄
    const { data: sig } = await sc.from('document_approval_signatures').select('*, document_approvals(*)').eq('id', signature_id).single()
    if (!sig) return NextResponse.json({ error: '找不到簽名紀錄' }, { status: 404 })

    const approval = (sig as Record<string, unknown>).document_approvals as { id: string; document_id: string; current_step: number; status: string } | null

    // 更新簽名狀態
    await sc.from('document_approval_signatures').update({
      status: 'signed',
      signed_at: new Date().toISOString(),
    }).eq('id', signature_id)

    if (!approval) return NextResponse.json({ ok: true })

    // 檢查是否所有步驟都簽了
    const { data: allSigs } = await sc.from('document_approval_signatures').select('status, step_order').eq('approval_id', approval.id).order('step_order')
    const allSigned = allSigs?.every(s => s.status === 'signed')
    const nextPending = allSigs?.find(s => s.status === 'pending')

    if (allSigned) {
      // 全部簽完
      await sc.from('document_approvals').update({ status: 'approved', completed_at: new Date().toISOString() }).eq('id', approval.id)
      await sc.from('company_documents').update({ status: 'approved' }).eq('id', approval.document_id)
    } else if (nextPending) {
      // 推進到下一步
      await sc.from('document_approvals').update({ current_step: nextPending.step_order }).eq('id', approval.id)
    }

    return NextResponse.json({ ok: true })
  }

  // ===== 退回 =====
  if (action === 'reject') {
    const { signature_id, comment } = body

    const { data: sig } = await sc.from('document_approval_signatures').select('approval_id').eq('id', signature_id).single()
    if (!sig) return NextResponse.json({ error: '找不到簽名紀錄' }, { status: 404 })

    // 更新簽名為退回
    await sc.from('document_approval_signatures').update({
      status: 'rejected',
      comment: comment ?? null,
      signed_at: new Date().toISOString(),
    }).eq('id', signature_id)

    // 取得 approval
    const { data: approval } = await sc.from('document_approvals').select('document_id').eq('id', sig.approval_id).single()

    // 更新 approval 和文件
    await sc.from('document_approvals').update({ status: 'rejected', completed_at: new Date().toISOString() }).eq('id', sig.approval_id)
    if (approval?.document_id) {
      await sc.from('company_documents').update({ status: 'draft' }).eq('id', approval.document_id)
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
