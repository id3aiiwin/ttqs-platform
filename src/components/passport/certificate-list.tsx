'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addCertificate, deleteCertificate } from '@/app/(dashboard)/companies/[id]/employees/[employeeId]/passport/actions'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Cert {
  id: string
  name: string
  issuer: string | null
  issued_date: string | null
  expiry_date: string | null
  file_url: string | null
}

function certStatus(expiryDate: string | null): { label: string; variant: 'success' | 'warning' | 'danger' | 'default' } {
  if (!expiryDate) return { label: '永久有效', variant: 'success' }
  const expiry = new Date(expiryDate)
  const now = new Date()
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft < 0) return { label: '已過期', variant: 'danger' }
  if (daysLeft < 90) return { label: `${daysLeft}天後到期`, variant: 'warning' }
  return { label: '有效', variant: 'success' }
}

export function CertificateList({
  certs, companyId, employeeId, isConsultant,
}: {
  certs: Cert[]
  companyId: string
  employeeId: string
  isConsultant: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const [name, setName] = useState('')
  const [issuer, setIssuer] = useState('')
  const [issuedDate, setIssuedDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  function handleAdd() {
    if (!name.trim()) return
    startTransition(async () => {
      await addCertificate(companyId, employeeId, {
        name: name.trim(),
        issuer: issuer || undefined,
        issued_date: issuedDate || undefined,
        expiry_date: expiryDate || undefined,
      })
      setName(''); setIssuer(''); setIssuedDate(''); setExpiryDate('')
      setAdding(false)
      router.refresh()
    })
  }

  function handleDelete(certId: string) {
    if (!confirm('確定刪除此證照記錄？')) return
    startTransition(async () => {
      await deleteCertificate(certId, companyId, employeeId)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-900">證照記錄</p>
          {!adding && (
            <Button size="sm" onClick={() => setAdding(true)}>+ 新增證照</Button>
          )}
        </div>
      </CardHeader>

      {adding && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">證照名稱 *</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="例：PMP 專案管理師" className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">核發單位</label>
              <input value={issuer} onChange={(e) => setIssuer(e.target.value)}
                placeholder="例：PMI" className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">取得日期</label>
              <input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">有效期限</label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" loading={pending} onClick={handleAdd} disabled={!name.trim()}>新增</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>取消</Button>
          </div>
        </div>
      )}

      {certs.length === 0 && !adding ? (
        <CardBody><p className="text-center text-sm text-gray-400 py-8">尚無證照記錄</p></CardBody>
      ) : (
        <div className="divide-y divide-gray-100">
          {certs.map((cert) => {
            const st = certStatus(cert.expiry_date)
            return (
              <div key={cert.id} className="px-6 py-3 flex items-center gap-4 group">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    {cert.issuer && <span>{cert.issuer}</span>}
                    {cert.issued_date && <span>取得：{cert.issued_date}</span>}
                    {cert.expiry_date && <span>到期：{cert.expiry_date}</span>}
                  </div>
                </div>
                <Badge variant={st.variant}>{st.label}</Badge>
                <button
                  onClick={() => handleDelete(cert.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
