import Skeleton from '@/components/Skeleton'

type PageSkeletonVariant =
  | 'default'
  | 'auth'
  | 'home'
  | 'folder'
  | 'community'
  | 'detail'
  | 'editor'
  | 'settings'
  | 'shared'
  | 'study'
  | 'collaborate'
  | 'account'

interface PageSkeletonProps {
  cards?: number
  variant?: PageSkeletonVariant
}

const cardList = (cards: number) => (
  <div className="space-y-3">
    {Array.from({ length: cards }).map((_, index) => (
      <div key={index} className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    ))}
  </div>
)

export default function PageSkeleton({ cards = 4, variant = 'default' }: PageSkeletonProps) {
  if (variant === 'auth') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-9 w-40 mx-auto" />
            <Skeleton className="h-4 w-52 mx-auto" />
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'home') {
    return (
      <div className="space-y-4 py-2">
        <div className="flex justify-end">
          <Skeleton className="h-11 w-24" />
        </div>
        {cardList(cards)}
      </div>
    )
  }

  if (variant === 'folder' || variant === 'community' || variant === 'shared') {
    return (
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-40" />
        </div>
        {cardList(cards)}
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-28" />
        </div>
        {cardList(cards)}
      </div>
    )
  }

  if (variant === 'editor' || variant === 'settings' || variant === 'collaborate' || variant === 'account') {
    return (
      <div className="space-y-4 py-2">
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-32" />
        </div>
        {cardList(Math.max(1, cards - 1))}
      </div>
    )
  }

  if (variant === 'study') {
    return (
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-28" />
      </div>
      {cardList(cards)}
    </div>
  )
}
