type IconName =
  | 'folder'
  | 'book'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronDown'
  | 'menu'
  | 'globe'
  | 'lock'
  | 'link'
  | 'users'
  | 'user'
  | 'settings'
  | 'home'
  | 'search'
  | 'file'
  | 'xCircle'
  | 'checkCircle'
  | 'alertCircle'
  | 'chart'
  | 'clock'
  | 'refresh'
  | 'play'
  | 'check'
  | 'x'
  | 'bolt'
  | 'logOut'
  | 'undo'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
  strokeWidth?: number
}

export default function Icon({ name, size = 18, strokeWidth = 1.9, className, ...rest }: IconProps) {
  const shared = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  const paths: Record<IconName, React.ReactNode> = {
    folder: (
      <>
        <path {...shared} d="M3 6.5h6l2 2h10v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path {...shared} d="M3 8.5h18" />
      </>
    ),
    book: (
      <>
        <path {...shared} d="M5 4.5h12a2 2 0 0 1 2 2V19H7a2 2 0 0 0-2 2z" />
        <path {...shared} d="M5 4.5v16.5" />
        <path {...shared} d="M8 8.5h8" />
      </>
    ),
    plus: <path {...shared} d="M12 5v14M5 12h14" />,
    edit: (
      <>
        <path {...shared} d="M4 20h4l10-10a2.1 2.1 0 0 0-4-4L4 16v4z" />
        <path {...shared} d="M13.5 6.5l4 4" />
      </>
    ),
    trash: (
      <>
        <path {...shared} d="M4 7h16" />
        <path {...shared} d="M9 7V5h6v2" />
        <path {...shared} d="M7 7l1 13h8l1-13" />
      </>
    ),
    chevronLeft: <path {...shared} d="m15 6-6 6 6 6" />,
    chevronRight: <path {...shared} d="m9 6 6 6-6 6" />,
    chevronDown: <path {...shared} d="m6 9 6 6 6-6" />,
    menu: (
      <>
        <path {...shared} d="M4 7h16" />
        <path {...shared} d="M4 12h16" />
        <path {...shared} d="M4 17h16" />
      </>
    ),
    globe: (
      <>
        <circle {...shared} cx="12" cy="12" r="9" />
        <path {...shared} d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
    lock: (
      <>
        <rect {...shared} x="5" y="11" width="14" height="10" rx="2" />
        <path {...shared} d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
    link: (
      <>
        <path {...shared} d="M10 14a4 4 0 0 1 0-5.7l2.3-2.3a4 4 0 0 1 5.7 5.7l-1.8 1.8" />
        <path {...shared} d="M14 10a4 4 0 0 1 0 5.7l-2.3 2.3a4 4 0 1 1-5.7-5.7L7.8 11" />
      </>
    ),
    users: (
      <>
        <circle {...shared} cx="9" cy="8" r="3" />
        <path {...shared} d="M3 19a6 6 0 0 1 12 0" />
        <circle {...shared} cx="17" cy="9" r="2.5" />
      </>
    ),
    user: (
      <>
        <circle {...shared} cx="12" cy="8" r="4" />
        <path {...shared} d="M4 20a8 8 0 0 1 16 0" />
      </>
    ),
    settings: (
      <>
        <circle {...shared} cx="12" cy="12" r="3" />
        <path {...shared} d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.7-1 1 1 0 0 0-1 .2l-.2.2a2 2 0 1 1-2.8-2.8l.2-.2a1 1 0 0 0 .2-1 1 1 0 0 0-.9-.7H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1l-.2-.2a2 2 0 1 1 2.8-2.8l.2.2a1 1 0 0 0 1 .2 1 1 0 0 0 .7-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z" />
      </>
    ),
    home: (
      <>
        <path {...shared} d="M3 11.5 12 4l9 7.5" />
        <path {...shared} d="M6 10.5V20h12v-9.5" />
      </>
    ),
    search: (
      <>
        <circle {...shared} cx="11" cy="11" r="7" />
        <path {...shared} d="m20 20-3.5-3.5" />
      </>
    ),
    file: (
      <>
        <path {...shared} d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path {...shared} d="M15 3v4h4" />
      </>
    ),
    xCircle: (
      <>
        <circle {...shared} cx="12" cy="12" r="9" />
        <path {...shared} d="m9 9 6 6M15 9l-6 6" />
      </>
    ),
    checkCircle: (
      <>
        <circle {...shared} cx="12" cy="12" r="9" />
        <path {...shared} d="m8.5 12.5 2.5 2.5 4.5-5" />
      </>
    ),
    alertCircle: (
      <>
        <circle {...shared} cx="12" cy="12" r="9" />
        <path {...shared} d="M12 8v5M12 16h.01" />
      </>
    ),
    chart: (
      <>
        <path {...shared} d="M5 20V9M12 20V4M19 20v-7" />
        <path {...shared} d="M3 20h18" />
      </>
    ),
    clock: (
      <>
        <circle {...shared} cx="12" cy="12" r="9" />
        <path {...shared} d="M12 7v5l3 2" />
      </>
    ),
    refresh: (
      <>
        <path {...shared} d="M20 12a8 8 0 0 0-14.5-4.8L3 10" />
        <path {...shared} d="m3 4.5.1 5.5 5.5-.1" />
        <path {...shared} d="M4 12a8 8 0 0 0 14.5 4.8L21 14" />
        <path {...shared} d="M21 19.5 20.9 14l-5.5.1" />
      </>
    ),
    play: <path {...shared} d="m9 7 8 5-8 5z" />,
    check: <path {...shared} d="m5 12 4 4 10-10" />,
    x: <path {...shared} d="m7 7 10 10M17 7 7 17" />,
    bolt: <path {...shared} d="M13 2 5 13h5l-1 9 8-11h-5z" />,
    logOut: (
      <>
        <path {...shared} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path {...shared} d="M16 17l5-5-5-5" />
        <path {...shared} d="M21 12H9" />
      </>
    ),
    undo: (
      <>
        <path {...shared} d="M9 7 4 12l5 5" />
        <path {...shared} d="M20 12a7 7 0 0 0-7-7H6" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}
