<p align="center">
  <img src="public/logo/logo.png" width="96" alt="몰입 스크립트 로고" />
</p>

<h1 align="center">몰입 스크립트</h1>

<p align="center">
  나만의 영어 스크립트를 만들고 플래시카드와 받아쓰기로 반복 학습하는 웹 애플리케이션입니다.
</p>

<p align="center">
  <a href="https://github.com/molipstudy/Molip-Script">GitHub</a> · Created by <a href="https://github.com/z1hxn">@z1hxn</a>
</p>

## 주요 기능

- 한글 뜻과 영어 문장으로 구성된 개인 스크립트 생성 및 편집
- 플래시카드와 받아쓰기 학습, 진행 상태 저장 및 이어하기
- 여러 브라우저 탭에서 과거 진행 상태가 최신 기록을 덮어쓰는 상황 방지
- 전체, 취약, 별표, 직접 지정 범위별 학습
- 문장별 별표와 취약 문장·단어 기록
- 받아쓰기 채점 결과 수정과 완료한 학습 내역 확인
- 커뮤니티 스크립트 공유, 미리보기, 내 서재 복사
- PC 사이드바와 모바일 하단 내비게이션을 제공하는 반응형 UI
- iPhone 홈 화면 추가용 앱 아이콘 지원

## 기술 스택

- React 19
- TypeScript 6
- Vite 8
- Supabase Auth, PostgreSQL, Row Level Security
- Feature-Sliced Design

## 시작하기

Node.js와 npm이 설치되어 있어야 합니다.

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`에 Supabase 프로젝트 정보를 입력합니다.

| 환경 변수 | 설명 |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | publishable key를 사용할 때 anon key 대신 설정 |
| `VITE_SUPABASE_SCHEMA` | 앱 스키마 이름. 기본값은 `molip_script` |
| `VITE_MOLIP_TIMER_URL` | 몰입 타이머 링크. 선택 사항 |
| `VITE_MOLIP_VOCA_URL` | 몰입 단어장 링크. 선택 사항 |

Supabase SQL Editor에서 새 프로젝트는 [`supabase.sql`](supabase.sql)을 실행합니다. 기존 설치에서 학습 저장, 플래시카드 이어하기, 문장 별표만 추가하려면 [`learning-progress-upgrade.sql`](learning-progress-upgrade.sql)을 실행합니다. 이후 Supabase의 **Project Settings → Data API → Exposed schemas**에 `molip_script`를 추가하고 Email 로그인을 활성화합니다.

## 스크립트 형식

한 문장은 번호, 한글 뜻, 영어 문장 순서로 입력합니다.

```text
1. 실례합니다. Star 경기장에 어떻게 가나요?
Excuse me, how can I get to the Star Stadium?

2. 지하철을 타고 갈 수 있어요.
You can get there by subway.
```

## 학습 단축키

### 플래시카드

| 키 | 동작 |
| --- | --- |
| `Space` | 영어 문장 공개 |
| `←` | 다시 연습 |
| `→` | 기억했어요 |
| `↑` | 이전 카드 |
| `↓` | 다음 카드 |

플래시카드 화면에 들어가면 카드에 자동으로 포커스되므로 별도의 클릭 없이 단축키를 사용할 수 있습니다. `←`와 `→` 평가는 영어 문장을 공개한 뒤 작동합니다.

어려웠던 단어 선택창에서는 `←` / `→`로 단어를 이동하고, `Enter`로 선택한 단어를 기록하며, `Esc`로 기록 없이 넘길 수 있습니다.

### 받아쓰기

| 키 | 동작 |
| --- | --- |
| `←` / `→` | 이전 / 다음 문장 |
| `Enter` | 다음 빈칸으로 이동하거나 마지막 빈칸 채점 |
| `Space` | 포커스된 채점 결과의 정답 / 오답 전환 |

## 프로젝트 구조

```text
src/
├── app/        # 앱 진입점, 화면 조합, 전역 상태 제어
├── pages/      # 라우트 단위 화면
├── widgets/    # 내비게이션과 크레딧 등 조합 UI
├── features/   # 학습 설정과 사용자 동작
├── entities/   # 스크립트, 학습, 커뮤니티 도메인
└── shared/     # Supabase, 공용 UI, 설정, 유틸리티
```

레이어별 책임과 import 규칙은 [`src/README.md`](src/README.md)에 정리되어 있습니다.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 타입 검사 후 프로덕션 빌드 |
| `npm run lint` | ESLint 검사 |
| `npm run preview` | 프로덕션 빌드 미리보기 |

## 데이터와 보안

사용자 스크립트와 학습 기록은 Supabase에 저장됩니다. 모든 앱 테이블은 RLS 정책으로 로그인한 사용자 본인의 데이터만 수정할 수 있으며, 커뮤니티에는 사용자가 직접 공유한 스크립트 스냅샷만 공개됩니다.

## 만든 사람

[![GitHub](https://img.shields.io/badge/GitHub-%40z1hxn-181717?logo=github)](https://github.com/molipstudy/Molip-Script)

Molip Script is created and maintained by [@z1hxn](https://github.com/z1hxn).
