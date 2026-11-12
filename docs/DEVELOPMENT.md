# 개발 및 운영 안내

README에서 분리한 프로젝트 설치·환경 설정·구조·데이터 변경 안내입니다.

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

Supabase SQL Editor에서 새 프로젝트는 [`supabase.sql`](../supabase.sql)을 실행합니다. 기존 설치에서 학습 저장, 플래시카드 이어하기, 문장 별표만 추가하려면 [`learning-progress-upgrade.sql`](../learning-progress-upgrade.sql)을 실행합니다. 이후 Supabase의 **Project Settings → Data API → Exposed schemas**에 `molip_script`를 추가하고 Email 로그인을 활성화합니다.

기존 설치에 새 에디터의 제외 단어 저장을 추가하려면 [`script-editor-upgrade.sql`](../script-editor-upgrade.sql)을 Supabase SQL Editor에서 실행하세요. 기존 데이터와 권한은 유지됩니다.

## 스크립트 형식

본문·Wrap Up 같은 번호 없는 구분 줄은 문장 카드 전환과 제외 단어 선택에서 자동으로 건너뜁니다. 문장 카드에서 본문을 수정하면 번호가 붙은 문장 쌍으로 정리됩니다.

문장 카드에서는 한글 뜻과 영어 문장을 각각 입력하고, 처음·중간·끝의 + 버튼으로 문장을 삽입합니다. 카드 왼쪽 손잡이를 마우스나 터치로 끌어 순서를 바꾸면 번호와 원문이 함께 갱신됩니다. 손잡이에 포커스를 둔 상태에서 ↑↓ 키로도 이동할 수 있습니다. 원문 편집에서는 아래 형식을 직접 입력합니다. 복사 버튼은 항상 원문 형식으로 복사하며, 제외 단어 설정은 별도 저장됩니다.

‘본문에서 제외 단어 선택’ 버튼을 누르면 전체 한글·영어 본문이 열립니다. 영어 단어를 눌러 제외·해제하고 적용하세요. `W:`, `B:` 같은 반복 표기는 직접 입력으로 문장부호까지 일치하는 현재 본문의 위치를 한 번에 선택할 수 있습니다. `Tim:`을 입력해도 대화 속 `Tim`은 제외되지 않습니다. 적용 후 스크립트를 저장하세요.

제외 설정은 각 문장의 단어 위치별로 저장됩니다. 같은 문장이나 다른 문장에서 같은 단어가 반복돼도 선택한 위치만 제외합니다. 카드 삽입·삭제·순서 변경 시에는 해당 카드의 설정을 유지하고, 영어 문장을 수정한 경우에는 그 문장의 제외 위치를 다시 선택해야 합니다. 직접 입력은 현재 본문을 대상으로 일괄 선택하며 이후 추가한 문장에는 자동 적용하지 않습니다.

새 받아쓰기와 오답 재출제부터 적용되며 이미 저장된 퀴즈의 이어하기·결과는 유지됩니다. 출제 가능한 단어가 없는 문장은 건너뛰고, 모든 문장이 해당하면 안내합니다. 기존에 전체 단어로 저장한 설정은 위치를 복원할 수 없어 더 이상 적용하지 않으므로 에디터에서 다시 선택해 주세요.

저장에는 기존 `excluded_words` 배열을 사용하므로 추가 SQL 마이그레이션은 없습니다. 배열의 각 항목은 `@token/v1/` 접두사와 `[문장 인덱스, 영어 본문, 단어 인덱스]` JSON을 담는 위치 키입니다. 공유·가져오기에도 함께 유지됩니다.

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

레이어별 책임과 import 규칙은 [`src/README.md`](../src/README.md)에 정리되어 있습니다.

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

### 공개 홈 · 비회원 체험 · 마스킹 학습 업데이트

기존 데이터베이스에는 Supabase SQL Editor에서 `public-masking-upgrade.sql`을 실행합니다.
기본 스키마와 기존 학습 진행 업그레이드가 설치된 환경을 대상으로 하며, 기존 행을 삭제하거나 초기화하지 않습니다.
추가되는 항목은 비회원의 공개 커뮤니티 조회 권한, 마스킹 진행 유형, 문장별 `masking_attempts` / `masking_wrong_count`, 완료 기록의 `quiz_type`, 마스킹 취약 단어 유형입니다.
마스킹에서 같은 세션의 문장을 다시 평가하면 기존 평가를 수정하며 평가 횟수를 중복 증가시키지 않습니다.
완료 기록은 기존 학습 기록 테이블을 재사용하되 유형을 구분하여 표시합니다.

체험 스크립트는 `src/entities/script/model/trial.ts`에서 관리합니다. 사용자 서재에 삽입하지 않으며 편집·삭제할 수 없습니다.
체험 학습의 진행과 평가는 메모리에서만 유지되고, 데이터베이스와 브라우저 저장소에 학습 기록을 쓰지 않습니다.
가이드 완료 여부만 `molip-guide-v1:*` 키로 브라우저에 저장됩니다.

검사: `npm run build`, `npm run lint`, `node --test tests/*.test.mjs`.

## 버전 기록

현재 배포 준비 버전은 **v1.0.0**입니다. 주요 기능·UI 변화별 과거 개발 이력과 현재 변경 사항은 [CHANGELOG.md](../CHANGELOG.md)에 정리합니다.

### v1.0.0 커뮤니티 확장

`public-masking-upgrade.sql`을 적용한 뒤 [`community-social-upgrade.sql`](../community-social-upgrade.sql)을 실행합니다.
좋아요·댓글·팔로우는 회원만 변경할 수 있고 비회원은 공개 반응과 게시자 프로필을 조회할 수 있습니다.
‘담은 수’는 해당 공유 스크립트를 담은 고유 회원 수입니다. 기존 개인 스크립트에서 과거의 복사 이력을 추정하지 않으며, 새 RPC로 성공한 담기부터 집계합니다. 개인 복사본은 공유 취소 후에도 유지됩니다.
내 정보의 버전은 `package.json`에서 Vite 빌드 시 주입되며 `Molip Script · v1.0.0`으로 표시됩니다.
