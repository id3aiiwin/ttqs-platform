'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Step { order: number; signer_role: string }
interface Flow { id: string; name: string; steps: Step[]; is_default: boolean }

interface Props {
  companyId: string
  flows: Flow[]
  signerRoles: string[]
}

export function ApprovalFlowEditor({ companyId, flows, signerRoles }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSteps, setNewSteps] = useState<Step[]>([])
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  async function handleCreate() {
    if (!newName.trim() || newSteps.length === 0) return
    startTransition(async () => {
      await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_flow',
          company_id: companyId,
          name: newName.trim(),
          steps: newSteps,
          is_default: flows.length === 0,
        }),
      })
      setCreating(false)
      setNewName('')
      setNewSteps([])
      router.refresh()
    })
  }

  async function handleUpdate(flowId: string, name: string, steps: Step[]) {
    startTransition(async () => {
      await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_flow', flow_id: flowId, name, steps }),
      })
      setEditing(null)
      router.refresh()
    })
  }

  async function handleDelete(flowId: string) {
    if (!confirm('確定刪除此簽核流程？')) return
    startTransition(async () => {
      await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_flow', flow_id: flowId }),
      })
      router.refresh()
    })
  }

  function addStep(steps: Step[], setSteps: (s: Step[]) => void) {
    const nextOrder = steps.length + 1
    const availableRole = signerRoles.find(r => !steps.find(s => s.signer_role === r)) || signerRoles[0] || '簽核人'
    setSteps([...steps, { order: nextOrder, signer_role: availableRole }])
  }

  return (
    <div className="space-y-4">
      {/* 現有流程 */}
      {flows.map(flow => (
        <FlowItem
          key={flow.id}
          flow={flow}
          signerRoles={signerRoles}
          isEditing={editing === flow.id}
          onEdit={() => setEditing(flow.id)}
          onSave={(name, steps) => handleUpdate(flow.id, name, steps)}
          onCancel={() => setEditing(null)}
          onDelete={() => handleDelete(flow.id)}
          pending={pending}
        />
      ))}

      {/* 新增流程 */}
      {creating ? (
        <div className="border border-indigo-200 bg-indigo-50/30 rounded-lg p-4 space-y-3">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="簽核流程名稱（如：四階文件簽核）"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" autoFocus />

          <div>
            <p className="text-xs text-gray-500 mb-2">簽核步驟（由上而下依序簽核）</p>
            {newSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400 w-6">{step.order}.</span>
                <select value={step.signer_role} onChange={e => {
                  const u = [...newSteps]; u[i] = { ...u[i], signer_role: e.target.value }; setNewSteps(u)
                }} className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 bg-white">
                  {signerRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={() => setNewSteps(newSteps.filter((_, j) => j !== i).map((s, j) => ({ ...s, order: j + 1 })))}
                  className="text-red-400 hover:text-red-600 text-xs">移除</button>
              </div>
            ))}
            <button onClick={() => addStep(newSteps, setNewSteps)}
              className="text-xs text-indigo-600 hover:text-indigo-700 mt-1">+ 新增步驟</button>
          </div>

          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={pending || !newName.trim() || newSteps.length === 0}
              className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1.5 disabled:opacity-50">建立</button>
            <button onClick={() => { setCreating(false); setNewName(''); setNewSteps([]) }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">取消</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)}
          className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors">
          + 新增簽核流程
        </button>
      )}
    </div>
  )
}

function FlowItem({ flow, signerRoles, isEditing, onEdit, onSave, onCancel, onDelete, pending }: {
  flow: Flow; signerRoles: string[]; isEditing: boolean
  onEdit: () => void; onSave: (name: string, steps: Step[]) => void
  onCancel: () => void; onDelete: () => void; pending: boolean
}) {
  const [name, setName] = useState(flow.name)
  const [steps, setSteps] = useState<Step[]>(flow.steps)

  if (isEditing) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <input value={name} onChange={e => setName(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        <div>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400 w-6">{step.order}.</span>
              <select value={step.signer_role} onChange={e => {
                const u = [...steps]; u[i] = { ...u[i], signer_role: e.target.value }; setSteps(u)
              }} className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 bg-white">
                {signerRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={() => setSteps(steps.filter((_, j) => j !== i).map((s, j) => ({ ...s, order: j + 1 })))}
                className="text-red-400 hover:text-red-600 text-xs">移除</button>
            </div>
          ))}
          <button onClick={() => setSteps([...steps, { order: steps.length + 1, signer_role: signerRoles[0] || '簽核人' }])}
            className="text-xs text-indigo-600 hover:text-indigo-700 mt-1">+ 新增步驟</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave(name, steps)} disabled={pending}
            className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1.5 disabled:opacity-50">儲存</button>
          <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">取消</button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between group">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{flow.name}</p>
          {flow.is_default && <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">預設</span>}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {flow.steps.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs">
              {i > 0 && <span className="text-gray-300">→</span>}
              <span className="bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{s.signer_role}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="text-xs text-indigo-600 hover:text-indigo-700">編輯</button>
        <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">刪除</button>
      </div>
    </div>
  )
}
