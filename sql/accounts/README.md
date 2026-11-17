# 가입 및 회원 관리 적용

기존 `email-username-upgrade.sql`과 `../admin/member-edit-upgrade.sql`까지 적용한 운영 DB에서 **`../member-management-upgrade.sql` 하나**를 SQL Editor에서 실행합니다. 전체 작업은 한 트랜잭션으로 적용되며 자동 실행되지 않습니다.

- 신규 Script 가입 시 이름·전화번호·유저네임·가입 경로 검증 및 공용 프로필 저장
- 프로필 편집 시 이름·전화번호 필수, 이미 저장된 이름·전화번호 삭제 금지
- 전역 관리자의 회원 연락처 편집, 보유/공개 스크립트 및 진행 중 학습 조회
- 이메일 변경 API의 전역 관리자 권한 확인용 RPC

기존 회원은 삭제하거나 임의의 정보로 채우지 않습니다. 다른 서비스의 가입 계약은 유지합니다. 가입 폼 배포 전 SQL을 적용해야 이메일 확인 전에도 이름·전화번호가 프로필에 저장됩니다.

관리자 이메일 편집에는 Vercel Production 환경 변수 `SUPABASE_SECRET_KEY` 또는 기존 `SUPABASE_SERVICE_ROLE_KEY`가 필요합니다. 서버 전용 secret/service-role 키를 사용하며 `VITE_` 접두사를 붙이지 않습니다. 공개 publishable/anon 키와 다릅니다.

이메일은 Auth 관리자 API로 변경합니다. 비밀번호·UUID·관리자 권한·이메일 인증 플래그는 변경 요청에 포함하지 않습니다. 이메일 변경 실패 시 다른 프로필 항목의 저장 여부를 따로 안내합니다.
