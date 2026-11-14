# 몰입 스터디 관리자

## 권한 구조

공통 로그인 주체는 기존 `auth.users.id`를 그대로 사용합니다. Supabase의 관리형 `auth` 스키마를 확장하지 않고, 별도 비공개 `molip_profiles.admin_grants`에서 관리자 권한을 관리합니다.

- `scope = 'global'`: 몰입 스터디 전역 관리자. 공통 인증 계정 전체 조회 가능.
- `scope = 'molip-script'`: 몰입 스크립트 관리자. `molip_profiles.service_registrations`에 `molip-script` 이용 기록이 있는 회원만 조회 가능.
- 이후 서비스는 자기 RPC에서 `molip_profiles.has_access('서비스키')`를 확인하는 어댑터를 추가합니다. 다른 서비스 테이블을 이번 SQL이 만들거나 조회하지 않습니다.

사용자 메타데이터나 프런트엔드 값으로 관리자 여부를 결정하지 않습니다. 앱에서 권한을 수정할 수 없으며 모든 회원 조회 RPC와 통계 API가 요청마다 권한을 검증합니다. `anon`은 관리자 RPC를 실행할 수 없고, 일반 회원은 목록·상세 조회 시 권한 오류를 받습니다. 관리자 테이블은 RLS 활성화, 클라이언트 권한 없음, Data API에 노출할 필요 없음입니다. 기존 회원·학습 테이블의 RLS는 변경하지 않습니다.

## 적용 순서

공용 프로필 1차 이전은 이미 적용됐습니다. 현재 단일화 작업은 `docs/ACCOUNT_MIGRATION.md`의 준비 → 앱 배포 → 정리 순서를 따릅니다. 아래 1차 이전 SQL을 재실행하지 않습니다.

1. Supabase SQL Editor에서 **`molip-profiles-upgrade.sql`만** 실행합니다. 기존 `supabase.sql`을 재실행하지 않습니다. 공통 프로필과 권한을 이전하고, 기존 `molip_admin`은 참조 교체 후 제거합니다. 기존 프로필 테이블·단어장 외래키는 호환 목적으로 유지합니다. DB 이전을 먼저 적용한 뒤 앱을 배포합니다.
2. 관리자 대상의 UUID를 Supabase Authentication의 Users에서 확인합니다. 아래 UUID를 교체해 필요한 범위 **하나만** 등록합니다.

```sql
-- 전역 관리자. 실제 존재하는 auth.users UUID만 등록할 수 있습니다.
insert into molip_profiles.admin_grants (user_id, scope)
values ('관리자-UUID로-교체'::uuid, 'global')
on conflict do nothing;

-- 스크립트만 관리하려면 위 구문 대신 사용합니다.
-- insert into molip_profiles.admin_grants (user_id, scope)
-- values ('관리자-UUID로-교체'::uuid, 'molip-script')
-- on conflict do nothing;
```

3. 코드 배포 후 해당 계정으로 새로 접속합니다. PC 사이드바, 모바일 내 정보의 관리자 페이지 버튼 또는 `/admin`에서 이용합니다. 등록한 직후 기존 탭에서는 새로고침하면 권한을 다시 확인합니다.
4. 해제 시에는 정확한 UUID·범위를 지정합니다. 관리자 등록 해제는 회원 삭제와 무관합니다.

```sql
-- 해당 계정의 전역 관리자 권한만 해제
 delete from molip_profiles.admin_grants
 where user_id = '관리자-UUID로-교체'::uuid and scope = 'global';
```

일반 계정으로 `/admin`을 직접 열었을 때 목록이 나타나지 않는지, 관리자 등록/해제 후 RPC 접근이 변경되는지 운영 적용 뒤 확인합니다. 운영 DB에서는 구조·정합성 SELECT만 실행했고, 변경 SQL은 실행하지 않았습니다.

## 표시 정보의 출처

