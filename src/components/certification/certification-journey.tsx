'use client'

import { useState } from 'react'

interface Requirement {
  label: string
  target: number
  current: number
}

interface Level {
  id: string
  label: string
  requirements: Requirement[]
  isCompleted: boolean
  isCurrent: boolean
}

interface Stage {
  id: string
  name: string
  color: string
  levels: Level[]
}

interface CertificationJourneyProps {
  title: string
  stages: Stage[]
  currentStageIdx: number
  currentLevelIdx: number
}

export function CertificationJourney({ title, stages, currentStageIdx, currentLevelIdx }: CertificationJourneyProps) {
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null)

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>

      {/* Desktop: Horizontal layout */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-6 left-0 right-0 h-1 z-0">
            <div className="h-full w-full bg-gray-200 rounded-full" />
            <div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                width: `${stages.length > 1 ? ((currentStageIdx + (currentLevelIdx > 0 ? 0.5 : 0)) / (stages.length - 1)) * 100 : 100}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
              }}
            />
          </div>

          {/* Stage nodes */}
          <div className="relative z-10 flex justify-between">
            {stages.map((stage, sIdx) => {
              const isPast = sIdx < currentStageIdx
              const isCurrent = sIdx === currentStageIdx
              const isFuture = sIdx > currentStageIdx

              return (
                <div key={stage.id} className="flex flex-col items-center" style={{ flex: 1 }}>
                  {/* Stage circle */}
                  <div className="relative">
                    {isCurrent && (
                      <>
                        <div className="absolute inset-0 w-12 h-12 rounded-full bg-indigo-400 animate-ping opacity-20" />
                        <div className="absolute -inset-1 w-14 h-14 rounded-full bg-indigo-400/30 animate-pulse" />
                      </>
                    )}
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center relative
                      transition-all duration-300 shadow-lg
                      ${isPast ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : ''}
                      ${isCurrent ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white ring-4 ring-indigo-300 ring-offset-2' : ''}
                      ${isFuture ? 'bg-gray-200 text-gray-400 border-2 border-dashed border-gray-300' : ''}
                    `}>
                      {isPast ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-bold">{sIdx + 1}</span>
                      )}
                    </div>
                  </div>

                  {/* Stage name */}
                  <p className={`mt-3 text-sm font-bold text-center ${isFuture ? 'text-gray-400' : 'text-gray-900'}`}>
                    {stage.name}
                  </p>

                  {/* "You are here" indicator */}
                  {isCurrent && (
                    <span className="mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                      你在這裡
                    </span>
                  )}

                  {/* Level dots */}
                  <div className="flex gap-2 mt-3">
                    {stage.levels.map((level, lIdx) => {
                      const levelPast = isPast || (isCurrent && lIdx < currentLevelIdx)
                      const levelCurrent = isCurrent && lIdx === currentLevelIdx
                      const levelFuture = isFuture || (isCurrent && lIdx > currentLevelIdx)
                      const isExpanded = expandedLevel === level.id

                      return (
                        <div key={level.id} className="flex flex-col items-center">
                          <button
                            onClick={() => setExpandedLevel(isExpanded ? null : level.id)}
                            className="relative group"
                          >
                            {levelCurrent && (
                              <div className="absolute -inset-1 w-8 h-8 rounded-full bg-indigo-400 animate-pulse opacity-30" />
                            )}
                            <div className={`
                              w-6 h-6 rounded-full flex items-center justify-center relative
                              transition-all duration-200 cursor-pointer
                              ${levelPast ? 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white shadow-md' : ''}
                              ${levelCurrent ? 'bg-indigo-500 text-white shadow-lg ring-2 ring-indigo-300 ring-offset-1 scale-110' : ''}
                              ${levelFuture ? 'bg-gray-200 text-gray-400' : ''}
                              hover:scale-125 hover:shadow-lg
                            `}>
                              {levelPast ? (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <span className="text-[9px] font-bold">
                                  {stage.levels.length > 1 ? (stage.levels.length - lIdx) : ''}
                                </span>
                              )}
                            </div>

                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                              <div className="bg-gray-900 text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                                {level.label}
                              </div>
                              <div className="w-2 h-2 bg-gray-900 transform rotate-45 mx-auto -mt-1" />
                            </div>
                          </button>

                          {/* Level short label */}
                          <p className={`mt-1 text-[9px] text-center whitespace-nowrap ${levelFuture ? 'text-gray-300' : 'text-gray-500'}`}>
                            {level.label.replace(/皮紋評量|心理/, '').slice(0, 3)}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Expanded requirements for current stage */}
                  {isCurrent && stage.levels.map((level, lIdx) => {
                    const levelCurrent = lIdx === currentLevelIdx
                    const isExpanded = expandedLevel === level.id || levelCurrent

                    if (!isExpanded) return null
                    return (
                      <div key={`req-${level.id}`} className="mt-3 bg-white border border-indigo-100 rounded-xl p-3 shadow-sm w-full max-w-[200px]">
                        <p className="text-xs font-semibold text-gray-700 mb-2">{level.label}</p>
                        <div className="space-y-1.5">
                          {level.requirements.map(req => {
                            const pct = Math.min(100, Math.round((req.current / req.target) * 100))
                            const met = req.current >= req.target
                            return (
                              <div key={req.label}>
                                <div className="flex justify-between text-[10px] mb-0.5">
                                  <span className="text-gray-500">{req.label}</span>
                                  <span className={met ? 'text-green-600 font-medium' : 'text-gray-400'}>
                                    {req.current}/{req.target}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${met ? 'bg-green-400' : 'bg-indigo-400'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile: Vertical layout */}
      <div className="md:hidden space-y-0">
        {stages.map((stage, sIdx) => {
          const isPast = sIdx < currentStageIdx
          const isCurrent = sIdx === currentStageIdx
          const isFuture = sIdx > currentStageIdx

          return (
            <div key={stage.id} className="relative">
              {/* Vertical connecting line */}
              {sIdx < stages.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-1 z-0">
                  <div className={`h-full w-full rounded-full ${isPast || isCurrent ? 'bg-gradient-to-b from-indigo-400 to-purple-400' : 'bg-gray-200'}`} />
                </div>
              )}

              <div className="relative z-10 flex gap-4 pb-8">
                {/* Stage circle */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    {isCurrent && (
                      <div className="absolute -inset-1 w-14 h-14 rounded-full bg-indigo-400/30 animate-pulse" />
                    )}
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      transition-all duration-300 shadow-lg
                      ${isPast ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : ''}
                      ${isCurrent ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white ring-4 ring-indigo-300 ring-offset-2' : ''}
                      ${isFuture ? 'bg-gray-200 text-gray-400 border-2 border-dashed border-gray-300' : ''}
                    `}>
                      {isPast ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-bold">{sIdx + 1}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stage content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold ${isFuture ? 'text-gray-400' : 'text-gray-900'}`}>{stage.name}</p>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                        你在這裡
                      </span>
                    )}
                  </div>

                  {/* Level list */}
                  <div className="mt-2 space-y-2">
                    {stage.levels.map((level, lIdx) => {
                      const levelPast = isPast || (isCurrent && lIdx < currentLevelIdx)
                      const levelCurrent = isCurrent && lIdx === currentLevelIdx
                      const levelFuture = isFuture || (isCurrent && lIdx > currentLevelIdx)
                      const isExpanded = expandedLevel === level.id || levelCurrent

                      return (
                        <button
                          key={level.id}
                          onClick={() => setExpandedLevel(isExpanded && !levelCurrent ? null : level.id)}
                          className={`
                            w-full text-left rounded-lg p-2.5 transition-all
                            ${levelCurrent ? 'bg-indigo-50 border border-indigo-200 shadow-sm' : ''}
                            ${levelPast ? 'bg-green-50/50 border border-green-100' : ''}
                            ${levelFuture ? 'bg-gray-50 border border-gray-100' : ''}
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`
                              w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                              ${levelPast ? 'bg-green-500 text-white' : ''}
                              ${levelCurrent ? 'bg-indigo-500 text-white' : ''}
                              ${levelFuture ? 'bg-gray-200 text-gray-400' : ''}
                            `}>
                              {levelPast ? (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <span className="text-[8px] font-bold">{stage.levels.length - lIdx}</span>
                              )}
                            </div>
                            <span className={`text-xs font-medium ${levelFuture ? 'text-gray-400' : 'text-gray-700'}`}>
                              {level.label}
                            </span>
                          </div>

                          {/* Requirements */}
                          {isExpanded && level.requirements.length > 0 && (
                            <div className="mt-2 ml-7 space-y-1.5">
                              {level.requirements.map(req => {
                                const pct = Math.min(100, Math.round((req.current / req.target) * 100))
                                const met = req.current >= req.target
                                return (
                                  <div key={req.label}>
                                    <div className="flex justify-between text-[10px] mb-0.5">
                                      <span className="text-gray-500">{req.label}</span>
                                      <span className={met ? 'text-green-600 font-medium' : 'text-gray-400'}>
                                        {req.current}/{req.target}
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full transition-all ${met ? 'bg-green-400' : 'bg-indigo-400'}`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Simpler horizontal journey for single-stage progressions (e.g. instructor levels)
 */
export function SimpleJourney({ title, levels, currentIdx }: {
  title: string
  levels: {
    id: string
    label: string
    requirements: Requirement[]
  }[]
  currentIdx: number
}) {
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null)

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>

      {/* Desktop: Horizontal */}
      <div className="hidden sm:block">
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-6 left-[8%] right-[8%] h-1 z-0">
            <div className="h-full w-full bg-gray-200 rounded-full" />
            <div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                width: `${levels.length > 1 ? (currentIdx / (levels.length - 1)) * 100 : 100}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
              }}
            />
          </div>

          {/* Level nodes */}
          <div className="relative z-10 flex justify-between px-[5%]">
            {levels.map((level, idx) => {
              const isPast = idx < currentIdx
              const isCurrent = idx === currentIdx
              const isFuture = idx > currentIdx
              const isExpanded = expandedLevel === level.id || isCurrent

              return (
                <div key={level.id} className="flex flex-col items-center" style={{ flex: 1 }}>
                  {/* Node */}
                  <button
                    onClick={() => setExpandedLevel(isExpanded && !isCurrent ? null : level.id)}
                    className="relative group"
                  >
                    {isCurrent && (
                      <>
                        <div className="absolute inset-0 w-12 h-12 rounded-full bg-indigo-400 animate-ping opacity-20" />
                        <div className="absolute -inset-1 w-14 h-14 rounded-full bg-indigo-400/30 animate-pulse" />
                      </>
                    )}
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center relative
                      transition-all duration-300 shadow-lg
                      ${isPast ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : ''}
                      ${isCurrent ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white ring-4 ring-indigo-300 ring-offset-2' : ''}
                      ${isFuture ? 'bg-gray-200 text-gray-400 border-2 border-dashed border-gray-300' : ''}
                      hover:scale-110
                    `}>
                      {isPast ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-bold">{idx + 1}</span>
                      )}
                    </div>
                  </button>

                  {/* Label */}
                  <p className={`mt-3 text-sm font-bold text-center ${isFuture ? 'text-gray-400' : 'text-gray-900'}`}>
                    {level.label}
                  </p>

                  {/* Current indicator */}
                  {isCurrent && (
                    <span className="mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                      目前等級
                    </span>
                  )}

                  {/* Requirements (expanded) */}
                  {isExpanded && level.requirements.length > 0 && (
                    <div className="mt-3 bg-white border border-indigo-100 rounded-xl p-3 shadow-sm w-full max-w-[180px]">
                      <div className="space-y-1.5">
                        {level.requirements.map(req => {
                          const pct = Math.min(100, Math.round((req.current / req.target) * 100))
                          const met = req.current >= req.target
                          return (
                            <div key={req.label}>
                              <div className="flex justify-between text-[10px] mb-0.5">
                                <span className="text-gray-500">{req.label}</span>
                                <span className={met ? 'text-green-600 font-medium' : 'text-gray-400'}>
                                  {req.current}/{req.target}
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${met ? 'bg-green-400' : 'bg-indigo-400'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile: Vertical */}
      <div className="sm:hidden space-y-0">
        {levels.map((level, idx) => {
          const isPast = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isFuture = idx > currentIdx
          const isExpanded = expandedLevel === level.id || isCurrent

          return (
            <div key={level.id} className="relative">
              {idx < levels.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-1 z-0">
                  <div className={`h-full w-full rounded-full ${isPast || isCurrent ? 'bg-gradient-to-b from-indigo-400 to-purple-400' : 'bg-gray-200'}`} />
                </div>
              )}
              <div className="relative z-10 flex gap-4 pb-6">
                <div className="flex-shrink-0 relative">
                  {isCurrent && (
                    <div className="absolute -inset-1 w-14 h-14 rounded-full bg-indigo-400/30 animate-pulse" />
                  )}
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center shadow-lg
                    ${isPast ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : ''}
                    ${isCurrent ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white ring-4 ring-indigo-300 ring-offset-2' : ''}
                    ${isFuture ? 'bg-gray-200 text-gray-400 border-2 border-dashed border-gray-300' : ''}
                  `}>
                    {isPast ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-bold">{idx + 1}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold ${isFuture ? 'text-gray-400' : 'text-gray-900'}`}>{level.label}</p>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                        目前等級
                      </span>
                    )}
                  </div>
                  {isExpanded && level.requirements.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {level.requirements.map(req => {
                        const pct = Math.min(100, Math.round((req.current / req.target) * 100))
                        const met = req.current >= req.target
                        return (
                          <div key={req.label}>
                            <div className="flex justify-between text-[10px] mb-0.5">
                              <span className="text-gray-500">{req.label}</span>
                              <span className={met ? 'text-green-600 font-medium' : 'text-gray-400'}>
                                {req.current}/{req.target}
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${met ? 'bg-green-400' : 'bg-indigo-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
