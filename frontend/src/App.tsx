import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoutes';
import { LayoutShell } from './components/layout/LayoutShell';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentSubjectsPage } from './pages/student/StudentSubjectsPage';
import { SubjectDetailPage } from './pages/student/SubjectDetailPage';
import { DigitalNotebookPage } from './pages/student/DigitalNotebookPage';
import { StudentAskTeacherPage } from './pages/student/StudentAskTeacherPage';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { SubjectManagementPage } from './pages/teacher/SubjectManagementPage';
import { ChapterModuleManagementPage } from './pages/teacher/ChapterModuleManagementPage';
import { AskTeacherInboxPage } from './pages/teacher/AskTeacherInboxPage';

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Student Portal Routes */}
          <Route element={<ProtectedRoute requiredRole="STUDENT" />}>
            <Route
              path="/student/dashboard"
              element={
                <LayoutShell>
                  <StudentDashboard />
                </LayoutShell>
              }
            />
            <Route
              path="/student/subjects"
              element={
                <LayoutShell>
                  <StudentSubjectsPage />
                </LayoutShell>
              }
            />
            <Route
              path="/student/subjects/:subjectId"
              element={
                <LayoutShell>
                  <SubjectDetailPage />
                </LayoutShell>
              }
            />
            <Route
              path="/student/notebook"
              element={
                <LayoutShell>
                  <DigitalNotebookPage />
                </LayoutShell>
              }
            />
            <Route
              path="/student/ask-teacher"
              element={
                <LayoutShell>
                  <StudentAskTeacherPage />
                </LayoutShell>
              }
            />
          </Route>

          {/* Teacher Portal Routes */}
          <Route element={<ProtectedRoute requiredRole="TEACHER" />}>
            <Route
              path="/teacher/dashboard"
              element={
                <LayoutShell>
                  <TeacherDashboard />
                </LayoutShell>
              }
            />
            <Route
              path="/teacher/subjects"
              element={
                <LayoutShell>
                  <SubjectManagementPage />
                </LayoutShell>
              }
            />
            <Route
              path="/teacher/subjects/:subjectId/manage"
              element={
                <LayoutShell>
                  <ChapterModuleManagementPage />
                </LayoutShell>
              }
            />
            <Route
              path="/teacher/questions"
              element={
                <LayoutShell>
                  <AskTeacherInboxPage />
                </LayoutShell>
              }
            />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
