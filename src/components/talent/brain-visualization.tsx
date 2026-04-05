'use client'

import { useState, useCallback } from 'react'

interface Drive {
  id: number
  name: string
  description: string
  percentage: number
  pattern: string
}

interface Props {
  drives: Drive[]
}

const DRIVES: Record<string, { region: string; func: string; hand: string; brain: string; color: string }> = {
  '管理力': { region: '前額葉', func: '精神功能', hand: '右手拇指', brain: 'left', color: '#e05252' },
  '推理力': { region: '後額葉', func: '思維功能', hand: '右手食指', brain: 'left', color: '#d4845a' },
  '操控力': { region: '頂葉', func: '體覺功能', hand: '右手中指', brain: 'left', color: '#4cad6b' },
  '語言力': { region: '顳葉', func: '聽覺功能', hand: '右手無名指', brain: 'left', color: '#3a6fa8' },
  '辨識力': { region: '枕葉', func: '視覺功能', hand: '右手小指', brain: 'left', color: '#9670c0' },
  '開創力': { region: '前額葉', func: '精神功能', hand: '左手拇指', brain: 'right', color: '#e05252' },
  '心像力': { region: '後額葉', func: '思維功能', hand: '左手食指', brain: 'right', color: '#d4845a' },
  '律動力': { region: '頂葉', func: '體覺功能', hand: '左手中指', brain: 'right', color: '#4cad6b' },
  '音樂力': { region: '顳葉', func: '聽覺功能', hand: '左手無名指', brain: 'right', color: '#3a6fa8' },
  '圖像力': { region: '枕葉', func: '視覺功能', hand: '左手小指', brain: 'right', color: '#7a5fb5' },
}

const LOBE_COLORS: Record<string, string> = {
  '前額葉': '#e05252', '後額葉': '#f0a500', '頂葉': '#6ab04c', '顳葉': '#5a9fd4', '枕葉': '#9e8fa0',
}

