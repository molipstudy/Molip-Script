import type { ReactNode } from 'react'
import { AsyncButton, Icon, IconButton, Progress } from '../../../shared/ui'

type Props = {
  title: string
  index: number
  total: number
  progress: number
  done?: boolean
  previousDisabled?: boolean
  nextDisabled?: boolean
  exitLabel: string
  onExit: () => Promise<unknown>
  onSettings: () => void
  onMove: (direction: -1 | 1) => Promise<unknown>
  children?: ReactNode
}

export function StudyHeader({ title, index, total, progress, done, previousDisabled, nextDisabled, exitLabel, onExit, onSettings, onMove, children }: Props) {
  return <>
    <div className="study-header study-toolbar">
      <div className="study-toolbar-tools mobile-relocated">
        <AsyncButton className="study-exit text-btn" onAction={onExit}><Icon name="logout" />{exitLabel}</AsyncButton>
        <IconButton icon="settings" label="학습 설정" onClick={onSettings} />
      </div>
      <div className="study-toolbar-title"><strong className="mobile-relocated">{title}</strong><span>{Math.min(index + 1, total)} / {total}</span></div>
      <div className="study-toolbar-navigation">
        <AsyncButton className="icon-btn" aria-label="이전 문장" disabled={done || index <= 0 || previousDisabled} onAction={() => onMove(-1)}><Icon name="back" /></AsyncButton>
        <AsyncButton className="icon-btn" aria-label="다음 문장" disabled={done || index >= total - 1 || nextDisabled} onAction={() => onMove(1)}><Icon name="arrow" /></AsyncButton>
      </div>
    </div>
    <Progress value={progress} total={total} />
    {children && <div className="study-options">{children}</div>}
  </>
}
