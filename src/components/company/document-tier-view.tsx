'use client'

import { DocumentItem } from './document-item'
import { AddDocumentForm } from './add-document-form'
import type { CompanyDocument } from '@/types/database'

interface VersionData { id: string; version: string; change_note: string | null; changed_by: string | null; changed_at: string; file_url: string | null; changer_name?: string }
interface ReviewData { id: string; status: 'needs_revision' | 'approved'; comment: string | null; reviewed_at: string; reviewer_id: string; reviewer_name?: string }
interface ApprovalData { id: string; status: string; current_step: number }
interface ApprovalSigData { id: string; step_order: number; signer_role: string; signer_name: string | null; signature_url: string | null; status: string; comment: string | null; signed_at: string | null }
interface FlowOption { id: string; name: string; is_default: boolean }

interface DocumentTierViewProps {
  documents: CompanyDocument[]
  companyId: string
  tier: number
  isConsultant: boolean
  versionsByDoc?: Record<string, VersionData[]>
  reviewsByDoc?: Record<string, ReviewData[]>
  approvalMap?: Record<string, ApprovalData>
  sigsByApproval?: Record<string, ApprovalSigData[]>
  approvalFlows?: FlowOption[]
}

export function DocumentTierView({ documents, companyId, tier, isConsultant, versionsByDoc, reviewsByDoc, approvalMap, sigsByApproval, approvalFlows }: DocumentTierViewProps) {
  return (
    <div>
      {documents.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">
          ���層級尚無文件
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              document={doc}
              companyId={companyId}
              isConsultant={isConsultant}
              versions={versionsByDoc?.[doc.id] ?? []}
              reviews={reviewsByDoc?.[doc.id] ?? []}
              approval={doc.approval_id ? approvalMap?.[doc.approval_id] : undefined}
              approvalSigs={doc.approval_id ? sigsByApproval?.[doc.approval_id] : undefined}
              approvalFlows={approvalFlows}
            />
          ))}
        </div>
      )}
      <div className="p-4 border-t border-gray-100">
        <AddDocumentForm companyId={companyId} tier={tier} />
      </div>
    </div>
  )
}
