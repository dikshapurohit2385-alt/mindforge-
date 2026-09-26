import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { DiagnosticAssessmentPage } from './pages/student/DiagnosticAssessmentPage';
import { AdaptiveLearningPathPage } from './pages/student/AdaptiveLearningPathPage';
import { FlashcardsPage } from './pages/student/FlashcardsPage';
import { QuizzesPage } from './pages/student/QuizzesPage';

import { StudySpacePage } from './pages/student/StudySpacePage';
import { StudySpaceLandingPage } from './pages/student/StudySpaceLandingPage';
import { StudentClassSubjectsPage } from './pages/student/StudentClassSubjectsPage';
import { AttendanceCatchUpPage } from './pages/student/AttendanceCatchUpPage';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { SubjectManagementPage } from './pages/teacher/SubjectManagementPage';
import { ChapterModuleManagementPage } from './pages/teacher/ChapterModuleManagementPage';
import { AskTeacherInboxPage } from './pages/teacher/AskTeacherInboxPage';
import { TeacherCurriculumPage } from './pages/teacher/TeacherCurriculumPage';
import { DocumentReviewPage } from './pages/teacher/DocumentReviewPage';
import { TeacherAnalyticsPage } from './pages/teacher/TeacherAnalyticsPage';
import { AITeacherAssistantPage } from './pages/teacher/AITeacherAssistantPage';
import { TeacherAttendanceManagementPage } from './pages/teacher/TeacherAttendanceManagementPage';

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'} replace />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
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
            <Route
              path="/student/diagnostic/:subjectId"
              element={
                <LayoutShell>
                  <DiagnosticAssessmentPage />
                </LayoutShell>
              }
            />
            <Route
              path="/student/diagnostic/chapter/:chapterId"
              element={
                <LayoutShell>
                  <DiagnosticAssessmentPage />
                </LayoutShell>
              }
            />
            <Route
              path="/student/study-space"
              element={
                <LayoutShell>
                  <StudySpaceLandingPage />
                </LayoutShell>
              }
            />
            <Route
              path="/student/study-space/:chapterId"
              element={
                <LayoutShell>
                  <StudySpacePage />
                </LayoutShell>
              }
            />
            <Route
              path="/student/adaptive-lesson/:chapterId"
              element={
                <LayoutShell>
                  <StudySpacePage />
                </LayoutShell>
              }
            />
            <Route
              path="/student/learning-path"
              element={
                <LayoutShell>
                  <AdaptiveLearningPathPage />
                </LayoutShell>
              }
            />
            <Route
              path="/student/quizzes"
              element={
                <LayoutShell>
                  <QuizzesPage />
                </LayoutShell>
              }
            />
            <Route
              path="/student/flashcards"
              element={
                <LayoutShell>
                  <FlashcardsPage />
                </LayoutShell>
              }
            />
            <Route
              path="/student/my-class"
              element={
                <LayoutShell>
                  <StudentClassSubjectsPage />
                </LayoutShell>
              }
            />
            <Route
              path="/student/attendance-catchup/:subjectId"
              element={
                <LayoutShell>
                  <AttendanceCatchUpPage />
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
              path="/teacher/attendance"
              element={
                <LayoutShell>
                  <TeacherAttendanceManagementPage />
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
              path="/teacher/analytics"
              element={
                <LayoutShell>
                  <TeacherAnalyticsPage />
                </LayoutShell>
              }
            />
            <Route
              path="/teacher/ai-assistant"
              element={
                <LayoutShell>
                  <AITeacherAssistantPage />
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
            <Route
              path="/teacher/curriculum"
              element={
                <LayoutShell>
                  <TeacherCurriculumPage />
                </LayoutShell>
              }
            />
            <Route
              path="/teacher/documents"
              element={
                <LayoutShell>
                  <TeacherCurriculumPage />
                </LayoutShell>
              }
            />
            <Route
              path="/teacher/documents/:id/review"
              element={
                <LayoutShell>
                  <DocumentReviewPage />
                </LayoutShell>
              }
            />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
