import { Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SwipePage from './pages/SwipePage';
import MatchesPage from './pages/MatchesPage';
import CommunityPage from './pages/CommunityPage';
import ProjectsPage from './pages/ProjectsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ChatPage from './pages/ChatPage';
import BuildPage from './pages/BuildPage';
import SurveyPage from './pages/SurveyPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/survey" element={<SurveyPage />} />

      {/* TODO: wrap AppLayout in a ProtectedRoute once Google OAuth is wired up */}
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="/app/swipe" replace />} />
        <Route path="swipe"          element={<SwipePage />} />
        <Route path="matches"        element={<MatchesPage />} />
        <Route path="chat"           element={<ChatPage />} />
        <Route path="community"      element={<CommunityPage />} />
        <Route path="projects"       element={<ProjectsPage />} />
        <Route path="profile"        element={<ProfilePage />} />
        <Route path="settings"       element={<SettingsPage />} />
        <Route path="build/:matchId" element={<BuildPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
