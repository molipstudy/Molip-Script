import { Icon } from '../../../shared/ui'

const PROJECT_URL = 'https://github.com/molipstudy/Molip-Script'

export function ProjectCredit() {
  return (
    <a
      className="project-credit"
      href={PROJECT_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="GitHub에서 Molip Script 프로젝트 보기"
    >
      <Icon name="github" />
      <span><small>Created by</small><strong>@z1hxn</strong></span>
    </a>
  )
}
