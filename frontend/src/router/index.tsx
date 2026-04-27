import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/auth/LoginPage';

// Lazy-loaded pages
import { lazy, Suspense } from 'react';

const DashboardPage     = lazy(() => import('../pages/dashboard/DashboardPage'));
const LeadsPage         = lazy(() => import('../pages/leads/LeadsPage'));
const LeadFormPage      = lazy(() => import('../pages/leads/LeadFormPage'));
const LeadDetailPage    = lazy(() => import('../pages/leads/LeadDetailPage'));
const ClientsPage      = lazy(() => import('../pages/clients/ClientsPage'));
const ClientDetailPage = lazy(() => import('../pages/clients/ClientDetailPage'));
const ApplicantsPage       = lazy(() => import('../pages/applicants/ApplicantsPage'));
const ApplicantDetailPage  = lazy(() => import('../pages/applicants/ApplicantDetailPage'));
const OpportunitiesPage = lazy(() => import('../pages/opportunities/OpportunitiesPage'));
const ActivitiesPage    = lazy(() => import('../pages/activities/ActivitiesPage'));
const ReportsPage       = lazy(() => import('../pages/reports/ReportsPage'));
const SettingsPage      = lazy(() => import('../pages/settings/SettingsPage'));
const UsersPage         = lazy(() => import('../pages/settings/UsersPage'));

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const wrap = (el: JSX.Element) => <Suspense fallback={<Spinner />}>{el}</Suspense>;

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/',          element: wrap(<DashboardPage />) },
          { path: '/dashboard', element: wrap(<DashboardPage />) },

          // Leads
          { path: '/leads',          element: wrap(<LeadsPage />) },
          { path: '/leads/new',      element: wrap(<LeadFormPage />) },
          { path: '/leads/:id',      element: wrap(<LeadDetailPage />) },
          { path: '/leads/:id/edit', element: wrap(<LeadFormPage />) },

          // Clients
          { path: '/clients',     element: wrap(<ClientsPage />) },
          { path: '/clients/:id', element: wrap(<ClientDetailPage />) },

          // Applicants
          { path: '/applicants',     element: wrap(<ApplicantsPage />) },
          { path: '/applicants/:id', element: wrap(<ApplicantDetailPage />) },

          // Opportunities
          { path: '/opportunities', element: wrap(<OpportunitiesPage />) },

          // Activities
          { path: '/activities', element: wrap(<ActivitiesPage />) },

          // Reports
          { path: '/reports', element: wrap(<ReportsPage />) },

          // Admin-only routes
          {
            element: <ProtectedRoute requiredRole="admin" />,
            children: [
              { path: '/settings',       element: wrap(<SettingsPage />) },
              { path: '/settings/users', element: wrap(<UsersPage />) },
            ],
          },
        ],
      },
    ],
  },

  {
    path: '/unauthorized',
    element: (
      <div className="p-8 text-center text-red-600">
        403 — You are not authorized to view this page.
      </div>
    ),
  },
  {
    path: '*',
    element: (
      <div className="p-8 text-center text-slate-600">
        404 — Page not found.
      </div>
    ),
  },
]);
