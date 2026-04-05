export interface ParsedQuizAnswer {
  questionNumber: number
  answer: string
  questionPreview: string
}

export interface ParsedQuizSession {
  quizName: string
  studentName: string
  companyName: string | null
  personName: string
  answers: ParsedQuizAnswer[]
  result: string | null
  totalQuestions: number
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

interface ChatMessage {
  senderType: string
  senderName: string
  date: string
  time: string
  content: string
}

/**
 * Parse a LINE chat log CSV and extract quiz sessions.
 *
 * CSV format:
 *   Line 1: 帳號名稱,...
 *   Line 2: 時區,...
 *   Line 3: 下載時間,...
 *   Line 4: header row (傳送者類型,傳送者名稱,傳送日期,傳送時間,內容)
 *   Line 5+: data rows
 */
export function parseLineChatLog(csvText: string): ParsedQuizSession[] {
  const messages = parseCsvToMessages(csvText)
  return extractQuizSessions(messages)
}

/**
 * Parse the raw CSV text into an array of ChatMessage objects.
 * Handles quoted fields that may contain newlines and commas.
 */
function parseCsvToMessages(csvText: string): ChatMessage[] {
  // Split into physical lines, then reassemble logical rows (handling quoted newlines)
  const logicalRows = splitCsvRows(csvText)

  // Skip first 3 metadata lines, then header row = 4 lines to skip
  if (logicalRows.length < 5) return []

  // Verify header row
  const headerRow = logicalRows[3]
  const headers = parseCsvFields(headerRow)
  const typeIdx = headers.findIndex(h => h.includes('傳送者類型'))
  const nameIdx = headers.findIndex(h => h.includes('傳送者名稱'))
  const dateIdx = headers.findIndex(h => h.includes('傳送日期'))
  const timeIdx = headers.findIndex(h => h.includes('傳送時間'))
  const contentIdx = headers.findIndex(h => h.includes('內容'))

  if (typeIdx === -1 || contentIdx === -1) return []

  const messages: ChatMessage[] = []
  for (let i = 4; i < logicalRows.length; i++) {
    const fields = parseCsvFields(logicalRows[i])
    if (fields.length < Math.max(typeIdx, nameIdx, dateIdx, timeIdx, contentIdx) + 1) continue

    const senderType = fields[typeIdx].trim()
    if (!senderType) continue // skip empty rows

    messages.push({
      senderType,
      senderName: fields[nameIdx]?.trim() || '',
      date: fields[dateIdx]?.trim() || '',
      time: fields[timeIdx]?.trim() || '',
      content: fields[contentIdx]?.trim() || '',
    })
  }

  return messages
}

/**
 * Split CSV text into logical rows, respecting quoted fields with newlines.
 */
function splitCsvRows(text: string): string[] {
  const rows: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (ch === '"') {
      // Check for escaped quote ""
      if (inQuotes && i + 1 < text.length && text[i + 1] === '"') {
        current += '""'
        i++ // skip next quote
        continue
      }
      inQuotes = !inQuotes
      current += ch
      continue
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      // End of logical row
      if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
        i++ // skip \n in \r\n
      }
      if (current.trim()) {
        rows.push(current)
      }
      current = ''
      continue
    }

    current += ch
  }

  if (current.trim()) {
    rows.push(current)
  }

  return rows
}

/**
 * Parse a single CSV row into fields, handling quoted values.
 */
function parseCsvFields(row: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < row.length; i++) {
    const ch = row[i]

    if (ch === '"') {
      if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
        current += '"'
        i++
        continue
      }
      inQuotes = !inQuotes
      continue
    }

    if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
      continue
    }

    current += ch
  }

  fields.push(current)
  return fields
}

type ParserState = 'idle' | 'quiz_started' | 'waiting_answer'

/**
 * Extract quiz sessions from parsed messages using a state machine.
 */
