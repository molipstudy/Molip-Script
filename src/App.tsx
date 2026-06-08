import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, supabaseSchema } from './supabase'
import './App.css'

type Screen =
  | 'home'
  | 'editor'
  | 'script'
  | 'flashcard'
  | 'dictation'
  | 'result'
  | 'auth'

type QuizItem = {
  number: string
  meaning: string
  english: string
}

type ScriptRecord = {
  id: string
  title: string
  rawText: string
  createdAt: string
  updatedAt: string
  lastOpenedAt: string
}

type SentenceStat = {
  sentenceKey: string
  number: string
  meaning: string
  english: string
  flashcardUnknownCount: number
  dictationAttempts: number
  dictationWrongCount: number
  lastStudiedAt?: string
  lastDictationAt?: string
}

type WordStat = {
  word: string
  source: 'dictation' | 'flashcard'
  wrongCount: number
  lastWrongAt?: string
}

type DictationSessionRecord = {
  id: string
  scriptId: string
  mode: string
  createdAt: string
  totalQuestions: number
  correctQuestions: number
  wrongQuestions: number
  wrongWords: string[]
}

type ActiveQuizRecord = {
  id: string
  scriptId: string
  quizType: 'dictation'
  mode: 'standard' | 'weak'
  state: ActiveDictationState
  updatedAt: string
}

type RouteTarget = {
  scriptId: string | null
  screen: Screen
  sessionId?: string
}

type LearningStore = {
  scripts: ScriptRecord[]
  sentenceStatsByScript: Record<string, Record<string, SentenceStat>>
  wordStatsByScript: Record<string, WordStat[]>
  dictationSessions: DictationSessionRecord[]
  activeQuizzes: ActiveQuizRecord[]
}

type ScriptRow = {
  id: string
  title: string
  raw_text: string
  created_at: string
  updated_at: string
  last_opened_at: string
}

type SentenceStatRow = {
  script_id: string
  sentence_key: string
  number: string
  meaning: string
  english: string
  flashcard_unknown_count: number
  dictation_attempts: number
  dictation_wrong_count: number
  last_studied_at: string | null
  last_dictation_at: string | null
}

type WordStatRow = {
  script_id: string
  word: string
  source: 'dictation' | 'flashcard'
  wrong_count: number
  last_wrong_at: string | null
}

type DictationSessionRow = {
  id: string
  script_id: string
  mode: string
  created_at: string
  total_questions: number
  correct_questions: number
  wrong_questions: number
  wrong_words: string[]
}

type ActiveQuizRow = {
  id: string
  script_id: string
  quiz_type: 'dictation'
  mode: 'standard' | 'weak'
  state: ActiveDictationState
  updated_at: string
}

type TextUnit = {
  kind: 'text'
  token: string
}

type BlankUnit = {
  kind: 'blank'
  blankId: string
  prefix: string
  suffix: string
  answer: string
  width: number
}

type SentenceUnit = TextUnit | BlankUnit

type DictationQuestion = {
  item: QuizItem
  sourceIndex: number
  sentenceKey: string
  units: SentenceUnit[]
}

type DictationGrade = {
  total: number
  correct: number
  checkedById: Record<string, boolean>
  wrongWords: string[]
}

type ActiveDictationState = {
  questions: DictationQuestion[]
  answersById: Record<string, string>
  gradesByIndex: Record<string, DictationGrade>
  currentIndex: number
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'been',
  'being',
  'but',
  'by',
  'for',
  'from',
  'had',
  'has',
  'have',
  'he',
  'her',
  'him',
  'his',
  'i',
  'in',
  'is',
  'it',
  'its',
  'my',
  'of',
  'on',
  'or',
  'our',
  'she',
  'that',
  'the',
  'their',
  'them',
  'they',
  'this',
  'to',
  'was',
  'we',
  'were',
  'with',
  'you',
  'your',
  'will',
  'every',
  'day',
])

const BRAND_LINKS = [
  {
    label: '몰입 타이머',
    href: import.meta.env.VITE_MOLIP_TIMER_URL ?? 'https://timer.molip.kro.kr',
  },
  {
    label: '몰입 보카',
    href: import.meta.env.VITE_MOLIP_VOCA_URL ?? 'https://voca.molip.kro.kr',
  },
]

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
const nowIso = () => new Date().toISOString()
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const normalizeLoginId = (value: string) => value.trim().toLowerCase()

const isValidLoginId = (value: string) => /^[a-z0-9][a-z0-9._-]{2,31}$/.test(value)

const displayLoginId = (user: User) => {
  const metadataId = user.user_metadata?.login_id
  if (typeof metadataId === 'string' && metadataId) return metadataId
  return user.email ?? '사용자'
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

const normalizeWord = (value: string) =>
  value
    .toLowerCase()
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '')
    .trim()

const normalizeAnswer = (value: string) =>
  value.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, '').trim()

