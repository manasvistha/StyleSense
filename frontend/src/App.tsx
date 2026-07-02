import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { RequireAdmin, RequireAuth, RedirectIfAuthed } from '@/components/RouteGuards';
import { Spinner } from '@/components/ui/misc';

const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Explore = lazy(() => import('@/pages/Explore'));
const DressDetailPage = lazy(() => import('@/pages/DressDetail'));
const MeasurementGuide = lazy(() => import('@/pages/MeasurementGuide'));

const Recommend = lazy(() => import('@/pages/app/Recommend'));
const History = lazy(() => import('@/pages/app/History'));
const HistoryDetail = lazy(() => import('@/pages/app/HistoryDetail'));
const Profile = lazy(() => import('@/pages/app/Profile'));
const Wishlist = lazy(() => import('@/pages/app/Wishlist'));

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminRules = lazy(() => import('@/pages/admin/Rules'));
const AdminDresses = lazy(() => import('@/pages/admin/Dresses'));
const AdminUsers = lazy(() => import('@/pages/admin/Users'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="h-7 w-7 text-primary" />
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public marketing + catalog */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/dresses/:slug" element={<DressDetailPage />} />
          <Route path="/measurement-guide" element={<MeasurementGuide />} />
        </Route>

        {/* Auth */}
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <Login />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthed>
              <Register />
            </RedirectIfAuthed>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Authenticated app */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/app" element={<Recommend />} />
          <Route path="/app/history" element={<History />} />
          <Route path="/app/history/:id" element={<HistoryDetail />} />
          <Route path="/app/profile" element={<Profile />} />
          <Route path="/app/wishlist" element={<Wishlist />} />
        </Route>

        {/* Admin */}
        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/rules" element={<AdminRules />} />
          <Route path="/admin/dresses" element={<AdminDresses />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
