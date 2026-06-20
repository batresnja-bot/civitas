import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { FeedPage } from '@/pages/FeedPage';
import { CommunitiesPage } from '@/pages/CommunitiesPage';
import { CommunityPage } from '@/pages/CommunityPage';
import { PostPage } from '@/pages/PostPage';
import { CreatePostPage } from '@/pages/CreatePostPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { CharterPage } from '@/pages/CharterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TrustRadarPage } from '@/pages/TrustRadarPage';
import { WeeklyTrustReportPage } from '@/pages/WeeklyTrustReportPage';
import { CaseStudyPage } from '@/pages/CaseStudyPage';
import { AboutBuilderPage } from '@/pages/AboutBuilderPage';
import { NotFoundPage } from '@/pages/MiscPages';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="case-study" element={<CaseStudyPage />} />
        <Route path="about-builder" element={<AboutBuilderPage />} />
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="register" element={<AuthPage mode="register" />} />
        <Route path="c" element={<CommunitiesPage />} />
        <Route path="c/:slug" element={<CommunityPage />} />
        <Route
          path="c/:slug/new"
          element={
            <ProtectedRoute>
              <CreatePostPage />
            </ProtectedRoute>
          }
        />
        <Route path="c/:slug/p/:id" element={<PostPage />} />
        <Route path="c/:slug/constitution" element={<CharterPage />} />
        <Route path="u/:username" element={<ProfilePage />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="radar"
          element={
            <ProtectedRoute>
              <TrustRadarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="report"
          element={
            <ProtectedRoute>
              <WeeklyTrustReportPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
