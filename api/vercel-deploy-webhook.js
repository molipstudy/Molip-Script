import { createHmac, timingSafeEqual } from 'node:crypto'
import { Buffer } from 'node:buffer'

export const config = { api: { bodyParser: false } }
const projectId = 'prj_PiLtRjOBuQB9KqdwBHRvBpBV8rla'
const maxBytes = 256 * 1024
const escape = value => String(value ?? '').replace(/[\\*_`~|<>\[\]]/g, '\\$&')

// Best-effort deduplication within a warm Function instance, not a persistent store.
export function createDeliveryCache() {
  const sent = new Map()
  const pending = new Map()
  return async (id, deliver) => {
    const now = Date.now()
    for (const [key, at] of sent) if (now - at > 6 * 60 * 60 * 1000) sent.delete(key)
    if (sent.has(id)) return { duplicate: true }
    if (pending.has(id)) { await pending.get(id); return { duplicate: true } }
    const work = Promise.resolve().then(deliver)
    pending.set(id, work)
    try {
      await work
      if (sent.size >= 1000) sent.delete(sent.keys().next().value)
      sent.set(id, Date.now())
      return { delivered: true }
    } finally { pending.delete(id) }
  }
}
const deliveryCache = createDeliveryCache()
export async function handleWebhook(req, res, { env = process.env, fetcher = fetch, deliverOnce = deliveryCache } = {}) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }) }
  const secret = env.MOLIP_VERCEL_WEBHOOK_SECRET
  const webhook = env.DISCORD_DEPLOY_WEBHOOK_URL
  if (!secret || !/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(webhook ?? '')) return res.status(503).json({ error: 'Webhook is not configured' })
  const signature = req.headers['x-vercel-signature']
  if (typeof signature !== 'string' || !/^[0-9a-f]{40}$/i.test(signature)) return res.status(403).json({ error: 'Invalid signature' })
  if (Number(req.headers['content-length']) > maxBytes) return res.status(413).json({ error: 'Payload too large' })
  const chunks = []
  let size = 0
  try {
    for await (const chunk of req) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += bytes.length
      if (size > maxBytes) return res.status(413).json({ error: 'Payload too large' })
      chunks.push(bytes)
    }
  } catch { return res.status(400).json({ error: 'Invalid body' }) }
  const raw = Buffer.concat(chunks)
  const expected = createHmac('sha1', secret).update(raw).digest()
  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return res.status(403).json({ error: 'Invalid signature' })
  let event
  try { event = JSON.parse(raw.toString('utf8')) } catch { return res.status(400).json({ error: 'Invalid payload' }) }
  if (!event || typeof event !== 'object') return res.status(400).json({ error: 'Invalid payload' })
  const payload = event.payload
  if (event.type !== 'deployment.succeeded' || payload?.target !== 'production' || payload?.project?.id !== projectId) return res.status(200).json({ ignored: true })
  const deploymentId = payload.deployment?.id
  if (typeof deploymentId !== 'string' || !/^dpl_[A-Za-z0-9]{1,160}$/.test(deploymentId)) return res.status(400).json({ error: 'Invalid deployment' })
  const meta = payload.deployment.meta ?? {}
  const sha = /^[0-9a-f]{40}$/i.test(meta.githubCommitSha ?? '') ? meta.githubCommitSha.slice(0, 7) : '정보 없음'
  const body = { allowed_mentions: { parse: [] }, embeds: [{
    title: 'Production 배포 성공', color: 0x18966c,
    description: escape(String(meta.githubCommitMessage ?? '몰입 스크립트 운영 배포가 완료됐어요.').slice(0, 500)),
    url: `https://vercel.com/z1hxn/molip-script/${deploymentId}`,
    fields: [{ name: '커밋', value: sha, inline: true }, { name: '서비스', value: 'https://script.molip.kro.kr', inline: true }],
    footer: { text: 'Molip Script' }, timestamp: new Date().toISOString(),
  }] }
  try {
    const result = await deliverOnce(deploymentId, async () => {
      const url = new URL(webhook)
      url.searchParams.set('wait', 'true')
      const response = await fetcher(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000), redirect: 'error' })
      if (!response.ok) throw new Error('Discord delivery failed')
    })
    return res.status(200).json(result)
  } catch { return res.status(503).json({ error: 'Notification could not be delivered' }) }
}
export default function handler(req, res) { return handleWebhook(req, res) }
