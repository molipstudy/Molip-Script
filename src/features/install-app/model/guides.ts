export const installGuides = {
  safari: {
    label: 'Safari', device: 'iPhone · iPad',
    steps: [
      ['공유 버튼을 눌러요', 'Safari 도구 막대의 공유 아이콘(↑)을 눌러 주세요. 메뉴 안에 있을 수도 있어요.'],
      ['홈 화면에 추가를 선택해요', '공유 목록을 아래로 내려 찾아보세요. 없다면 ‘동작 편집’에서 추가할 수 있어요.'],
      ['이름을 확인하고 추가해요', '‘웹 앱으로 열기’가 보이면 켜 두고, ‘추가’를 누르면 완료!'],
    ],
    source: 'https://support.apple.com/ko-kr/guide/iphone/iphea86e5236/ios',
  },
  chromeAndroid: {
    label: 'Chrome', device: 'Android',
    steps: [
      ['오른쪽 위 메뉴를 열어요', '주소창 옆 더보기(⋮) 버튼을 눌러 주세요.'],
      ['홈 화면에 추가를 눌러요', '메뉴에서 ‘홈 화면에 추가’ 또는 ‘앱 설치’를 선택해 주세요.'],
      ['설치를 완료해요', '안내 창에서 ‘설치’ 또는 ‘추가’를 누른 뒤 홈 화면에서 아이콘을 찾아보세요.'],
    ],
    source: 'https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=ko',
  },
  samsung: {
    label: '삼성 인터넷', device: 'Android',
    steps: [
      ['브라우저 메뉴를 열어요', '화면 아래 메뉴(☰) 버튼을 눌러 주세요.'],
      ['현재 페이지를 추가해요', '‘현재 페이지 추가’ 또는 ‘페이지 추가’를 누르고 ‘홈 화면’을 선택해 주세요.'],
      ['추가 버튼을 눌러요', '이름을 확인한 뒤 ‘추가’를 눌러 주세요. 주소창에 설치 아이콘이 보이면 바로 설치할 수도 있어요.'],
    ],
    source: 'https://samsunginternet.github.io/docs/homescreen',
  },
  chromeIos: {
    label: 'Chrome', device: 'iPhone · iPad',
    steps: [
      ['주소창 옆 공유를 눌러요', 'Chrome 주소창 오른쪽의 공유 아이콘(↑)을 눌러 주세요.'],
      ['홈 화면에 추가를 찾아요', '공유 목록에서 ‘홈 화면에 추가’를 선택해 주세요.'],
      ['이름을 확인하고 추가해요', '‘몰입 스크립트’를 확인하고 ‘추가’를 눌러 주세요. 메뉴가 없다면 Safari에서 열어 진행해 주세요.'],
    ],
    source: 'https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DiOS&hl=ko',
  },
  desktop: {
    label: 'Chrome · Edge', device: 'PC · Mac',
    steps: [
      ['주소창의 설치 아이콘을 찾아요', '주소창 오른쪽에 앱 설치 아이콘이 보이면 눌러 주세요.'],
      ['메뉴에서도 설치할 수 있어요', 'Chrome: 더보기 → 전송, 저장 및 공유 → 페이지를 앱으로 설치. Edge: 더보기 → 기타 도구 → 앱 → 이 사이트를 앱으로 설치.'],
      ['설치하고 바로 실행해요', '설치 창에서 이름을 확인하고 ‘설치’를 눌러 주세요. 앱 목록에서 다시 실행할 수 있어요.'],
    ],
    source: 'https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DDesktop&hl=ko',
  },
  safariMac: {
    label: 'Safari', device: 'Mac',
    steps: [
      ['Safari에서 사이트를 열어요', 'macOS Sonoma 이상에서 사용할 수 있어요.'],
      ['Dock에 추가를 선택해요', '상단 ‘파일’ 메뉴 또는 공유 버튼에서 ‘Dock에 추가’를 눌러 주세요.'],
      ['추가하고 Dock에서 실행해요', '앱 이름을 확인하고 ‘추가’를 누르면 Dock에 아이콘이 생겨요.'],
    ],
    source: 'https://support.apple.com/ko-kr/104996',
  },
} as const

export type InstallGuideId = keyof typeof installGuides

export function detectInstallBrowser() {
  const ua = navigator.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  const embedded = /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|; wv\)/i.test(ua)
  const guide: InstallGuideId = ios ? (/CriOS/.test(ua) ? 'chromeIos' : 'safari')
    : /SamsungBrowser/.test(ua) ? 'samsung'
      : /Android/.test(ua) ? 'chromeAndroid'
        : /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua) ? 'safariMac' : 'desktop'
  return { guide, embedded }
}
