import { lazy, Suspense } from 'react'
import './styles/app.css'
import { useAppController } from './model/useAppController'
import { AuthPage, AppLoadingPage, SupabaseSetupPage } from '../pages/auth'
import { StudySettingsDialog } from '../features/learning-settings'
import { AppShell } from '../widgets/navigation'
import { LoadingSkeleton } from '../shared/ui'

const CommunityPage = lazy(() => import('../pages/community').then((module) => ({ default: module.CommunityPage })))
const DictationPage = lazy(() => import('../pages/dictation').then((module) => ({ default: module.DictationPage })))
const FlashcardPage = lazy(() => import('../pages/flashcard').then((module) => ({ default: module.FlashcardPage })))
const HistoryPage = lazy(() => import('../pages/history').then((module) => ({ default: module.HistoryPage })))
const HomePage = lazy(() => import('../pages/home').then((module) => ({ default: module.HomePage })))
const ProfilePage = lazy(() => import('../pages/profile').then((module) => ({ default: module.ProfilePage })))
const ResultPage = lazy(() => import('../pages/result').then((module) => ({ default: module.ResultPage })))
const ScriptEditorPage = lazy(() => import('../pages/editor').then((module) => ({ default: module.ScriptEditorPage })))
const ScriptPage = lazy(() => import('../pages/script').then((module) => ({ default: module.ScriptPage })))

