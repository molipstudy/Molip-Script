import { parseAppPath } from './lib/routing'
import { useAccountProfile } from '../features/account-profile/model/useAccountProfile'
import { missingProfileFields } from '../features/account-profile/model/profile'
import { ErrorPage } from '../pages/error/ui/ErrorPage'
import { useAdminAccess } from '../features/admin-access/model/useAdminAccess'
import { PublisherPage } from '../pages/publisher/ui/PublisherPage'
import { ContinuePage } from '../pages/home/ui/ContinuePage'
import { useState, lazy, Suspense } from 'react'
import './styles/app.css'
import { InstallAppBanner } from '../features/install-app'
import { DashboardPage } from '../pages/home/ui/DashboardPage'
import { LandingPage } from '../pages/home/ui/LandingPage'
import { MaskingPage } from '../pages/masking/ui/MaskingPage'
import { Guide } from '../features/guide/Guide'
import { TRIAL_ID } from '../entities/script/model/trial'
import { useAppController } from './model/useAppController'
import { AuthPage, AppLoadingPage, SupabaseSetupPage } from '../pages/auth'
import { StudySettingsDialog } from '../features/learning-settings'
import { AppShell } from '../widgets/navigation'
import { AsyncButton, Icon, IconButton, LoadingSkeleton } from '../shared/ui'

