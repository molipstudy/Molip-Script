# 디스코드 운영 알림 연결

아직 웹훅을 설정하지 않았다면 아래 설정 후 활성화합니다. 프런트엔드 배포나 데이터 초기화는 필요 없습니다. 알림용 파일은 별도로 GitHub main에 반영해야 합니다.

## 채널 구성

| 채널 | 알림 원천 | 보관할 비밀 설정 |
| --- | --- | --- |
| 신규-가입자 | Supabase의 새 서비스 프로필 | Supabase Vault: `molip_script_signup_discord_webhook_url` |
| github-알림 | main 푸시 | GitHub Actions Secret: `DISCORD_GITHUB_WEBHOOK_URL` |
| 배포-알림 | GitHub에 기록된 Vercel 성공·실패 상태 | GitHub Actions Secret: `DISCORD_DEPLOY_WEBHOOK_URL` |
| 문의-접수 | 추후 문의 기능에서 연결 | Supabase Vault: `molip_script_inquiry_discord_webhook_url` |
| 운영-메모 | 운영자가 직접 작성 | 없음 |

각 채널 설정 → 연동 → 웹훅에서 하나씩 생성합니다. 한 채널에서 모두 받으려면 같은 웹훅 URL을 각 설정에 넣어도 됩니다. 운영 알림은 운영진만 보는 채널을 권장합니다. 웹훅 주소는 채팅·소스·README·VITE 환경 변수에 넣지 않습니다.

## 커밋·배포 알림

1. [저장소 Actions 비밀 설정](https://github.com/molipstudy/Molip-Script/settings/secrets/actions)에 `DISCORD_GITHUB_WEBHOOK_URL`, `DISCORD_DEPLOY_WEBHOOK_URL`을 각각 등록합니다.
2. `.github/workflows/discord-notifications.yml`과 `scripts/notifications/discord.mjs`를 main에 반영합니다.
3. GitHub Actions → **Discord notifications** → **Run workflow** → main을 선택하면 github-알림 채널로 연결 확인 메시지를 보냅니다.
4. 다음 main 푸시부터 커밋 알림이 전송됩니다. 한 푸시의 커밋을 한 메시지로 묶고 최근 8개를 보여줍니다.
5. 배포 알림은 `Vercel` 커밋 상태가 `success`, `failure`, `error`가 될 때 보냅니다. 대기 상태와 다른 검사 결과는 보내지 않습니다. 알림 실패는 서비스 배포를 차단하지 않습니다.

**배포 알림의 범위:** 현재 서비스에서 실제 확인한 GitHub Vercel 커밋 상태를 사용합니다. 운영/미리보기 구분을 임의로 표시하지 않습니다. GitHub 상태를 갱신하지 않는 별도 CLI 배포는 이 방식으로 감지되지 않습니다. 플랜 제한으로 자동 배포가 실패한 후 수동 배포에 성공하면 실패와 성공 알림이 모두 올 수 있습니다. 워크플로 재실행도 메시지를 다시 보냅니다.

## 신규 가입 알림

1. Supabase Dashboard → Database → Extensions에서 `pg_net`을 활성화하고 Vault 사용 가능 여부를 확인합니다.
2. Vault에서 `molip_script_signup_discord_webhook_url` 이름으로 신규-가입자 채널의 웹훅 주소를 저장합니다.
3. SQL Editor에서 저장소 루트의 `discord-notifications-upgrade.sql`만 실행합니다. 기존 `supabase.sql`을 재실행할 필요가 없습니다.
4. 다음 SQL로 연결을 테스트합니다. 고정 ID 대신 매번 새 ID를 사용하므로 실제 가입 데이터를 만들지 않습니다.

```sql
select molip_notifications.send_event(
  'test', gen_random_uuid()::text,
  '가입 알림 연결 확인', '신규 가입 알림 채널이 연결됐어요.'
) as request_id;
```

결과의 request_id는 **전송 대기열 등록**을 의미합니다. 실제 응답은 트랜잭션 종료 후 아래 쿼리에서 확인합니다. Discord 메시지 수신도 직접 확인합니다.

```sql
select id, status_code, timed_out, error_msg, created
from net._http_response
order by created desc limit 10;
```

`molip_script.profiles` 최초 INSERT를 서비스 가입 완료로 봅니다. 로그인·프로필 수정에는 알림을 보내지 않습니다. 같은 사용자 ID로 프로필이 다시 만들어져도 중복 발송하지 않으며 기존 회원은 설치 시 조용히 제외합니다. 메일 인증 전 auth 계정 생성 자체는 알리지 않습니다. 이메일·비밀번호·사용자 ID를 Discord에 보내지 않습니다.

기존 학습 데이터와 RLS 정책은 변경하지 않습니다. 알림은 별도 비공개 스키마에서 실행하며 앱 사용자는 알림 함수를 호출할 수 없습니다. 주소 미설정이나 전송 대기열 등록 오류가 있어도 가입은 계속됩니다. Discord 장애나 제한으로 비동기 요청이 실패한 경우 자동 재시도는 하지 않습니다. 이벤트 기록의 request_id로 응답을 확인할 수 있으며 pg_net 응답은 영구 보관이 아닙니다.

## 문의 기능 연결 시

문의 기능 자체는 아직 구현하지 않습니다. 문의 저장이 성공한 뒤 **서버/DB 내부에서만** 아래 함수를 호출하도록 붙일 수 있습니다. 같은 문의 ID는 한 번만 대기열에 등록됩니다. 문의 채널 웹훅은 Vault의 `molip_script_inquiry_discord_webhook_url`로 별도 관리합니다.

```sql
-- 실제 문의 저장 트리거 등 신뢰할 수 있는 서버 측 흐름에서 호출합니다.
-- 본문/이메일 등 개인정보 대신 문의 ID와 관리자 화면에서 확인할 안내만 보냅니다.
select molip_notifications.send_event(
  'inquiry', '실제-문의-ID', '새 문의가 도착했어요',
  '관리자 화면에서 문의를 확인해 주세요.'
);
```

## 알림 끄기

- 커밋·배포: GitHub Actions에서 Discord notifications 워크플로를 비활성화합니다.
- 신규 가입: SQL Editor에서 다음 구문을 실행합니다. 학습 데이터는 유지됩니다.

```sql
drop trigger if exists molip_discord_profile_created on molip_script.profiles;
```

## 참고

- [GitHub status 이벤트](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#status)
- [Supabase pg_net](https://supabase.com/docs/guides/database/extensions/pg_net)
- [Supabase Vault](https://supabase.com/docs/guides/database/vault)
- [Discord 웹훅](https://docs.discord.com/developers/resources/webhook)
