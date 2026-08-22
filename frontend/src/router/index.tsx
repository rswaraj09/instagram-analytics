import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Posts from '../pages/Posts';
import Profiles from '../pages/Profiles';
import AccountsPage from '../pages/AccountsPage';
import SpreadsheetDashboard from '../pages/SpreadsheetDashboard';
import AnalyticsDashboard from '../pages/AnalyticsDashboard';
import GrowthAnalytics from '../pages/GrowthAnalytics';
import AudienceAnalytics from '../pages/AudienceAnalytics';
import ReelAnalytics from '../pages/ReelAnalytics';
import StoryAnalytics from '../pages/StoryAnalytics';
import ContentStudio from '../pages/ContentStudio';
import CompetitorAnalysis from '../pages/CompetitorAnalysis';
import ContentCalendar from '../pages/ContentCalendar';
import HashtagAnalytics from '../pages/HashtagAnalytics';
import BestTimeAnalytics from '../pages/BestTimeAnalytics';
import AIInsights from '../pages/AIInsights';
import ReportsPage from '../pages/ReportsPage';
import AdminDashboard from '../pages/AdminDashboard';
import UserSettings from '../pages/UserSettings';

const isAuthenticated = () => !!localStorage.getItem('token');

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;

const RedirectIfAuthed: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  isAuthenticated() ? <Navigate to="/app" replace /> : <>{children}</>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: (
      <RedirectIfAuthed>
        <Login />
      </RedirectIfAuthed>
    ),
  },
  {
    path: '/signup',
    element: (
      <RedirectIfAuthed>
        <Signup />
      </RedirectIfAuthed>
    ),
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <App />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/app/analytics" replace /> },
      { path: 'analytics', element: <AnalyticsDashboard /> },
      { path: 'growth', element: <GrowthAnalytics /> },
      { path: 'audience', element: <AudienceAnalytics /> },
      { path: 'reels', element: <ReelAnalytics /> },
      { path: 'stories', element: <StoryAnalytics /> },
      { path: 'ai-studio', element: <ContentStudio /> },
      { path: 'competitors', element: <CompetitorAnalysis /> },
      { path: 'calendar', element: <ContentCalendar /> },
      { path: 'hashtags', element: <HashtagAnalytics /> },
      { path: 'best-time', element: <BestTimeAnalytics /> },
      { path: 'ai-insights', element: <AIInsights /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'admin', element: <AdminDashboard /> },
      { path: 'settings', element: <UserSettings /> },
      { path: 'dashboard', element: <SpreadsheetDashboard /> },
      { path: 'profiles', element: <Profiles /> },
      { path: 'posts', element: <Posts /> },
      { path: 'accounts', element: <AccountsPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