const SupportPage = lazy(() => import('../pages/support/ui/SupportPage').then(module => ({ default: module.SupportPage })))
const AdminScriptPage = lazy(() => import('../pages/admin/ui/AdminScriptPage').then(module => ({ default: module.AdminScriptPage })))
const AdminPage = lazy(() => import('../pages/admin/ui/AdminPage').then(module => ({ default: module.AdminPage })))
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
    loginRequired, setLoginRequired, requestLogin, visibleTokens, setMaskTokens, recordMaskWords, maskingGrades,
    screen,
    setScreen,
    user, refreshAccountIdentity,
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
    publisherId, setPublisherId, adminMemberId, setAdminMemberId,
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
    draftExcludedWords,
    setDraftExcludedWords,
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
    selectedScript, selectedScriptId, copyScript,
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

  const account = useAccountProfile(user?.id ?? '')
  const [dismissedProfileUser, setDismissedProfileUser] = useState('')
  const missingProfile = account.profile ? missingProfileFields(account.profile) : []
  const admin = useAdminAccess(user?.id ?? '')

  if (!hasSupabase) return <SupabaseSetupPage />

  if (!isAuthReady || isLoadingStore) {
    const route = parseAppPath(window.location.pathname)
    const loadingView = route.adminMemberId ? 'admin-member' : route.communityId ? 'script' : route.screen === 'home' && !user ? 'about' : route.screen
    return <AppLoadingPage view={loadingView} />
  }

  const exitStudy = async () => {
    if (screen === 'dictation' && !isDictationDone) {
      const saved = await saveCurrentDictationProgress()
      if (!saved) return
    }
    if ((screen === 'flashcard' || screen === 'masking') && flashIndex < flashQueue.length) {
      const saved = await saveActiveFlashcard(flashcardState())
      if (!saved) return
    }
    setScreen('script')
  }
  const openStudySettings = () => {
    if (screen === 'flashcard' || screen === 'dictation' || screen === 'masking') setStudyKind(screen)
    setStudyModalOpen(true)
  }
  const mobileHeader = selectedScript && ['script', 'flashcard', 'masking', 'dictation'].includes(screen) ? (
    <>
      {screen === 'script' && <IconButton icon="back" label="내 스크립트로 돌아가기" onClick={() => void navigateMain(user ? 'library' : 'home')} />}
      <div className="mobile-page-title">
        {screen !== 'script' && <span>{screen === 'masking' ? '마스킹 학습' : screen === 'flashcard' ? '플래시카드' : '받아쓰기'}</span>}
        <h1 title={screen === 'script' ? undefined : selectedScript.title}>{screen === 'script' ? '스크립트 상세' : selectedScript.title}</h1>
      </div>
      <div className="mobile-page-actions">
        {screen === 'script' && user && selectedScript.id !== TRIAL_ID && <AsyncButton className="icon-btn" aria-label="스크립트 복사" title="스크립트 복사" onAction={() => copyScript(selectedScript.id)}><Icon name="copy" /></AsyncButton>}
        {screen === 'script' && selectedScript.id !== TRIAL_ID && <IconButton icon="edit" label="스크립트 수정" onClick={() => openEditor(selectedScript)} />}
        {screen !== 'script' && <IconButton icon="settings" label="학습 설정" onClick={openStudySettings} />}
        {screen !== 'script' && (
          <AsyncButton className="mobile-study-exit" onAction={exitStudy}>
            <Icon name="logout" />
            {!user || (screen === 'dictation' ? isDictationDone : flashIndex >= flashQueue.length) ? '나가기' : '저장 후 나가기'}
          </AsyncButton>
        )}
      </div>
    </>
  ) : undefined

  const shell = (content: React.ReactNode) => (
    <AppShell
      screen={screen}
      isAdmin={admin.isAdmin}
      storyPage={screen === 'about' || (screen === 'home' && !user)}
      user={user}
      syncError={syncError}
      mobileHeader={mobileHeader}
      onNavigate={navigateMain}
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
            if (studyKind !== 'dictation') await startFlashcard()
            else await startDictation(modeForScope(studyScope))
          }}
        />
      ) : undefined}
    >
      {screen === 'home' && user && <InstallAppBanner />}
      {user && missingProfile.length > 0 && dismissedProfileUser !== user.id && !['auth', 'profile', 'flashcard', 'dictation', 'masking', 'result'].includes(screen) && <aside className="profile-completion-notice" aria-label="회원 정보 입력 안내"><div><strong>회원 정보 확인이 필요해요</strong><p>{missingProfile.join('·')} 정보를 추가해 주세요. 계정을 더 편리하게 이용할 수 있어요.</p></div><div className="button-row"><button className="primary-btn" onClick={() => void navigateMain('profile')}>회원 정보 입력하기</button><button className="text-btn" onClick={() => setDismissedProfileUser(user.id)}>나중에</button></div></aside>}
      <Suspense fallback={<LoadingSkeleton view={screen === 'admin-members' && adminMemberId ? 'admin-member' : screen === 'community' && selectedCommunityId ? 'script' : screen} />}>{content}</Suspense>
      {['script', 'flashcard', 'masking', 'dictation'].includes(screen) && selectedScript?.id === TRIAL_ID && <p className="trial-notice">체험 모드 · 학습 기록은 저장되지 않습니다.</p>}
      {screen !== 'home' && screen !== 'about' && <Guide key={screen} screen={screen} />}
      {loginRequired && <div className="login-overlay" role="dialog" aria-modal="true" aria-label="로그인 안내"><section className="result-card"><h2>로그인이 필요한 기능이에요</h2><p>내 스크립트와 개인 학습 기록을 계정에 안전하게 보관하세요.</p><div className="button-row"><button className="primary-btn" onClick={() => { setLoginRequired(false); setScreen('auth') }}>로그인하기</button><button onClick={() => setLoginRequired(false)}>계속 둘러보기</button></div></section></div>}
    </AppShell>
  )

  const errorPage = (code: 403 | 404 | 503, retry?: () => void) => shell(<ErrorPage code={code} onHome={() => void navigateMain('home')} onLogin={code === 403 && !user ? () => { setAuthMode('login'); setScreen('auth') } : undefined} onRetry={retry} />)
  if (screen === 'not-found') return errorPage(404)
  if (screen === 'forbidden') return errorPage(403)
  if (screen === 'admin-development' || screen === 'admin' || screen === 'admin-support' || screen === 'admin-analytics' || screen === 'admin-members') {
    if (admin.pending) return shell(<LoadingSkeleton view={adminMemberId ? 'admin-member' : screen} />)
    if (admin.error) return errorPage(503, admin.refresh)
    if (!user || !admin.isAdmin) return errorPage(403)
    return shell(<AdminPage section={screen === 'admin-development' ? 'development' : screen === 'admin-analytics' ? 'analytics' : screen === 'admin-members' ? 'members' : screen === 'admin-support' ? 'support' : 'dashboard'} onNavigate={section => void navigateMain(section === 'development' ? 'admin-development' : section === 'dashboard' ? 'admin' : section === 'analytics' ? 'admin-analytics' : section === 'members' ? 'admin-members' : 'admin-support')} key={user.id} memberId={adminMemberId} onSelectMember={setAdminMemberId} />)
  }

  if (screen === 'support') return shell(user ? <SupportPage key={user.id} /> : <section className="result-card"><h1>문의하기</h1><p>로그인하면 문의를 보내고 답변을 확인할 수 있어요.</p><button className="primary-btn" onClick={() => requestLogin('support')}>로그인하기</button></section>)

  if (screen === 'auth') {
    return shell(
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

  if (screen === 'profile') {
    return shell(user ? <ProfilePage user={user} profile={account.profile} profileError={account.error} onRetry={account.refresh} onProfileSaved={profile => { account.accept(profile); refreshAccountIdentity(profile.username, profile.id) }} store={store} onSignOut={signOut} onSupport={() => void navigateMain('support')} onAbout={() => void navigateMain('about')} onAdmin={admin.isAdmin ? () => void navigateMain('admin') : undefined} /> : <section className="result-card"><p className="eyebrow">My account</p><h1>나만의 학습을 시작하세요</h1><p>로그인하면 스크립트와 학습 기록을 이어갈 수 있어요.</p><div className="button-row"><button className="primary-btn" onClick={() => { setAuthMode('login'); setScreen('auth') }}>로그인</button><button onClick={() => { setAuthMode('signup'); setScreen('auth') }}>회원가입</button></div></section>)
  }

  if (screen === 'home' && user) return shell(<DashboardPage onMore={() => void navigateMain('continue')} store={store} onOpen={openScript} onResume={learning => learning.quizType === 'dictation' ? resumeDictation(learning) : resumeFlashcard(learning)} onCreate={() => openEditor()} onLibrary={() => void navigateMain('library')} onCommunity={() => void navigateMain('community')} onReview={id => { openScript(id); setStudyScope('weak'); setStudyError(''); setStudyModalOpen(true) }} />)

  if (screen === 'home' || screen === 'about') return shell(<LandingPage signedIn={Boolean(user)} scripts={communityScripts} onStart={() => openScript(TRIAL_ID)} onCommunity={() => void navigateMain('community')} onSelect={(id) => { setSelectedCommunityId(id); setScreen('community') }} loading={communityLoading} onSignup={() => { setAuthMode('signup'); setAuthError(''); setAuthNotice(''); setScreen('auth') }} onLibrary={() => void navigateMain('library')} />)

  if (screen === 'library') {
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

  if (screen === 'continue' && user) return shell(<ContinuePage store={store} onOpen={openScript} onResume={learning => learning.quizType === 'dictation' ? resumeDictation(learning) : resumeFlashcard(learning)} onBack={() => void navigateMain('home')} onLibrary={() => void navigateMain('library')} />)

  if (screen === 'publisher' && publisherId) return shell(<PublisherPage key={publisherId} publisherId={publisherId} userId={user?.id ?? ''} onBack={() => void navigateMain('community')} onSelect={id => { setSelectedCommunityId(id); setScreen('community') }} onLogin={() => requestLogin('publisher')} />)

  if (screen === 'community') {
    if (selectedCommunityId && !selectedCommunityScript && !communityLoading && !syncError) return errorPage(404)
    return shell(
      <CommunityPage
        onPublisher={id => { setPublisherId(id); setScreen('publisher') }}
        onRequireLogin={() => requestLogin('community')}
        userId={user?.id ?? ''}
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
        onSharePickerChange={(open) => { if (!user) requestLogin('community'); else setSharePickerOpen(open) }}
        onShowMeaningChange={setShowMeaning}
        onShare={shareScript}
        onUnshare={unshareScript}
        onCopy={(script) => { if (!user) { requestLogin('community'); return Promise.resolve() } return copyCommunityScript(script) }}
      />,
    )
  }

  if (screen === 'editor') {
    return shell(
      <ScriptEditorPage
        editing={Boolean(editingScriptId)}
        title={draftTitle}
        rawText={draftRawText}
        excludedWords={draftExcludedWords}
        onExcludedWordsChange={setDraftExcludedWords}
        error={draftError}
        onTitleChange={setDraftTitle}
        onRawTextChange={setDraftRawText}
        onCancel={() => setScreen(editingScriptId ? 'script' : 'home')}
        onSave={saveScript}
        onDelete={editingScriptId ? () => void deleteScript(editingScriptId) : undefined}
      />,
    )
  }

  if (screen === 'script' && !selectedScript && selectedScriptId && user) {
    if (admin.pending) return shell(<LoadingSkeleton view="script" />)
    if (admin.error) return errorPage(503, admin.refresh)
    if (!admin.isAdmin) return errorPage(404)
    return shell(<AdminScriptPage key={`${user.id}:${selectedScriptId}`} scriptId={selectedScriptId} onCopy={copyScript} onBack={ownerId => { setAdminMemberId(ownerId || null); setScreen('admin-members') }} />)
  }

  if (screen === 'script' && selectedScript) {
    return shell(
      <ScriptPage
        script={selectedScript}
        onCopy={user && selectedScript.id !== TRIAL_ID ? () => copyScript(selectedScript.id) : undefined}
        items={selectedItems}
        stats={selectedStats}
        wordStats={selectedWordStats}
        historyCount={selectedScriptSessions.length + selectedFlashcardSessions.length}
        activeLearnings={selectedActiveLearnings}
        showMeaning={showMeaning}
        onBack={() => void navigateMain(user ? 'library' : 'home')}
        onEdit={() => { if (!user) requestLogin('editor'); else openEditor(selectedScript) }}
        onOpenHistory={() => user ? setScreen('history') : requestLogin('history')}
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

  if (screen === 'masking' && selectedScript) return shell(<MaskingPage exitLabel={!user || selectedScript.id === TRIAL_ID ? '나가기' : '저장 후 나가기'} onOpenSettings={openStudySettings} grades={maskingGrades} items={selectedItems} stats={selectedStats} queue={flashQueue} index={flashIndex} visible={visibleTokens} onVisible={setMaskTokens} onMove={moveFlashcard} onStar={toggleSentenceStar} onBack={exitStudy} onEvaluate={advanceFlashcard} onRecordWords={async (words) => { await recordMaskWords(words) }} />)

  if (screen === 'flashcard' && selectedScript) {
    return shell(
      <FlashcardPage
        exitLabel={!user || selectedScript.id === TRIAL_ID ? '나가기' : '저장 후 나가기'}
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
        onBack={exitStudy}
        onOpenSettings={openStudySettings}
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
        exitLabel={!user || selectedScript.id === TRIAL_ID ? '나가기' : '저장 후 나가기'}
        onOpenSettings={openStudySettings}
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
        onSaveExit={exitStudy}
      />,
    )
  }

  return errorPage(404)
}

export default App
