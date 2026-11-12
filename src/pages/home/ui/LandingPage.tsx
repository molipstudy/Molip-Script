import type { CommunityScript } from '../../../entities/community'
import { parseItems } from '../../../entities/script'
import { Icon } from '../../../shared/ui'

const learningFeatures = [
  { number: '01', title: '플래시카드', subtitle: '먼저 떠올리고, 오래 기억하세요.', description: '한글 뜻을 보고 영어를 회상하세요. 기억 여부를 평가하고 어려운 문장을 다시 연습할 수 있어요.', image: 'flashcard', width: 2126, height: 1488 },
  { number: '02', title: '받아쓰기', subtitle: '빈칸을 채우며 정확해지세요.', description: '문장 속 단어를 직접 입력하고 채점하세요. 틀린 단어와 문장을 중심으로 반복해요.', image: 'dictation', width: 2184, height: 1648 },
  { number: '03', title: '마스킹 학습', subtitle: '한 단어씩, 기억을 꺼내세요.', description: '가려진 영어 단어를 하나씩 열어 보세요. 필요한 만큼 힌트를 확인하며 문장을 완성해요.', image: 'masking', width: 2184, height: 1648 },
]
type Props = { signedIn: boolean; scripts: CommunityScript[]; onStart: () => void; onCommunity: () => void; onSelect: (id: string) => void; onLogin: () => void; onLibrary: () => void }
export function LandingPage({ signedIn, scripts, onStart, onCommunity, onSelect, onLogin, onLibrary }: Props) {
  return <section className="landing">
    <header className="landing-hero" data-guide="intro">
      <p className="eyebrow">YOUR WORDS. YOUR ENGLISH.</p>
      <h1>읽었던 영어가<br /><span>나의 문장이 되는 순간.</span></h1>
      <p>영어 본문 암기가 막막할 때, 한 문장씩 나누어 연습해 보세요.<br />플래시카드로 떠올리고, 받아쓰기로 확인하고, 마스킹으로 반복하며 효율적으로 기억하세요.</p>
      <div className="button-row"><button className="primary-btn jumbo-btn" data-guide="start" onClick={onStart}><Icon name="play" />무료로 체험하기</button><button onClick={onLibrary}>내 스크립트로 이동<Icon name="arrow" /></button></div>
      <small>가입 없이 바로 · 세 가지 학습 모두 체험 · 기록 저장 없음</small>
    </header>

    <section className="landing-dashboard-preview" aria-labelledby="dashboard-preview-title">
      <div className="panel-top"><div><h2 id="dashboard-preview-title">학습 대시보드</h2><p>진행 중인 학습을 모드별로 이어가고, 취약 문장을 골라 복습할 수 있어요.</p></div></div>
      <figure className="service-screenshot"><a href="/screenshots/home.png" target="_blank" rel="noreferrer" aria-label="학습 대시보드 사진 크게 보기"><img src="/screenshots/home.png" width={2422} height={1948} alt="학습 모드별 이어하기와 취약 문장 복습을 보여주는 로그인 홈 화면" loading="lazy" decoding="async" /></a><figcaption>실제 로그인 홈 화면 · 예시로 제공된 학습 기록입니다.</figcaption></figure>
    </section>

    <section className="landing-features" aria-label="학습 방법">{learningFeatures.map(feature => <article key={feature.number}>
      <span>{feature.number}</span><h2>{feature.title}</h2><strong>{feature.subtitle}</strong><p>{feature.description}</p>
      <figure className="service-screenshot learning-feature-screenshot"><a href={`/screenshots/${feature.image}.png`} target="_blank" rel="noreferrer" aria-label={`${feature.title} 사진 크게 보기`}><img src={`/screenshots/${feature.image}.png`} width={feature.width} height={feature.height} alt={`${feature.title} 실제 학습 화면`} loading="lazy" decoding="async" /></a><figcaption>{feature.title} 실제 화면 · 사진을 누르면 크게 볼 수 있어요.</figcaption></figure>
    </article>)}</section>

    <section className="landing-community">
      <div className="panel-top"><div><p className="eyebrow">Shared inspiration</p><h2>함께 나누는 문장들</h2></div><button onClick={onCommunity}>커뮤니티 둘러보기 <Icon name="arrow" /></button></div>
      <div className="landing-community-preview"><div><p>공개 스크립트는 로그인 없이 자유롭게 미리 볼 수 있어요.</p>
        <div className="script-list">{scripts.slice(0, 3).map(script => <button className="script-row" key={script.id} onClick={() => onSelect(script.id)}><span className="script-cover"><Icon name="book" /></span><span className="script-row-copy"><strong>{script.title}</strong><small>{script.ownerLoginId} · 문장 {parseItems(script.rawText).length}개</small></span><Icon name="chevron" /></button>)}</div>
        {!scripts.length && <button onClick={onCommunity}>커뮤니티에서 새로운 스크립트 만나기</button>}
      </div><figure className="service-screenshot community-mobile-screenshot"><a href="/screenshots/community-mobileview.png" target="_blank" rel="noreferrer" aria-label="모바일 커뮤니티 사진 크게 보기"><img src="/screenshots/community-mobileview.png" width={934} height={1996} alt="공개 스크립트 검색과 모바일 메뉴가 보이는 커뮤니티 화면" loading="lazy" decoding="async" /></a><figcaption>모바일 커뮤니티 실제 화면</figcaption></figure></div>
    </section>

    <section className="landing-cta"><h2>오늘의 한 문장, 내일의 자신감.</h2><p>나만의 서재와 취약 단어, 학습 이어하기를 계정 하나로 관리하세요.</p><button className="primary-btn" onClick={signedIn ? onLibrary : onLogin}>{signedIn ? '내 스크립트 열기' : '로그인 / 회원가입'}</button></section>
  </section>
}
