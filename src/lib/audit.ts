import { createServiceClient } from '@/lib/supabase/server'

export async function logAudit(params: {
  userId?: string | null
  userName?: string | null
  action: string
  entityType: string
  entityId?: string | null
  details?: Record<string, unknown>
}) {
  const sc = createServiceClient()
  await sc.from('audit_logs').insert({
    user_id: params.userId ?? null,
    user_name: params.userName ?? null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    details: params.details ?? {},
  })
}
