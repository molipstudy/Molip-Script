# 화면 문구 검토 목록

기준: 2026-11-12 현재 소스. 문구 교체 전 검토용입니다. 기존 서비스 문구는 수정하지 않았습니다.

슬로건뿐 아니라 각 영역의 **제목 → 강조 문구 → 설명 → 버튼 → 보조 문구**를 한 묶음으로 기록했습니다. `L01`, `H01` 같은 ID와 바꿀 문장을 알려 주면 해당 위치를 찾아 수정할 수 있습니다. 동적인 사용자 제목·학습 문장·숫자는 `[개수]` 등으로 표시합니다. 서버 오류와 입력 검증 문구는 브랜딩 검토 범위에서 제외합니다.

스크린샷 안의 글자는 이미지에 포함되어 있어 소스 문구를 바꿔도 자동으로 바뀌지 않습니다. README는 별도로 마지막에 정리했습니다.

## L01 · 공개 홈 / 서비스 소개 · 첫 화면

위치: [src/pages/home/ui/LandingPage.tsx:14](../src/pages/home/ui/LandingPage.tsx#L14)

상단 영문: **YOUR WORDS. YOUR ENGLISH.**

# 읽었던 영어가<br>나의 문장이 되는 순간.

영어 본문 암기가 막막할 때, 한 문장씩 나누어 연습해 보세요.<br>
플래시카드로 떠올리고, 받아쓰기로 확인하고, 마스킹으로 반복하며 효율적으로 기억하세요.

버튼: **무료로 체험하기** / **내 스크립트로 이동**

보조 문구: 가입 없이 바로 · 세 가지 학습 모두 체험 · 기록 저장 없음

---

## L02 · 공개 홈 / 서비스 소개 · 플래시카드 카드

위치: [src/pages/home/ui/LandingPage.tsx:6](../src/pages/home/ui/LandingPage.tsx#L6)

제목: **플래시카드**

**먼저 떠올리고, 오래 기억하세요.**

한글 뜻을 보고 영어를 회상하세요. 기억 여부를 평가하고 어려운 문장을 다시 연습할 수 있어요.

---

## L03 · 공개 홈 / 서비스 소개 · 받아쓰기 카드

위치: [src/pages/home/ui/LandingPage.tsx:7](../src/pages/home/ui/LandingPage.tsx#L7)

제목: **받아쓰기**

**빈칸을 채우며 정확해지세요.**

문장 속 단어를 직접 입력하고 채점하세요. 틀린 단어와 문장을 중심으로 반복해요.

---

## L04 · 공개 홈 / 서비스 소개 · 마스킹 카드

위치: [src/pages/home/ui/LandingPage.tsx:8](../src/pages/home/ui/LandingPage.tsx#L8)

제목: **마스킹 학습**

**한 단어씩, 기억을 꺼내세요.**

가려진 영어 단어를 하나씩 열어 보세요. 필요한 만큼 힌트를 확인하며 문장을 완성해요.

---

## L05 · 공개 홈 / 서비스 소개 · 커뮤니티 소개

위치: [src/pages/home/ui/LandingPage.tsx:32](../src/pages/home/ui/LandingPage.tsx#L32)

상단 영문: **Shared inspiration**

제목: **함께 나누는 문장들**

공개 스크립트는 로그인 없이 자유롭게 미리 볼 수 있어요.

버튼: **커뮤니티 둘러보기**

공개 자료를 불러오지 못했거나 목록이 없을 때 버튼: **커뮤니티에서 새로운 스크립트 만나기**

---

## L06 · 공개 홈 / 서비스 소개 · 하단 로그인 유도

위치: [src/pages/home/ui/LandingPage.tsx:39](../src/pages/home/ui/LandingPage.tsx#L39)

## 오늘의 한 문장, 내일의 자신감.

나만의 서재와 취약 단어, 학습 이어하기를 계정 하나로 관리하세요.

로그인 상태 버튼: **내 스크립트 열기**<br>
비로그인 상태 버튼: **로그인 / 회원가입**

---

## L07 · 공개 홈 / 서비스 소개 · 새로 추가한 실제 사진 설명

위치: [src/pages/home/ui/LandingPage.tsx:22](../src/pages/home/ui/LandingPage.tsx#L22)

제목: **학습 대시보드**

진행 중인 학습을 모드별로 이어가고, 취약 문장을 골라 복습할 수 있어요.

대시보드 사진 아래: 실제 로그인 홈 화면 · 예시로 제공된 학습 기록입니다.

학습 사진 아래: [플래시카드 / 받아쓰기 / 마스킹 학습] 실제 화면 · 사진을 누르면 크게 볼 수 있어요.

모바일 사진 아래: 모바일 커뮤니티 실제 화면

이 묶음은 이번 사진 추가 작업에서 새로 넣은 기능 설명입니다.

---

## H01 · 로그인 홈 · 상단 인사

위치: [src/pages/home/ui/DashboardPage.tsx:20](../src/pages/home/ui/DashboardPage.tsx#L20)

상단 영문: **Your study space**

## 오늘도 영어 한 문장부터.

진행 중인 학습이 있을 때: 지난번의 몰입을 이어가 보세요.

진행 중인 학습이 없을 때: 나만의 문장으로, 나만의 속도로 시작하세요.

---

## H02 · 로그인 홈 · 첫 스크립트 안내

위치: [src/pages/home/ui/DashboardPage.tsx:21](../src/pages/home/ui/DashboardPage.tsx#L21)

상단 영문: **Start your first script**

## 첫 번째 스크립트를 만나볼까요?

암기할 영어 본문을 추가하거나, 커뮤니티의 공개 스크립트를 내 스크립트에 담아 학습하세요.

버튼: **첫 스크립트 만들기** / **커뮤니티에서 찾아보기**

---

## H03 · 로그인 홈 · 이어하기와 바로가기

위치: [src/pages/home/ui/DashboardPage.tsx:21](../src/pages/home/ui/DashboardPage.tsx#L21)

상단 영문: **Continue learning**

제목: **최근 학습** · 버튼: **더 보기**

모드별 버튼: **이어하기**

바로가기: **새 스크립트 만들기** / **내 스크립트로 이동** / **커뮤니티 둘러보기**

복습 영역: **복습이 필요한 문장** / 취약 문장 [개수]개 · 복습 범위 선택 / **내 스크립트에서 더 보기**

별도 이어하기 페이지: **학습 이어하기** / 진행 중인 학습을 최근 저장 순으로 확인하세요. / **홈으로**

이어갈 내용이 없을 때: 진행 중인 학습이 없어요. / **내 스크립트에서 학습 시작**

추가 파일: `src/pages/home/ui/LearningCards.tsx`, `src/pages/home/ui/ContinuePage.tsx`.

---

## S01 · 내 스크립트 · 제목과 설명

위치: [src/pages/home/ui/HomePage.tsx:19](../src/pages/home/ui/HomePage.tsx#L19)

상단 영문: **Scripts**

## 내 스크립트

한 문장씩, 나의 영어가 되는 시간.

버튼: **스크립트 추가**

자료가 없을 때: **저장된 스크립트가 없습니다.**

외우고 싶은 문장을 추가하고, 나에게 맞는 방식으로 학습을 시작해 보세요.

---

## C01 · 커뮤니티 · 목록 상단

위치: [src/pages/community/ui/CommunityPage.tsx:88](../src/pages/community/ui/CommunityPage.tsx#L88)

상단 영문: **Community**

## 함께 공부하는 서재

좋은 스크립트를 발견하고, 나의 학습으로 이어가세요.

버튼: **스크립트 공유** / **목록형** / **카드형**

검색창: 제목 또는 공유한 사람 검색

아직 자료가 없을 때: **아직 공유된 스크립트가 없습니다.**

내 스크립트를 공유해 첫 커뮤니티 자료를 만들어 보세요.

---

## C02 · 커뮤니티 · 댓글 소개

위치: [src/features/community-social/ui/CommunityComments.tsx:51](../src/features/community-social/ui/CommunityComments.tsx#L51)

## 댓글

함께 공부하는 사람들과 의견을 나눠 보세요. 최근 댓글부터 표시합니다.

입력 안내: 스크립트에 대한 생각을 남겨 주세요.

버튼: **댓글 등록** / **로그인하고 댓글 남기기** / **댓글 더 보기**

댓글이 없을 때: 첫 댓글을 남겨 보세요.

---

## P01 · 내 정보 · 회원

위치: [src/pages/profile/ui/ProfilePage.tsx:13](../src/pages/profile/ui/ProfilePage.tsx#L13)

상단 영문: **My account**

## 내 정보

나의 학습 공간을 관리해요.

하단 버튼: **서비스 소개 다시 보기**

하단 표기: **Molip Script · v1.0.0** (버전은 빌드 값)

---

## P02 · 내 정보 · 비회원

위치: [src/app/App.tsx:270](../src/app/App.tsx#L270)

상단 영문: **My account**

## 나만의 학습을 시작하세요

로그인하면 스크립트와 학습 기록을 이어갈 수 있어요.

버튼: **로그인** / **회원가입**

---

## A01 · 제한 기능 · 로그인 안내

위치: [src/app/App.tsx:243](../src/app/App.tsx#L243)

## 로그인이 필요한 기능이에요

내 스크립트와 개인 학습 기록을 계정에 안전하게 보관하세요.

버튼: **로그인하기** / **계속 둘러보기**

---

## A02 · 로그인 / 회원가입 · 안내

위치: [src/pages/auth/ui/AuthPage.tsx:46](../src/pages/auth/ui/AuthPage.tsx#L46)

상단 영문: **Molip Study**

로그인 제목: **몰입 스크립트**<br>
아이디와 비밀번호로 학습 기록을 불러옵니다.

회원가입 제목: **계정 만들기**<br>
아이디, 이메일, 비밀번호를 등록합니다.

**회원가입 정보**<br>
이메일은 로그인과 계정 복구에 사용하고, 아이디는 서비스 안에서 표시됩니다.

탭 / 제출 버튼: **로그인** / **회원가입**

---

## B01 · 사이드바 · 프로필 옆 문구

위치: [src/widgets/navigation/ui/AppShell.tsx:64](../src/widgets/navigation/ui/AppShell.tsx#L64)

오늘도, 한 문장 더.

로그인 사용자 이름 아래에 표시됩니다.

함께 쓰이는 영문 이름: **Molip Study**

관련 항목: **몰입 스터디 서비스** / **서비스 소개** / **Created by** / **@z1hxn**

---

## B02 · 모바일 · 시작 인트로

위치: [src/app/ui/MobileIntro.tsx:56](../src/app/ui/MobileIntro.tsx#L56)

**Molip Study**

**몰입 스크립트**

오늘도, 한 문장 더.

---

## B03 · 홈 · 앱 설치 배너

위치: [src/features/install-app/ui/InstallAppBanner.tsx:23](../src/features/install-app/ui/InstallAppBanner.tsx#L23)

상단: **몰입을 더 가까이**

## 홈 화면에서<br>바로 시작해요.

앱으로 추가하고, 오늘도 한 문장 더.

버튼: **앱으로 추가**

---

## B04 · 설치 앱 · 설명 메타데이터

위치: [public/manifest.webmanifest:5](../public/manifest.webmanifest#L5)

오늘도, 한 문장 더. 나만의 영어 스크립트와 퀴즈 학습 공간.

앱 설치 정보에 쓰이는 설명이며 일반 화면의 본문은 아닙니다.

---

## ST01 · 학습 설정 · 모드 소개

위치: [src/features/learning-settings/ui/StudySettingsDialog.tsx:51](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L51)

상단 영문: **Study**

## 어떻게 공부할까요?

**플래시카드**<br>
떠올리고, 뒤집고, 기억해요

**받아쓰기**<br>
빈칸을 채우며 정확하게

**마스킹 학습**<br>
단어를 하나씩 꺼내며 회상해요

설명: 단어를 눌러 공개하거나 가리고, 어려운 단어를 직접 기록할 수 있어요.

설명: 틀린 문장과 단어를 기록하고 취약 단어를 우선 빈칸 처리합니다.

버튼: **플래시카드 시작** / **받아쓰기 시작** / **마스킹 학습 시작**

---

## ST02 · 플래시카드 · 카드 아래

위치: [src/pages/flashcard/ui/FlashcardPage.tsx:97](../src/pages/flashcard/ui/FlashcardPage.tsx#L97)

영어 공개 전: 눌러서 영어 문장 확인

영어 공개 후: 얼마나 잘 기억하고 있었나요?

버튼: **다시 연습** / **기억했어요**

완료: **플래시카드 완료** / [개수]개의 문장을 학습했어요. 다시 연습할 문장은 [개수]개예요.

완료 버튼: **다시 학습** / **스크립트로**

---

## ST03 · 마스킹 학습 · 안내

위치: [src/pages/masking/ui/MaskingPage.tsx:14](../src/pages/masking/ui/MaskingPage.tsx#L14)

기억을 떠올린 뒤 맞음 / 틀림을 평가해 주세요

맞음으로 기록한 문장 · 다시 평가할 수 있어요

틀림으로 기록한 문장 · 다시 평가할 수 있어요

단어를 누르면 공개되고, 다시 누르면 가려져요.

버튼: **전체 공개** / **전체 가리기** / **취약 단어 기록** / **틀렸어요** / **맞았어요**

완료: **마스킹 학습 완료** / [개수]개의 문장을 연습했어요. 맞음 [개수] · 틀림 [개수]

---

## ST04 · 학습 내역 · 상단

위치: [src/pages/history/ui/HistoryPage.tsx:19](../src/pages/history/ui/HistoryPage.tsx#L19)

상단 영문: **Learning history** / **Learning History**

## 학습 내역

차곡차곡 쌓인 나의 학습 기록

버튼: **새 학습**

기록이 없을 때: **아직 학습 기록이 없습니다.**

플래시카드나 받아쓰기를 완료하면 이곳에 결과가 쌓입니다.

---

## 부록 A · 화면별 나머지 정적 문구

앞의 문맥별 묶음과 함께 확인할 수 있는 실제 화면 문구입니다. 기능명·빈 상태·버튼도 포함합니다. `/`는 상태별 대안이나 줄바꿈을 뜻하며 사용자 제목·오류 변수처럼 동적으로 들어오는 내용은 제외했습니다.

### src/app/App.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| span | 마스킹 학습 / 플래시카드 / 받아쓰기 | [182행](../src/app/App.tsx#L182) |
| h1 | 스크립트 상세 | [183행](../src/app/App.tsx#L183) |
| p | 체험 모드 · 학습 기록은 저장되지 않습니다. | [241행](../src/app/App.tsx#L241) |
| h2 | 로그인이 필요한 기능이에요 | [243행](../src/app/App.tsx#L243) |
| p | 내 스크립트와 개인 학습 기록을 계정에 안전하게 보관하세요. | [243행](../src/app/App.tsx#L243) |
| button | 로그인하기 | [243행](../src/app/App.tsx#L243) |
| button | 계속 둘러보기 | [243행](../src/app/App.tsx#L243) |
| p | My account | [270행](../src/app/App.tsx#L270) |
| h1 | 나만의 학습을 시작하세요 | [270행](../src/app/App.tsx#L270) |
| p | 로그인하면 스크립트와 학습 기록을 이어갈 수 있어요. | [270행](../src/app/App.tsx#L270) |
| button | 로그인 | [270행](../src/app/App.tsx#L270) |
| button | 회원가입 | [270행](../src/app/App.tsx#L270) |
| h2 | 화면을 찾을 수 없습니다. | [460행](../src/app/App.tsx#L460) |
| button | 홈으로 | [461행](../src/app/App.tsx#L461) |

### src/app/ui/MobileIntro.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| span | Molip Study | [54행](../src/app/ui/MobileIntro.tsx#L54) |
| strong | 몰입 스크립트 | [55행](../src/app/ui/MobileIntro.tsx#L55) |
| p | 오늘도, 한 문장 더. | [56행](../src/app/ui/MobileIntro.tsx#L56) |

### src/features/community-social/ui/CommunityComments.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| h2 | 댓글 | [51행](../src/features/community-social/ui/CommunityComments.tsx#L51) |
| p | 함께 공부하는 사람들과 의견을 나눠 보세요. 최근 댓글부터 표시합니다. | [51행](../src/features/community-social/ui/CommunityComments.tsx#L51) |
| span | 댓글 작성 | [52행](../src/features/community-social/ui/CommunityComments.tsx#L52) |
| small | / 1000 | [52행](../src/features/community-social/ui/CommunityComments.tsx#L52) |
| button | 처리 중… / 댓글 등록 | [52행](../src/features/community-social/ui/CommunityComments.tsx#L52) |
| button | 로그인하고 댓글 남기기 | [52행](../src/features/community-social/ui/CommunityComments.tsx#L52) |
| p | 다시 불러오기 | [53행](../src/features/community-social/ui/CommunityComments.tsx#L53) |
| p | 댓글을 불러오는 중… | [55행](../src/features/community-social/ui/CommunityComments.tsx#L55) |
| p | 첫 댓글을 남겨 보세요. | [55행](../src/features/community-social/ui/CommunityComments.tsx#L55) |

### src/features/community-social/ui/CommunityCounts.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| span | 좋아요 담은 수 댓글 | [5행](../src/features/community-social/ui/CommunityCounts.tsx#L5) |
| span | 좋아요 | [5행](../src/features/community-social/ui/CommunityCounts.tsx#L5) |
| span | 담은 수 | [5행](../src/features/community-social/ui/CommunityCounts.tsx#L5) |
| span | 댓글 | [5행](../src/features/community-social/ui/CommunityCounts.tsx#L5) |

### src/features/install-app/ui/InstallAppBanner.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| span | 몰입을 더 가까이 | [23행](../src/features/install-app/ui/InstallAppBanner.tsx#L23) |
| h2 | 홈 화면에서 / 바로 시작해요. | [24행](../src/features/install-app/ui/InstallAppBanner.tsx#L24) |
| p | 앱으로 추가하고, 오늘도 한 문장 더. | [25행](../src/features/install-app/ui/InstallAppBanner.tsx#L25) |
| button | 앱으로 추가 | [26행](../src/features/install-app/ui/InstallAppBanner.tsx#L26) |
| span | 몰입 스크립트 | [28행](../src/features/install-app/ui/InstallAppBanner.tsx#L28) |

### src/features/install-app/ui/InstallAppButton.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| button | 앱으로 추가 홈 화면에서 바로, 오늘의 한 문장. | [8행](../src/features/install-app/ui/InstallAppButton.tsx#L8) |
| strong | 앱으로 추가 | [10행](../src/features/install-app/ui/InstallAppButton.tsx#L10) |
| small | 홈 화면에서 바로, 오늘의 한 문장. | [10행](../src/features/install-app/ui/InstallAppButton.tsx#L10) |

### src/features/install-app/ui/InstallAppProvider.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| p | YOUR DAILY ENGLISH | [90행](../src/features/install-app/ui/InstallAppProvider.tsx#L90) |
| h2 | 한 번의 터치로, / 몰입을 시작해요. | [91행](../src/features/install-app/ui/InstallAppProvider.tsx#L91) |
| p | 몰입 스크립트를 앱으로 추가하고 / 홈 화면에서 바로 학습하세요. | [92행](../src/features/install-app/ui/InstallAppProvider.tsx#L92) |
| span | 홈 화면 바로 실행 | [93행](../src/features/install-app/ui/InstallAppProvider.tsx#L93) |
| span | 나만의 학습 공간 | [93행](../src/features/install-app/ui/InstallAppProvider.tsx#L93) |
| h3 | 앱이 추가됐어요 | [96행](../src/features/install-app/ui/InstallAppProvider.tsx#L96) |
| p | 홈 화면이나 앱 목록에서 몰입 스크립트를 찾아보세요. | [96행](../src/features/install-app/ui/InstallAppProvider.tsx#L96) |
| strong | Safari나 Chrome에서 열어 주세요 | [97행](../src/features/install-app/ui/InstallAppProvider.tsx#L97) |
| p | 앱 안의 브라우저에서는 설치 메뉴가 없을 수 있어요. 메뉴에서 ‘다른 브라우저로 열기’를 선택하거나 아래에서 주소를 복사해 주세요. | [97행](../src/features/install-app/ui/InstallAppProvider.tsx#L97) |
| h3 | 브라우저별 추가 방법 | [99행](../src/features/install-app/ui/InstallAppProvider.tsx#L99) |
| span | 간단한 3단계 | [99행](../src/features/install-app/ui/InstallAppProvider.tsx#L99) |
| p | 기기와 브라우저 버전에 따라 메뉴 이름이 조금 다를 수 있어요. 공식 도움말 ↗ | [106행](../src/features/install-app/ui/InstallAppProvider.tsx#L106) |
| span | ↗ | [106행](../src/features/install-app/ui/InstallAppProvider.tsx#L106) |
| button | 확인했어요 | [111행](../src/features/install-app/ui/InstallAppProvider.tsx#L111) |

### src/features/learning-settings/ui/StudyHeader.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| span | / | [26행](../src/features/learning-settings/ui/StudyHeader.tsx#L26) |

### src/features/learning-settings/ui/StudySettingsDialog.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| p | Study | [51행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L51) |
| h2 | 어떻게 공부할까요? | [51행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L51) |
| button | 닫기 | [52행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L52) |
| button | 플래시카드 떠올리고, 뒤집고, 기억해요 | [56행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L56) |
| strong | 플래시카드 | [57행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L57) |
| small | 떠올리고, 뒤집고, 기억해요 | [57행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L57) |
| button | 받아쓰기 빈칸을 채우며 정확하게 | [59행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L59) |
| strong | 받아쓰기 | [60행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L60) |
| small | 빈칸을 채우며 정확하게 | [60행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L60) |
| button | 마스킹 학습 단어를 하나씩 꺼내며 회상해요 | [62행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L62) |
| strong | 마스킹 학습 | [62행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L62) |
| small | 단어를 하나씩 꺼내며 회상해요 | [62행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L62) |
| span | 시작 | [78행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L78) |
| span | – | [79행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L79) |
| span | 끝 | [80행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L80) |
| small | 총 문장 | [81행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L81) |
| p | 단어를 눌러 공개하거나 가리고, 어려운 단어를 직접 기록할 수 있어요. | [84행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L84) |
| span | 빈칸 비율 % | [88행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L88) |
| strong | % | [88행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L88) |
| p | 틀린 문장과 단어를 기록하고 취약 단어를 우선 빈칸 처리합니다. | [89행](../src/features/learning-settings/ui/StudySettingsDialog.tsx#L89) |

### src/pages/auth/ui/AuthPage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| p | Molip Study | [46행](../src/pages/auth/ui/AuthPage.tsx#L46) |
| h1 | 몰입 스크립트 / 계정 만들기 | [47행](../src/pages/auth/ui/AuthPage.tsx#L47) |
| p | 아이디와 비밀번호로 학습 기록을 불러옵니다. / 아이디, 이메일, 비밀번호를 등록합니다. | [48행](../src/pages/auth/ui/AuthPage.tsx#L48) |
| button | 로그인 | [57행](../src/pages/auth/ui/AuthPage.tsx#L57) |
| button | 회원가입 | [58행](../src/pages/auth/ui/AuthPage.tsx#L58) |
| strong | 회원가입 정보 | [63행](../src/pages/auth/ui/AuthPage.tsx#L63) |
| span | 이메일은 로그인과 계정 복구에 사용하고, 아이디는 서비스 안에서 표시됩니다. | [64행](../src/pages/auth/ui/AuthPage.tsx#L64) |
| span | 아이디 | [69행](../src/pages/auth/ui/AuthPage.tsx#L69) |
| span | 이메일 | [74행](../src/pages/auth/ui/AuthPage.tsx#L74) |
| span | 비밀번호 | [79행](../src/pages/auth/ui/AuthPage.tsx#L79) |

### src/pages/auth/ui/AuthStates.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| h1 | 서비스에 연결할 수 없어요 | [8행](../src/pages/auth/ui/AuthStates.tsx#L8) |
| p | 잠시 후 다시 접속해 주세요. | [9행](../src/pages/auth/ui/AuthStates.tsx#L9) |

### src/pages/community/ui/CommunityPage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| h2 | 공유된 스크립트를 찾을 수 없어요 | [55행](../src/pages/community/ui/CommunityPage.tsx#L55) |
| p | 공유가 취소되었거나 삭제된 자료예요. | [55행](../src/pages/community/ui/CommunityPage.tsx#L55) |
| button | 커뮤니티로 | [55행](../src/pages/community/ui/CommunityPage.tsx#L55) |
| button | 커뮤니티 | [62행](../src/pages/community/ui/CommunityPage.tsx#L62) |
| p | · 문장 개 · 공유 | [62행](../src/pages/community/ui/CommunityPage.tsx#L62) |
| button | 공유 취소 | [65행](../src/pages/community/ui/CommunityPage.tsx#L65) |
| button | 내 스크립트에 담기 | [66행](../src/pages/community/ui/CommunityPage.tsx#L66) |
| p | 다시 시도 | [71행](../src/pages/community/ui/CommunityPage.tsx#L71) |
| h2 | 스크립트 본문 | [74행](../src/pages/community/ui/CommunityPage.tsx#L74) |
| button | 해석 | [74행](../src/pages/community/ui/CommunityPage.tsx#L74) |
| button | 본문 접기 / 본문 펼치기 | [74행](../src/pages/community/ui/CommunityPage.tsx#L74) |
| p | Community | [88행](../src/pages/community/ui/CommunityPage.tsx#L88) |
| h1 | 함께 공부하는 서재 | [88행](../src/pages/community/ui/CommunityPage.tsx#L88) |
| p | 좋은 스크립트를 발견하고, 나의 학습으로 이어가세요. | [88행](../src/pages/community/ui/CommunityPage.tsx#L88) |
| button | 스크립트 공유 | [89행](../src/pages/community/ui/CommunityPage.tsx#L89) |
| span | 공개 스크립트 개 | [92행](../src/pages/community/ui/CommunityPage.tsx#L92) |
| button | 목록형 | [92행](../src/pages/community/ui/CommunityPage.tsx#L92) |
| button | 카드형 | [92행](../src/pages/community/ui/CommunityPage.tsx#L92) |
| h2 | 검색 결과가 없어요 | [99행](../src/pages/community/ui/CommunityPage.tsx#L99) |
| p | 다른 제목이나 공유한 사람으로 검색해 보세요. | [99행](../src/pages/community/ui/CommunityPage.tsx#L99) |
| button | 문장 개 | [102행](../src/pages/community/ui/CommunityPage.tsx#L102) |
| h2 | 아직 공유된 스크립트가 없습니다. | [109행](../src/pages/community/ui/CommunityPage.tsx#L109) |
| p | 내 스크립트를 공유해 첫 커뮤니티 자료를 만들어 보세요. | [109행](../src/pages/community/ui/CommunityPage.tsx#L109) |
| p | Share | [114행](../src/pages/community/ui/CommunityPage.tsx#L114) |
| h2 | 공유할 스크립트 선택 | [114행](../src/pages/community/ui/CommunityPage.tsx#L114) |
| button | 이미 공유 중 / 문장 [값]개 ✓ / › | [119행](../src/pages/community/ui/CommunityPage.tsx#L119) |
| span | 이미 공유 중 / 문장 [값]개 | [119행](../src/pages/community/ui/CommunityPage.tsx#L119) |
| span | ✓ / › | [119행](../src/pages/community/ui/CommunityPage.tsx#L119) |
| p | 먼저 홈에서 스크립트를 추가해 주세요. | [122행](../src/pages/community/ui/CommunityPage.tsx#L122) |

### src/pages/dictation/ui/DictationPage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| span | 정답 · 오답 · 남은 | [47행](../src/pages/dictation/ui/DictationPage.tsx#L47) |
| h1 | 받아쓰기 완료 | [52행](../src/pages/dictation/ui/DictationPage.tsx#L52) |
| p | 정답 개 · 오답 개 · 기록된 취약 단어 개 | [53행](../src/pages/dictation/ui/DictationPage.tsx#L53) |
| strong | . | [63행](../src/pages/dictation/ui/DictationPage.tsx#L63) |
| small | 틀린 단어: | [63행](../src/pages/dictation/ui/DictationPage.tsx#L63) |
| button | 틀린 문제 다시 풀기 / 틀린 문제 없음 | [69행](../src/pages/dictation/ui/DictationPage.tsx#L69) |
| button | 스크립트로 | [69행](../src/pages/dictation/ui/DictationPage.tsx#L69) |
| p | SENTENCE 채점 완료 / 빈칸을 채워 보세요 | [74행](../src/pages/dictation/ui/DictationPage.tsx#L74) |
| span | 채점 완료 / 빈칸을 채워 보세요 | [74행](../src/pages/dictation/ui/DictationPage.tsx#L74) |
| strong | 이번 문장 / | [77행](../src/pages/dictation/ui/DictationPage.tsx#L77) |

### src/pages/editor/ui/ExcludedWordsDialog.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| p | Dictation Settings | [25행](../src/pages/editor/ui/ExcludedWordsDialog.tsx#L25) |
| h2 | 본문에서 제외 단어 선택 | [25행](../src/pages/editor/ui/ExcludedWordsDialog.tsx#L25) |
| p | 단어를 누르면 빈칸에서 제외돼요. 다시 누르면 해제됩니다. 누른 위치만 제외돼요. 같은 문장이나 다른 문장에 같은 단어가 있어도 함께 제외되지 않아요. | [28행](../src/pages/editor/ui/ExcludedWordsDialog.tsx#L28) |
| p | . 한글 뜻을 입력하지 않은 문장 | [31행](../src/pages/editor/ui/ExcludedWordsDialog.tsx#L31) |
| strong | . | [31행](../src/pages/editor/ui/ExcludedWordsDialog.tsx#L31) |
| p | 영어 문장을 입력하면 단어를 선택할 수 있어요. | [46행](../src/pages/editor/ui/ExcludedWordsDialog.tsx#L46) |
| p | 먼저 본문에 한글 뜻과 영어 문장을 입력해 주세요. | [47행](../src/pages/editor/ui/ExcludedWordsDialog.tsx#L47) |
| span | 제외 단어 개 | [50행](../src/pages/editor/ui/ExcludedWordsDialog.tsx#L50) |
| button | 취소 | [51행](../src/pages/editor/ui/ExcludedWordsDialog.tsx#L51) |
| button | 적용 | [51행](../src/pages/editor/ui/ExcludedWordsDialog.tsx#L51) |
| p | 적용 후 스크립트를 저장하면 새로 시작하는 받아쓰기부터 반영돼요. | [53행](../src/pages/editor/ui/ExcludedWordsDialog.tsx#L53) |

### src/pages/editor/ui/ScriptEditorPage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| button | 문장 추가 | [115행](../src/pages/editor/ui/ScriptEditorPage.tsx#L115) |
| p | Script Editor | [119행](../src/pages/editor/ui/ScriptEditorPage.tsx#L119) |
| h1 | 스크립트 수정 / 스크립트 추가 | [119행](../src/pages/editor/ui/ScriptEditorPage.tsx#L119) |
| button | 취소 | [119행](../src/pages/editor/ui/ScriptEditorPage.tsx#L119) |
| span | 제목 | [120행](../src/pages/editor/ui/ScriptEditorPage.tsx#L120) |
| button | 문장 카드 | [123행](../src/pages/editor/ui/ScriptEditorPage.tsx#L123) |
| button | 원문 편집 | [124행](../src/pages/editor/ui/ScriptEditorPage.tsx#L124) |
| p | 왼쪽 손잡이를 끌어 순서를 바꾸고, + 버튼으로 문장을 추가하세요. | [129행](../src/pages/editor/ui/ScriptEditorPage.tsx#L129) |
| span | 끌어서 원하는 위치에 놓으세요. 위아래 방향키로도 이동할 수 있어요. Escape는 끌기 취소입니다. | [130행](../src/pages/editor/ui/ScriptEditorPage.tsx#L130) |
| span | 한글 | [149행](../src/pages/editor/ui/ScriptEditorPage.tsx#L149) |
| span | 영어 | [150행](../src/pages/editor/ui/ScriptEditorPage.tsx#L150) |
| span | 본문 · 번호. 한글 뜻 다음 줄에 영어 문장을 입력하세요 | [155행](../src/pages/editor/ui/ScriptEditorPage.tsx#L155) |
| h2 | 받아쓰기 제외 단어 | [164행](../src/pages/editor/ui/ScriptEditorPage.tsx#L164) |
| p | 본문에서 선택한 위치만 빈칸 출제에서 제외돼요. 같은 단어의 다른 위치는 그대로 출제됩니다. | [165행](../src/pages/editor/ui/ScriptEditorPage.tsx#L165) |
| button | 본문에서 제외 단어 선택 곳 제외 | [166행](../src/pages/editor/ui/ScriptEditorPage.tsx#L166) |
| span | 곳 제외 | [175행](../src/pages/editor/ui/ScriptEditorPage.tsx#L175) |
| h3 | 반복 표기 · 직접 입력 | [177행](../src/pages/editor/ui/ScriptEditorPage.tsx#L177) |
| p | Tim:, Amy:처럼 반복되는 표기를 입력하면 현재 본문에서 문장부호까지 일치하는 위치만 한 번에 선택해요. Tim:을 입력해도 대화 속 Tim은 제외되지 않아요. | [178행](../src/pages/editor/ui/ScriptEditorPage.tsx#L178) |
| span | 쉼표나 공백으로 구분 | [179행](../src/pages/editor/ui/ScriptEditorPage.tsx#L179) |
| button | 추가 | [179행](../src/pages/editor/ui/ScriptEditorPage.tsx#L179) |
| p | 이전에 단어 전체에 적용했던 제외 설정은 더 이상 적용하지 않아요. 본문에서 제외할 위치를 다시 선택해 주세요. | [181행](../src/pages/editor/ui/ScriptEditorPage.tsx#L181) |
| p | [값]곳 제외 · 본문 선택창에서 확인·해제할 수 있어요. / 제외한 위치가 없어요. | [182행](../src/pages/editor/ui/ScriptEditorPage.tsx#L182) |
| button | 전체 해제 | [182행](../src/pages/editor/ui/ScriptEditorPage.tsx#L182) |
| button | 삭제 | [196행](../src/pages/editor/ui/ScriptEditorPage.tsx#L196) |

### src/pages/flashcard/ui/FlashcardPage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| h1 | 플래시카드 완료 | [87행](../src/pages/flashcard/ui/FlashcardPage.tsx#L87) |
| p | 개의 문장을 학습했어요. 다시 연습할 문장은 개예요. | [87행](../src/pages/flashcard/ui/FlashcardPage.tsx#L87) |
| button | 스크립트로 | [88행](../src/pages/flashcard/ui/FlashcardPage.tsx#L88) |
| button | SENTENCE 눌러서 영어 문장 확인 Space 얼마나 잘 기억하고 있었나요? | [94행](../src/pages/flashcard/ui/FlashcardPage.tsx#L94) |
| span | SENTENCE | [95행](../src/pages/flashcard/ui/FlashcardPage.tsx#L95) |
| span | 눌러서 영어 문장 확인 Space | [96행](../src/pages/flashcard/ui/FlashcardPage.tsx#L96) |
| span | 얼마나 잘 기억하고 있었나요? | [97행](../src/pages/flashcard/ui/FlashcardPage.tsx#L97) |
| h2 | 어려웠던 단어 선택 | [110행](../src/pages/flashcard/ui/FlashcardPage.tsx#L110) |

### src/pages/history/ui/HistoryPage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| p | Learning history | [19행](../src/pages/history/ui/HistoryPage.tsx#L19) |
| h1 | 학습 내역 | [19행](../src/pages/history/ui/HistoryPage.tsx#L19) |
| p | 차곡차곡 쌓인 나의 학습 기록 | [19행](../src/pages/history/ui/HistoryPage.tsx#L19) |
| button | 새 학습 | [19행](../src/pages/history/ui/HistoryPage.tsx#L19) |
| p | Learning History | [21행](../src/pages/history/ui/HistoryPage.tsx#L21) |
| span | 개 | [21행](../src/pages/history/ui/HistoryPage.tsx#L21) |
| button | · 정답률 / 오답 · 단어 | [27행](../src/pages/history/ui/HistoryPage.tsx#L27) |
| span | · 정답률 | [28행](../src/pages/history/ui/HistoryPage.tsx#L28) |
| span | / 오답 · 단어 | [29행](../src/pages/history/ui/HistoryPage.tsx#L29) |
| small | 오답 · 단어 | [29행](../src/pages/history/ui/HistoryPage.tsx#L29) |
| h2 | 아직 학습 기록이 없습니다. | [36행](../src/pages/history/ui/HistoryPage.tsx#L36) |
| p | 플래시카드나 받아쓰기를 완료하면 이곳에 결과가 쌓입니다. | [36행](../src/pages/history/ui/HistoryPage.tsx#L36) |
| span | 마스킹 학습 / 플래시카드 · 문장 학습 | [41행](../src/pages/history/ui/HistoryPage.tsx#L41) |
| span | / 맞음 / 기억함 · 틀림 / 다시 연습 | [42행](../src/pages/history/ui/HistoryPage.tsx#L42) |
| small | 맞음 / 기억함 · 틀림 / 다시 연습 | [42행](../src/pages/history/ui/HistoryPage.tsx#L42) |

### src/pages/home/ui/ContinuePage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| button | 홈으로 | [9행](../src/pages/home/ui/ContinuePage.tsx#L9) |
| p | Continue learning | [9행](../src/pages/home/ui/ContinuePage.tsx#L9) |
| h1 | 학습 이어하기 | [9행](../src/pages/home/ui/ContinuePage.tsx#L9) |
| p | 진행 중인 학습을 최근 저장 순으로 확인하세요. | [9행](../src/pages/home/ui/ContinuePage.tsx#L9) |
| h2 | 진행 중인 학습이 없어요. | [9행](../src/pages/home/ui/ContinuePage.tsx#L9) |
| button | 내 스크립트에서 학습 시작 | [9행](../src/pages/home/ui/ContinuePage.tsx#L9) |

### src/pages/home/ui/DashboardPage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| p | Your study space | [20행](../src/pages/home/ui/DashboardPage.tsx#L20) |
| h1 | 오늘도 영어 한 문장부터. | [20행](../src/pages/home/ui/DashboardPage.tsx#L20) |
| p | 지난번의 몰입을 이어가 보세요. / 나만의 문장으로, 나만의 속도로 시작하세요. | [20행](../src/pages/home/ui/DashboardPage.tsx#L20) |
| p | Start your first script | [21행](../src/pages/home/ui/DashboardPage.tsx#L21) |
| h2 | 첫 번째 스크립트를 만나볼까요? | [21행](../src/pages/home/ui/DashboardPage.tsx#L21) |
| p | 암기할 영어 본문을 추가하거나, 커뮤니티의 공개 스크립트를 내 스크립트에 담아 학습하세요. | [21행](../src/pages/home/ui/DashboardPage.tsx#L21) |
| button | 첫 스크립트 만들기 | [21행](../src/pages/home/ui/DashboardPage.tsx#L21) |
| button | 커뮤니티에서 찾아보기 | [21행](../src/pages/home/ui/DashboardPage.tsx#L21) |
| p | Continue learning / Ready to learn | [21행](../src/pages/home/ui/DashboardPage.tsx#L21) |
| h2 | 최근 학습 / 학습을 시작해 보세요 | [21행](../src/pages/home/ui/DashboardPage.tsx#L21) |
| button | 더 보기 | [21행](../src/pages/home/ui/DashboardPage.tsx#L21) |
| p | 아직 학습 기록이 없어요. 준비한 스크립트에서 학습 방법을 선택하세요. | [21행](../src/pages/home/ui/DashboardPage.tsx#L21) |
| button | 새 스크립트 만들기 | [25행](../src/pages/home/ui/DashboardPage.tsx#L25) |
| button | 내 스크립트로 이동 | [25행](../src/pages/home/ui/DashboardPage.tsx#L25) |
| button | 커뮤니티 둘러보기 | [25행](../src/pages/home/ui/DashboardPage.tsx#L25) |
| h2 | 복습이 필요한 문장 | [26행](../src/pages/home/ui/DashboardPage.tsx#L26) |
| span | 문장 | [26행](../src/pages/home/ui/DashboardPage.tsx#L26) |
| button | 취약 문장 개 · 복습 범위 선택 | [26행](../src/pages/home/ui/DashboardPage.tsx#L26) |
| button | 내 스크립트에서 더 보기 | [26행](../src/pages/home/ui/DashboardPage.tsx#L26) |
| p | 아직 기록된 취약 문장이 없어요. 학습 중 어려웠던 문장이 생기면 여기서 복습할 수 있어요. | [26행](../src/pages/home/ui/DashboardPage.tsx#L26) |

### src/pages/home/ui/HomePage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| p | Scripts | [19행](../src/pages/home/ui/HomePage.tsx#L19) |
| h1 | 내 스크립트 | [19행](../src/pages/home/ui/HomePage.tsx#L19) |
| p | 한 문장씩, 나의 영어가 되는 시간. | [19행](../src/pages/home/ui/HomePage.tsx#L19) |
| button | 스크립트 추가 | [20행](../src/pages/home/ui/HomePage.tsx#L20) |
| h2 | 검색 결과가 없어요 | [26행](../src/pages/home/ui/HomePage.tsx#L26) |
| p | 다른 제목으로 검색해 보세요. | [26행](../src/pages/home/ui/HomePage.tsx#L26) |
| h2 | 저장된 스크립트가 없습니다. | [28행](../src/pages/home/ui/HomePage.tsx#L28) |
| p | 외우고 싶은 문장을 추가하고, 나에게 맞는 방식으로 학습을 시작해 보세요. | [28행](../src/pages/home/ui/HomePage.tsx#L28) |
| button | 문장 개 · 최근 수정 | [32행](../src/pages/home/ui/HomePage.tsx#L32) |

### src/pages/home/ui/LandingPage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| p | YOUR WORDS. YOUR ENGLISH. | [14행](../src/pages/home/ui/LandingPage.tsx#L14) |
| h1 | 읽었던 영어가 / 나의 문장이 되는 순간. | [15행](../src/pages/home/ui/LandingPage.tsx#L15) |
| span | 나의 문장이 되는 순간. | [15행](../src/pages/home/ui/LandingPage.tsx#L15) |
| p | 영어 본문 암기가 막막할 때, 한 문장씩 나누어 연습해 보세요. / 플래시카드로 떠올리고, 받아쓰기로 확인하고, 마스킹으로 반복하며 효율적으로 기억하세요. | [16행](../src/pages/home/ui/LandingPage.tsx#L16) |
| button | 무료로 체험하기 | [17행](../src/pages/home/ui/LandingPage.tsx#L17) |
| button | 내 스크립트로 이동 | [17행](../src/pages/home/ui/LandingPage.tsx#L17) |
| small | 가입 없이 바로 · 세 가지 학습 모두 체험 · 기록 저장 없음 | [18행](../src/pages/home/ui/LandingPage.tsx#L18) |
| h2 | 학습 대시보드 | [22행](../src/pages/home/ui/LandingPage.tsx#L22) |
| p | 진행 중인 학습을 모드별로 이어가고, 취약 문장을 골라 복습할 수 있어요. | [22행](../src/pages/home/ui/LandingPage.tsx#L22) |
| figcaption | 실제 로그인 홈 화면 · 예시로 제공된 학습 기록입니다. | [23행](../src/pages/home/ui/LandingPage.tsx#L23) |
| figcaption | 실제 화면 · 사진을 누르면 크게 볼 수 있어요. | [28행](../src/pages/home/ui/LandingPage.tsx#L28) |
| p | Shared inspiration | [32행](../src/pages/home/ui/LandingPage.tsx#L32) |
| h2 | 함께 나누는 문장들 | [32행](../src/pages/home/ui/LandingPage.tsx#L32) |
| button | 커뮤니티 둘러보기 | [32행](../src/pages/home/ui/LandingPage.tsx#L32) |
| p | 공개 스크립트는 로그인 없이 자유롭게 미리 볼 수 있어요. | [33행](../src/pages/home/ui/LandingPage.tsx#L33) |
| button | · 문장 개 | [34행](../src/pages/home/ui/LandingPage.tsx#L34) |
| button | 커뮤니티에서 새로운 스크립트 만나기 | [35행](../src/pages/home/ui/LandingPage.tsx#L35) |
| figcaption | 모바일 커뮤니티 실제 화면 | [36행](../src/pages/home/ui/LandingPage.tsx#L36) |
| h2 | 오늘의 한 문장, 내일의 자신감. | [39행](../src/pages/home/ui/LandingPage.tsx#L39) |
| p | 나만의 서재와 취약 단어, 학습 이어하기를 계정 하나로 관리하세요. | [39행](../src/pages/home/ui/LandingPage.tsx#L39) |
| button | 내 스크립트 열기 / 로그인 / 회원가입 | [39행](../src/pages/home/ui/LandingPage.tsx#L39) |

### src/pages/home/ui/LearningCards.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| button | 마지막 학습 | [9행](../src/pages/home/ui/LearningCards.tsx#L9) |
| small | · | [12행](../src/pages/home/ui/LearningCards.tsx#L12) |
| span | / · % | [12행](../src/pages/home/ui/LearningCards.tsx#L12) |
| button | 이어하기 | [12행](../src/pages/home/ui/LearningCards.tsx#L12) |

### src/pages/masking/ui/MaskingPage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| h1 | 마스킹 학습 완료 | [12행](../src/pages/masking/ui/MaskingPage.tsx#L12) |
| p | 개의 문장을 연습했어요. 맞음 · 틀림 | [12행](../src/pages/masking/ui/MaskingPage.tsx#L12) |
| p | SENTENCE | [14행](../src/pages/masking/ui/MaskingPage.tsx#L14) |
| p | 맞음으로 기록한 문장 · 다시 평가할 수 있어요 / 틀림으로 기록한 문장 · 다시 평가할 수 있어요 / 기억을 떠올린 뒤 맞음 / 틀림을 평가해 주세요 | [14행](../src/pages/masking/ui/MaskingPage.tsx#L14) |
| p | 단어를 누르면 공개되고, 다시 누르면 가려져요. | [14행](../src/pages/masking/ui/MaskingPage.tsx#L14) |
| button | 취약 단어 기록 | [14행](../src/pages/masking/ui/MaskingPage.tsx#L14) |
| h2 | 어려웠던 단어 선택 | [14행](../src/pages/masking/ui/MaskingPage.tsx#L14) |
| button | 취소 | [14행](../src/pages/masking/ui/MaskingPage.tsx#L14) |

### src/pages/profile/ui/ProfilePage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| p | My account | [13행](../src/pages/profile/ui/ProfilePage.tsx#L13) |
| h1 | 내 정보 | [13행](../src/pages/profile/ui/ProfilePage.tsx#L13) |
| p | 나의 학습 공간을 관리해요. | [13행](../src/pages/profile/ui/ProfilePage.tsx#L13) |
| span | Molip Study | [14행](../src/pages/profile/ui/ProfilePage.tsx#L14) |
| span | 내 스크립트 | [16행](../src/pages/profile/ui/ProfilePage.tsx#L16) |
| span | 완료한 학습 | [17행](../src/pages/profile/ui/ProfilePage.tsx#L17) |
| span | 진행 중인 학습 | [18행](../src/pages/profile/ui/ProfilePage.tsx#L18) |
| h2 | 몰입 스터디 | [21행](../src/pages/profile/ui/ProfilePage.tsx#L21) |
| button | 서비스 소개 다시 보기 | [24행](../src/pages/profile/ui/ProfilePage.tsx#L24) |
| p | Molip Script · v | [25행](../src/pages/profile/ui/ProfilePage.tsx#L25) |
| span | v | [25행](../src/pages/profile/ui/ProfilePage.tsx#L25) |

### src/pages/publisher/ui/PublisherPage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| button | 커뮤니티 | [68행](../src/pages/publisher/ui/PublisherPage.tsx#L68) |
| p | 다시 시도 | [69행](../src/pages/publisher/ui/PublisherPage.tsx#L69) |
| p | Publisher | [70행](../src/pages/publisher/ui/PublisherPage.tsx#L70) |
| p | 공개 스크립트 · 팔로워 · 팔로잉 | [70행](../src/pages/publisher/ui/PublisherPage.tsx#L70) |
| h2 | 공개한 스크립트 | [70행](../src/pages/publisher/ui/PublisherPage.tsx#L70) |
| button | 문장 개 | [70행](../src/pages/publisher/ui/PublisherPage.tsx#L70) |
| p | 잠시 후 다시 확인해 주세요. / 현재 공개 중인 스크립트가 없어요. | [70행](../src/pages/publisher/ui/PublisherPage.tsx#L70) |
| p | 게시자를 찾을 수 없어요. | [70행](../src/pages/publisher/ui/PublisherPage.tsx#L70) |

### src/pages/result/ui/ResultPage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| h2 | 퀴즈 결과를 찾을 수 없습니다. | [22행](../src/pages/result/ui/ResultPage.tsx#L22) |
| p | 삭제되었거나 아직 저장된 받아쓰기 기록이 없습니다. | [22행](../src/pages/result/ui/ResultPage.tsx#L22) |
| button | 스크립트로 돌아가기 | [22행](../src/pages/result/ui/ResultPage.tsx#L22) |
| button | 스크립트로 | [33행](../src/pages/result/ui/ResultPage.tsx#L33) |
| p | Quiz Result | [33행](../src/pages/result/ui/ResultPage.tsx#L33) |
| h1 | 받아쓰기 결과 | [33행](../src/pages/result/ui/ResultPage.tsx#L33) |
| p | · · | [33행](../src/pages/result/ui/ResultPage.tsx#L33) |
| small | 정답률 | [34행](../src/pages/result/ui/ResultPage.tsx#L34) |
| span | 점수 | [38행](../src/pages/result/ui/ResultPage.tsx#L38) |
| strong | / | [38행](../src/pages/result/ui/ResultPage.tsx#L38) |
| small | 맞힌 문장 | [38행](../src/pages/result/ui/ResultPage.tsx#L38) |
| span | 틀린 문장 | [39행](../src/pages/result/ui/ResultPage.tsx#L39) |
| small | 다시 확인할 문장 | [39행](../src/pages/result/ui/ResultPage.tsx#L39) |
| span | 틀린 단어 | [40행](../src/pages/result/ui/ResultPage.tsx#L40) |
| small | 기록된 취약 단어 | [40행](../src/pages/result/ui/ResultPage.tsx#L40) |
| h2 | 학습 요약 | [44행](../src/pages/result/ui/ResultPage.tsx#L44) |
| p | 총 문장 중 문장을 맞혔고, 문장은 다시 연습이 필요합니다. | [46행](../src/pages/result/ui/ResultPage.tsx#L46) |
| span | 개 | [50행](../src/pages/result/ui/ResultPage.tsx#L50) |
| p | 기록된 틀린 단어가 없습니다. | [51행](../src/pages/result/ui/ResultPage.tsx#L51) |
| strong | . | [62행](../src/pages/result/ui/ResultPage.tsx#L62) |
| small | 틀린 단어: | [62행](../src/pages/result/ui/ResultPage.tsx#L62) |
| button | 틀린 문제 다시 풀기 / 틀린 문제 없음 | [69행](../src/pages/result/ui/ResultPage.tsx#L69) |
| button | 스크립트 보기 | [70행](../src/pages/result/ui/ResultPage.tsx#L70) |
| button | 결과 삭제 | [71행](../src/pages/result/ui/ResultPage.tsx#L71) |

### src/pages/script/ui/ScriptPage.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| button | 내 스크립트 | [35행](../src/pages/script/ui/ScriptPage.tsx#L35) |
| p | 문장 개 · 최근 열람 | [35행](../src/pages/script/ui/ScriptPage.tsx#L35) |
| button | 학습 내역 | [38행](../src/pages/script/ui/ScriptPage.tsx#L38) |
| button | 학습하기 | [39행](../src/pages/script/ui/ScriptPage.tsx#L39) |
| p | Continue | [45행](../src/pages/script/ui/ScriptPage.tsx#L45) |
| h2 | 학습 이어하기 | [45행](../src/pages/script/ui/ScriptPage.tsx#L45) |
| span | 개 | [45행](../src/pages/script/ui/ScriptPage.tsx#L45) |
| strong | 받아쓰기 / 마스킹 학습 / 플래시카드 | [55행](../src/pages/script/ui/ScriptPage.tsx#L55) |
| span | · / · 저장 | [55행](../src/pages/script/ui/ScriptPage.tsx#L55) |
| button | 이어하기 | [57행](../src/pages/script/ui/ScriptPage.tsx#L57) |
| h2 | 스크립트 본문 | [69행](../src/pages/script/ui/ScriptPage.tsx#L69) |
| button | 해석 | [69행](../src/pages/script/ui/ScriptPage.tsx#L69) |
| p | 취약 | [78행](../src/pages/script/ui/ScriptPage.tsx#L78) |

### src/shared/ui/index.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| button | 학습 Tip | [71행](../src/shared/ui/index.tsx#L71) |
| p | Tip | [73행](../src/shared/ui/index.tsx#L73) |
| span | 학습 공간을 준비하고 있어요. | [107행](../src/shared/ui/index.tsx#L107) |
| p | 학습 공간을 준비하고 있어요 | [112행](../src/shared/ui/index.tsx#L112) |

### src/widgets/navigation/ui/AppShell.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| button | Molip Study 몰입 스크립트 | [41행](../src/widgets/navigation/ui/AppShell.tsx#L41) |
| small | Molip Study | [43행](../src/widgets/navigation/ui/AppShell.tsx#L43) |
| button | 홈 | [46행](../src/widgets/navigation/ui/AppShell.tsx#L46) |
| button | 내 스크립트 | [47행](../src/widgets/navigation/ui/AppShell.tsx#L47) |
| button | 커뮤니티 | [48행](../src/widgets/navigation/ui/AppShell.tsx#L48) |
| summary | 몰입 스터디 서비스 | [53행](../src/widgets/navigation/ui/AppShell.tsx#L53) |
| button | 서비스 소개 | [56행](../src/widgets/navigation/ui/AppShell.tsx#L56) |
| button | 오늘도, 한 문장 더. | [62행](../src/widgets/navigation/ui/AppShell.tsx#L62) |
| button | 로그인 | [66행](../src/widgets/navigation/ui/AppShell.tsx#L66) |
| button | 몰입 스크립트 | [73행](../src/widgets/navigation/ui/AppShell.tsx#L73) |
| span | 내 정보 | [86행](../src/widgets/navigation/ui/AppShell.tsx#L86) |

### src/widgets/project-credit/ui/ProjectCredit.tsx

| 종류 | 문구 | 위치 |
| --- | --- | --- |
| span | Created by @z1hxn | [15행](../src/widgets/project-credit/ui/ProjectCredit.tsx#L15) |
| small | Created by | [15행](../src/widgets/project-credit/ui/ProjectCredit.tsx#L15) |
| strong | @z1hxn | [15행](../src/widgets/project-credit/ui/ProjectCredit.tsx#L15) |


## 부록 B · 단계별 도움말 제목과 설명

위치: `src/features/guide/Guide.tsx`. 각 화면 첫 안내와 수동 도움말에 표시되는 제목·본문입니다.

### 도움말 · home

**나만의 문장으로 배우는 영어**<br>
플래시카드, 받아쓰기, 마스킹으로 한 문장을 여러 방식으로 익혀요.

위치: [src/features/guide/Guide.tsx:8](../src/features/guide/Guide.tsx#L8)

**커뮤니티**<br>
누구나 공개 스크립트를 둘러보고 원문을 미리 볼 수 있어요.

위치: [src/features/guide/Guide.tsx:9](../src/features/guide/Guide.tsx#L9)

**내 스크립트**<br>
로그인하면 나만의 스크립트를 만들고 학습을 이어갈 수 있어요.

위치: [src/features/guide/Guide.tsx:10](../src/features/guide/Guide.tsx#L10)

**마이 메뉴**<br>
로그인과 회원가입, 계정 관리는 이곳에서 시작해요.

위치: [src/features/guide/Guide.tsx:11](../src/features/guide/Guide.tsx#L11)

**바로 체험해 보세요**<br>
가입 없이 전용 스크립트로 세 가지 학습을 이용할 수 있어요. 체험 기록은 저장되지 않아요.

위치: [src/features/guide/Guide.tsx:12](../src/features/guide/Guide.tsx#L12)

### 도움말 · about

**나만의 문장으로 배우는 영어**<br>
플래시카드, 받아쓰기, 마스킹으로 영어 본문을 효율적으로 암기하세요.

위치: [src/features/guide/Guide.tsx:15](../src/features/guide/Guide.tsx#L15)

**무료 체험**<br>
전용 스크립트로 세 가지 학습을 체험할 수 있어요.

위치: [src/features/guide/Guide.tsx:16](../src/features/guide/Guide.tsx#L16)

### 도움말 · editor

**문장 추가**<br>
문장 사이의 + 버튼으로 한글 뜻과 영어 문장을 추가해요.

위치: [src/features/guide/Guide.tsx:19](../src/features/guide/Guide.tsx#L19)

**카드와 원문 편집**<br>
문장 카드와 원문 편집을 자유롭게 전환할 수 있어요.

위치: [src/features/guide/Guide.tsx:20](../src/features/guide/Guide.tsx#L20)

**문장 순서 변경**<br>
손잡이를 끌거나 위아래 방향키로 문장을 옮기세요.

위치: [src/features/guide/Guide.tsx:21](../src/features/guide/Guide.tsx#L21)

**제외 단어 설정**<br>
받아쓰기의 빈칸에서 제외할 단어 위치를 선택해요.

위치: [src/features/guide/Guide.tsx:22](../src/features/guide/Guide.tsx#L22)

**저장**<br>
편집을 마쳤다면 저장 버튼으로 내 스크립트에 보관하세요.

위치: [src/features/guide/Guide.tsx:23](../src/features/guide/Guide.tsx#L23)

### 도움말 · flashcard

**문장 공개**<br>
카드를 누르거나 Space 키를 눌러 영어 문장을 확인해요.

위치: [src/features/guide/Guide.tsx:26](../src/features/guide/Guide.tsx#L26)

**기억 여부 평가**<br>
다시 연습과 기억했어요로 평가하세요. 좌우 방향키도 사용할 수 있어요.

위치: [src/features/guide/Guide.tsx:27](../src/features/guide/Guide.tsx#L27)

**취약 단어 기록**<br>
단어 기록을 켜면 다시 연습을 선택한 뒤 어려운 단어를 골라 저장할 수 있어요.

위치: [src/features/guide/Guide.tsx:28](../src/features/guide/Guide.tsx#L28)

**문장 별표**<br>
다시 보고 싶은 문장에 별표를 남기고 별표 범위로 학습하세요.

위치: [src/features/guide/Guide.tsx:29](../src/features/guide/Guide.tsx#L29)

### 도움말 · dictation

**빈칸 입력**<br>
가려진 단어를 입력하세요. Enter로 다음 빈칸으로 이동해요.

위치: [src/features/guide/Guide.tsx:32](../src/features/guide/Guide.tsx#L32)

**채점**<br>
문장을 완성한 뒤 채점하기를 눌러 확인하세요.

위치: [src/features/guide/Guide.tsx:33](../src/features/guide/Guide.tsx#L33)

**결과 수정**<br>
채점 후 오답 옆의 정답을 누르면 정답 처리로 수정할 수 있어요.

위치: [src/features/guide/Guide.tsx:34](../src/features/guide/Guide.tsx#L34)

**오답 재학습**<br>
모든 문장을 마치면 결과 화면에서 틀린 문제만 다시 풀 수 있어요.

위치: [src/features/guide/Guide.tsx:35](../src/features/guide/Guide.tsx#L35)

### 도움말 · masking

**단어 공개와 가리기**<br>
단어마다 눌러서 공개하고, 다시 눌러 가리세요.

위치: [src/features/guide/Guide.tsx:38](../src/features/guide/Guide.tsx#L38)

**전체 공개**<br>
문장 전체를 공개하거나 한 번에 다시 가릴 수 있어요.

위치: [src/features/guide/Guide.tsx:39](../src/features/guide/Guide.tsx#L39)

**맞음과 틀림 평가**<br>
문장을 떠올린 뒤 맞았어요 또는 틀렸어요를 선택하세요. 회원은 평가와 진행 상황이 저장되고 틀린 문장을 복습할 수 있어요.

위치: [src/features/guide/Guide.tsx:40](../src/features/guide/Guide.tsx#L40)

**취약 단어 기록**<br>
어려웠던 단어를 선택해 기존 취약 단어 기록에 함께 보관하세요. 체험에서는 저장되지 않아요.

위치: [src/features/guide/Guide.tsx:41](../src/features/guide/Guide.tsx#L41)


## 부록 C · 학습 Tip 문구

위치: `src/shared/ui/index.tsx`의 `tips`.

### Tip · script

- 밑줄이 표시된 단어는 이전 학습에서 어려웠던 단어예요. 학습 설정에서 취약 문장만 골라 복습할 수 있어요.
- 퀴즈 내역에서 지난 점수를 확인하고, 틀린 문제를 다시 풀어 보세요.

### Tip · flashcard

- ← 다시 연습 · → 기억했어요 · ↑ 이전 · ↓ 다음 단축키를 바로 사용할 수 있어요.
- Space를 눌러 영어 문장을 확인하세요.
- 단어 선택에서는 ← / →로 이동하고 Enter로 기록, Esc로 넘길 수 있어요.
- ‘다시 연습’을 선택하면 어려운 문장과 단어를 다음 학습에 활용할 수 있어요.

### Tip · dictation

- ← 이전 단어 · → 다음 단어 · ↑ 이전 문장 · ↓ 다음 문장으로 이동해요. 입력한 답은 그대로 유지돼요.
- Enter를 누르면 다음 빈칸으로 이동하고, 마지막 빈칸에서는 채점해요.
- 채점한 빈칸을 누르면 정답과 오답을 직접 바꿀 수 있어요. 키보드에서는 Space를 누르세요.

### Tip · graded

- 채점한 빈칸을 누르면 정답 ↔ 오답을 바꿀 수 있어요. 변경한 결과는 학습 기록에도 반영돼요.
- ← 이전 단어 · → 다음 단어 · ↑ 이전 문장 · ↓ 다음 문장으로 이동할 수 있어요.

### Tip · community

- 마음에 드는 스크립트를 내 스크립트에 담으면 플래시카드와 받아쓰기로 학습할 수 있어요.


## 부록 D · README 소개 문구

README는 서비스 설명과 사진 중심으로 정리했고 개발 내용은 `docs/DEVELOPMENT.md`로 이동했습니다. 화면 문구와 별도로 검토할 수 있도록 현재 README 원문을 아래에 보관합니다.

````markdown
<p align="center">
  <img src="public/logo/logo.png" width="96" alt="몰입 스크립트 로고" />
</p>

<h1 align="center">몰입 스크립트</h1>

<p align="center">
  영어 본문을 문장별로 나누어 플래시카드, 받아쓰기, 마스킹으로 암기하는 학습 서비스입니다.
</p>

## 어떤 서비스인가요?

암기할 영어 본문을 스크립트로 만들고 세 가지 방법으로 반복 학습할 수 있습니다. 어려운 단어와 문장을 기록하고, 저장한 위치에서 다시 이어갈 수 있습니다.

- **플래시카드**: 한글 뜻을 보고 영어를 떠올린 뒤, 기억 여부를 평가합니다.
- **받아쓰기**: 영어 문장의 빈칸을 채우고 채점합니다. 결과를 수정하거나 틀린 문제만 다시 풀 수 있습니다.
- **마스킹 학습**: 가려진 단어를 하나씩 공개하거나 다시 가리며 연습합니다. 맞음·틀림 평가와 취약 단어 기록을 지원합니다.
- **학습 관리**: 학습 범위를 선택하고 취약 문장·단어와 별표를 모아 복습합니다.
- **커뮤니티**: 공개 스크립트를 검색하고 내 스크립트에 담을 수 있습니다. 좋아요, 댓글, 게시자 팔로우도 지원합니다.
- **비회원 체험**: 가입 없이 전용 스크립트로 세 가지 학습을 체험할 수 있습니다. 체험 기록은 저장되지 않습니다.

## 실제 서비스 화면

아래 사진은 실제 서비스 사용 화면입니다. 사진 속 스크립트와 학습 수치는 촬영 당시의 예시입니다.

### 학습 대시보드

홈에서 진행 중인 학습을 모드별로 이어가고, 복습이 필요한 문장을 확인할 수 있습니다. 홈은 최근 학습 최대 3개를 표시하며 더 보기에서 전체 목록을 확인합니다.

[![몰입 스크립트 학습 대시보드](public/screenshots/home.png)](public/screenshots/home.png)

### 세 가지 학습 방법

사진을 누르면 원본 크기로 볼 수 있습니다.

| 플래시카드 | 받아쓰기 | 마스킹 학습 |
| --- | --- | --- |
| [![플래시카드 실제 화면](public/screenshots/flashcard.png)](public/screenshots/flashcard.png) | [![받아쓰기 실제 화면](public/screenshots/dictation.png)](public/screenshots/dictation.png) | [![마스킹 학습 실제 화면](public/screenshots/masking.png)](public/screenshots/masking.png) |
| 뜻을 보고 문장을 회상한 뒤 기억 여부를 평가합니다. | 빈칸을 채우고 정답과 오답을 확인합니다. | 필요한 단어만 공개하며 문장을 연습합니다. |

### 모바일 커뮤니티

휴대폰에서도 공개 스크립트를 검색하고 살펴볼 수 있습니다. PC에서는 목록형과 카드형 중 원하는 보기를 선택할 수 있습니다.

<a href="public/screenshots/community-mobileview.png"><img src="public/screenshots/community-mobileview.png" width="320" alt="몰입 스크립트 모바일 커뮤니티 화면" /></a>

## 시작하는 방법

1. 로그인 없이 체험용 스크립트로 학습 방법을 살펴봅니다.
2. 내 자료를 학습하려면 가입하거나 로그인합니다.
3. 내 스크립트에서 영어 본문을 추가하거나 커뮤니티의 공개 자료를 담습니다.
4. 플래시카드·받아쓰기·마스킹 중 학습 방법과 범위를 선택합니다.
5. 저장된 학습을 이어가거나 취약 문장을 다시 연습합니다.

PC와 모바일을 지원하며, 홈 화면에 추가해 앱처럼 실행할 수 있습니다.

## 만든 사람

Created by [@z1hxn](https://github.com/z1hxn) · [Molip Script](https://github.com/molipstudy/Molip-Script)

````
