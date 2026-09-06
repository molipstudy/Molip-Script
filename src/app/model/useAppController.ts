import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../shared/api'
import type { Screen } from '../../shared/model/navigation'
import { parseAppPath, pathForScreen } from '../lib/routing'
import type { CommunityScript, CommunityScriptRow } from '../../entities/community'
import type {
  ActiveDictationState,
  ActiveFlashcardState,
  ActiveQuizRecord,
  ActiveQuizRow,
  BlankUnit,
  DictationGrade,
  DictationQuestion,
  DictationSessionDetail,
  DictationSessionRecord,
  DictationSessionRow,
  FlashcardSessionRecord,
  FlashcardSessionRow,
  LearningStore,
  StudyMode,
  StudyScope,
} from '../../entities/learning'
import { emptyStore, normalizeStore } from '../../entities/learning'
import type {
  QuizItem,
  ScriptRecord,
  ScriptRow,
  SentenceStat,
  SentenceStatRow,
  WordStat,
  WordStatRow,
} from '../../entities/script'
import { normalizeWord, parseItems, sentenceKeyOf } from '../../entities/script'
import {
  collectBlanks,
  createAnswers,
  gradeFromCheckedBlanks,
  gradeQuestion,
  makeDictationQuestion,
} from '../../features/dictation'
import {
  clamp,
  displayLoginId,
  errorMessageOf,
  isValidLoginId,
  makeId,
  normalizeLoginId,
  nowIso,
  sessionDetailStorageKey,
  toFriendlyDbError,
} from '../../shared/lib'

