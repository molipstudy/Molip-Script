import { ProgressDemo } from '../../../features/landing-story/ui/ProgressDemo'
import { useRef } from 'react'
import type { CommunityScript } from '../../../entities/community'
import { parseItems } from '../../../entities/script'
import { InstallAppBanner } from '../../../features/install-app'
import { useScrollStory } from '../../../features/landing-story/lib/useScrollStory'
import { storyContent } from '../../../features/landing-story/model/story'
import { StoryChapter } from '../../../features/landing-story/ui/StoryChapter'
import { DictationDemo, FlashcardDemo, MaskingDemo } from '../../../features/landing-story/ui/LearningDemos'
import '../../../features/landing-story/ui/story.css'

type Props = {
  signedIn: boolean
  scripts: CommunityScript[]
  loading?: boolean
  onStart: () => void
  onCommunity: () => void
  onSelect: (id: string) => void
  onSignup: () => void
  onLibrary: () => void
}
export function LandingPage({ signedIn, scripts, loading, onStart, onCommunity, onSelect, onSignup, onLibrary }: Props) {
  const root = useRef<HTMLElement>(null)
  useScrollStory(root)
  return <article className="story-landing" ref={root}>
    <a className="story-skip" href="#story-ending">학습 시작으로 이동</a>
    <header className="story-intro" data-guide="intro">
      <div className="story-intro-brand"><img src="/logo/logo.png" width={100} height={100} alt="몰입 스크립트 로고" fetchPriority="high" /><h1>몰입 스크립트<span className="story-brand-english" lang="en">Molip Script</span></h1></div>
      <a className="story-scroll-cue" href="#story-problem">스크롤해서 알아보기 ↓</a>
    </header>

    <StoryChapter id="story-problem" accents={['📖', '🤔', '✍️']} lines={storyContent.problem} />
    <StoryChapter id="story-solution" lines={storyContent.solution} />
    <StoryChapter id="story-flashcard" lines={storyContent.flashcard} description="한국어 해석을 보고 영어 원문을 떠올리는 학습"><FlashcardDemo /></StoryChapter>
    <StoryChapter id="story-dictation" lines={storyContent.dictation} description="빈칸에 단어를 입력하고 바로 채점하는 학습"><DictationDemo /></StoryChapter>
    <StoryChapter id="story-masking" lines={storyContent.masking} description="가려진 단어를 확인하며 반복하는 학습"><MaskingDemo /></StoryChapter>
    <StoryChapter id="story-progress" lines={storyContent.progress} description="학습 진도 확인 · 이어하기 · 취약 문장 복습">
      <ProgressDemo />
    </StoryChapter>

    <section className="story-community" aria-labelledby="story-community-title">
      <h2 id="story-community-title">다른 사람이 만든 본문도 사용할 수 있어요.</h2>
      {loading ? <p className="story-community-empty" role="status">공개 스크립트를 불러오는 중이에요.</p> : scripts.length ? <ul>{scripts.slice(0, 3).map(script => <li key={script.id}><button onClick={() => onSelect(script.id)}><span><strong>{script.title}</strong><small>{script.ownerLoginId} · 문장 {parseItems(script.rawText).length}개</small></span><span aria-hidden="true">→</span></button></li>)}</ul> : <p className="story-community-empty">지금은 보여드릴 공개 스크립트가 없어요. 직접 등록한 본문으로도 학습할 수 있어요.</p>}
      <button className="text-btn story-community-link" onClick={onCommunity}>커뮤니티 둘러보기 →</button>
    </section>

    <footer className="story-ending" id="story-ending">
      <div className="story-ending-brand"><img src="/logo/logo.png" width={88} height={88} alt="몰입 스크립트 로고" loading="lazy" /><h2>몰입 스크립트<span className="story-brand-english" lang="en">Molip Script</span></h2></div><p>영어 본문 암기, 여기서 시작하세요.</p>
      <div className="story-ending-actions"><button className="primary-btn" onClick={signedIn ? onLibrary : onSignup}>{signedIn ? '내 스크립트로 이동 →' : '무료로 시작하기 →'}</button><button className="text-btn" data-guide="start" onClick={onStart}>{signedIn ? '체험 스크립트 학습하기' : '회원가입 없이 체험하기'}</button></div>
    </footer>
    <div className="story-install"><InstallAppBanner /></div>
  </article>
}
