import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Posts from '../pages/Posts';
import Profiles from '../pages/Profiles';
import { AccountsPage } from '../pages/AccountsPage';
import { CompareAccountsPage } from '../pages/CompareAccountsPage';
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
import { LiveCampaignsPage } from '../pages/LiveCampaignsPage';
import { AllCampaignsPage } from '../pages/AllCampaignsPage';
import { CampaignDetailsPage } from '../pages/CampaignDetailsPage';
import { InstagramLinksPage } from '../pages/InstagramLinksPage';
import { ContentPerformancePage } from '../pages/ContentPerformancePage';
import { CampaignLinkAnalyzerPage } from '../pages/CampaignLinkAnalyzerPage';
import { RecentCampaignAnalysesPage } from '../pages/RecentCampaignAnalysesPage';

const isAuthenticated = () => !!(localStorage.getItem('token') || localStorage.getItem('auth_token'));

const RedirectIfAuthed: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  isAuthenticated() ? <Navigate to="/app/campaign-analyzer" replace /> : <>{children}</>;

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
    path: '/campaign-analyzer',
    element: <Navigate to="/app/campaign-analyzer" replace />,
  },
  {
    path: '/app',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/app/campaign-analyzer" replace /> },
      { path: 'dashboard', element: <AnalyticsDashboard /> },
      { path: 'analytics', element: <AnalyticsDashboard /> },
      { path: 'campaigns/live', element: <LiveCampaignsPage /> },
      { path: 'campaigns', element: <AllCampaignsPage /> },
      { path: 'campaigns/:id', element: <CampaignDetailsPage /> },
      { path: 'links', element: <InstagramLinksPage /> },
      { path: 'campaign-analyzer', element: <CampaignLinkAnalyzerPage /> },
      { path: 'campaign-analyzer/recent', element: <RecentCampaignAnalysesPage /> },
      { path: 'content-performance', element: <ContentPerformancePage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'compare-accounts', element: <CompareAccountsPage /> },
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
      { path: 'profiles', element: <Profiles /> },
      { path: 'posts', element: <Posts /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/app/campaign-analyzer" replace />,
  },
]);
