# Vercel Production 성공 알림

경로: Vercel `deployment.succeeded` → Vercel Function `/api/vercel-deploy-webhook` → Discord.

Supabase와 GitHub Actions는 배포 알림에 사용하지 않습니다. 기존 Supabase 가입 알림과 GitHub 커밋 알림은 그대로 유지합니다.

## 운영 적용 순서

1. 수신 Function 코드를 커밋·푸시해 Vercel에 배포합니다.
2. Vercel 팀 설정 → Webhooks에서 새 웹훅을 등록합니다.
   - 수신 URL: `https://script.molip.kro.kr/api/vercel-deploy-webhook`
   - 프로젝트: `molip-script` (`prj_PiLtRjOBuQB9KqdwBHRvBpBV8rla`)
   - 이벤트: `deployment.succeeded`만 선택
3. Vercel 프로젝트 → Settings → Environment Variables의 **Production**에 다음 두 변수를 저장합니다.
   - `MOLIP_VERCEL_WEBHOOK_SECRET`: 2번에서 Vercel이 생성한 웹훅 서명 Secret
   - `DISCORD_DEPLOY_WEBHOOK_URL`: 배포 채널의 Discord 웹훅 URL
4. 재배포하여 환경변수를 적용하고, 배포 성공 후 Discord 메시지 도착을 확인합니다. Vercel Analytics 토큰과 별개이며 `VITE_` 접두사를 붙이지 않습니다. 비밀값은 채팅·Git·프런트엔드에 노출하지 않습니다.

## 검증 및 전송

- 원문 body의 HMAC-SHA1과 `x-vercel-signature`를 상수 시간 비교로 검증합니다.
- 프로젝트·Production·성공 이벤트·배포 ID를 모두 확인합니다. 실패·Preview는 알리지 않습니다.
- Discord가 메시지 수신을 확인한 뒤 HTTP 200을 반환합니다. 실패·429·시간 초과는 HTTP 503으로 반환하여 Vercel이 재시도할 수 있게 합니다.
- 동시 요청·중복 알림은 **같은 따뜻한 Function 인스턴스 안에서만** 배포 ID로 방지합니다. 별도 저장소를 사용하지 않으므로 재시작·다른 인스턴스로 전달된 재시도까지 영구적으로 중복을 막지는 못합니다.
- 메시지에는 커밋·서비스 주소·배포 상세 링크가 포함되고 Discord 멘션은 비활성화합니다.

## 이미 실행한 Supabase SQL 정리

`sql/notifications/remove-supabase-vercel-relay.sql`을 SQL Editor에서 실행하면 이전에 추가한 `molip_script.queue_vercel_deployment(jsonb)` 함수만 제거합니다. 기존 회원·학습 기록·가입 알림 함수·이벤트 원장은 변경하지 않습니다. 실행하지 않고 남겨둬도 Vercel Function은 이 함수를 호출하지 않습니다.

Supabase Edge Function은 이 작업에서 운영 배포하지 않았습니다. 별도로 직접 배포했다면 `vercel-deploy-notify`만 제거하고, 해당 URL을 가리키는 Vercel 웹훅도 제거합니다. 가입 알림 관련 설정은 유지합니다.

## 표시 버전

웹사이트 표시 버전은 `package.json`의 `version`을 Vite 빌드 시 주입한 값입니다. 이번 버전은 **1.0.1**입니다. 기능 수정·개선을 묶어 출시할 때 patch를 올리고, 같은 코드 재배포·환경변수 수정에는 버전을 올리지 않습니다. 배포 횟수는 Vercel 배포 ID로 구분합니다.

참고: [Vercel 웹훅 설정](https://vercel.com/docs/webhooks), [서명·성공 이벤트 명세](https://vercel.com/docs/webhooks/webhooks-api).
