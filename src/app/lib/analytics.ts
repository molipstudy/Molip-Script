import type { BeforeSendEvent } from '@vercel/analytics/react'

export const sanitizeAnalyticsEvent = (event: BeforeSendEvent): BeforeSendEvent | null => {
  try {
    const url = new URL(event.url)
    // Authentication callbacks and return destinations can contain private values.
    url.search = ''
    url.hash = ''
    url.username = ''
    url.password = ''
    return { ...event, url: url.toString() }
  } catch {
    return null
  }
}
