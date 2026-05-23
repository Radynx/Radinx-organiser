import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Skeleton } from '@/components/Skeleton'
import { AppLayout } from '@/routes/AppLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicRoute } from '@/routes/PublicRoute'

const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() =>
  import('@/features/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const CalendarPage = lazy(() =>
  import('@/features/calendar/CalendarPage').then((module) => ({ default: module.CalendarPage })),
)
const TasksPage = lazy(() =>
  import('@/features/tasks/TasksPage').then((module) => ({ default: module.TasksPage })),
)
const CompletedPage = lazy(() =>
  import('@/features/completed/CompletedPage').then((module) => ({ default: module.CompletedPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)

function RouteLoader() {
  return (
    <main className="content">
      <section className="panel" aria-label="Caricamento pagina">
        <Skeleton lines={6} />
      </section>
    </main>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="completed" element={<CompletedPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
