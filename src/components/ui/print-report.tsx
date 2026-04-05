'use client'

interface PrintReportProps {
  title: string
  subtitle?: string
  /** Function that returns HTML string for the report body */
  getContent: () => string
}

export function PrintReportButton({ title, subtitle, getContent }: PrintReportProps) {
  function handlePrint() {
    const content = getContent()
    const win = window.open('', '_blank')
    if (!win) { alert('請允許彈出視窗'); return }

    const now = new Date()
    const dateStr = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()}`

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Microsoft JhengHei', 'PingFang TC', sans-serif; color: #1a1a1a; font-size: 12px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { font-size: 20px; color: #4f46e5; margin: 0; }
          .header .subtitle { font-size: 14px; color: #6b7280; margin-top: 4px; }
          .header .meta { font-size: 11px; color: #9ca3af; margin-top: 8px; }
          .section { margin-bottom: 16px; }
          .section h2 { font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #f9fafb; text-align: left; padding: 6px 8px; border: 1px solid #e5e7eb; font-weight: 600; }
          td { padding: 6px 8px; border: 1px solid #e5e7eb; }
          .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
          .stat-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
          .stat-card .value { font-size: 18px; font-weight: 700; color: #4f46e5; }
          .stat-card .label { font-size: 10px; color: #9ca3af; }
          .bar { height: 12px; border-radius: 4px; margin: 2px 0; }
          .footer { text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 24px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
          <div class="meta">ID3A 管理平台 · 產出日期：${dateStr}</div>
        </div>
        ${content}
        <div class="footer">ID3A 管理平台 · 此報告由系統自動產出</div>
      </body>
      </html>
    `)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  return (
    <button onClick={handlePrint}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 border border-gray-200 rounded-lg hover:border-indigo-200 transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      匯出 PDF
    </button>
  )
}