function extractQuizSessions(messages: ChatMessage[]): ParsedQuizSession[] {
  const sessions: ParsedQuizSession[] = []
  let state: ParserState = 'idle'
  let currentSession: ParsedQuizSession | null = null
  let currentQuestionNumber = 0
  let currentQuestionPreview = ''
  let lastStudentName = ''

  // Patterns
  const welcomePattern = /歡迎來到(.+?)！/
  const triggerPattern = /@人格測驗\/(.+)/
  const questionPattern = /（(\d+)\/(\d+)）/
  const resultPattern1 = /測驗結束！你的.+?結果是「(.+?)」/
  const resultPattern2 = /你的(.+?)是「(.+?)」/
  const resultPattern3 = /結果是「(.+?)」/
  const answerPattern = /^[A-Da-d]$/

  function finalizeSession() {
    if (currentSession) {
      // Only add if we have at least one answer or a result
      if (currentSession.answers.length > 0 || currentSession.result) {
        sessions.push({ ...currentSession })
      }
    }
    currentSession = null
    state = 'idle'
    currentQuestionNumber = 0
    currentQuestionPreview = ''
  }

  for (const msg of messages) {
    const content = msg.content

    // Track student name from User messages
    if (msg.senderType === 'User') {
      lastStudentName = msg.senderName
    }

    // Check for quiz start triggers
    const welcomeMatch = content.match(welcomePattern)
    const triggerMatch = content.match(triggerPattern)

    if (welcomeMatch || triggerMatch) {
      // If there's an ongoing session, finalize it first
      if (currentSession) {
        finalizeSession()
      }

      const quizName = welcomeMatch ? welcomeMatch[1] : triggerMatch![1]

      const fullName = lastStudentName || msg.senderName
      const dashIdx = fullName.indexOf('-')
      const companyName = dashIdx > 0 ? fullName.slice(0, dashIdx).trim() : null
      const personName = dashIdx > 0 ? fullName.slice(dashIdx + 1).trim() : fullName.trim()

      currentSession = {
        quizName,
        studentName: fullName,
        companyName,
        personName,
        answers: [],
        result: null,
        totalQuestions: 0,
        startDate: msg.date,
        endDate: msg.date,
        startTime: msg.time,
        endTime: msg.time,
      }
      state = 'quiz_started'
      continue
    }

    // Check for question pattern (Account sends questions)
    if (msg.senderType === 'Account' && currentSession) {
      const qMatch = content.match(questionPattern)
      if (qMatch) {
        currentQuestionNumber = parseInt(qMatch[1], 10)
        const totalQ = parseInt(qMatch[2], 10)
        currentSession.totalQuestions = Math.max(currentSession.totalQuestions, totalQ)

        // Extract question preview: content after the （N/M） pattern
        const afterPattern = content.substring(content.indexOf(qMatch[0]) + qMatch[0].length).trim()
        // Take the first line as preview
        const firstLine = afterPattern.split('\n')[0].trim()
        currentQuestionPreview = firstLine || content.substring(0, 50)

        state = 'waiting_answer'
        continue
      }
    }

    // Check for answer (User sends single letter while waiting)
    if (msg.senderType === 'User' && state === 'waiting_answer' && currentSession) {
      const trimmed = content.trim()
      if (answerPattern.test(trimmed)) {
        currentSession.answers.push({
          questionNumber: currentQuestionNumber,
          answer: trimmed.toUpperCase(),
          questionPreview: currentQuestionPreview,
        })
        currentSession.studentName = msg.senderName || currentSession.studentName
        currentSession.endDate = msg.date || currentSession.endDate
        currentSession.endTime = msg.time || currentSession.endTime
        state = 'quiz_started'
        continue
      }
      // Non-answer user message while waiting - stay in waiting_answer
      // (user might send stickers, etc.)
    }

    // Check for result message (quiz end)
    if (msg.senderType === 'Account' && currentSession) {
      const r1 = content.match(resultPattern1)
      const r2 = content.match(resultPattern2)
      const r3 = content.match(resultPattern3)

      if (r1 || r2 || r3) {
        if (r1) {
          currentSession.result = r1[1]
        } else if (r3) {
          // r3 is more specific than r2 for just extracting the result value
          currentSession.result = r3[1]
        } else if (r2) {
          currentSession.result = r2[2]
          // Also try to fill quiz name from result pattern if not set
          if (!currentSession.quizName) {
            currentSession.quizName = r2[1]
          }
        }

        currentSession.endDate = msg.date || currentSession.endDate
        currentSession.endTime = msg.time || currentSession.endTime
        finalizeSession()
        continue
      }
    }
  }

  // Handle incomplete session (no result message)
  if (currentSession && currentSession.answers.length > 0) {
    sessions.push({ ...currentSession })
  }

  return sessions
}
