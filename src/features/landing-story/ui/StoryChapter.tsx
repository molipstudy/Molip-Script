import type { CSSProperties, ReactNode } from 'react'

type Props = { id: string; nextHref: string; lines: readonly string[]; description?: string; accents?: readonly string[]; children?: ReactNode }
export function StoryChapter({ id, nextHref, lines, description, accents, children }: Props) {
  return <section id={id} className={`story-track ${children ? 'story-track-feature' : ''}`} data-story-track style={{ '--story-steps': lines.length + (children ? 1 : 0) } as CSSProperties} aria-label={lines[0]}>
    <div className="story-sticky">
      <div className="story-frames">{lines.map((line, index) => <div className="story-frame" key={line}>{accents?.[index] && <span className="story-line-accent" aria-hidden="true">{accents[index]}</span>}{index === lines.length - 1 ? <h2>{line}</h2> : <p>{line}</p>}</div>)}</div>
      {children && <div className="story-demo-stage"><h2 className="story-demo-title" aria-hidden="true">{lines.at(-1)}</h2><p className="story-feature-description">{description}</p>{children}</div>}
      <a className="story-chapter-cue" href={nextHref}><span>아래로 스크롤해 계속 보기</span><span aria-hidden="true">↓</span></a>
    </div>
  </section>
}
