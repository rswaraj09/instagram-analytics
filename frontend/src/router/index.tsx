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
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
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
