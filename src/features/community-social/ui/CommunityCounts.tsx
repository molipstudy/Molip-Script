import type { CommunitySummary } from '../../../entities/community'

export function CommunityCounts({ summary, showLikes = true }: { summary?: CommunitySummary; showLikes?: boolean }) {
  if (!summary) return null
  return <span className="community-counts">{showLikes && <span>좋아요 {summary.like_count}</span>}<span title="이 스크립트를 담은 회원 수">담은 수 {summary.collection_count}</span><span>댓글 {summary.comment_count}</span></span>
}