const parseTokenParts = (token: string) => {
  const match = token.match(/^([^A-Za-z0-9']*)([A-Za-z0-9']+)([^A-Za-z0-9']*)$/)
  if (!match) return { prefix: '', core: '', suffix: '' }
  const [, prefix, core, suffix] = match
  return { prefix, core, suffix }
}

const renderHighlightedSentence = (english: string, weakWords: Set<string>) =>
  english.split(/(\s+)/).map((token, index) => {
    if (/^\s+$/.test(token)) return token
    const { prefix, core, suffix } = parseTokenParts(token)
    if (!core || !weakWords.has(normalizeWord(core))) return token
    return (
      <span className="weak-word" key={`${token}-${index}`}>
        {prefix}
        {core}
        {suffix}
      </span>
    )
  })

const parseAppPath = (pathname: string): RouteTarget => {
  const [scriptId = '', mode = '', id = ''] = pathname.split('/').filter(Boolean).map(decodeURIComponent)
  if (!scriptId) return { scriptId: null, screen: 'home' }
  if (mode === 'flashcard') return { scriptId, screen: 'flashcard' }
  if (mode === 'dictation') return { scriptId, screen: 'dictation' }
  if (mode === 'result' && id) return { scriptId, screen: 'result', sessionId: id }
  return { scriptId, screen: 'script' }
}

const pathForScreen = (screen: Screen, scriptId: string | null, sessionId?: string | null) => {
  if (!scriptId) return '/'
  const encodedId = encodeURIComponent(scriptId)
  if (screen === 'flashcard') return `/${encodedId}/flashcard`
  if (screen === 'dictation') return `/${encodedId}/dictation`
  if (screen === 'result' && sessionId) return `/${encodedId}/result/${encodeURIComponent(sessionId)}`
  if (screen === 'script') return `/${encodedId}`
  return '/'
}

const formatPercent = (value: number) => `${Math.round(value)}%`

const dictationModeLabel = (mode: string) => (mode === 'weak' ? '취약 문장' : '전체 받아쓰기')

const extractWords = (english: string) =>
  Array.from(
    new Set(
      english
        .split(/\s+/)
        .map(normalizeWord)
        .filter((word) => word.length > 1 && !STOP_WORDS.has(word)),
    ),
  )

const parseItems = (rawText: string): QuizItem[] => {
  const lines = rawText
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^\[[^\]]*]$/.test(line))

  const items: QuizItem[] = []
  for (let i = 0; i < lines.length; i += 1) {
    const numberMatch = lines[i].match(/^(\d+)\.\s*(.+)$/)
    if (!numberMatch) continue
    const nextLine = lines[i + 1] ?? ''
    if (!nextLine || /^\d+\.\s+/.test(nextLine)) continue
    items.push({ number: numberMatch[1], meaning: numberMatch[2].trim(), english: nextLine.trim() })
    i += 1
  }
  return items
}

const sentenceKeyOf = (item: QuizItem, index: number) =>
  `${index}:${item.number}:${item.english.toLowerCase().replace(/\s+/g, ' ').trim()}`

const pickRandom = (pool: number[], count: number) => {
  const next = [...pool]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next.slice(0, count)
}

const makeDictationQuestion = (
  item: QuizItem,
  sourceIndex: number,
  weakWords: Set<string>,
  blankPercent: number,
): DictationQuestion => {
  const tokens = item.english.split(/\s+/).filter(Boolean)
  const candidateIndexes = tokens
    .map((token, index) => ({ index, core: parseTokenParts(token).core }))
    .filter(({ core }) => core.length > 0)
  const weakIndexes = candidateIndexes
    .filter(({ core }) => weakWords.has(normalizeWord(core)))
    .map(({ index }) => index)
  const randomIndexes = candidateIndexes.map(({ index }) => index)
  const targetCount = clamp(
    Math.ceil(candidateIndexes.length * (blankPercent / 100)),
    1,
    Math.max(1, candidateIndexes.length),
  )
  const selected = new Set<number>(weakIndexes)

  if (selected.size < targetCount) {
    pickRandom(
      randomIndexes.filter((index) => !selected.has(index)),
      targetCount - selected.size,
    ).forEach((index) => selected.add(index))
  }

  const units: SentenceUnit[] = tokens.map((token, index) => {
    if (!selected.has(index)) return { kind: 'text', token }
    const { prefix, core, suffix } = parseTokenParts(token)
    if (!core) return { kind: 'text', token }
    return {
      kind: 'blank',
      blankId: `${item.number}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      prefix,
      suffix,
      answer: core,
      width: Math.max(96, Math.min(340, core.length * 24 + 28)),
    }
  })

  return { item, sourceIndex, sentenceKey: sentenceKeyOf(item, sourceIndex), units }
}

const collectBlanks = (question: DictationQuestion) =>
  question.units.filter((unit): unit is BlankUnit => unit.kind === 'blank')

const questionSentence = (question: DictationQuestion) =>
  question.units
    .map((unit) => (unit.kind === 'text' ? unit.token : `${unit.prefix}${unit.answer}${unit.suffix}`))
    .join(' ')

const createAnswers = (questions: DictationQuestion[]) => {
  const answers: Record<string, string> = {}
  questions.forEach((question) => {
    collectBlanks(question).forEach((blank) => {
      answers[blank.blankId] = ''
    })
  })
  return answers
}

const gradeQuestion = (
  question: DictationQuestion,
  answersById: Record<string, string>,
): DictationGrade => {
  const checkedById: Record<string, boolean> = {}
  const wrongWords: string[] = []
  let correct = 0
  const blanks = collectBlanks(question)

  blanks.forEach((blank) => {
    const expected = normalizeAnswer(blank.answer)
    const typed = normalizeAnswer(answersById[blank.blankId] ?? '')
    const isCorrect = typed !== '' && typed === expected
    checkedById[blank.blankId] = isCorrect
    if (isCorrect) {
      correct += 1
    } else {
      wrongWords.push(normalizeWord(blank.answer))
    }
  })

  return { total: blanks.length, correct, checkedById, wrongWords }
}

const gradeFromCheckedBlanks = (
  question: DictationQuestion,
  checkedById: Record<string, boolean>,
): DictationGrade => {
  const blanks = collectBlanks(question)
  const wrongWords: string[] = []
  let correct = 0

  blanks.forEach((blank) => {
    if (checkedById[blank.blankId]) {
      correct += 1
    } else {
      wrongWords.push(normalizeWord(blank.answer))
    }
  })

  return { total: blanks.length, correct, checkedById, wrongWords }
}

const emptyStore = (): LearningStore => ({
  scripts: [],
  sentenceStatsByScript: {},
  wordStatsByScript: {},
  dictationSessions: [],
  activeQuizzes: [],
})

const toFriendlyDbError = (message: string) => {
  const lowered = message.toLowerCase()
  if (lowered.includes('pgrst002') || lowered.includes('schema cache')) {
    return 'Supabase Data API의 Exposed schemas에 삭제된 스키마가 남아 있습니다. `supabase.sql`을 실행한 뒤 Data API 설정에 현재 스키마가 포함되어 있는지 확인해 주세요.'
  }
  if (lowered.includes('invalid schema')) {
    return `Supabase API 설정에서 Exposed schemas에 \`${supabaseSchema}\`를 추가해 주세요.`
  }
  if (lowered.includes('does not exist') || lowered.includes('relation')) {
    return '`supabase.sql`을 Supabase SQL Editor에서 실행해 주세요.'
  }
  if (lowered.includes('row-level security') || lowered.includes('permission denied')) {
    return 'RLS 또는 권한 정책을 확인해 주세요. 최신 `supabase.sql` 실행이 필요합니다.'
  }
  if (lowered.includes('email logins are disabled') || lowered.includes('email provider')) {
    return 'Supabase Auth의 Email provider가 꺼져 있습니다. 이메일/비밀번호 로그인을 켜 주세요.'
  }
  if (lowered.includes('user already registered') || lowered.includes('user already exists')) {
    return '이미 가입된 이메일입니다. 기존 비밀번호가 맞으면 입력한 아이디로 계정을 연결합니다.'
  }
  if (lowered.includes('profiles_login_id_format') || lowered.includes('duplicate key')) {
    return '이미 사용 중인 아이디이거나 아이디 형식이 올바르지 않습니다.'
  }
  return message
}

const normalizeStore = (
  scripts: ScriptRow[],
  sentenceRows: SentenceStatRow[],
  wordRows: WordStatRow[],
  dictationRows: DictationSessionRow[],
  activeQuizRows: ActiveQuizRow[],
): LearningStore => {
  const sentenceStatsByScript: Record<string, Record<string, SentenceStat>> = {}
  const wordStatsByScript: Record<string, WordStat[]> = {}

  sentenceRows.forEach((row) => {
    const bucket = sentenceStatsByScript[row.script_id] ?? {}
    bucket[row.sentence_key] = {
      sentenceKey: row.sentence_key,
      number: row.number,
      meaning: row.meaning,
      english: row.english,
      flashcardUnknownCount: row.flashcard_unknown_count,
      dictationAttempts: row.dictation_attempts,
      dictationWrongCount: row.dictation_wrong_count,
      lastStudiedAt: row.last_studied_at ?? undefined,
      lastDictationAt: row.last_dictation_at ?? undefined,
    }
    sentenceStatsByScript[row.script_id] = bucket
  })

  wordRows.forEach((row) => {
    const bucket = wordStatsByScript[row.script_id] ?? []
    bucket.push({
      word: row.word,
      source: row.source,
      wrongCount: row.wrong_count,
      lastWrongAt: row.last_wrong_at ?? undefined,
    })
    wordStatsByScript[row.script_id] = bucket
  })

  return {
    scripts: scripts.map((row) => ({
      id: row.id,
      title: row.title,
      rawText: row.raw_text,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastOpenedAt: row.last_opened_at,
    })),
    sentenceStatsByScript,
    wordStatsByScript,
    dictationSessions: dictationRows.map((row) => ({
      id: row.id,
      scriptId: row.script_id,
      mode: row.mode,
      createdAt: row.created_at,
      totalQuestions: row.total_questions,
      correctQuestions: row.correct_questions,
      wrongQuestions: row.wrong_questions,
      wrongWords: row.wrong_words ?? [],
    })),
    activeQuizzes: activeQuizRows.map((row) => ({
      id: row.id,
      scriptId: row.script_id,
      quizType: row.quiz_type,
      mode: row.mode,
      state: row.state,
      updatedAt: row.updated_at,
    })),
  }
}

function App() {
  const [screen, setScreen] = useState<Screen>('auth')
  const [user, setUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [loginId, setLoginId] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authNotice, setAuthNotice] = useState('')
  const [isAuthReady, setIsAuthReady] = useState(false)

  const [store, setStore] = useState<LearningStore>(() => emptyStore())
  const [isLoadingStore, setIsLoadingStore] = useState(false)
  const [hasLoadedStore, setHasLoadedStore] = useState(false)
  const [syncError, setSyncError] = useState('')

  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [detailedResultSessionId, setDetailedResultSessionId] = useState<string | null>(null)
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftRawText, setDraftRawText] = useState('')
  const [draftError, setDraftError] = useState('')

  const [studyModalOpen, setStudyModalOpen] = useState(false)
  const [studyKind, setStudyKind] = useState<'flashcard' | 'dictation'>('flashcard')
  const [weakOnly, setWeakOnly] = useState(false)
  const [dictationBlankPercent, setDictationBlankPercent] = useState(30)
  const [trackFlashWords, setTrackFlashWords] = useState(true)
  const [flashQueue, setFlashQueue] = useState<number[]>([])
  const [flashIndex, setFlashIndex] = useState(0)
  const [flashRevealed, setFlashRevealed] = useState(false)
  const [flashUnknown, setFlashUnknown] = useState<number[]>([])
  const [wordPickerOpen, setWordPickerOpen] = useState(false)
  const [pendingFlashIndex, setPendingFlashIndex] = useState<number | null>(null)
  const [selectedWords, setSelectedWords] = useState<Set<string>>(() => new Set())
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const [dictationQuestions, setDictationQuestions] = useState<DictationQuestion[]>([])
  const [answersById, setAnswersById] = useState<Record<string, string>>({})
  const [gradesByIndex, setGradesByIndex] = useState<Record<number, DictationGrade>>({})
  const [dictationIndex, setDictationIndex] = useState(0)
  const [dictationMode, setDictationMode] = useState<'standard' | 'weak'>('standard')
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const hasAppliedInitialRoute = useRef(false)

  const selectedScript = store.scripts.find((script) => script.id === selectedScriptId) ?? null
  const selectedScriptSessions = selectedScript
    ? store.dictationSessions.filter((session) => session.scriptId === selectedScript.id)
    : []
  const selectedResultSession =
    selectedScriptSessions.find((session) => session.id === selectedSessionId) ??
    (screen === 'result' ? selectedScriptSessions[0] ?? null : null)
  const selectedItems = useMemo(
    () => (selectedScript ? parseItems(selectedScript.rawText) : []),
    [selectedScript],
  )
  const selectedStats = selectedScript ? store.sentenceStatsByScript[selectedScript.id] ?? {} : {}
  const selectedWordStats = selectedScript ? store.wordStatsByScript[selectedScript.id] ?? [] : []
  const selectedActiveQuiz = selectedScript
    ? (store.activeQuizzes.find((quiz) => quiz.scriptId === selectedScript.id && quiz.quizType === 'dictation') ??
      null)
    : null
  const sortedScripts = useMemo(
    () => [...store.scripts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [store.scripts],
  )
  const currentQuestion = dictationQuestions[dictationIndex] ?? null
  const currentGrade = gradesByIndex[dictationIndex]
  const isDictationDone =
    dictationQuestions.length > 0 && dictationIndex >= dictationQuestions.length
  const solvedCount = Object.keys(gradesByIndex).length
  const correctCount = Object.values(gradesByIndex).filter((grade) => grade.correct === grade.total).length
  const wrongCount = Object.values(gradesByIndex).filter((grade) => grade.correct < grade.total).length

  const loadStore = useCallback(async () => {
    if (!supabase || !user) return
    setIsLoadingStore(true)
    setHasLoadedStore(false)
    try {
      const scriptsResult = await supabase
        .from('scripts')
        .select('id,title,raw_text,created_at,updated_at,last_opened_at')
        .order('updated_at', { ascending: false })
      if (scriptsResult.error) throw scriptsResult.error

      const sentenceResult = await supabase
        .from('sentence_stats')
        .select(
          'script_id,sentence_key,number,meaning,english,flashcard_unknown_count,dictation_attempts,dictation_wrong_count,last_studied_at,last_dictation_at',
        )
      if (sentenceResult.error) throw sentenceResult.error

      const wordResult = await supabase
        .from('word_stats')
        .select('script_id,word,source,wrong_count,last_wrong_at')
        .order('wrong_count', { ascending: false })
      if (wordResult.error) throw wordResult.error

      const dictationResult = await supabase
        .from('dictation_sessions')
        .select(
          'id,script_id,mode,created_at,total_questions,correct_questions,wrong_questions,wrong_words',
        )
        .order('created_at', { ascending: false })
      if (dictationResult.error) throw dictationResult.error

      const activeQuizResult = await supabase
        .from('active_quizzes')
        .select('id,script_id,quiz_type,mode,state,updated_at')
        .order('updated_at', { ascending: false })
      if (activeQuizResult.error) throw activeQuizResult.error

      setStore(
        normalizeStore(
          (scriptsResult.data ?? []) as ScriptRow[],
          (sentenceResult.data ?? []) as SentenceStatRow[],
          (wordResult.data ?? []) as WordStatRow[],
          (dictationResult.data ?? []) as DictationSessionRow[],
          (activeQuizResult.data ?? []) as ActiveQuizRow[],
        ),
      )
      setSyncError('')
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류'
      setSyncError(`데이터 불러오기 실패: ${toFriendlyDbError(message)}`)
    } finally {
      setIsLoadingStore(false)
      setHasLoadedStore(true)
    }
  }, [user])

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      const nextUser = data.session?.user ?? null
      setUser(nextUser)
      setScreen(nextUser ? 'home' : 'auth')
      setIsAuthReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      setStore(emptyStore())
      setHasLoadedStore(false)
      hasAppliedInitialRoute.current = false
      setSelectedScriptId(null)
      setSelectedSessionId(null)
      setDetailedResultSessionId(null)
      setScreen(nextUser ? 'home' : 'auth')
    })

    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    void loadStore()
  }, [user, loadStore])

  useEffect(() => {
    if (!user || !hasLoadedStore || isLoadingStore || hasAppliedInitialRoute.current) return
    const target = parseAppPath(window.location.pathname)
    hasAppliedInitialRoute.current = true
    if (!target.scriptId) return
    if (!store.scripts.some((script) => script.id === target.scriptId)) return
    setSelectedScriptId(target.scriptId)
    setSelectedSessionId(target.sessionId ?? null)
    setScreen(target.screen)
  }, [hasLoadedStore, isLoadingStore, store.scripts, user])

  useEffect(() => {
    if (!user || screen === 'auth' || screen === 'editor') return
    if (!hasAppliedInitialRoute.current) return
    const nextPath = pathForScreen(screen, selectedScriptId, selectedSessionId)
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath)
    }
  }, [screen, selectedScriptId, selectedSessionId, user])

  useEffect(() => {
    const handlePopState = () => {
      const target = parseAppPath(window.location.pathname)
      if (!target.scriptId) {
        setSelectedScriptId(null)
        setSelectedSessionId(null)
        setScreen('home')
        return
      }
      setSelectedScriptId(target.scriptId)
      setSelectedSessionId(target.sessionId ?? null)
      setScreen(target.screen)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!currentQuestion || currentGrade || isDictationDone) return
    const firstBlank = collectBlanks(currentQuestion)[0]
    const raf = window.requestAnimationFrame(() => {
      const input = firstBlank ? inputRefs.current[firstBlank.blankId] : null
      input?.focus()
      input?.select()
    })
    return () => window.cancelAnimationFrame(raf)
  }, [currentQuestion, currentGrade, isDictationDone])

  const requireUserId = () => {
    if (!user) throw new Error('로그인이 필요합니다.')
    return user.id
  }

  const handleAuth = async () => {
    if (!supabase) return
    const client = supabase
    setAuthError('')
    setAuthNotice('')
    const normalizedLoginId = normalizeLoginId(loginId)
    if (!normalizedLoginId || !password) {
      setAuthError('아이디와 비밀번호를 입력해 주세요.')
      return
    }

    const saveProfile = async (id: string, email: string) =>
      client.from('profiles').upsert(
        {
          id,
          login_id: normalizedLoginId,
          email,
          updated_at: nowIso(),
        },
        { onConflict: 'id' },
      )

    if (authMode === 'login') {
      const { data: email, error: lookupError } = await client.rpc('email_for_login_id', {
        input_login_id: normalizedLoginId,
      })
      if (lookupError) {
        setAuthError(toFriendlyDbError(lookupError.message))
        return
      }
      if (typeof email !== 'string' || !email) {
        setAuthError('아이디 또는 비밀번호가 올바르지 않습니다.')
        return
      }
      const result = await client.auth.signInWithPassword({
        email,
        password,
      })
      if (result.error) {
        setAuthError(toFriendlyDbError(result.error.message))
        return
      }
      setPassword('')
      return
    }

    const email = signupEmail.trim().toLowerCase()
    if (!email) {
      setAuthError('이메일을 입력해 주세요.')
      return
    }
    if (!isValidLoginId(normalizedLoginId)) {
      setAuthError('아이디는 영문 소문자, 숫자, 점, 밑줄, 하이픈 3~32자로 입력해 주세요.')
      return
    }

    const result = await client.auth.signUp({
      email,
      password,
      options: { data: { login_id: normalizedLoginId } },
    })
    if (result.error) {
      const loweredMessage = result.error.message.toLowerCase()
      if (
        loweredMessage.includes('user already registered') ||
        loweredMessage.includes('user already exists')
      ) {
        const loginResult = await client.auth.signInWithPassword({ email, password })
        if (loginResult.error || !loginResult.data.user) {
          setAuthError('이미 가입된 이메일입니다. 기존 비밀번호를 확인해 주세요.')
          return
        }
        const { error: profileError } = await saveProfile(loginResult.data.user.id, email)
        if (profileError) {
          setAuthError(toFriendlyDbError(profileError.message))
          return
        }
        setAuthNotice('기존 계정을 입력한 아이디와 연결했습니다.')
        setPassword('')
        return
      }
      setAuthError(toFriendlyDbError(result.error.message))
      return
    }
    const identities = result.data.user?.identities
    const mayBeExistingUser = Array.isArray(identities) && identities.length === 0

    if (mayBeExistingUser) {
      const loginResult = await client.auth.signInWithPassword({ email, password })
      if (loginResult.error || !loginResult.data.user) {
        setAuthError('이미 가입된 이메일입니다. 기존 비밀번호를 확인해 주세요.')
        return
      }
      const { error: profileError } = await saveProfile(loginResult.data.user.id, email)
      if (profileError) {
        setAuthError(toFriendlyDbError(profileError.message))
        return
      }
      setAuthNotice('기존 계정을 입력한 아이디와 연결했습니다.')
      setPassword('')
      return
    }

    if (!result.data.session) {
      setAuthNotice('가입 확인 이메일을 보냈습니다. 이메일 인증 후 아이디로 로그인해 주세요.')
    } else if (result.data.user) {
      const { error: profileError } = await saveProfile(result.data.user.id, email)
      if (profileError) {
        setAuthError(toFriendlyDbError(profileError.message))
        return
      }
    }
    setPassword('')
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const touchScript = (scriptId: string) => {
    const touchedAt = nowIso()
    setStore((prev) => ({
      ...prev,
      scripts: prev.scripts.map((script) =>
        script.id === scriptId ? { ...script, lastOpenedAt: touchedAt } : script,
      ),
    }))
    if (!supabase) return
    void supabase
      .from('scripts')
      .update({ last_opened_at: touchedAt })
      .eq('id', scriptId)
      .then(({ error }) => {
        if (error) setSyncError(`열람 기록 저장 실패: ${toFriendlyDbError(error.message)}`)
      })
  }

  const openScript = (scriptId: string) => {
    setSelectedScriptId(scriptId)
    setSelectedSessionId(null)
    touchScript(scriptId)
    setScreen('script')
  }

  const openDictationResult = (session: DictationSessionRecord) => {
    setSelectedScriptId(session.scriptId)
    setSelectedSessionId(session.id)
    touchScript(session.scriptId)
    setScreen('result')
  }

  const openEditor = (script?: ScriptRecord) => {
    setEditingScriptId(script?.id ?? null)
    setDraftTitle(script?.title ?? '')
    setDraftRawText(script?.rawText ?? '')
    setDraftError('')
    setScreen('editor')
  }

  const saveScript = async () => {
    if (!supabase) return
    const title = draftTitle.trim()
    const rawText = draftRawText.trim()
    if (!title) {
      setDraftError('제목을 입력해 주세요.')
      return
    }
    if (!parseItems(rawText).length) {
      setDraftError('번호. 한글 뜻 다음 줄에 영어 문장을 넣어 주세요.')
      return
    }

    try {
      const ownerId = requireUserId()
      const timestamp = nowIso()
      const scriptId = editingScriptId ?? makeId()
      const payload = {
        id: scriptId,
        owner_id: ownerId,
        title,
        raw_text: rawText,
        updated_at: timestamp,
        last_opened_at: timestamp,
      }
      const { error } = editingScriptId
        ? await supabase
            .from('scripts')
            .update({
              title: payload.title,
              raw_text: payload.raw_text,
              updated_at: payload.updated_at,
              last_opened_at: payload.last_opened_at,
            })
            .eq('id', editingScriptId)
        : await supabase.from('scripts').insert({
            ...payload,
            created_at: timestamp,
          })

      if (error) throw error

      setStore((prev) => ({
        ...prev,
        scripts: editingScriptId
          ? prev.scripts.map((script) =>
              script.id === editingScriptId
                ? { ...script, title, rawText, updatedAt: timestamp, lastOpenedAt: timestamp }
                : script,
            )
          : [
              {
                id: scriptId,
                title,
                rawText,
                createdAt: timestamp,
                updatedAt: timestamp,
                lastOpenedAt: timestamp,
              },
              ...prev.scripts,
            ],
      }))
      setSelectedScriptId(scriptId)
      setScreen('script')
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류'
      setDraftError(`저장 실패: ${toFriendlyDbError(message)}`)
    }
  }

  const deleteScript = async (scriptId: string) => {
    if (!supabase) return
    if (!window.confirm('스크립트와 학습 기록을 삭제할까요?')) return
    const { error } = await supabase.from('scripts').delete().eq('id', scriptId)
    if (error) {
      setSyncError(`삭제 실패: ${toFriendlyDbError(error.message)}`)
      return
    }
    setStore((prev) => {
      const sentenceStatsByScript = { ...prev.sentenceStatsByScript }
      const wordStatsByScript = { ...prev.wordStatsByScript }
      delete sentenceStatsByScript[scriptId]
      delete wordStatsByScript[scriptId]
      return {
        ...prev,
        scripts: prev.scripts.filter((script) => script.id !== scriptId),
        sentenceStatsByScript,
        wordStatsByScript,
        dictationSessions: prev.dictationSessions.filter((session) => session.scriptId !== scriptId),
      }
    })
    if (selectedScriptId === scriptId) {
      setSelectedScriptId(null)
      setScreen('home')
    }
  }

  const upsertSentenceStat = async (
    scriptId: string,
    item: QuizItem,
    index: number,
    updater: (stat: SentenceStat) => SentenceStat,
  ) => {
    if (!supabase || !user) return
    const sentenceKey = sentenceKeyOf(item, index)
    const bucket = store.sentenceStatsByScript[scriptId] ?? {}
    const base: SentenceStat = bucket[sentenceKey] ?? {
      sentenceKey,
      number: item.number,
      meaning: item.meaning,
      english: item.english,
      flashcardUnknownCount: 0,
      dictationAttempts: 0,
      dictationWrongCount: 0,
    }
    const next = updater({ ...base, number: item.number, meaning: item.meaning, english: item.english })

    setStore((prev) => ({
      ...prev,
      sentenceStatsByScript: {
        ...prev.sentenceStatsByScript,
        [scriptId]: {
          ...(prev.sentenceStatsByScript[scriptId] ?? {}),
          [sentenceKey]: next,
        },
      },
    }))

    const { error } = await supabase.from('sentence_stats').upsert(
      {
        owner_id: user.id,
        script_id: scriptId,
        sentence_key: sentenceKey,
        number: next.number,
        meaning: next.meaning,
        english: next.english,
        flashcard_unknown_count: next.flashcardUnknownCount,
        dictation_attempts: next.dictationAttempts,
        dictation_wrong_count: next.dictationWrongCount,
        last_studied_at: next.lastStudiedAt ?? null,
        last_dictation_at: next.lastDictationAt ?? null,
        updated_at: nowIso(),
      },
      { onConflict: 'owner_id,script_id,sentence_key' },
    )
    if (error) setSyncError(`문장 기록 저장 실패: ${toFriendlyDbError(error.message)}`)
  }

  const recordWords = async (
    scriptId: string,
    words: string[],
    source: 'dictation' | 'flashcard',
  ) => {
    if (!supabase || !user || !words.length) return
    const normalizedWords = Array.from(new Set(words.map(normalizeWord).filter(Boolean)))
    const timestamp = nowIso()
    const current = store.wordStatsByScript[scriptId] ?? []
    const rows = normalizedWords.map((word) => {
      const existing = current.find((stat) => stat.word === word && stat.source === source)
      return {
        owner_id: user.id,
        script_id: scriptId,
        word,
        source,
        wrong_count: (existing?.wrongCount ?? 0) + 1,
        last_wrong_at: timestamp,
        updated_at: timestamp,
      }
    })

    setStore((prev) => {
      const bucket = [...(prev.wordStatsByScript[scriptId] ?? [])]
      rows.forEach((row) => {
        const targetIndex = bucket.findIndex((stat) => stat.word === row.word && stat.source === source)
        const nextStat: WordStat = {
          word: row.word,
          source,
          wrongCount: row.wrong_count,
          lastWrongAt: timestamp,
        }
        if (targetIndex >= 0) bucket[targetIndex] = nextStat
        else bucket.push(nextStat)
      })
      return {
        ...prev,
        wordStatsByScript: {
          ...prev.wordStatsByScript,
          [scriptId]: bucket,
        },
      }
    })

    const { error } = await supabase.from('word_stats').upsert(rows, {
      onConflict: 'owner_id,script_id,word,source',
    })
    if (error) setSyncError(`단어 기록 저장 실패: ${toFriendlyDbError(error.message)}`)
  }

  const adjustWordStat = async (
    scriptId: string,
    word: string,
    source: 'dictation' | 'flashcard',
    delta: 1 | -1,
  ) => {
    if (!supabase || !user) return
    const normalized = normalizeWord(word)
    if (!normalized) return
    const timestamp = nowIso()
    const existing = (store.wordStatsByScript[scriptId] ?? []).find(
      (stat) => stat.word === normalized && stat.source === source,
    )
    const nextCount = (existing?.wrongCount ?? 0) + delta

    setStore((prev) => {
      const bucket = [...(prev.wordStatsByScript[scriptId] ?? [])]
      const targetIndex = bucket.findIndex(
        (stat) => stat.word === normalized && stat.source === source,
      )

      if (nextCount <= 0) {
        return {
          ...prev,
          wordStatsByScript: {
            ...prev.wordStatsByScript,
            [scriptId]: bucket.filter(
              (stat) => !(stat.word === normalized && stat.source === source),
            ),
          },
        }
      }

      const nextStat: WordStat = {
        word: normalized,
        source,
        wrongCount: nextCount,
        lastWrongAt: timestamp,
      }
      if (targetIndex >= 0) bucket[targetIndex] = nextStat
      else bucket.push(nextStat)

      return {
        ...prev,
        wordStatsByScript: {
          ...prev.wordStatsByScript,
          [scriptId]: bucket,
        },
      }
    })

    if (nextCount <= 0) {
      const { error } = await supabase
        .from('word_stats')
        .delete()
        .eq('script_id', scriptId)
        .eq('word', normalized)
        .eq('source', source)
      if (error) setSyncError(`단어 기록 저장 실패: ${toFriendlyDbError(error.message)}`)
      return
    }

    const { error } = await supabase.from('word_stats').upsert(
      {
        owner_id: user.id,
        script_id: scriptId,
        word: normalized,
        source,
        wrong_count: nextCount,
        last_wrong_at: timestamp,
        updated_at: timestamp,
      },
      { onConflict: 'owner_id,script_id,word,source' },
    )
    if (error) setSyncError(`단어 기록 저장 실패: ${toFriendlyDbError(error.message)}`)
  }

  const weakIndexesForSelected = () => {
    const weakKeys = new Set(
      Object.values(selectedStats)
        .filter((stat) => stat.dictationWrongCount > 0 || stat.flashcardUnknownCount > 0)
        .map((stat) => stat.sentenceKey),
    )
    const indexes = selectedItems
      .map((item, index) => ({ index, key: sentenceKeyOf(item, index) }))
      .filter(({ key }) => weakKeys.has(key))
      .map(({ index }) => index)
    return indexes.length ? indexes : selectedItems.map((_, index) => index)
  }

  const startFlashcard = () => {
    if (!selectedScript || !selectedItems.length) return
    const queue = weakOnly ? weakIndexesForSelected() : selectedItems.map((_, index) => index)
    setStudyModalOpen(false)
    setFlashQueue(queue)
    setFlashIndex(0)
    setFlashRevealed(false)
    setFlashUnknown([])
    touchScript(selectedScript.id)
    setScreen('flashcard')
  }

  const finishFlashcard = async () => {
    if (!supabase || !user || !selectedScript) return
    const trackedWords = selectedWordStats
      .filter((stat) => stat.source === 'flashcard')
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 20)
      .map((stat) => stat.word)
    await supabase.from('flashcard_sessions').insert({
      id: makeId(),
      owner_id: user.id,
      script_id: selectedScript.id,
      created_at: nowIso(),
      total_cards: flashQueue.length,
      unknown_cards: flashUnknown.length,
      tracked_words: trackedWords,
    })
  }

  const advanceFlashcard = async (known: boolean) => {
    if (!selectedScript) return
    const sourceIndex = flashQueue[flashIndex]
    const item = selectedItems[sourceIndex]
    if (!item) return

    if (!known) {
      setFlashUnknown((prev) => (prev.includes(sourceIndex) ? prev : [...prev, sourceIndex]))
      await upsertSentenceStat(selectedScript.id, item, sourceIndex, (stat) => ({
        ...stat,
        flashcardUnknownCount: stat.flashcardUnknownCount + 1,
        lastStudiedAt: nowIso(),
      }))
      if (trackFlashWords) {
        setPendingFlashIndex(sourceIndex)
        setSelectedWords(new Set())
        setWordPickerOpen(true)
        return
      }
    }

    if (flashIndex >= flashQueue.length - 1) {
      await finishFlashcard()
      setFlashIndex(flashQueue.length)
      return
    }
    setFlashIndex((prev) => prev + 1)
    setFlashRevealed(false)
  }

  const moveFlashcard = (direction: -1 | 1) => {
    if (!flashQueue.length || wordPickerOpen) return
    setFlashIndex((prev) => clamp(prev + direction, 0, flashQueue.length - 1))
    setFlashRevealed(false)
  }

  const closeWordPicker = async (save: boolean) => {
    if (save && selectedScript && selectedWords.size) {
      await recordWords(selectedScript.id, Array.from(selectedWords), 'flashcard')
    }
    setWordPickerOpen(false)
    setPendingFlashIndex(null)
    setSelectedWords(new Set())
    if (flashIndex >= flashQueue.length - 1) {
      await finishFlashcard()
      setFlashIndex(flashQueue.length)
      return
    }
    setFlashIndex((prev) => prev + 1)
    setFlashRevealed(false)
  }

  const upsertActiveDictation = async (
    scriptId: string,
    mode: 'standard' | 'weak',
    state: ActiveDictationState,
  ) => {
    if (!supabase || !user) return
    const timestamp = nowIso()
    const existing = store.activeQuizzes.find(
      (quiz) => quiz.scriptId === scriptId && quiz.quizType === 'dictation',
    )
    const record: ActiveQuizRecord = {
      id: existing?.id ?? makeId(),
      scriptId,
      quizType: 'dictation',
      mode,
      state,
      updatedAt: timestamp,
    }

    setStore((prev) => ({
      ...prev,
      activeQuizzes: [
        record,
        ...prev.activeQuizzes.filter(
          (quiz) => !(quiz.scriptId === scriptId && quiz.quizType === 'dictation'),
        ),
      ],
    }))

    const { error } = await supabase.from('active_quizzes').upsert(
      {
        id: record.id,
        owner_id: user.id,
        script_id: scriptId,
        quiz_type: 'dictation',
        mode,
        state,
        updated_at: timestamp,
      },
      { onConflict: 'owner_id,script_id,quiz_type' },
    )
    if (error) setSyncError(`진행 중 퀴즈 저장 실패: ${toFriendlyDbError(error.message)}`)
  }

  const deleteActiveDictation = async (scriptId: string) => {
    if (!supabase) return
    setStore((prev) => ({
      ...prev,
      activeQuizzes: prev.activeQuizzes.filter(
        (quiz) => !(quiz.scriptId === scriptId && quiz.quizType === 'dictation'),
      ),
    }))
    const { error } = await supabase
      .from('active_quizzes')
      .delete()
      .eq('script_id', scriptId)
      .eq('quiz_type', 'dictation')
    if (error) setSyncError(`진행 중 퀴즈 삭제 실패: ${toFriendlyDbError(error.message)}`)
  }

  const resumeDictation = (quiz: ActiveQuizRecord) => {
    setSelectedScriptId(quiz.scriptId)
    setDictationMode(quiz.mode)
    setDictationQuestions(quiz.state.questions)
    setAnswersById(quiz.state.answersById)
    setGradesByIndex(
      Object.fromEntries(
        Object.entries(quiz.state.gradesByIndex).map(([index, grade]) => [Number(index), grade]),
      ),
    )
    setDictationIndex(quiz.state.currentIndex)
    touchScript(quiz.scriptId)
    setScreen('dictation')
  }

  const startDictation = (mode: 'standard' | 'weak') => {
    if (!selectedScript || !selectedItems.length) return
    setStudyModalOpen(false)
    const weakWords = new Set(
      selectedWordStats
        .filter((stat) => stat.wrongCount > 0)
        .sort((a, b) => b.wrongCount - a.wrongCount)
        .map((stat) => stat.word),
    )
    const sourceIndexes =
      mode === 'weak' ? weakIndexesForSelected() : selectedItems.map((_, index) => index)
    const questions = sourceIndexes.map((index) =>
      makeDictationQuestion(selectedItems[index], index, weakWords, dictationBlankPercent),
    )
    const initialAnswers = createAnswers(questions)
    setDictationMode(mode)
    setDictationQuestions(questions)
    setAnswersById(initialAnswers)
    setGradesByIndex({})
    setDetailedResultSessionId(null)
    setDictationIndex(0)
    void upsertActiveDictation(selectedScript.id, mode, {
      questions,
      answersById: initialAnswers,
      gradesByIndex: {},
      currentIndex: 0,
    })
    touchScript(selectedScript.id)
    setScreen('dictation')
  }

  useEffect(() => {
    if (screen === 'flashcard' && selectedScript && selectedItems.length && !flashQueue.length) {
      setFlashQueue(selectedItems.map((_, index) => index))
      setFlashIndex(0)
      setFlashRevealed(false)
      setFlashUnknown([])
    }
    if (
      screen === 'dictation' &&
      selectedScript &&
      selectedItems.length &&
      !dictationQuestions.length
    ) {
      startDictation('standard')
    }
  }, [dictationQuestions.length, flashQueue.length, screen, selectedItems, selectedScript])

  const gradeCurrent = async () => {
    if (!currentQuestion || currentGrade || !selectedScript) return
    const grade = gradeQuestion(currentQuestion, answersById)
    const nextGrades = { ...gradesByIndex, [dictationIndex]: grade }
    await upsertSentenceStat(
      selectedScript.id,
      currentQuestion.item,
      currentQuestion.sourceIndex,
      (stat) => ({
        ...stat,
        dictationAttempts: stat.dictationAttempts + 1,
        dictationWrongCount: stat.dictationWrongCount + (grade.correct < grade.total ? 1 : 0),
        lastDictationAt: nowIso(),
      }),
    )
    if (grade.wrongWords.length) {
      await recordWords(selectedScript.id, grade.wrongWords, 'dictation')
    }
    setGradesByIndex(nextGrades)
    await upsertActiveDictation(selectedScript.id, dictationMode, {
      questions: dictationQuestions,
      answersById,
      gradesByIndex: Object.fromEntries(
        Object.entries(nextGrades).map(([index, itemGrade]) => [String(index), itemGrade]),
      ),
      currentIndex: dictationIndex,
    })
  }

  const saveDictationSession = async () => {
    if (!supabase || !user || !selectedScript) return null
    const grades = Object.values(gradesByIndex)
    const wrongWords = Array.from(new Set(grades.flatMap((grade) => grade.wrongWords)))
    const session: DictationSessionRecord = {
      id: makeId(),
      scriptId: selectedScript.id,
      mode: dictationMode,
      createdAt: nowIso(),
      totalQuestions: dictationQuestions.length,
      correctQuestions: grades.filter((grade) => grade.correct === grade.total).length,
      wrongQuestions: grades.filter((grade) => grade.correct < grade.total).length,
      wrongWords,
    }
    setStore((prev) => ({
      ...prev,
      dictationSessions: [session, ...prev.dictationSessions],
    }))
    const { error } = await supabase.from('dictation_sessions').insert({
      id: session.id,
      owner_id: user.id,
      script_id: session.scriptId,
      mode: session.mode,
      created_at: session.createdAt,
      total_questions: session.totalQuestions,
      correct_questions: session.correctQuestions,
      wrong_questions: session.wrongQuestions,
      wrong_words: session.wrongWords,
    })
    if (error) setSyncError(`받아쓰기 기록 저장 실패: ${toFriendlyDbError(error.message)}`)
    return session
  }

  const deleteDictationSession = async (session: DictationSessionRecord) => {
    if (!supabase) return
    const client = supabase
    if (!window.confirm('이 받아쓰기 기록을 삭제할까요? 기록된 취약 단어도 함께 조정됩니다.')) return

    const { error } = await client.from('dictation_sessions').delete().eq('id', session.id)
    if (error) {
      setSyncError(`받아쓰기 기록 삭제 실패: ${toFriendlyDbError(error.message)}`)
      return
    }

    const wordCounts = session.wrongWords.reduce<Record<string, number>>((acc, word) => {
      const normalized = normalizeWord(word)
      if (!normalized) return acc
      acc[normalized] = (acc[normalized] ?? 0) + 1
      return acc
    }, {})

    await Promise.all(
      Object.entries(wordCounts).map(async ([word, count]) => {
        const existing = (store.wordStatsByScript[session.scriptId] ?? []).find(
          (stat) => stat.source === 'dictation' && stat.word === word,
        )
        if (!existing) return
        const nextCount = existing.wrongCount - count
        if (nextCount <= 0) {
          await client
            .from('word_stats')
            .delete()
            .eq('script_id', session.scriptId)
            .eq('word', word)
            .eq('source', 'dictation')
          return
        }
        await client
          .from('word_stats')
          .update({ wrong_count: nextCount, updated_at: nowIso() })
          .eq('script_id', session.scriptId)
          .eq('word', word)
          .eq('source', 'dictation')
      }),
    )

    setStore((prev) => {
      const currentWords = prev.wordStatsByScript[session.scriptId] ?? []
      const nextWords = currentWords
        .map((stat) => {
          if (stat.source !== 'dictation') return stat
          const count = wordCounts[stat.word] ?? 0
          if (!count) return stat
          return { ...stat, wrongCount: stat.wrongCount - count, lastWrongAt: nowIso() }
        })
        .filter((stat) => stat.wrongCount > 0)

      return {
        ...prev,
        dictationSessions: prev.dictationSessions.filter((item) => item.id !== session.id),
        wordStatsByScript: {
          ...prev.wordStatsByScript,
          [session.scriptId]: nextWords,
        },
      }
    })
    if (selectedSessionId === session.id) {
      setSelectedSessionId(null)
      setScreen('script')
    }
  }

  const goNextDictation = async () => {
    if (!currentQuestion || !currentGrade) return
    if (dictationIndex >= dictationQuestions.length - 1) {
      setDictationIndex(dictationQuestions.length)
      const session = await saveDictationSession()
      if (selectedScript) await deleteActiveDictation(selectedScript.id)
      if (session) {
        setSelectedSessionId(session.id)
        setDetailedResultSessionId(session.id)
        setScreen('result')
      }
      return
    }
    const nextIndex = dictationIndex + 1
    setDictationIndex(nextIndex)
    if (selectedScript) {
      await upsertActiveDictation(selectedScript.id, dictationMode, {
        questions: dictationQuestions,
        answersById,
        gradesByIndex: Object.fromEntries(
          Object.entries(gradesByIndex).map(([index, grade]) => [String(index), grade]),
        ),
        currentIndex: nextIndex,
      })
    }
  }

  const moveDictationQuestion = (direction: -1 | 1) => {
    if (!dictationQuestions.length || isDictationDone) return
    setDictationIndex((prev) => clamp(prev + direction, 0, dictationQuestions.length - 1))
  }

  const handleBlankEnter = (blankId: string) => {
    if (!currentQuestion) return
    if (currentGrade) {
      void goNextDictation()
      return
    }
    const blanks = collectBlanks(currentQuestion)
    const index = blanks.findIndex((blank) => blank.blankId === blankId)
    const next = blanks[index + 1]
    if (next) {
      inputRefs.current[next.blankId]?.focus()
      inputRefs.current[next.blankId]?.select()
      return
    }
    void gradeCurrent()
  }

  const saveCurrentDictationProgress = async () => {
    if (!selectedScript || !dictationQuestions.length) return
    await upsertActiveDictation(selectedScript.id, dictationMode, {
      questions: dictationQuestions,
      answersById,
      gradesByIndex: Object.fromEntries(
        Object.entries(gradesByIndex).map(([index, grade]) => [String(index), grade]),
      ),
      currentIndex: dictationIndex,
    })
  }

  const toggleBlankGrade = async (blank: BlankUnit) => {
    if (!selectedScript || !currentQuestion || !currentGrade) return
    const wasCorrect = Boolean(currentGrade.checkedById[blank.blankId])
    const nextCheckedById = {
      ...currentGrade.checkedById,
      [blank.blankId]: !wasCorrect,
    }
    const nextGrade = gradeFromCheckedBlanks(currentQuestion, nextCheckedById)
    const nextGrades = { ...gradesByIndex, [dictationIndex]: nextGrade }
    const wasWrongSentence = currentGrade.correct < currentGrade.total
    const isWrongSentence = nextGrade.correct < nextGrade.total

    setGradesByIndex(nextGrades)

    await adjustWordStat(
      selectedScript.id,
      blank.answer,
      'dictation',
      wasCorrect ? 1 : -1,
    )

    if (wasWrongSentence !== isWrongSentence) {
      await upsertSentenceStat(
        selectedScript.id,
        currentQuestion.item,
        currentQuestion.sourceIndex,
        (stat) => ({
          ...stat,
          dictationWrongCount: Math.max(
            0,
            stat.dictationWrongCount + (isWrongSentence ? 1 : -1),
          ),
        }),
      )
    }

    await upsertActiveDictation(selectedScript.id, dictationMode, {
      questions: dictationQuestions,
      answersById,
      gradesByIndex: Object.fromEntries(
        Object.entries(nextGrades).map(([index, grade]) => [String(index), grade]),
      ),
      currentIndex: dictationIndex,
    })
  }

  const resetCurrentAnswers = () => {
    if (!currentQuestion || currentGrade) return
    setAnswersById((prev) => {
      const next = { ...prev }
      collectBlanks(currentQuestion).forEach((blank) => {
        next[blank.blankId] = ''
      })
      return next
    })
  }

  if (!supabase) {
    return (
      <main className="center-page">
        <section className="auth-card">
          <img src="/logo/logo.png" alt="몰입 스터디" className="auth-logo" />
          <h1>Supabase 연결 필요</h1>
          <p className="muted">`.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 설정해 주세요.</p>
        </section>
      </main>
    )
  }

  if (!isAuthReady || isLoadingStore) {
    return (
      <main className="loading-screen">
        <aside className="loading-sidebar" aria-hidden="true">
          <div className="loading-brand">
            <img src="/logo/logo.png" alt="" />
            <span />
          </div>
          <div className="loading-nav-line wide" />
          <div className="loading-nav-line" />
          <div className="loading-nav-line short" />
          <div className="loading-account" />
        </aside>
        <section className="loading-workspace" aria-live="polite">
          <div className="loading-top">
            <div>
              <p className="eyebrow">Scripts</p>
              <h1>내 스크립트</h1>
            </div>
            <div className="loading-button" />
          </div>
          <div className="loading-grid">
            <article className="loading-preview main">
              <span />
              <strong />
              <p />
              <p className="short" />
            </article>
            <article className="loading-preview">
              <span />
              <strong />
              <p />
            </article>
          </div>
          <div className="loading-list">
            <div />
            <div />
            <div />
          </div>
          <p className="loading-caption">몰입 스크립트를 불러오는 중입니다.</p>
        </section>
      </main>
    )
  }

  if (!user || screen === 'auth') {
    return (
      <main className="center-page">
        <section className={`auth-card ${authMode === 'signup' ? 'signup-mode' : 'login-mode'}`}>
          <div className="auth-head">
            <img src="/logo/logo.png" alt="몰입 스터디" className="auth-logo" />
            <div>
              <p className="eyebrow">Molip Study</p>
              <h1>{authMode === 'login' ? '몰입 스크립트' : '계정 만들기'}</h1>
              <p className="muted">
                {authMode === 'login'
                  ? '아이디와 비밀번호로 학습 기록을 불러옵니다.'
                  : '아이디, 이메일, 비밀번호를 등록합니다.'}
              </p>
            </div>
          </div>

          <div className="auth-mode-tabs" role="tablist" aria-label="인증 모드">
            <button
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => {
                setAuthMode('login')
                setAuthError('')
                setAuthNotice('')
              }}
            >
              로그인
            </button>
            <button
              className={authMode === 'signup' ? 'active' : ''}
              onClick={() => {
                setAuthMode('signup')
                setAuthError('')
                setAuthNotice('')
              }}
            >
              회원가입
            </button>
          </div>

          {authMode === 'signup' && (
            <div className="signup-note">
              <strong>회원가입 정보</strong>
              <span>이메일은 로그인과 계정 복구에 사용하고, 아이디는 서비스 안에서 표시됩니다.</span>
            </div>
          )}

          <label className="field">
            <span>아이디</span>
            <input
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="예: molip01"
            />
          </label>
          {authMode === 'signup' && (
            <label className="field">
              <span>이메일</span>
              <input
                value={signupEmail}
                onChange={(event) => setSignupEmail(event.target.value)}
                type="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="name@example.com"
              />
            </label>
          )}
          <label className="field">
            <span>비밀번호</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleAuth()
              }}
              type="password"
            />
          </label>
          {authError && <p className="error-text">{authError}</p>}
          {authNotice && <p className="notice-text">{authNotice}</p>}
          <button className="primary-btn full-btn" onClick={() => void handleAuth()}>
            {authMode === 'login' ? '로그인' : '회원가입'}
          </button>
        </section>
      </main>
    )
  }

  const closeMobileSidebar = () => setIsMobileSidebarOpen(false)

  const sidebarContent = (variant: 'desktop' | 'mobile') => (
    <>
      <button
        className="brand-button"
        onClick={() => {
          setScreen('home')
          closeMobileSidebar()
        }}
      >
        <img src="/logo/logo.png" alt="몰입 스터디" />
        <span>
          <small>Molip Study</small>
          몰입 스크립트
        </span>
      </button>
      <nav className="sidebar-nav">
        <button
          className={screen === 'home' ? 'active' : ''}
          onClick={() => {
            setScreen('home')
            closeMobileSidebar()
          }}
        >
          홈
        </button>
        <button
          onClick={() => {
            openEditor()
            closeMobileSidebar()
          }}
        >
          스크립트 추가
        </button>
      </nav>
      <details className="brand-links">
        <summary>몰입 스터디 서비스</summary>
        {BRAND_LINKS.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        ))}
      </details>
      <div className="account-box">
        <p>{displayLoginId(user)}</p>
        <button
          onClick={() => {
            closeMobileSidebar()
            void signOut()
          }}
        >
          로그아웃
        </button>
      </div>
      {variant === 'mobile' && (
        <button className="text-btn mobile-sidebar-close" onClick={closeMobileSidebar}>
          닫기
        </button>
      )}
    </>
  )

  const shell = (content: React.ReactNode) => (
    <div className="app-layout">
      <aside className="sidebar">{sidebarContent('desktop')}</aside>
      {isMobileSidebarOpen && (
        <div className="mobile-sidebar-backdrop" onClick={closeMobileSidebar}>
          <aside className="mobile-sidebar" onClick={(event) => event.stopPropagation()}>
            {sidebarContent('mobile')}
          </aside>
        </div>
      )}
      <main className="workspace">
        <header className="mobile-header">
          <button className="brand-button" onClick={() => setScreen('home')}>
            <img src="/logo/logo.png" alt="몰입 스터디" />
            <span>몰입 스크립트</span>
          </button>
          <button
            className="hamburger-btn"
            aria-label="사이드바 열기"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </header>
        {syncError && <p className="sync-error">{syncError}</p>}
        {content}
        {studyModalOpen && selectedScript && (
          <div className="modal-backdrop" onClick={() => setStudyModalOpen(false)}>
            <section className="study-modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-head">
                <div>
                  <p className="eyebrow">Study</p>
                  <h2>학습 선택</h2>
                </div>
                <button className="text-btn modal-close" onClick={() => setStudyModalOpen(false)}>
                  닫기
                </button>
              </div>

              <div className="study-type-tabs" role="tablist" aria-label="학습 종류">
                <button
                  className={studyKind === 'flashcard' ? 'active' : ''}
                  onClick={() => setStudyKind('flashcard')}
                >
                  플래시카드
                </button>
                <button
                  className={studyKind === 'dictation' ? 'active' : ''}
                  onClick={() => setStudyKind('dictation')}
                >
                  받아쓰기
                </button>
              </div>

              <div className="study-settings">
                <label className="check-line">
                  <input
                    type="checkbox"
                    checked={weakOnly}
                    onChange={(event) => setWeakOnly(event.target.checked)}
                  />
                  취약 문장 연습
                </label>
                {studyKind === 'flashcard' ? (
                  <label className="check-line">
                    <input
                      type="checkbox"
                      checked={trackFlashWords}
                      onChange={(event) => setTrackFlashWords(event.target.checked)}
                    />
                    X 선택 후 어려운 단어 기록
                  </label>
                ) : (
                  <>
                    <label className="slider-field">
                      <span>
                        빈칸 비율
                        <strong>{dictationBlankPercent}%</strong>
                      </span>
                      <input
                        type="range"
                        min="30"
                        max="100"
                        step="10"
                        value={dictationBlankPercent}
                        onChange={(event) => setDictationBlankPercent(Number(event.target.value))}
                      />
                    </label>
                    <p className="setting-note">틀린 문장과 단어를 기록하고 취약 단어를 우선 빈칸 처리합니다.</p>
                  </>
                )}
              </div>

              <button
                className="primary-btn full-btn"
                onClick={() => {
                  if (studyKind === 'flashcard') startFlashcard()
                  else startDictation(weakOnly ? 'weak' : 'standard')
                }}
              >
                {studyKind === 'flashcard' ? '플래시카드 시작' : '받아쓰기 시작'}
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  )

  if (screen === 'home') {
    return shell(
      <section className="home-surface">
        <div className="page-top compact">
          <div>
            <p className="eyebrow">Scripts</p>
            <h1>내 스크립트</h1>
          </div>
          <button className="primary-btn" onClick={() => openEditor()}>
            스크립트 추가
          </button>
        </div>
        {!sortedScripts.length ? (
          <div className="empty-state">
            <h2>저장된 스크립트가 없습니다.</h2>
            <p>첫 스크립트를 추가하면 홈에는 스크립트 목록만 표시됩니다.</p>
          </div>
        ) : (
          <div className="script-list">
            {sortedScripts.map((script) => {
              const itemCount = parseItems(script.rawText).length
              return (
                <button key={script.id} className="script-row" onClick={() => openScript(script.id)}>
                  <span>
                    <strong>{script.title}</strong>
                    <small>
                      문장 {itemCount}개 · 최근 수정 {formatDateTime(script.updatedAt)}
                    </small>
                  </span>
                  <span className="row-arrow">›</span>
                </button>
              )
            })}
          </div>
        )}
      </section>,
    )
  }

  if (screen === 'editor') {
    return shell(
      <section className="editor-page">
        <div className="page-top">
          <div>
            <p className="eyebrow">Script Editor</p>
            <h1>{editingScriptId ? '스크립트 수정' : '스크립트 추가'}</h1>
          </div>
          <button onClick={() => setScreen(editingScriptId ? 'script' : 'home')}>취소</button>
        </div>
        <label className="field">
          <span>제목</span>
          <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>본문</span>
          <textarea
            value={draftRawText}
            onChange={(event) => setDraftRawText(event.target.value)}
            spellCheck={false}
            placeholder={'1. 한글 뜻\nEnglish sentence.\n\n2. 한글 뜻\nEnglish sentence.'}
          />
        </label>
        {draftError && <p className="error-text">{draftError}</p>}
        <div className="button-row">
          <button className="primary-btn" onClick={() => void saveScript()}>
            저장
          </button>
          {editingScriptId && (
            <button className="danger-btn" onClick={() => void deleteScript(editingScriptId)}>
              삭제
            </button>
          )}
        </div>
      </section>,
    )
  }

  if (screen === 'script' && selectedScript) {
    const weakWords = new Set(
      selectedWordStats.filter((stat) => stat.wrongCount > 0).map((stat) => stat.word),
    )
    return shell(
      <section className="script-detail-page">
        <div className="script-hero">
          <div>
            <button className="text-btn" onClick={() => setScreen('home')}>
              홈으로
            </button>
            <h1>{selectedScript.title}</h1>
            <p>문장 {selectedItems.length}개 · 최근 열람 {formatDateTime(selectedScript.lastOpenedAt)}</p>
          </div>
          <div className="script-actions">
            <button onClick={() => openEditor(selectedScript)}>스크립트 수정</button>
            <button className="primary-btn jumbo-btn" onClick={() => setStudyModalOpen(true)}>
              학습하기
            </button>
          </div>
        </div>

        {selectedActiveQuiz && (
          <section className="resume-banner">
            <div>
              <strong>진행 중인 받아쓰기가 있습니다.</strong>
              <span>
                {selectedActiveQuiz.mode === 'weak' ? '취약 문장 연습' : '전체 받아쓰기'} ·{' '}
                {Math.min(
                  selectedActiveQuiz.state.currentIndex + 1,
                  selectedActiveQuiz.state.questions.length,
                )}{' '}
                / {selectedActiveQuiz.state.questions.length} · 저장{' '}
                {formatDateTime(selectedActiveQuiz.updatedAt)}
              </span>
            </div>
            <div className="button-row">
              <button className="primary-btn" onClick={() => resumeDictation(selectedActiveQuiz)}>
                이어하기
              </button>
              <button onClick={() => void deleteActiveDictation(selectedScript.id)}>삭제</button>
            </div>
          </section>
        )}

        <section className="body-panel quiz-history-panel">
          <div className="panel-top">
            <div>
              <p className="eyebrow">Quiz History</p>
              <h2>퀴즈 내역</h2>
            </div>
            <span className="panel-count">{selectedScriptSessions.length}개</span>
          </div>
          {selectedScriptSessions.length ? (
            <div className="quiz-history-list">
              {selectedScriptSessions.map((session) => {
                const accuracy =
                  session.totalQuestions > 0
                    ? (session.correctQuestions / session.totalQuestions) * 100
                    : 0
                return (
                  <button
                    className="quiz-history-row"
                    key={session.id}
                    onClick={() => openDictationResult(session)}
                  >
                    <span className="quiz-history-main">
                      <strong>{formatDateTime(session.createdAt)}</strong>
                      <small>
                        {dictationModeLabel(session.mode)} · 정답률 {formatPercent(accuracy)}
                      </small>
                    </span>
                    <span className="quiz-history-stats">
                      <em>{session.correctQuestions}/{session.totalQuestions}</em>
                      <small>오답 {session.wrongQuestions} · 단어 {session.wrongWords.length}</small>
                    </span>
                    <span className="row-arrow">›</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="empty-state slim">
              <h2>아직 퀴즈 기록이 없습니다.</h2>
              <p>받아쓰기를 완료하면 이곳에 결과가 쌓입니다.</p>
            </div>
          )}
        </section>

        <section className="body-panel">
          <div className="panel-top">
            <h2>스크립트 본문</h2>
          </div>
          <div className="script-body">
            {selectedItems.map((item, index) => {
              const stat = selectedStats[sentenceKeyOf(item, index)]
              const isWeakSentence =
                Boolean(stat) &&
                (stat.dictationWrongCount > 0 || stat.flashcardUnknownCount > 0)
              return (
                <article
                  className={isWeakSentence ? 'weak-sentence' : ''}
                  key={`${item.number}-${item.english}`}
                >
                  <p>
                    {item.number}. {item.meaning}
                    {isWeakSentence && <span className="weak-badge">취약</span>}
                  </p>
                  <strong>{renderHighlightedSentence(item.english, weakWords)}</strong>
                </article>
              )
            })}
          </div>
        </section>
      </section>,
    )
  }

  if (screen === 'result' && selectedScript) {
    if (!selectedResultSession) {
      return shell(
        <section className="result-page">
          <div className="empty-state">
            <h2>퀴즈 결과를 찾을 수 없습니다.</h2>
            <p>삭제되었거나 아직 저장된 받아쓰기 기록이 없습니다.</p>
            <button className="primary-btn" onClick={() => setScreen('script')}>
              스크립트로 돌아가기
            </button>
          </div>
        </section>,
      )
    }

    const accuracy =
      selectedResultSession.totalQuestions > 0
        ? (selectedResultSession.correctQuestions / selectedResultSession.totalQuestions) * 100
        : 0
    const canShowSentenceDetails =
      detailedResultSessionId === selectedResultSession.id &&
      dictationQuestions.length === selectedResultSession.totalQuestions
    const finalWrongIndexes = canShowSentenceDetails
      ? dictationQuestions
          .map((_, index) => index)
          .filter((index) => {
            const grade = gradesByIndex[index]
            return grade && grade.correct < grade.total
          })
      : []

    return shell(
      <section className="result-page">
        <section className="result-hero">
          <div>
            <button className="text-btn" onClick={() => setScreen('script')}>
              스크립트로
            </button>
            <p className="eyebrow">Quiz Result</p>
            <h1>받아쓰기 결과</h1>
            <p>
              {selectedScript.title} · {dictationModeLabel(selectedResultSession.mode)} ·{' '}
              {formatDateTime(selectedResultSession.createdAt)}
            </p>
          </div>
          <div className="score-ring" aria-label={`정답률 ${formatPercent(accuracy)}`}>
            <span>{formatPercent(accuracy)}</span>
            <small>정답률</small>
          </div>
        </section>

        <section className="result-widgets" aria-label="퀴즈 요약">
          <article className="result-widget score">
            <span>점수</span>
            <strong>
              {selectedResultSession.correctQuestions}/{selectedResultSession.totalQuestions}
            </strong>
            <small>맞힌 문장</small>
          </article>
          <article className="result-widget">
            <span>틀린 문장</span>
            <strong>{selectedResultSession.wrongQuestions}</strong>
            <small>다시 확인할 문장</small>
          </article>
          <article className="result-widget">
            <span>틀린 단어</span>
            <strong>{selectedResultSession.wrongWords.length}</strong>
            <small>기록된 취약 단어</small>
          </article>
        </section>

        <section className="body-panel result-progress-panel">
          <div className="panel-top">
            <h2>학습 요약</h2>
            <strong>{formatPercent(accuracy)}</strong>
          </div>
          <div className="result-meter" aria-hidden="true">
            <span style={{ width: `${accuracy}%` }} />
          </div>
          <p>
            총 {selectedResultSession.totalQuestions}문장 중 {selectedResultSession.correctQuestions}문장을 맞혔고,
            {selectedResultSession.wrongQuestions}문장은 다시 연습이 필요합니다.
          </p>
        </section>

        <section className="body-panel">
          <div className="panel-top">
            <h2>틀린 단어</h2>
            <span className="panel-count">{selectedResultSession.wrongWords.length}개</span>
          </div>
          {selectedResultSession.wrongWords.length ? (
            <div className="wrong-word-cloud">
              {selectedResultSession.wrongWords.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </div>
          ) : (
            <p className="muted">기록된 틀린 단어가 없습니다.</p>
          )}
        </section>

        {!!finalWrongIndexes.length && (
          <section className="body-panel">
            <div className="panel-top">
              <h2>틀린 문장</h2>
              <span className="panel-count">{finalWrongIndexes.length}개</span>
            </div>
            <div className="wrong-list polished">
              {finalWrongIndexes.map((index) => {
                const question = dictationQuestions[index]
                const grade = gradesByIndex[index]
                return (
                  <article key={question.sentenceKey}>
                    <strong>
                      {question.item.number}. {question.item.meaning}
                    </strong>
                    <p>{questionSentence(question)}</p>
                    <small>틀린 단어: {grade.wrongWords.join(', ')}</small>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        <div className="result-actions">
          <button className="primary-btn" onClick={() => startDictation('weak')}>
            취약 문장 재시험
          </button>
          <button onClick={() => setScreen('script')}>스크립트 보기</button>
          <button className="danger-btn" onClick={() => void deleteDictationSession(selectedResultSession)}>
            결과 삭제
          </button>
        </div>
      </section>,
    )
  }

  if (screen === 'flashcard' && selectedScript) {
    const done = flashIndex >= flashQueue.length
    const sourceIndex = flashQueue[flashIndex]
    const item = selectedItems[sourceIndex]
    const pickerItem =
      pendingFlashIndex === null ? null : selectedItems[pendingFlashIndex] ?? null
    const pickerWords = pickerItem ? extractWords(pickerItem.english) : []

    return shell(
      <section className="study-page">
        <div className="study-header">
          <div className="study-header-actions">
            <button onClick={() => setStudyModalOpen(true)}>학습 선택</button>
            <button onClick={() => moveFlashcard(-1)} disabled={flashIndex <= 0 || wordPickerOpen || done}>
              이전
            </button>
          </div>
          <div>
            <strong>플래시카드</strong>
            <span>
              {Math.min(flashIndex + 1, flashQueue.length)} / {flashQueue.length}
            </span>
          </div>
          <div className="study-header-actions right">
            <button
              onClick={() => moveFlashcard(1)}
              disabled={flashIndex >= flashQueue.length - 1 || wordPickerOpen || done}
            >
              다음
            </button>
            <label className="toggle-line">
              <input
                type="checkbox"
                checked={trackFlashWords}
                onChange={(event) => setTrackFlashWords(event.target.checked)}
              />
              단어 기록
            </label>
          </div>
        </div>

        {done ? (
          <section className="result-card">
            <h1>플래시카드 완료</h1>
            <p>모르는 카드 {flashUnknown.length}개를 기록했습니다.</p>
            <div className="button-row">
              <button className="primary-btn" onClick={startFlashcard}>
                다시 학습
              </button>
              <button onClick={() => setScreen('script')}>스크립트로</button>
            </div>
          </section>
        ) : (
          item && (
            <>
              <button className="flashcard" onClick={() => setFlashRevealed((prev) => !prev)}>
                <span>{item.number}번</span>
                <strong>{item.meaning}</strong>
                {flashRevealed && <em>{item.english}</em>}
              </button>
              <div className="study-actions">
                <button className="danger-btn big-round" onClick={() => void advanceFlashcard(false)}>
                  X
                </button>
                <button className="success-btn big-round" onClick={() => void advanceFlashcard(true)}>
                  O
                </button>
              </div>
            </>
          )
        )}

        {wordPickerOpen && (
          <div className="modal-backdrop">
            <section className="word-modal">
              <h2>어려웠던 단어 선택</h2>
              <p>{pickerItem?.english}</p>
              <div className="word-chip-grid">
                {pickerWords.map((word) => (
                  <button
                    key={word}
                    className={selectedWords.has(word) ? 'selected' : ''}
                    onClick={() =>
                      setSelectedWords((prev) => {
                        const next = new Set(prev)
                        if (next.has(word)) next.delete(word)
                        else next.add(word)
                        return next
                      })
                    }
                  >
                    {word}
                  </button>
                ))}
              </div>
              <div className="button-row">
                <button className="primary-btn" onClick={() => void closeWordPicker(true)}>
                  기록
                </button>
                <button onClick={() => void closeWordPicker(false)}>넘기기</button>
              </div>
            </section>
          </div>
        )}
      </section>,
    )
  }

  if (screen === 'dictation' && selectedScript) {
    const total = dictationQuestions.length
    const blanks = currentQuestion ? collectBlanks(currentQuestion) : []
    const finalWrongIndexes = dictationQuestions
      .map((_, index) => index)
      .filter((index) => {
        const grade = gradesByIndex[index]
        return grade && grade.correct < grade.total
      })

    return shell(
      <section className="dictation-page">
        <div className="study-header">
          <button
            onClick={() => moveDictationQuestion(-1)}
            disabled={dictationIndex <= 0 || isDictationDone}
          >
            이전 문장
          </button>
          <div>
            <strong>받아쓰기</strong>
            <span>
              진행 {Math.min(dictationIndex + 1, total)} / {total} · 정답 {correctCount} · 오답 {wrongCount} · 남은{' '}
              {Math.max(0, total - solvedCount)}
            </span>
          </div>
          <button
            onClick={() => moveDictationQuestion(1)}
            disabled={dictationIndex >= total - 1 || isDictationDone}
          >
            다음 문장
          </button>
        </div>

        {isDictationDone ? (
          <section className="result-card">
            <h1>받아쓰기 완료</h1>
            <p>
              정답 {correctCount}개 · 오답 {wrongCount}개 · 기록된 취약 단어{' '}
              {Array.from(new Set(Object.values(gradesByIndex).flatMap((grade) => grade.wrongWords))).length}
              개
            </p>
            {!!finalWrongIndexes.length && (
              <div className="wrong-list">
                {finalWrongIndexes.map((index) => {
                  const question = dictationQuestions[index]
                  const grade = gradesByIndex[index]
                  return (
                    <article key={question.sentenceKey}>
                      <strong>
                        {question.item.number}. {question.item.meaning}
                      </strong>
                      <p>{questionSentence(question)}</p>
                      <small>틀린 단어: {grade.wrongWords.join(', ')}</small>
                    </article>
                  )
                })}
              </div>
            )}
            <div className="button-row">
              <button className="primary-btn" onClick={() => startDictation('weak')}>
                취약 문장 재시험
              </button>
              <button onClick={() => setScreen('script')}>스크립트로</button>
            </div>
          </section>
        ) : (
          currentQuestion && (
            <section className="question-card">
              <div className="question-top">
                <p>
                  {currentQuestion.item.number}. {currentQuestion.item.meaning}
                </p>
                {currentGrade && (
                  <strong>
                    이번 문장 {currentGrade.correct} / {currentGrade.total}
                  </strong>
                )}
              </div>
              <div className="sentence-line">
                {currentQuestion.units.map((unit, index) => {
                  if (unit.kind === 'text') {
                    return <span key={`${unit.token}-${index}`}>{unit.token}</span>
                  }
                  const status = currentGrade
                    ? currentGrade.checkedById[unit.blankId]
                      ? 'correct'
                      : 'wrong'
                    : ''
                  return (
                    <span className="blank-wrap" key={unit.blankId}>
                      {unit.prefix}
                      <input
                        ref={(node) => {
                          inputRefs.current[unit.blankId] = node
                        }}
                        className={status}
                        style={{ width: `${unit.width}px` }}
                        value={answersById[unit.blankId] ?? ''}
                        readOnly={Boolean(currentGrade)}
                        title={currentGrade ? '클릭하면 정답/오답을 바꿉니다.' : undefined}
                        aria-label={
                          currentGrade
                            ? `${unit.answer} 정답 오답 전환`
                            : `${unit.answer.length}글자 빈칸`
                        }
                        onChange={(event) =>
                          setAnswersById((prev) => ({
                            ...prev,
                            [unit.blankId]: event.target.value,
                          }))
                        }
                        onClick={() => {
                          if (currentGrade) void toggleBlankGrade(unit)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            handleBlankEnter(unit.blankId)
                          }
                        }}
                      />
                      {unit.suffix}
                      {currentGrade && !currentGrade.checkedById[unit.blankId] && (
                        <small onClick={() => void toggleBlankGrade(unit)}>{unit.answer}</small>
                      )}
                    </span>
                  )
                })}
              </div>
              <div className="button-row">
                <button
                  className="primary-btn"
                  onClick={currentGrade ? () => void goNextDictation() : () => void gradeCurrent()}
                >
                  {currentGrade ? '다음' : '채점'}
                </button>
                <button onClick={resetCurrentAnswers} disabled={Boolean(currentGrade) || !blanks.length}>
                  초기화
                </button>
                <button
                  onClick={() => {
                    void saveCurrentDictationProgress().then(() => setScreen('script'))
                  }}
                >
                  나가기
                </button>
              </div>
            </section>
          )
        )}
      </section>,
    )
  }

  return shell(
    <section className="empty-state">
      <h2>화면을 찾을 수 없습니다.</h2>
      <button className="primary-btn" onClick={() => setScreen('home')}>
        홈으로
      </button>
    </section>,
  )
}

export default App