export function useAppController() {
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
  const [communityScripts, setCommunityScripts] = useState<CommunityScript[]>([])
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null)
  const [sharePickerOpen, setSharePickerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [communityQuery, setCommunityQuery] = useState('')
  const [communityLoading, setCommunityLoading] = useState(false)
  const [showMeaning, setShowMeaning] = useState(true)
  const [communityBusy, setCommunityBusy] = useState(false)
  const [communityNotice, setCommunityNotice] = useState('')

  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [detailedResultSessionId, setDetailedResultSessionId] = useState<string | null>(null)
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftRawText, setDraftRawText] = useState('')
  const [draftError, setDraftError] = useState('')

  const [studyModalOpen, setStudyModalOpen] = useState(false)
  const [studyError, setStudyError] = useState('')
  const [studyKind, setStudyKind] = useState<'flashcard' | 'dictation'>('flashcard')
  const [studyScope, setStudyScope] = useState<StudyScope>('all')
  const [rangeStart, setRangeStart] = useState(1)
  const [rangeEnd, setRangeEnd] = useState(1)
  const [dictationBlankPercent, setDictationBlankPercent] = useState(30)
  const [trackFlashWords, setTrackFlashWords] = useState(true)
  const [flashQueue, setFlashQueue] = useState<number[]>([])
  const [flashIndex, setFlashIndex] = useState(0)
  const [flashRevealed, setFlashRevealed] = useState(false)
  const [flashUnknown, setFlashUnknown] = useState<number[]>([])
  const [wordPickerOpen, setWordPickerOpen] = useState(false)
  const [pendingFlashIndex, setPendingFlashIndex] = useState<number | null>(null)
  const [selectedWords, setSelectedWords] = useState<Set<string>>(() => new Set())

  const [dictationQuestions, setDictationQuestions] = useState<DictationQuestion[]>([])
  const [answersById, setAnswersById] = useState<Record<string, string>>({})
  const [gradesByIndex, setGradesByIndex] = useState<Record<number, DictationGrade>>({})
  const [dictationIndex, setDictationIndex] = useState(0)
  const [dictationMode, setDictationMode] = useState<StudyMode>('standard')
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const dictationNavigationRef = useRef<(direction: -1 | 1) => void>(() => undefined)
  const hasAppliedInitialRoute = useRef(false)

  const selectedScript = store.scripts.find((script) => script.id === selectedScriptId) ?? null
  const selectedScriptSessions = selectedScript
    ? store.dictationSessions.filter((session) => session.scriptId === selectedScript.id)
    : []
  const selectedFlashcardSessions = selectedScript
    ? store.flashcardSessions.filter((session) => session.scriptId === selectedScript.id)
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
  const selectedActiveLearnings = selectedScript
    ? store.activeQuizzes.filter((quiz) => quiz.scriptId === selectedScript.id)
    : []
  const selectedActiveDictation = selectedActiveLearnings.find((quiz) => quiz.quizType === 'dictation') ?? null
  const selectedActiveFlashcard = selectedActiveLearnings.find((quiz) => quiz.quizType === 'flashcard') ?? null
  const sortedScripts = useMemo(
    () => [...store.scripts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [store.scripts],
  )
  const selectedCommunityScript =
    communityScripts.find((script) => script.id === selectedCommunityId) ?? null
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

      let needsSchemaUpgrade = false
      const sentenceResult = await supabase
        .from('sentence_stats')
        .select(
          'script_id,sentence_key,number,meaning,english,flashcard_unknown_count,dictation_attempts,dictation_wrong_count,starred,last_studied_at,last_dictation_at',
        )
      let sentenceRows: SentenceStatRow[] = []
      if (sentenceResult.error && /starred|column/i.test(sentenceResult.error.message)) {
        needsSchemaUpgrade = true
        const legacySentenceResult = await supabase
          .from('sentence_stats')
          .select('script_id,sentence_key,number,meaning,english,flashcard_unknown_count,dictation_attempts,dictation_wrong_count,last_studied_at,last_dictation_at')
        if (legacySentenceResult.error) throw legacySentenceResult.error
        sentenceRows = (legacySentenceResult.data ?? []).map((row) => ({
          ...row,
          starred: false,
        })) as SentenceStatRow[]
      } else {
        if (sentenceResult.error) throw sentenceResult.error
        sentenceRows = (sentenceResult.data ?? []) as SentenceStatRow[]
      }

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

      const flashcardResult = await supabase
        .from('flashcard_sessions')
        .select('id,script_id,created_at,total_cards,unknown_cards,tracked_words')
        .order('created_at', { ascending: false })
      if (flashcardResult.error) throw flashcardResult.error

      const activeQuizResult = await supabase
        .from('active_quizzes')
        .select('id,script_id,quiz_type,mode,state,progress,updated_at')
        .order('updated_at', { ascending: false })
      let activeQuizRows: ActiveQuizRow[] = []
      if (activeQuizResult.error && /progress|column/i.test(activeQuizResult.error.message)) {
        needsSchemaUpgrade = true
        const legacyActiveResult = await supabase
          .from('active_quizzes')
          .select('id,script_id,quiz_type,mode,state,updated_at')
          .order('updated_at', { ascending: false })
        if (legacyActiveResult.error) throw legacyActiveResult.error
        activeQuizRows = (legacyActiveResult.data ?? []).map((row) => {
          const state = row.state as Partial<ActiveDictationState>
          return {
            ...row,
            progress: Math.max(
              (state.currentIndex ?? -1) + 1,
              Object.keys(state.gradesByIndex ?? {}).length,
            ),
          }
        }) as ActiveQuizRow[]
      } else {
        if (activeQuizResult.error) throw activeQuizResult.error
        activeQuizRows = (activeQuizResult.data ?? []) as ActiveQuizRow[]
      }

      setStore(
        normalizeStore(
          (scriptsResult.data ?? []) as ScriptRow[],
          sentenceRows,
          (wordResult.data ?? []) as WordStatRow[],
          (dictationResult.data ?? []) as DictationSessionRow[],
          (flashcardResult.data ?? []) as FlashcardSessionRow[],
          activeQuizRows,
        ),
      )
      setSyncError(needsSchemaUpgrade ? '새 학습 저장 기능을 사용하려면 learning-progress-upgrade.sql을 Supabase SQL Editor에서 한 번 실행해 주세요.' : '')
    } catch (error) {
      const message = errorMessageOf(error)
      setSyncError(`데이터 불러오기 실패: ${toFriendlyDbError(message)}`)
    } finally {
      setIsLoadingStore(false)
      setHasLoadedStore(true)
    }
  }, [user])

  const loadCommunity = useCallback(async () => {
    if (!supabase || !user) return
    setCommunityLoading(true)
    try {
    const result = await supabase
      .from('community_scripts')
      .select('id,owner_id,owner_login_id,source_script_id,title,raw_text,shared_at')
      .order('shared_at', { ascending: false })
    if (result.error) {
      setSyncError(`커뮤니티 불러오기 실패: ${toFriendlyDbError(result.error.message)}`)
      return
    }
    setCommunityScripts(((result.data ?? []) as CommunityScriptRow[]).map((row) => ({
      id: row.id,
      ownerId: row.owner_id,
      ownerLoginId: row.owner_login_id,
      sourceScriptId: row.source_script_id,
      title: row.title,
      rawText: row.raw_text,
      sharedAt: row.shared_at,
    })))
    } catch {
      setSyncError('커뮤니티를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally { setCommunityLoading(false) }
  }, [user])

  useEffect(() => {
    if (screen === 'community' && user) void loadCommunity()
  }, [screen, user, loadCommunity])

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
    setRangeStart(1)
    setRangeEnd(Math.max(1, selectedItems.length))
  }, [selectedScriptId, selectedItems.length])

  useEffect(() => {
    if (!user || !hasLoadedStore || isLoadingStore || hasAppliedInitialRoute.current) return
    const target = parseAppPath(window.location.pathname)
    hasAppliedInitialRoute.current = true
    if (target.screen === 'profile') { setScreen('profile'); return }
    if (target.screen === 'community') {
      setSelectedCommunityId(target.communityId ?? null)
      setScreen('community')
      return
    }
    if (!target.scriptId) return
    if (!store.scripts.some((script) => script.id === target.scriptId)) return
    setSelectedScriptId(target.scriptId)
    setSelectedSessionId(target.sessionId ?? null)
    setScreen(target.screen)
  }, [hasLoadedStore, isLoadingStore, store.scripts, user])

  useEffect(() => {
    if (!user || screen === 'auth' || screen === 'editor') return
    if (!hasAppliedInitialRoute.current) return
    const nextPath = pathForScreen(screen, selectedScriptId, selectedSessionId, selectedCommunityId)
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath)
    }
  }, [screen, selectedScriptId, selectedSessionId, selectedCommunityId, user])

  useEffect(() => {
    const handlePopState = () => {
      const target = parseAppPath(window.location.pathname)
      if (target.screen === 'profile') { setScreen('profile'); return }
      if (target.screen === 'community') {
        setSelectedScriptId(null)
        setSelectedSessionId(null)
        setSelectedCommunityId(target.communityId ?? null)
        setScreen('community')
        return
      }
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

  useEffect(() => {
    if (screen !== 'dictation' || isDictationDone || studyModalOpen) return
    const navigateDictation = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
      if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat) return
      if (document.querySelector('[role="dialog"]') || document.querySelector('.question-card [aria-busy="true"]')) return
      event.preventDefault()
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        dictationNavigationRef.current(event.key === 'ArrowUp' ? -1 : 1)
        return
      }
      if (!currentQuestion) return
      const blanks = collectBlanks(currentQuestion)
      const activeIndex = blanks.findIndex((blank) => inputRefs.current[blank.blankId] === document.activeElement)
      const direction = event.key === 'ArrowLeft' ? -1 : 1
      const nextIndex = activeIndex < 0
        ? (direction === 1 ? 0 : blanks.length - 1)
        : Math.max(0, Math.min(blanks.length - 1, activeIndex + direction))
      const nextBlank = blanks[nextIndex]
      const input = nextBlank ? inputRefs.current[nextBlank.blankId] : null
      input?.focus()
      input?.select()
    }
    window.addEventListener('keydown', navigateDictation)
    return () => window.removeEventListener('keydown', navigateDictation)
  }, [screen, isDictationDone, studyModalOpen, currentQuestion])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [screen, selectedCommunityId])

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

  const saveDictationSessionDetail = (
    sessionId: string,
    questions: DictationQuestion[],
    grades: Record<number, DictationGrade>,
  ) => {
    const detail: DictationSessionDetail = {
      questions,
      gradesByIndex: Object.fromEntries(
        Object.entries(grades).map(([index, grade]) => [String(index), grade]),
      ),
    }
    localStorage.setItem(sessionDetailStorageKey(sessionId), JSON.stringify(detail))
  }

  const loadDictationSessionDetail = (session: DictationSessionRecord) => {
    const raw = localStorage.getItem(sessionDetailStorageKey(session.id))
    if (!raw) return false
    try {
      const detail = JSON.parse(raw) as DictationSessionDetail
      if (!Array.isArray(detail.questions) || detail.questions.length !== session.totalQuestions) {
        return false
      }
      setDictationMode(session.mode === 'weak' ? 'weak' : 'standard')
      setDictationQuestions(detail.questions)
      setAnswersById(createAnswers(detail.questions))
      setGradesByIndex(
        Object.fromEntries(
          Object.entries(detail.gradesByIndex ?? {}).map(([index, grade]) => [Number(index), grade]),
        ),
      )
      setDictationIndex(detail.questions.length)
      setDetailedResultSessionId(session.id)
      return true
    } catch {
      localStorage.removeItem(sessionDetailStorageKey(session.id))
      return false
    }
  }

  const openDictationResult = (session: DictationSessionRecord) => {
    setSelectedScriptId(session.scriptId)
    setSelectedSessionId(session.id)
    if (!loadDictationSessionDetail(session)) {
      setDetailedResultSessionId(null)
    }
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

  const shareScript = async (script: ScriptRecord) => {
    if (!supabase || !user) return
    setCommunityBusy(true)
    setCommunityNotice('')
    const timestamp = nowIso()
    const { error } = await supabase.from('community_scripts').insert({
      id: makeId(), owner_id: user.id, owner_login_id: displayLoginId(user),
      source_script_id: script.id, title: script.title, raw_text: script.rawText, shared_at: timestamp,
    })
    if (error) {
      setSyncError(error.code === '23505' ? '이미 공유 중인 스크립트입니다.' : `공유 실패: ${toFriendlyDbError(error.message)}`)
    }
    else {
      setSharePickerOpen(false)
      setCommunityNotice('스크립트를 커뮤니티에 공유했습니다.')
      await loadCommunity()
    }
    setCommunityBusy(false)
  }

  const unshareScript = async (shared: CommunityScript) => {
    if (!supabase || !user || shared.ownerId !== user.id) return
    if (!window.confirm('이 스크립트의 커뮤니티 공유를 취소할까요?')) return
    setCommunityBusy(true)
    const { error } = await supabase.from('community_scripts').delete().eq('id', shared.id)
    if (error) setSyncError(`공유 취소 실패: ${toFriendlyDbError(error.message)}`)
    else {
      setCommunityScripts((prev) => prev.filter((item) => item.id !== shared.id))
      setSelectedCommunityId(null)
      setCommunityNotice('커뮤니티 공유를 취소했습니다. 내 스크립트는 그대로 유지됩니다.')
    }
    setCommunityBusy(false)
  }

  const copyCommunityScript = async (shared: CommunityScript) => {
    if (!supabase || !user) return
    setCommunityBusy(true)
    const timestamp = nowIso()
    const scriptId = makeId()
    const { error } = await supabase.from('scripts').insert({
      id: scriptId, owner_id: user.id, title: shared.title, raw_text: shared.rawText,
      created_at: timestamp, updated_at: timestamp, last_opened_at: timestamp,
    })
    if (error) setSyncError(`내 계정으로 복사 실패: ${toFriendlyDbError(error.message)}`)
    else {
      setStore((prev) => ({ ...prev, scripts: [{
        id: scriptId, title: shared.title, rawText: shared.rawText, createdAt: timestamp,
        updatedAt: timestamp, lastOpenedAt: timestamp,
      }, ...prev.scripts] }))
      setSelectedScriptId(null)
      setSelectedCommunityId(null)
      setCommunityNotice('내 계정에 복사했습니다. 홈에서 학습할 수 있습니다.')
      setScreen('home')
    }
    setCommunityBusy(false)
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
      starred: false,
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
        starred: next.starred,
        last_studied_at: next.lastStudiedAt ?? null,
        last_dictation_at: next.lastDictationAt ?? null,
        updated_at: nowIso(),
      },
      { onConflict: 'owner_id,script_id,sentence_key' },
    )
    if (error) setSyncError(`문장 기록 저장 실패: ${toFriendlyDbError(error.message)}`)
  }

  const toggleSentenceStar = async (item: QuizItem, index: number) => {
    if (!supabase || !selectedScript) return
    const sentenceKey = sentenceKeyOf(item, index)
    const { data, error } = await supabase.rpc('toggle_sentence_star', {
      p_script_id: selectedScript.id,
      p_sentence_key: sentenceKey,
      p_number: item.number,
      p_meaning: item.meaning,
      p_english: item.english,
    })
    if (error) {
      setSyncError(`별표 저장 실패: ${toFriendlyDbError(error.message)} 최신 supabase.sql을 실행해 주세요.`)
      return
    }
    const starred = Boolean(data)
    setStore((prev) => {
      const bucket = prev.sentenceStatsByScript[selectedScript.id] ?? {}
      const current = bucket[sentenceKey] ?? {
        sentenceKey,
        number: item.number,
        meaning: item.meaning,
        english: item.english,
        flashcardUnknownCount: 0,
        dictationAttempts: 0,
        dictationWrongCount: 0,
        starred: false,
      }
      return {
        ...prev,
        sentenceStatsByScript: {
          ...prev.sentenceStatsByScript,
          [selectedScript.id]: { ...bucket, [sentenceKey]: { ...current, starred } },
        },
      }
    })
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

  const adjustWordStats = async (
    scriptId: string,
    source: 'dictation' | 'flashcard',
    deltasByWord: Record<string, number>,
  ) => {
    if (!supabase || !user) return
    const client = supabase
    const deltas = Object.entries(deltasByWord)
      .map(([word, delta]) => [normalizeWord(word), delta] as const)
      .filter(([word, delta]) => word && delta !== 0)
      .reduce<Record<string, number>>((acc, [word, delta]) => {
        acc[word] = (acc[word] ?? 0) + delta
        return acc
      }, {})
    const entries = Object.entries(deltas).filter(([, delta]) => delta !== 0)
    if (!entries.length) return

    const timestamp = nowIso()
    const current = store.wordStatsByScript[scriptId] ?? []
    const nextCounts = entries.map(([word, delta]) => {
      const existing = current.find((stat) => stat.word === word && stat.source === source)
      return { word, wrongCount: (existing?.wrongCount ?? 0) + delta }
    })

    setStore((prev) => {
      const bucket = [...(prev.wordStatsByScript[scriptId] ?? [])]
      nextCounts.forEach(({ word, wrongCount }) => {
        const targetIndex = bucket.findIndex(
          (stat) => stat.word === word && stat.source === source,
        )
        if (wrongCount <= 0) {
          if (targetIndex >= 0) bucket.splice(targetIndex, 1)
          return
        }
        const nextStat: WordStat = {
          word,
          source,
          wrongCount,
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

    await Promise.all(
      nextCounts.map(async ({ word, wrongCount }) => {
        if (wrongCount <= 0) {
          const { error } = await client
            .from('word_stats')
            .delete()
            .eq('script_id', scriptId)
            .eq('word', word)
            .eq('source', source)
          if (error) setSyncError(`단어 기록 저장 실패: ${toFriendlyDbError(error.message)}`)
          return
        }

        const { error } = await client.from('word_stats').upsert(
          {
            owner_id: user.id,
            script_id: scriptId,
            word,
            source,
            wrong_count: wrongCount,
            last_wrong_at: timestamp,
            updated_at: timestamp,
          },
          { onConflict: 'owner_id,script_id,word,source' },
        )
        if (error) setSyncError(`단어 기록 저장 실패: ${toFriendlyDbError(error.message)}`)
      }),
    )
  }

  const indexesForScope = (scope: StudyScope) => {
    if (scope === 'range') {
      const start = clamp(Math.min(rangeStart, rangeEnd), 1, selectedItems.length)
      const end = clamp(Math.max(rangeStart, rangeEnd), start, selectedItems.length)
      return selectedItems.map((_, index) => index).slice(start - 1, end)
    }

    if (scope === 'starred') {
      return selectedItems
        .map((item, index) => ({ index, stat: selectedStats[sentenceKeyOf(item, index)] }))
        .filter(({ stat }) => stat?.starred)
        .map(({ index }) => index)
    }

    if (scope === 'all') return selectedItems.map((_, index) => index)

    const weakKeys = new Set(
      Object.values(selectedStats)
        .filter((stat) => stat.dictationWrongCount > 0 || stat.flashcardUnknownCount > 0)
        .map((stat) => stat.sentenceKey),
    )
    const indexes = selectedItems
      .map((item, index) => ({ index, key: sentenceKeyOf(item, index) }))
      .filter(({ key }) => weakKeys.has(key))
      .map(({ index }) => index)
    return indexes
  }

  const modeForScope = (scope: StudyScope): StudyMode =>
    scope === 'all' ? 'standard' : scope

  const saveActiveLearning = async (
    quizType: 'dictation' | 'flashcard',
    scriptId: string,
    mode: StudyMode,
    state: ActiveDictationState | ActiveFlashcardState,
    progress: number,
    force = false,
  ): Promise<boolean> => {
    if (!supabase || !user) return false
    const existing = store.activeQuizzes.find(
      (quiz) => quiz.scriptId === scriptId && quiz.quizType === quizType,
    )
    const id = existing?.id ?? makeId()
    const { data, error } = await supabase.rpc('save_active_learning', {
      p_id: id,
      p_script_id: scriptId,
      p_quiz_type: quizType,
      p_mode: mode,
      p_state: state,
      p_progress: progress,
      p_force: force,
    })
    if (error) {
      setSyncError(`학습 진행 저장 실패: ${toFriendlyDbError(error.message)} 최신 supabase.sql을 실행해 주세요.`)
      return false
    }

    const result = (Array.isArray(data) ? data[0] : data) as
      | { saved: boolean; requires_confirmation: boolean; server_progress: number; server_updated_at: string }
      | null
    if (result?.requires_confirmation && !force) {
      const shouldReplace = window.confirm(
        `다른 창에 ${result.server_progress}번까지 저장된 학습이 있습니다. 현재 창의 ${progress}번 상태로 덮어쓰면 앞선 진행 기록이 줄어듭니다. 그래도 저장할까요?`,
      )
      if (!shouldReplace) {
        await loadStore()
        setSyncError('더 앞선 학습 기록을 유지했습니다. 스크립트에서 이어하기를 눌러 최신 기록을 불러오세요.')
        return false
      }
      return saveActiveLearning(quizType, scriptId, mode, state, progress, true)
    }
    if (!result?.saved) return false

    const record: ActiveQuizRecord = {
      id,
      scriptId,
      quizType,
      mode,
      state,
      progress,
      updatedAt: result.server_updated_at ?? nowIso(),
    }
    setStore((prev) => ({
      ...prev,
      activeQuizzes: [
        record,
        ...prev.activeQuizzes.filter(
          (quiz) => !(quiz.scriptId === scriptId && quiz.quizType === quizType),
        ),
      ],
    }))
    setSyncError('')
    return true
  }

  const deleteActiveLearning = async (scriptId: string, quizType: 'dictation' | 'flashcard') => {
    if (!supabase) return
    setStore((prev) => ({
      ...prev,
      activeQuizzes: prev.activeQuizzes.filter(
        (quiz) => !(quiz.scriptId === scriptId && quiz.quizType === quizType),
      ),
    }))
    const { error } = await supabase
      .from('active_quizzes')
      .delete()
      .eq('script_id', scriptId)
      .eq('quiz_type', quizType)
    if (error) setSyncError(`진행 중 학습 삭제 실패: ${toFriendlyDbError(error.message)}`)
  }

  const flashcardState = (
    currentIndex = flashIndex,
    revealed = flashRevealed,
    unknownIndexes = flashUnknown,
  ): ActiveFlashcardState => ({
    queue: flashQueue,
    currentIndex,
    revealed,
    unknownIndexes,
    trackWords: trackFlashWords,
  })

  const saveActiveFlashcard = async (
    state: ActiveFlashcardState,
    reset = false,
  ) => {
    if (!selectedScript) return false
    const progress = reset
      ? 1
      : Math.max(selectedActiveFlashcard?.progress ?? 0, state.currentIndex + 1)
    return saveActiveLearning('flashcard', selectedScript.id, modeForScope(studyScope), state, progress)
  }

  const startFlashcard = async () => {
    if (!selectedScript || !selectedItems.length) return
    const queue = indexesForScope(studyScope)
    if (!queue.length) {
      setStudyError(studyScope === 'starred' ? '별표 표시한 문장이 없습니다.' : '선택한 조건에 맞는 문장이 없습니다.')
      return
    }
    const state: ActiveFlashcardState = {
      queue,
      currentIndex: 0,
      revealed: false,
      unknownIndexes: [],
      trackWords: trackFlashWords,
    }
    if (!(await saveActiveFlashcard(state, true))) return
    setFlashQueue(queue)
    setFlashIndex(0)
    setFlashRevealed(false)
    setFlashUnknown([])
    setStudyModalOpen(false)
    touchScript(selectedScript.id)
    setScreen('flashcard')
  }

  const finishFlashcard = async (unknownIndexes = flashUnknown) => {
    if (!supabase || !user || !selectedScript) return
    const trackedWords = selectedWordStats
      .filter((stat) => stat.source === 'flashcard')
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 20)
      .map((stat) => stat.word)
    const session: FlashcardSessionRecord = {
      id: makeId(),
      scriptId: selectedScript.id,
      createdAt: nowIso(),
      totalCards: flashQueue.length,
      unknownCards: unknownIndexes.length,
      trackedWords,
    }
    const { error } = await supabase.from('flashcard_sessions').insert({
      id: session.id,
      owner_id: user.id,
      script_id: session.scriptId,
      created_at: session.createdAt,
      total_cards: session.totalCards,
      unknown_cards: session.unknownCards,
      tracked_words: session.trackedWords,
    })
    if (error) {
      setSyncError(`플래시카드 기록 저장 실패: ${toFriendlyDbError(error.message)}`)
      return
    }
    setStore((prev) => ({ ...prev, flashcardSessions: [session, ...prev.flashcardSessions] }))
    await deleteActiveLearning(selectedScript.id, 'flashcard')
  }

  const advanceFlashcard = async (known: boolean) => {
    if (!selectedScript) return
    const sourceIndex = flashQueue[flashIndex]
    const item = selectedItems[sourceIndex]
    if (!item) return

    const nextUnknown = !known && !flashUnknown.includes(sourceIndex)
      ? [...flashUnknown, sourceIndex]
      : flashUnknown

    if (!known) {
      setFlashUnknown(nextUnknown)
      await upsertSentenceStat(selectedScript.id, item, sourceIndex, (stat) => ({
        ...stat,
        flashcardUnknownCount: stat.flashcardUnknownCount + 1,
        lastStudiedAt: nowIso(),
      }))
      if (trackFlashWords) {
        await saveActiveFlashcard(flashcardState(flashIndex, flashRevealed, nextUnknown))
        setPendingFlashIndex(sourceIndex)
        setSelectedWords(new Set())
        setWordPickerOpen(true)
        return
      }
    }

    if (flashIndex >= flashQueue.length - 1) {
      await finishFlashcard(nextUnknown)
      setFlashIndex(flashQueue.length)
      return
    }
    const nextIndex = flashIndex + 1
    if (!(await saveActiveFlashcard(flashcardState(nextIndex, false, nextUnknown)))) return
    setFlashIndex(nextIndex)
    setFlashRevealed(false)
  }

  const moveFlashcard = async (direction: -1 | 1) => {
    if (!flashQueue.length || wordPickerOpen) return
    const nextIndex = clamp(flashIndex + direction, 0, flashQueue.length - 1)
    if (nextIndex === flashIndex) return
    if (!(await saveActiveFlashcard(flashcardState(nextIndex, false)))) return
    setFlashIndex(nextIndex)
    setFlashRevealed(false)
  }

  const toggleFlashcardReveal = async () => {
    const revealed = !flashRevealed
    if (!(await saveActiveFlashcard(flashcardState(flashIndex, revealed)))) return
    setFlashRevealed(revealed)
  }

  const closeWordPicker = async (save: boolean) => {
    if (save && selectedScript && selectedWords.size) {
      await recordWords(selectedScript.id, Array.from(selectedWords), 'flashcard')
    }
    if (flashIndex >= flashQueue.length - 1) {
      await finishFlashcard()
      setFlashIndex(flashQueue.length)
      setWordPickerOpen(false)
      setPendingFlashIndex(null)
      setSelectedWords(new Set())
      return
    }
    const nextIndex = flashIndex + 1
    if (!(await saveActiveFlashcard(flashcardState(nextIndex, false)))) return
    setWordPickerOpen(false)
    setPendingFlashIndex(null)
    setSelectedWords(new Set())
    setFlashIndex(nextIndex)
    setFlashRevealed(false)
  }

  const upsertActiveDictation = async (
    scriptId: string,
    mode: StudyMode,
    state: ActiveDictationState,
    reset = false,
  ) => {
    const progress = reset
      ? 1
      : Math.max(
          selectedActiveDictation?.progress ?? 0,
          Math.min(state.currentIndex + 1, state.questions.length),
          Object.keys(state.gradesByIndex).length,
        )
    return saveActiveLearning('dictation', scriptId, mode, state, progress)
  }

  const deleteActiveDictation = async (scriptId: string) => {
    await deleteActiveLearning(scriptId, 'dictation')
  }

  const resumeDictation = (quiz: ActiveQuizRecord) => {
    const state = quiz.state as ActiveDictationState
    setSelectedScriptId(quiz.scriptId)
    setDictationMode(quiz.mode)
    setDictationQuestions(state.questions)
    setAnswersById(state.answersById)
    setGradesByIndex(
      Object.fromEntries(
        Object.entries(state.gradesByIndex).map(([index, grade]) => [Number(index), grade]),
      ),
    )
    setDictationIndex(state.currentIndex)
    touchScript(quiz.scriptId)
    setScreen('dictation')
  }

  const resumeFlashcard = (quiz: ActiveQuizRecord) => {
    const state = quiz.state as ActiveFlashcardState
    setSelectedScriptId(quiz.scriptId)
    setStudyScope(quiz.mode === 'standard' ? 'all' : quiz.mode)
    setFlashQueue(state.queue)
    setFlashIndex(state.currentIndex)
    setFlashRevealed(state.revealed)
    setFlashUnknown(state.unknownIndexes ?? [])
    setTrackFlashWords(state.trackWords ?? true)
    touchScript(quiz.scriptId)
    setScreen('flashcard')
  }

  const startDictation = async (mode: StudyMode, retrySourceIndexes?: number[]) => {
    if (!selectedScript || !selectedItems.length) return
    const weakWords = new Set(
      selectedWordStats
        .filter((stat) => stat.wrongCount > 0)
        .sort((a, b) => b.wrongCount - a.wrongCount)
        .map((stat) => stat.word),
    )
    const sourceIndexes =
      retrySourceIndexes ??
      indexesForScope(mode === 'standard' ? 'all' : mode)
    if (!sourceIndexes.length) {
      setStudyError(mode === 'starred' ? '별표 표시한 문장이 없습니다.' : '선택한 조건에 맞는 문장이 없습니다.')
      return
    }
    const questions = sourceIndexes.map((index) =>
      makeDictationQuestion(selectedItems[index], index, weakWords, dictationBlankPercent),
    )
    const initialAnswers = createAnswers(questions)
    const state: ActiveDictationState = {
      questions,
      answersById: initialAnswers,
      gradesByIndex: {},
      currentIndex: 0,
    }
    if (!(await upsertActiveDictation(selectedScript.id, mode, state, true))) return
    setDictationMode(mode)
    setDictationQuestions(questions)
    setAnswersById(initialAnswers)
    setGradesByIndex({})
    setDetailedResultSessionId(null)
    setDictationIndex(0)
    setStudyModalOpen(false)
    touchScript(selectedScript.id)
    setScreen('dictation')
  }

  const retryWrongDictation = (wrongQuestionIndexes: number[]) => {
    const retrySourceIndexes = Array.from(
      new Set(
        wrongQuestionIndexes
          .map((index) => dictationQuestions[index]?.sourceIndex)
          .filter((index): index is number => typeof index === 'number'),
      ),
    )
    void startDictation('weak', retrySourceIndexes)
  }

  const initializeLearningFromRoute = useEffectEvent(() => {
    if (screen === 'dictation') {
      if (selectedActiveDictation) resumeDictation(selectedActiveDictation)
      else void startDictation('standard')
    }
    if (screen === 'flashcard') {
      if (selectedActiveFlashcard) resumeFlashcard(selectedActiveFlashcard)
      else void startFlashcard()
    }
  })

  useEffect(() => {
    if (!selectedScript || !selectedItems.length) return
    if (screen === 'flashcard' && !flashQueue.length) initializeLearningFromRoute()
    if (screen === 'dictation' && !dictationQuestions.length) initializeLearningFromRoute()
  }, [dictationQuestions.length, flashQueue.length, screen, selectedItems, selectedScript])

  const gradeCurrent = async () => {
    if (!currentQuestion || currentGrade || !selectedScript) return
    const grade = gradeQuestion(currentQuestion, answersById)
    const nextGrades = { ...gradesByIndex, [dictationIndex]: grade }
    if (!(await upsertActiveDictation(selectedScript.id, dictationMode, {
      questions: dictationQuestions,
      answersById,
      gradesByIndex: Object.fromEntries(
        Object.entries(nextGrades).map(([index, itemGrade]) => [String(index), itemGrade]),
      ),
      currentIndex: dictationIndex,
    }))) return
    const wordDeltas = collectBlanks(currentQuestion).reduce<Record<string, number>>((acc, blank) => {
      const word = normalizeWord(blank.answer)
      if (!word) return acc
      const isCorrect = Boolean(grade.checkedById[blank.blankId])
      const alreadyTracked = selectedWordStats.some(
        (stat) => stat.source === 'dictation' && stat.word === word && stat.wrongCount > 0,
      )
      if (!isCorrect || alreadyTracked) {
        acc[word] = (acc[word] ?? 0) + (isCorrect ? -1 : 1)
      }
      return acc
    }, {})
    await upsertSentenceStat(
      selectedScript.id,
      currentQuestion.item,
      currentQuestion.sourceIndex,
      (stat) => ({
        ...stat,
        dictationAttempts: stat.dictationAttempts + 1,
        dictationWrongCount: Math.max(
          0,
          stat.dictationWrongCount + (grade.correct < grade.total ? 1 : -1),
        ),
        lastDictationAt: nowIso(),
      }),
    )
    await adjustWordStats(selectedScript.id, 'dictation', wordDeltas)
    setGradesByIndex(nextGrades)
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
    saveDictationSessionDetail(session.id, dictationQuestions, gradesByIndex)
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
    localStorage.removeItem(sessionDetailStorageKey(session.id))
  }

  const goNextDictation = async () => {
    if (!currentQuestion || !currentGrade) return
    if (dictationIndex >= dictationQuestions.length - 1) {
      setDictationIndex(dictationQuestions.length)
      const session = await saveDictationSession()
      if (selectedScript) await deleteActiveDictation(selectedScript.id)
      if (session) {
        openDictationResult(session)
      }
      return
    }
    const nextIndex = dictationIndex + 1
    if (selectedScript) {
      if (!(await upsertActiveDictation(selectedScript.id, dictationMode, {
        questions: dictationQuestions,
        answersById,
        gradesByIndex: Object.fromEntries(
          Object.entries(gradesByIndex).map(([index, grade]) => [String(index), grade]),
        ),
        currentIndex: nextIndex,
      }))) return
    }
    setDictationIndex(nextIndex)
  }

  const moveDictationQuestion = async (direction: -1 | 1) => {
    if (!selectedScript || !dictationQuestions.length || isDictationDone) return
    const nextIndex = clamp(dictationIndex + direction, 0, dictationQuestions.length - 1)
    if (nextIndex === dictationIndex) return
    if (!(await upsertActiveDictation(selectedScript.id, dictationMode, {
      questions: dictationQuestions,
      answersById,
      gradesByIndex: Object.fromEntries(
        Object.entries(gradesByIndex).map(([index, grade]) => [String(index), grade]),
      ),
      currentIndex: nextIndex,
    }))) return
    setDictationIndex(nextIndex)
  }
  dictationNavigationRef.current = (direction) => void moveDictationQuestion(direction)

  const handleBlankEnter = (blankId: string) => {
    if (!currentQuestion) return
    if (currentGrade) {
      document.querySelector<HTMLButtonElement>('.question-card .primary-btn')?.click()
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
    document.querySelector<HTMLButtonElement>('.question-card .primary-btn')?.click()
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

  const navigateMain = async (nextScreen: 'home' | 'community' | 'profile') => {
    if (screen === 'dictation' && !isDictationDone) await saveCurrentDictationProgress()
    if (screen === 'flashcard' && flashQueue.length && flashIndex < flashQueue.length) {
      await saveActiveFlashcard(flashcardState())
    }
    if (nextScreen === 'community') { setSelectedCommunityId(null); setCommunityNotice('') }
    setScreen(nextScreen)
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

    if (!(await upsertActiveDictation(selectedScript.id, dictationMode, {
      questions: dictationQuestions,
      answersById,
      gradesByIndex: Object.fromEntries(
        Object.entries(nextGrades).map(([index, grade]) => [String(index), grade]),
      ),
      currentIndex: dictationIndex,
    }))) return

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

  const handleFlashcardShortcut = useEffectEvent((key: string) => {
    if (key === 'ArrowUp') void moveFlashcard(-1)
    if (key === 'ArrowDown') void moveFlashcard(1)
    if (key === 'ArrowLeft' && flashRevealed) {
      document.querySelector<HTMLButtonElement>('.review-btn')?.click()
    }
    if (key === 'ArrowRight' && flashRevealed) {
      document.querySelector<HTMLButtonElement>('.recall-btn')?.click()
    }
  })

  useEffect(() => {
    if (screen !== 'flashcard' || wordPickerOpen || studyModalOpen || flashIndex >= flashQueue.length) return
    const handleKey = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
      if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat) return
      if (document.querySelector('[role="dialog"]')) return
      event.preventDefault()
      handleFlashcardShortcut(event.key)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [screen, wordPickerOpen, studyModalOpen, flashIndex, flashQueue.length])

  const registerDictationInput = (blankId: string, node: HTMLInputElement | null) => {
    inputRefs.current[blankId] = node
  }

  return {
    hasSupabase: Boolean(supabase),
    screen,
    setScreen,
    user,
    authMode,
    setAuthMode,
    loginId,
    setLoginId,
    signupEmail,
    setSignupEmail,
    password,
    setPassword,
    authError,
    setAuthError,
    authNotice,
    setAuthNotice,
    isAuthReady,
    isLoadingStore,
    syncError,
    store,
    communityScripts,
    selectedCommunityId,
    setSelectedCommunityId,
    sharePickerOpen,
    setSharePickerOpen,
    searchQuery,
    setSearchQuery,
    communityQuery,
    setCommunityQuery,
    communityLoading,
    showMeaning,
    setShowMeaning,
    communityBusy,
    communityNotice,
    setCommunityNotice,
    editingScriptId,
    draftTitle,
    setDraftTitle,
    draftRawText,
    setDraftRawText,
    draftError,
    studyModalOpen,
    setStudyModalOpen,
    studyError,
    setStudyError,
    studyKind,
    setStudyKind,
    studyScope,
    setStudyScope,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
    dictationBlankPercent,
    setDictationBlankPercent,
    trackFlashWords,
    setTrackFlashWords,
    flashQueue,
    flashIndex,
    flashRevealed,
    flashUnknown,
    wordPickerOpen,
    pendingFlashIndex,
    selectedWords,
    setSelectedWords,
    dictationQuestions,
    answersById,
    setAnswersById,
    gradesByIndex,
    dictationIndex,
    registerDictationInput,
    selectedScript,
    selectedScriptSessions,
    selectedFlashcardSessions,
    selectedResultSession,
    detailedResultSessionId,
    selectedItems,
    selectedStats,
    selectedWordStats,
    selectedActiveLearnings,
    sortedScripts,
    selectedCommunityScript,
    currentGrade,
    isDictationDone,
    solvedCount,
    correctCount,
    wrongCount,
    handleAuth,
    signOut,
    navigateMain,
    openEditor,
    openScript,
    saveScript,
    deleteScript,
    shareScript,
    unshareScript,
    copyCommunityScript,
    modeForScope,
    startFlashcard,
    startDictation,
    resumeDictation,
    resumeFlashcard,
    deleteActiveLearning,
    toggleSentenceStar,
    openDictationResult,
    retryWrongDictation,
    deleteDictationSession,
    flashcardState,
    saveActiveFlashcard,
    moveFlashcard,
    toggleFlashcardReveal,
    advanceFlashcard,
    closeWordPicker,
    moveDictationQuestion,
    toggleBlankGrade,
    handleBlankEnter,
    goNextDictation,
    gradeCurrent,
    resetCurrentAnswers,
    saveCurrentDictationProgress,
  }
}
