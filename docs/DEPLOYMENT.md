# 운영 배포

대상: `molipstudy/Molip-Script` main → Vercel `molip-script` → https://script.molip.kro.kr

## 전환 상태

현재 Vercel Git 자동 배포는 Hobby 플랜의 비공개 조직 저장소 제한으로 거절됩니다. 대체 GitHub Actions 설정을 준비했으며, **VERCEL_TOKEN 등록과 첫 실행 검증 전에는 전환 완료가 아닙니다.** 기존 운영 사이트는 유지합니다. 새 흐름의 첫 검증 후 `vercel.json`의 `git.deploymentEnabled`를 false로 설정해 중복 Git 자동 배포를 끕니다.

## 한 번 필요한 설정

1. [Vercel Tokens](https://vercel.com/account/settings/tokens)에서 현재 `z1hxn` 팀에 접근 가능한 배포 토큰을 만듭니다. 필요한 팀으로 범위를 제한하고 만료 기한을 설정합니다.
2. [GitHub Actions Secrets](https://github.com/molipstudy/Molip-Script/settings/secrets/actions)에 `VERCEL_TOKEN`으로 직접 등록합니다. 토큰을 채팅·문서·커밋에 넣지 않습니다.
3. 새 워크플로를 main에 반영한 뒤 Actions → **Deploy production** → **Run workflow** → main을 실행합니다.
4. 배포와 Discord 결과 알림, 실제 사이트 반영을 확인한 뒤 Vercel Git 자동 배포를 해제합니다.

GitHub 기본 요금제의 비공개 저장소에서는 현재 브랜치 보호 설정을 사용할 수 없어, 이 구성의 운영 배포 실행자는 `z1hxn`으로 제한합니다. 다른 계정의 푸시는 커밋 알림만 보내며 운영 배포 작업은 건너뜁니다. 배포 권한 위임이 필요하면 실행자 제한과 저장소 보호 정책을 함께 조정합니다. 토큰은 필요한 인증 단계에만 제공하고 의존성 설치·코드 검사·빌드 명령에는 제공하지 않습니다.

## 이후 배포 흐름

1. `z1hxn`이 main에 서비스 코드·공개 자산·빌드 설정·배포 워크플로 변경을 푸시합니다.
2. 고정 버전의 실행 환경과 Vercel CLI를 설치하고 린트·테스트를 실행합니다.
3. 현재 Vercel 프로젝트의 프로덕션 설정을 불러와 동일한 환경으로 빌드합니다.
4. `--prebuilt --prod --skip-domain`으로 빌드 산출물을 올립니다. 이 단계에서는 운영 도메인을 바꾸지 않습니다.
5. 배포 보호를 유지한 상태에서 인증된 `vercel curl`로 페이지를 받아 로컬 빌드의 시작 파일과 일치하는지 확인합니다.
6. 아직 최신 main 커밋인지 확인하고 같은 빌드를 운영 도메인으로 승격합니다.
7. 실제 운영 페이지가 같은 빌드를 제공하는지 확인합니다.
8. 별도 알림 워크플로가 완료 결과와 실행 내역 링크를 배포 채널로 전송합니다.

문서·SQL·알림 문구만 바꾸면 사이트 배포는 생략됩니다. 필요할 때 Actions에서 수동 실행할 수 있습니다. 같은 운영 대상의 배포는 동시에 진행하지 않습니다. 토큰 만료·도구 오류 등 어느 단계에서든 실패하면 작업이 실패하며 알림에 실행 내역 링크가 포함됩니다.

도메인 반영 전 실패하면 이전 사이트를 유지합니다. 도메인 반영 후 검증 실패는 자동 롤백하지 않으며 실패한 실행과 직전 정상 배포를 확인해 복구합니다. 페이지 확인은 시작 파일 일치 여부를 검사하는 기본 점검이며 로그인·전체 학습 기능의 종단 간 검사를 대체하지 않습니다.

## 복구

새 흐름에 문제가 있으면 **Deploy production**을 일시 비활성화하고 Vercel에서 직전 정상 배포를 확인해 복구합니다. 재배포할 때는 기존 프로덕션 환경과 프로젝트·팀을 유지합니다. Supabase 마이그레이션은 배포 워크플로에서 자동 실행하지 않습니다.

## 근거

- [Vercel Git 자동 배포 제어](https://vercel.com/docs/project-configuration/git-configuration)
- [Vercel 빌드 산출물·도메인 연결 전 배포](https://vercel.com/docs/cli/deploy)
- [보호된 배포의 인증된 페이지 확인](https://vercel.com/docs/cli/curl)
