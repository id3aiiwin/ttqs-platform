import Link from 'next/link'
import { createCompany } from '../actions'
import { CompanyForm } from '@/components/company/company-form'
import { Card, CardBody, CardHeader } from '@/components/ui/card'

export const metadata = { title: '新增企業 | ID3A 管理平台' }

export default function NewCompanyPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/companies" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回企業列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">新增企業</h1>
      </div>
      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">填寫企業基本資料</p>
        </CardHeader>
        <CardBody>
          <CompanyForm action={createCompany} submitLabel="新增企業" />
        </CardBody>
      </Card>
    </div>
  )
}
