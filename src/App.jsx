import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

import LoginPage from './pages/LoginPage'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import TestBankPage from './pages/TestBankPage'
import AssessmentPage from './pages/AssessmentPage'
import LessonPage from './pages/LessonPage'
import SandboxPage from './pages/SandboxPage'
import MysqlSetupPage from './pages/MysqlSetupPage'

function Home() {
  const { user, loading } = useAuth()
  if (loading) return <p className="loading">Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/teacher"
            element={
              <ProtectedRoute role="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/test-bank/:lessonId"
            element={
              <ProtectedRoute role="teacher">
                <TestBankPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/mysql-setup"
            element={
              <ProtectedRoute role="teacher">
                <MysqlSetupPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment"
            element={
              <ProtectedRoute role="student">
                <AssessmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lesson/:lessonId"
            element={
              <ProtectedRoute role="student">
                <LessonPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sandbox/:challengeId"
            element={
              <ProtectedRoute role="student">
                <SandboxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sandbox"
            element={
              <ProtectedRoute role="student">
                <SandboxPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<p className="page">Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}
