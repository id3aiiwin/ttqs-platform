import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PDDRO_PHASES = {
  P:  { label: '計畫 (Plan)',    color: 'bg-blue-100 text-blue-800' },
  D:  { label: '設計 (Design)',  color: 'bg-purple-100 text-purple-800' },
  DO: { label: '執行 (Do)',      color: 'bg-orange-100 text-orange-800' },
  R:  { label: '查核 (Review)',  color: 'bg-yellow-100 text-yellow-800' },
  O:  { label: '成果 (Outcome)', color: 'bg-green-100 text-green-800' },
} as const

export const TTQS_LEVELS = {
  bronze: { label: '銅牌', color: 'bg-amber-100 text-amber-800' },
  silver: { label: '銀牌', color: 'bg-gray-100 text-gray-800' },
  gold: { label: '金牌', color: 'bg-yellow-100 text-yellow-800' },
} as const

export const ROLE_LABELS: Record<string, string> = {
  consultant: '顧問',
  admin: '行政人員',
  instructor: '講師',
  supervisor: '講師',
  analyst: '生命教練',
  hr: '人資',
  manager: '主管',
  employee: '員工',
  student: '學員',
}
