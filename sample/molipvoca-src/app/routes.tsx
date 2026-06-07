import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '@/features/auth/ui/ProtectedRoute'
import Layout from '@/widgets/layout/ui/Layout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import FolderPage from '@/pages/FolderPage'
import VocaDetailPage from '@/pages/VocaDetailPage'
import StudySelectPage from '@/pages/StudySelectPage'
import VocaEditorPage from '@/pages/VocaEditorPage'
import VocaSettingsPage from '@/pages/VocaSettingsPage'
import FlashcardPage from '@/pages/FlashcardPage'
import MultipleChoicePage from '@/pages/MultipleChoicePage'
import WritingPage from '@/pages/WritingPage'
import SharedVocaPage from '@/pages/SharedVocaPage'
import CollaboratePage from '@/pages/CollaboratePage'
import AccountPage from '@/pages/AccountPage'
import CommunityPage from '@/pages/CommunityPage'
import { useAuthStore } from '@/features/auth/model/authStore'

export function AppRoutes() {
  const { user } = useAuthStore()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/shared/:shareToken" element={<SharedVocaPage />} />

        <Route path="/" element={<HomePage />} />
        <Route path="/folder/:id" element={<ProtectedRoute><FolderPage /></ProtectedRoute>} />
        <Route path="/voca/:id" element={<VocaDetailPage />} />
        <Route path="/voca/:id/edit" element={<ProtectedRoute><VocaEditorPage /></ProtectedRoute>} />
        <Route path="/voca/:id/settings" element={<ProtectedRoute><VocaSettingsPage /></ProtectedRoute>} />
        <Route path="/voca/:id/collaborate" element={<ProtectedRoute><CollaboratePage /></ProtectedRoute>} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/study/:id" element={<StudySelectPage />} />
        <Route path="/study/:id/flashcard" element={<FlashcardPage />} />
        <Route path="/study/:id/multiple_choice" element={<MultipleChoicePage />} />
        <Route path="/study/:id/writing" element={<WritingPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
