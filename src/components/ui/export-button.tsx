'use client'

interface Props {
  type: 'courses' | 'employees' | 'documents'
  companyId?: string
  label?: string
}

export function ExportButton({ type, companyId, label }: Props) {
  function handleExport() {
    const params = new URLSearchParams({ type })
    if (companyId) params.set('company_id', companyId)
    window.open(`/api/export?${params.toString()}`, '_blank')
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      {label ?? '匯出 PDF'}
    </button>
  )
}
