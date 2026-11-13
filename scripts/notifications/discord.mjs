import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const escape = value => String(value ?? '').replace(/[\\*_`~|<>\[\]]/g, '\\$&')
const cut = (value, size) => String(value ?? '').slice(0, size)
const repositoryUrl = name => /^[-\w.]+\/[-\w.]+$/.test(name ?? '') ? `https://github.com/${name}` : null
const safeLink = value => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ['github.com', 'vercel.com'].includes(url.hostname) ? url.href : undefined
  } catch { return undefined }
}

// Formats only trusted event metadata. No shell interpolation or repository code from event SHAs.
export function notificationFor(eventName, event) {
  const repo = repositoryUrl(event.repository?.full_name)
  if (!repo) return null
  const footer = { text: 'Molip Script' }
  const payload = embed => ({ allowed_mentions: { parse: [] }, embeds: [{ ...embed, footer }] })
  if (eventName === 'push') {
    if (event.deleted || event.ref !== 'refs/heads/main') return null
    const commits = event.commits ?? []
    if (!commits.length) return null
    const lines = commits.slice(-8).map(commit => `\`${cut(commit.id, 7)}\` ${escape(cut(commit.message?.split('\n')[0], 180))}`)
    return payload({ title: '새 커밋이 반영됐어요', color: 0x7059ee, url: safeLink(event.compare) ?? repo,
      description: cut(lines.join('\n'), 3500), fields: [
        { name: '저장소', value: escape(event.repository.full_name), inline: true },
        { name: '브랜치', value: 'main', inline: true },
        { name: '이번 푸시', value: `${commits.length}개 커밋${commits.length > 8 ? ' · 최근 8개 표시' : ''}`, inline: true },
      ] })
  }
  if (eventName === 'status') {
    if (event.context !== 'Vercel' || !['success', 'failure', 'error'].includes(event.state)) return null
    const success = event.state === 'success'
    return payload({ title: success ? '배포에 성공했어요' : '배포에 실패했어요', color: success ? 0x18966c : 0xd9534f,
      url: safeLink(event.target_url) ?? `${repo}/commit/${encodeURIComponent(event.sha ?? '')}`,
      description: escape(cut(event.description, 1000)), fields: [
        { name: '커밋', value: cut(event.sha, 7) || '확인 필요', inline: true },
        { name: '배포 확인', value: 'Vercel 커밋 상태', inline: true },
      ] })
  }
  if (eventName === 'workflow_dispatch') return payload({ title: '알림 연결 확인', color: 0x7059ee, description: 'Molip Script의 디스코드 알림이 연결됐어요.', url: repo })
  return null
}

export async function sendDiscord(webhook, payload, { fetcher = fetch, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  if (!/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(webhook ?? '')) throw new Error('Discord 웹훅 비밀 설정을 확인해 주세요.')
  const url = new URL(webhook)
  url.searchParams.set('wait', 'true')
  for (let attempt = 0; attempt < 3; attempt++) {
    let response
    try {
      response = await fetcher(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) })
    } catch { throw new Error('Discord 연결에 실패했습니다. 네트워크 상태를 확인해 주세요.') }
    if (response.ok) return
    if (response.status === 429 && attempt < 2) {
      const body = await response.json().catch(() => ({}))
      const seconds = Number(body.retry_after ?? 1)
      await sleep(Math.min(30000, Math.max(1000, Number.isFinite(seconds) ? seconds * 1000 : 1000)))
      continue
    }
    // Never log the webhook URL, response body or fetch error (they can contain credentials).
    throw new Error(`Discord 알림 전송 실패 (HTTP ${response.status})`)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'))
    const payload = notificationFor(process.env.GITHUB_EVENT_NAME, event)
    if (payload) {
      const webhook = process.env.GITHUB_EVENT_NAME === 'status'
        ? process.env.DISCORD_DEPLOY_WEBHOOK_URL
        : process.env.DISCORD_GITHUB_WEBHOOK_URL
      await sendDiscord(webhook, payload)
      console.log('Discord 알림 전송 완료')
    } else console.log('알림 대상이 아닌 이벤트입니다.')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
