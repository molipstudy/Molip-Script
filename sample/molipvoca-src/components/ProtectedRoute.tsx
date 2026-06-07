import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/authStore'
import PageSkeleton from '@/shared/ui/PageSkeleton'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return <PageSkeleton cards={3} />
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