const LEFT_DRIVES = ['管理力', '推理力', '操控力', '語言力', '辨識力']
const RIGHT_DRIVES = ['開創力', '心像力', '律動力', '音樂力', '圖像力']
const RANK_EMOJI = ['🥇', '🥈', '🥉', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']

const SVG_W = 700, SVG_H = 560
const BOX_H = 82, BOX_GAP = 6, BOX_W = 148
const BOX_START_Y = (SVG_H - (BOX_H * 5 + BOX_GAP * 4)) / 2
const L_BOX_X = 2, R_BOX_X = SVG_W - BOX_W - 2
const BRAIN_L = 240, BRAIN_R = 460

const boxTop = (i: number) => BOX_START_Y + i * (BOX_H + BOX_GAP)
const boxMidY = (i: number) => boxTop(i) + BOX_H / 2

const BRAIN_OUTLINE = 'M 350,60 Q 302,50 272,72 Q 238,96 232,134 Q 226,168 236,200 Q 244,228 256,252 Q 272,278 296,292 Q 320,304 350,308 Q 380,304 404,292 Q 428,278 444,252 Q 456,228 464,200 Q 474,168 468,134 Q 462,96 428,72 Q 398,50 350,60 Z'

const LEFT_LOBES = [
  { drive: '管理力', path: 'M 348,63 Q 322,57 298,72 Q 272,90 268,120 Q 265,144 278,158 Q 292,170 312,170 Q 330,170 342,158 Q 350,148 350,130 Z' },
  { drive: '推理力', path: 'M 349,134 Q 340,152 322,164 Q 302,174 282,168 Q 268,162 265,180 Q 262,198 276,212 Q 292,224 314,224 Q 334,222 346,208 Q 354,196 350,176 Z' },
  { drive: '操控力', path: 'M 349,180 Q 343,200 326,214 Q 306,226 284,222 Q 268,216 263,234 Q 260,252 274,264 Q 290,276 314,276 Q 336,274 348,260 Q 356,246 350,224 Z' },
  { drive: '語言力', path: 'M 348,228 Q 342,248 322,262 Q 300,276 276,272 Q 262,266 258,282 Q 255,296 268,306 Q 284,316 308,316 Q 330,314 344,300 Q 354,286 350,264 Z' },
  { drive: '辨識力', path: 'M 349,268 Q 340,288 318,300 Q 296,312 270,308 Q 257,303 254,316 Q 260,310 350,308 Z' },
]

const RIGHT_LOBES = [
  { drive: '開創力', path: 'M 352,63 Q 378,57 402,72 Q 428,90 432,120 Q 435,144 422,158 Q 408,170 388,170 Q 370,170 358,158 Q 350,148 350,130 Z' },
  { drive: '心像力', path: 'M 351,134 Q 360,152 378,164 Q 398,174 418,168 Q 432,162 435,180 Q 438,198 424,212 Q 408,224 386,224 Q 366,222 354,208 Q 346,196 350,176 Z' },
  { drive: '律動力', path: 'M 351,180 Q 357,200 374,214 Q 394,226 416,222 Q 432,216 437,234 Q 440,252 426,264 Q 410,276 386,276 Q 364,274 352,260 Q 344,246 350,224 Z' },
  { drive: '音樂力', path: 'M 352,228 Q 358,248 378,262 Q 400,276 424,272 Q 438,266 442,282 Q 445,296 432,306 Q 416,316 392,316 Q 370,314 356,300 Q 346,286 350,264 Z' },
  { drive: '圖像力', path: 'M 351,268 Q 360,288 382,300 Q 404,312 430,308 Q 443,303 446,316 Q 440,310 350,308 Z' },
]

export function BrainVisualization({ drives }: Props) {
  const [activeDrive, setActiveDrive] = useState<string | null>(null)

  if (!drives || drives.length === 0) return null

  const getDriveData = (n: string) => drives.find(d => d.name === n)
  const getPct = (n: string) => Number(getDriveData(n)?.percentage || 0)
  const handleClick = useCallback((n: string) => setActiveDrive(p => p === n ? null : n), [])

  const allDrives = [...drives].filter(d => d.percentage).sort((a, b) => b.percentage - a.percentage)

  const getLobeColor = (name: string) => {
    const info = DRIVES[name]
    const pct = getPct(name)
    const base = LOBE_COLORS[info?.region] || '#888'
    const a = Math.round((0.38 + (pct / 100) * 0.57) * 255).toString(16).padStart(2, '0')
    return base + a
  }

  const isActive = (n: string) => activeDrive === n
  const isDimmed = (n: string) => activeDrive !== null && activeDrive !== n

  function Label({ name, index, side }: { name: string; index: number; side: 'left' | 'right' }) {
    const info = DRIVES[name]
    const dd = getDriveData(name)
    const pct = getPct(name)
    const active = isActive(name)
    const dimmed = isDimmed(name)
    const color = info?.color || '#888'
    const ty = boxTop(index)
    const my = boxMidY(index)
    const bx = side === 'left' ? L_BOX_X : R_BOX_X
    const cx = bx + BOX_W / 2
    const lineX1 = side === 'left' ? bx + BOX_W : BRAIN_R
    const lineX2 = side === 'left' ? BRAIN_L : R_BOX_X

    return (
      <g onClick={() => handleClick(name)} style={{ cursor: 'pointer' }} opacity={dimmed ? 0.22 : 1}>
        <line x1={lineX1} y1={my} x2={lineX2} y2={my} stroke={active ? color : '#d8ccf0'} strokeWidth={active ? 2 : 1} />
        <rect x={bx} y={ty} width={BOX_W} height={BOX_H} rx={9} fill={active ? color + '14' : 'white'} stroke={active ? color : '#e2d9f3'} strokeWidth={active ? 2 : 1} />
        <text x={cx} y={ty + 18} textAnchor="middle" fontSize="9.5" fill={active ? color : '#b0a0c8'} fontWeight={600}>{info?.region}・{info?.func}</text>
        <text x={cx} y={ty + 38} textAnchor="middle" fontSize="15" fontWeight={900} fill={active ? color : '#1a1a2e'}>{name}</text>
        <text x={cx} y={ty + 58} textAnchor="middle" fontSize="12" fontWeight={700} fill={active ? color : '#555'}>{pct > 0 ? `${pct}%` : '—'}{dd?.pattern ? ` · ${dd.pattern}` : ''}</text>
      </g>
    )
  }

  return (
    <div>
      <h3 className="text-center text-indigo-700 font-bold text-lg mb-2">大腦天賦分布圖</h3>
      <div className="max-w-[800px] mx-auto">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full block">
          <defs>
            <filter id="bs2"><feDropShadow dx={0} dy={3} stdDeviation={10} floodColor="#7c3aed1a" /></filter>
            <filter id="lg2"><feGaussianBlur stdDeviation={3} result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>

          <path d={BRAIN_OUTLINE} fill="white" stroke="#d8b4fe" strokeWidth={2.5} filter="url(#bs2)" />

          {LEFT_LOBES.map(({ drive, path }) => (
            <path key={drive} d={path} fill={getLobeColor(drive)} stroke="rgba(255,255,255,0.8)" strokeWidth={2}
              opacity={isDimmed(drive) ? 0.12 : 1} style={{ transition: 'opacity 0.25s', filter: isActive(drive) ? 'url(#lg2)' : 'none' }} />
          ))}
          {RIGHT_LOBES.map(({ drive, path }) => (
            <path key={drive} d={path} fill={getLobeColor(drive)} stroke="rgba(255,255,255,0.8)" strokeWidth={2}
              opacity={isDimmed(drive) ? 0.12 : 1} style={{ transition: 'opacity 0.25s', filter: isActive(drive) ? 'url(#lg2)' : 'none' }} />
          ))}

          <path d={BRAIN_OUTLINE} fill="none" stroke="#c4b5fd" strokeWidth={2} />
          <line x1={350} y1={60} x2={350} y2={308} stroke="#c4b5fd" strokeWidth={1.5} strokeDasharray="5,4" opacity={0.7} />
          <text x={296} y={76} textAnchor="middle" fontSize={9} fontWeight={700} fill="rgba(140,115,190,0.65)">左腦（右手）</text>
          <text x={404} y={76} textAnchor="middle" fontSize={9} fontWeight={700} fill="rgba(140,115,190,0.65)">右腦（左手）</text>

          {LEFT_DRIVES.map((n, i) => <Label key={n} name={n} index={i} side="left" />)}
          {RIGHT_DRIVES.map((n, i) => <Label key={n} name={n} index={i} side="right" />)}
        </svg>
      </div>

      <p className="text-center text-indigo-300 text-xs mt-1 mb-6">
        {activeDrive ? `已選取「${activeDrive}」— 再次點擊取消` : '點擊標籤，對應腦葉變亮'}
      </p>

      {/* 排名 */}
      {allDrives.length > 0 && (
        <div className="bg-white rounded-xl border border-indigo-100 p-5">
          <h4 className="text-indigo-700 font-bold text-sm mb-3">十大驅動力完整排名</h4>

          {allDrives.length >= 3 && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg px-3 py-2 mb-4 border border-indigo-200 text-sm">
              <strong className="text-indigo-700">專家建議：</strong>
              <span className="text-indigo-900"> 前三大優勢驅動力為「{allDrives.slice(0, 3).map(d => d.name).join('、')}」，建議發展相關領域的專業能力。</span>
            </div>
          )}

          <div className="space-y-1">
            {allDrives.map((d, i) => {
              const info = DRIVES[d.name]
              const pct = d.percentage
              return (
                <div key={d.name} className="grid items-center gap-2 px-2 py-2 rounded-lg hover:bg-indigo-50/50" style={{ gridTemplateColumns: '36px 1fr 60px 60px 72px' }}>
                  <span className="text-center text-base">{RANK_EMOJI[i] || `#${i + 1}`}</span>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: info?.color }} />
                      <span className="text-sm font-bold text-gray-900">{d.name}</span>
                      <span className="text-[10px] text-gray-400">{info?.region}・{info?.hand}</span>
                    </div>
                    <div className="h-1.5 bg-indigo-50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${info?.color}80, ${info?.color})` }} />
                    </div>
                  </div>
                  <span className="text-right text-sm font-bold" style={{ color: info?.color }}>{pct}%</span>
                  <span className="text-center text-xs rounded-md px-1.5 py-0.5 font-semibold" style={{ background: `${info?.color}18`, color: info?.color, border: `1px solid ${info?.color}35` }}>{d.pattern || '—'}</span>
                  <span className="text-center text-[10px] text-gray-400">{info?.region}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