function App() {
  const {
    hasSupabase,
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
  } = useAppController()

  if (!hasSupabase) return <SupabaseSetupPage />

  if (!isAuthReady || isLoadingStore) {
    const loadingRoute = window.location.pathname.split('/').filter(Boolean)
    const loadingView = loadingRoute[0] === 'community' && loadingRoute[1] ? 'script' : (loadingRoute[1] || loadingRoute[0] || 'home')
    return <AppLoadingPage view={loadingView} />
  }

  if (!user || screen === 'auth') {
    return (
      <AuthPage
        mode={authMode}
        loginId={loginId}
        email={signupEmail}
        password={password}
        error={authError}
        notice={authNotice}
        onModeChange={(mode) => {
          setAuthMode(mode)
          setAuthError('')
          setAuthNotice('')
        }}
        onLoginIdChange={setLoginId}
        onEmailChange={setSignupEmail}
        onPasswordChange={setPassword}
        onSubmit={handleAuth}
      />
    )
  }

  const shell = (content: React.ReactNode) => (
    <AppShell
      screen={screen}
      user={user}
      syncError={syncError}
      onNavigate={navigateMain}
      onAddScript={() => openEditor()}
      onOpenCommunity={() => {
        setSelectedCommunityId(null)
        setCommunityNotice('')
        void navigateMain('community')
      }}
      onSignOut={signOut}
      studyDialog={studyModalOpen && selectedScript ? (
        <StudySettingsDialog
          script={selectedScript}
          sentenceCount={selectedItems.length}
          kind={studyKind}
          scope={studyScope}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          blankPercent={dictationBlankPercent}
          trackWords={trackFlashWords}
          error={studyError}
          onClose={() => setStudyModalOpen(false)}
          onKindChange={setStudyKind}
          onScopeChange={(scope) => {
            setStudyScope(scope)
            setStudyError('')
          }}
          onRangeStartChange={setRangeStart}
          onRangeEndChange={setRangeEnd}
          onBlankPercentChange={setDictationBlankPercent}
          onTrackWordsChange={setTrackFlashWords}
          onStart={async () => {
            if (studyKind === 'flashcard') await startFlashcard()
            else await startDictation(modeForScope(studyScope))
          }}
        />
      ) : undefined}
    >
      <Suspense fallback={<LoadingSkeleton view={screen} />}>{content}</Suspense>
    </AppShell>
  )

  if (screen === 'profile') {
    return shell(<ProfilePage user={user} store={store} onSignOut={signOut} />)
  }

  if (screen === 'home') {
    return shell(
      <HomePage
        scripts={sortedScripts}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onAddScript={() => openEditor()}
        onOpenScript={openScript}
      />,
    )
  }

  if (screen === 'community') {
    return shell(
      <CommunityPage
        userId={user.id}
        scripts={communityScripts}
        libraryScripts={sortedScripts}
        selected={selectedCommunityScript}
        selectedId={selectedCommunityId}
        query={communityQuery}
        notice={communityNotice}
        loading={communityLoading}
        busy={communityBusy}
        sharePickerOpen={sharePickerOpen}
        showMeaning={showMeaning}
        onSelect={setSelectedCommunityId}
        onQueryChange={setCommunityQuery}
        onSharePickerChange={setSharePickerOpen}
        onShowMeaningChange={setShowMeaning}
        onShare={shareScript}
        onUnshare={unshareScript}
        onCopy={copyCommunityScript}
      />,
    )
  }

  if (screen === 'editor') {
    return shell(
      <ScriptEditorPage
        editing={Boolean(editingScriptId)}
        title={draftTitle}
        rawText={draftRawText}
        error={draftError}
        onTitleChange={setDraftTitle}
        onRawTextChange={setDraftRawText}
        onCancel={() => setScreen(editingScriptId ? 'script' : 'home')}
        onSave={saveScript}
        onDelete={editingScriptId ? () => void deleteScript(editingScriptId) : undefined}
      />,
    )
  }

  if (screen === 'script' && selectedScript) {
    return shell(
      <ScriptPage
        script={selectedScript}
        items={selectedItems}
        stats={selectedStats}
        wordStats={selectedWordStats}
        historyCount={selectedScriptSessions.length + selectedFlashcardSessions.length}
        activeLearnings={selectedActiveLearnings}
        showMeaning={showMeaning}
        onBack={() => setScreen('home')}
        onEdit={() => openEditor(selectedScript)}
        onOpenHistory={() => setScreen('history')}
        onOpenStudy={() => setStudyModalOpen(true)}
        onShowMeaningChange={setShowMeaning}
        onResume={(learning) => learning.quizType === 'dictation' ? resumeDictation(learning) : resumeFlashcard(learning)}
        onDeleteActive={(quizType) => deleteActiveLearning(selectedScript.id, quizType)}
        onToggleStar={toggleSentenceStar}
      />,
    )
  }

  if (screen === 'history' && selectedScript) {
    return shell(
      <HistoryPage
        script={selectedScript}
        dictationSessions={selectedScriptSessions}
        flashcardSessions={selectedFlashcardSessions}
        onBack={() => setScreen('script')}
        onNewStudy={() => setStudyModalOpen(true)}
        onOpenDictation={openDictationResult}
      />,
    )
  }

  if (screen === 'result' && selectedScript) {
    return shell(
      <ResultPage
        script={selectedScript}
        session={selectedResultSession}
        questions={dictationQuestions}
        grades={gradesByIndex}
        stats={selectedStats}
        showDetails={Boolean(selectedResultSession && detailedResultSessionId === selectedResultSession.id)}
        onBack={() => setScreen('script')}
        onRetryWrong={retryWrongDictation}
        onDelete={deleteDictationSession}
        onToggleStar={toggleSentenceStar}
      />,
    )
  }

  if (screen === 'flashcard' && selectedScript) {
    return shell(
      <FlashcardPage
        items={selectedItems}
        stats={selectedStats}
        queue={flashQueue}
        index={flashIndex}
        revealed={flashRevealed}
        unknownIndexes={flashUnknown}
        trackWords={trackFlashWords}
        wordPickerOpen={wordPickerOpen}
        pendingIndex={pendingFlashIndex}
        selectedWords={selectedWords}
        onBack={() => void saveActiveFlashcard(flashcardState()).then((saved) => { if (saved) setScreen('script') })}
        onOpenSettings={() => setStudyModalOpen(true)}
        onMove={moveFlashcard}
        onTrackWordsChange={async (checked) => {
          const saved = await saveActiveFlashcard({ ...flashcardState(), trackWords: checked })
          if (saved) setTrackFlashWords(checked)
        }}
        onRestart={startFlashcard}
        onExit={() => setScreen('script')}
        onReveal={toggleFlashcardReveal}
        onAdvance={advanceFlashcard}
        onToggleStar={toggleSentenceStar}
        onToggleWord={(word) => setSelectedWords((previous) => {
          const next = new Set(previous)
          if (next.has(word)) next.delete(word)
          else next.add(word)
          return next
        })}
        onCloseWordPicker={closeWordPicker}
      />,
    )
  }

  if (screen === 'dictation' && selectedScript) {
    return shell(
      <DictationPage
        questions={dictationQuestions}
        index={dictationIndex}
        answers={answersById}
        grades={gradesByIndex}
        stats={selectedStats}
        solvedCount={solvedCount}
        correctCount={correctCount}
        wrongCount={wrongCount}
        done={isDictationDone}
        onMove={moveDictationQuestion}
        onRetryWrong={retryWrongDictation}
        onExit={() => setScreen('script')}
        onToggleStar={toggleSentenceStar}
        onRegisterInput={registerDictationInput}
        onAnswerChange={(blankId, value) => setAnswersById((previous) => ({ ...previous, [blankId]: value }))}
        onToggleBlank={toggleBlankGrade}
        onBlankEnter={handleBlankEnter}
        onPrimary={currentGrade ? goNextDictation : gradeCurrent}
        onReset={resetCurrentAnswers}
        onSaveExit={async () => {
          await saveCurrentDictationProgress()
          setScreen('script')
        }}
      />,
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
