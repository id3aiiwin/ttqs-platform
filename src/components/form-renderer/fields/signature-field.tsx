'use client'

import type { FormFieldDefinition } from '@/types/form-schema'

interface SignatureData {
  [signer: string]: { name: string; date: string; signature_url?: string; signed?: boolean }
}

interface Props {
  field: FormFieldDefinition
  value: SignatureData
  onChange: (value: SignatureData) => void
  disabled?: boolean
  /** 企業簽核人資料（含簽名圖檔） */
  companySigners?: Record<string, { signer_name: string | null; signature_url: string | null }>
}

export function SignatureField({ field, value, onChange, disabled, companySigners }: Props) {
  const signers = field.signers ?? []
  const data: SignatureData = value && typeof value === 'object' ? value : {}

  function handleSign(signer: string) {
    const signerInfo = companySigners?.[signer]
    onChange({
      ...data,
      [signer]: {
        name: signerInfo?.signer_name ?? data[signer]?.name ?? '',
        date: new Date().toISOString().split('T')[0],
        signature_url: signerInfo?.signature_url ?? undefined,
        signed: true,
      },
    })
  }

  function updateSigner(signer: string, key: 'name' | 'date', val: string) {
    onChange({
      ...data,
      [signer]: { ...data[signer], [key]: val },
    })
  }

  return (
    <div className="grid gap-4">
      {signers.map((signer) => {
        const signerData = data[signer]
        const signerInfo = companySigners?.[signer]
        const isSigned = signerData?.signed

        return (
          <div key={signer} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{signer}</span>
              {isSigned && (
                <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">已簽署</span>
              )}
            </div>

            {isSigned && signerData.signature_url ? (
              /* 已簽署 - 顯示簽名圖檔 */
              <div className="flex items-center gap-3">
                <div className="bg-white border border-gray-200 rounded px-2 py-1">
                  <img
                    src={`/api/download?path=${encodeURIComponent(signerData.signature_url)}`}
                    alt={`${signer}簽名`}
                    className="h-10 max-w-[120px] object-contain"
                  />
                </div>
                <span className="text-xs text-gray-500">{signerData.date}</span>
              </div>
            ) : isSigned ? (
              /* 已簽署 - 無圖檔（文字） */
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">{signerData.name}</span>
                <span className="text-xs text-gray-500">{signerData.date}</span>
              </div>
            ) : (
              /* 未簽署 */
              <div className="flex items-center gap-3">
                {signerInfo?.signature_url && !disabled ? (
                  /* 有簽名圖檔 - 顯示簽署按鈕 */
                  <button
                    type="button"
                    onClick={() => handleSign(signer)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
                  >
                    <img
                      src={`/api/download?path=${encodeURIComponent(signerInfo.signature_url)}`}
                      alt="簽名預覽"
                      className="h-6 max-w-[80px] object-contain opacity-50"
                    />
                    <span className="text-xs text-indigo-600 font-medium">點擊簽署</span>
                  </button>
                ) : (
                  /* 無圖檔 - 手動輸入 */
                  <>
                    <input
                      type="text"
                      placeholder="簽名"
                      value={data[signer]?.name ?? ''}
                      onChange={(e) => updateSigner(signer, 'name', e.target.value)}
                      disabled={disabled}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-white disabled:text-gray-500"
                    />
                    <input
                      type="date"
                      value={data[signer]?.date ?? ''}
                      onChange={(e) => updateSigner(signer, 'date', e.target.value)}
                      disabled={disabled}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-white disabled:text-gray-500"
                    />
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
