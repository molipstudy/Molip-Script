import { AppRoutes } from '@/app/routes'
import { useAuthStore } from '@/features/auth/model/authStore'
import PageSkeleton from '@/shared/ui/PageSkeleton'

export function App() {
  const { loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen max-w-[680px] mx-auto px-4 py-6">
        <PageSkeleton cards={5} />
      </div>
    )
  }

  return <AppRoutes />
}