| 정보 | 실제 출처 |
| --- | --- |
| 로그인 아이디 | `molip_profiles.profiles.login_id` |
| 이메일 | `auth.users.email` |
| 가입 경로 | `auth.users.raw_user_meta_data.signup_source`의 허용된 세 값. 없으면 미선택 |
| 계정 생성·최근 로그인·이메일 인증 | `auth.users.created_at`, `last_sign_in_at`, `email_confirmed_at` |
| 서비스 가입 | `molip_profiles.service_registrations.joined_at` |
| 보유·공개 스크립트 수 | `scripts`, `community_scripts`의 `owner_id`별 개수 |
| 진행 중·완료 학습 | `active_quizzes`, `dictation_sessions`, `flashcard_sessions` 개수 |

표시 이름은 실제 공통 프로필의 `username`을 사용하며 실명으로 간주하지 않습니다. 가입 경로는 사용자가 직접 선택한 응답이며 권한 판단에 사용하지 않습니다. 이메일 인증 전 계정도 전역 관리자의 공통 계정 목록에 표시될 수 있고, 서비스 프로필이 없으면 프로필 미등록으로 표시합니다. 완료 학습은 문장 수가 아닌 저장된 세션 수입니다. 실제 스크립트 본문, 비밀번호, 인증 토큰, 인증 메타데이터 전체를 관리자 브라우저에 반환하지 않습니다.

회원 검색은 아이디·이메일·UUID의 부분 일치이며, 가입 경로 필터와 25명 단위 페이지를 제공합니다. 다른 계정으로 전환하면 관리자 화면을 분리하여 이전 회원 목록을 재사용하지 않습니다.

## Vercel 방문 통계 연결

`api/admin-analytics.js`는 Vercel 서버에서만 실행합니다. Supabase 공개 키와 현재 사용자의 액세스 토큰으로 `admin_access()`를 호출해 관리자 여부를 확인한 뒤 Vercel 공식 Web Analytics API를 조회합니다. Supabase 서비스 역할 키는 필요 없습니다. 통계·인증 결과는 공유 캐시에 저장하지 않습니다.

Vercel 프로젝트 Settings → Environment Variables에 아래 값을 **서버 전용**으로 설정한 뒤 재배포합니다. 토큰을 채팅·리포지토리·`VITE_*` 변수에 넣지 않습니다.

| 변수 | 값 |
| --- | --- |
| `MOLIP_VERCEL_ANALYTICS_TOKEN` | 해당 프로젝트 Web Analytics 읽기가 가능한 Vercel 토큰 |
| `MOLIP_VERCEL_PROJECT_ID` | `prj_PiLtRjOBuQB9KqdwBHRvBpBV8rla` |
| `MOLIP_VERCEL_TEAM_ID` | `team_GxTXlMTWjJMRtk566lnonTDB` |

회원 인증에는 기존 `VITE_SUPABASE_URL`과 공개 키를 서버에서도 사용하며, 별도 `SUPABASE_URL`, `SUPABASE_ANON_KEY`가 있으면 우선합니다. 기존 `VITE_SUPABASE_SCHEMA` 설정도 동일하게 사용합니다.

최근 7일의 운영 사이트 방문자 수·페이지 조회 수를 표시합니다. Web Analytics 활성화, 해당 기간 수집 데이터와 API 조회 권한이 필요합니다. 미설정·조회 실패는 0으로 바꾸지 않고 연결 상태로 표시합니다. Vite 개발 서버만 실행하면 서버 API는 제공되지 않으며 Vercel 환경에서 최종 연결을 확인해야 합니다. [Vercel 공식 통계 API 안내](https://vercel.com/docs/analytics/web-analytics-api)

## 오류 화면과 HTTP 응답

앱은 React SPA이므로 `/admin`, 잘못된 주소의 초기 HTML은 기존 SPA 재작성으로 제공됩니다. 403·404는 클라이언트 오류 화면이며 해당 HTML의 HTTP 상태를 바꾸는 서버 라우팅은 아닙니다. 서버 통계 API는 비로그인 401·권한 거부 403·조회 실패 5xx를 실제 HTTP 상태로 반환합니다. API 경로는 SPA 재작성에서 제외합니다. 오류 화면에는 권한 테이블·SQL 오류·토큰 등 내부 정보가 나오지 않으며 검색 제외 메타데이터를 적용합니다.
