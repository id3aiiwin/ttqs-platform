'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '1rem' }}>
          <div style={{ maxWidth: '24rem', textAlign: 'center' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>系統發生錯誤</h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>請稍後再試，或重新整理頁面</p>
            <button
              onClick={reset}
              style={{ padding: '0.5rem 1.5rem', background: '#4f46e5', color: 'white', borderRadius: '0.5rem', border: 'none', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              重新載入
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
