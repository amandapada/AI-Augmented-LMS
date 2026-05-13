import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { StudentDashboardPage } from './pages/StudentDashboardPage'
import { StudentBrowseCoursesPage } from './pages/StudentBrowseCoursesPage'
import { StudentStudySchedulePage } from './pages/StudentStudySchedulePage'
import { StudentHandoutDetailPage } from './pages/StudentHandoutDetailPage'
import { StudentHandoutChatPage } from './pages/StudentHandoutChatPage'
import { StudentFlashcardSessionPage } from './pages/StudentFlashcardSessionPage'
import { StudentQuizPage } from './pages/StudentQuizPage'
import { LecturerDashboardPage } from './pages/LecturerDashboardPage'
import { LecturerUploadPage } from './pages/LecturerUploadPage'
import { LecturerAnalyticsPage } from './pages/LecturerAnalyticsPage'
import { ProtectedRoute } from './components/routing/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowRole="student">
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses"
        element={
          <ProtectedRoute allowRole="student">
            <StudentBrowseCoursesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/handouts/:handoutId"
        element={
          <ProtectedRoute allowRole="student">
            <StudentHandoutDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/handouts/:handoutId/chat"
        element={
          <ProtectedRoute allowRole="student">
            <StudentHandoutChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/handouts/:handoutId/flashcards"
        element={
          <ProtectedRoute allowRole="student">
            <StudentFlashcardSessionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/handouts/:handoutId/quiz/:quizId"
        element={
          <ProtectedRoute allowRole="student">
            <StudentQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/schedule"
        element={
          <ProtectedRoute allowRole="student">
            <StudentStudySchedulePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer"
        element={
          <ProtectedRoute allowRole="lecturer">
            <LecturerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/upload"
        element={
          <ProtectedRoute allowRole="lecturer">
            <LecturerUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/analytics"
        element={
          <ProtectedRoute allowRole="lecturer">
            <LecturerAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
