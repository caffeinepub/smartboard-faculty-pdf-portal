import React from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import AdminPanel from '@/pages/AdminPanel';
import FacultyPortal from '@/pages/FacultyPortal';
import TeachingView from '@/pages/TeachingView';
import DeveloperPortal from '@/pages/DeveloperPortal';
import DeviceLimitBlocker from '@/components/DeviceLimitBlocker';
import ErrorBoundary from '@/components/ErrorBoundary';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { FacultyProvider } from '@/context/FacultyContext';
import { useDeviceRegistration } from '@/hooks/useDeviceRegistration';
import { Loader2 } from 'lucide-react';

// Root route with layout + device registration gate
const rootRoute = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <FacultyProvider>
        <DeviceGate />
      </FacultyProvider>
    </ErrorBoundary>
  ),
});

function DeviceGate() {
  const { isChecking, isLimitExceeded } = useDeviceRegistration();

  if (isLimitExceeded) {
    return <DeviceLimitBlocker />;
  }

  if (isChecking) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/assets/uploads/image-5-1.png"
            alt="RS Logo"
            className="h-12 w-12 rounded-xl object-contain"
            onError={(e) => {
              // Hide broken image gracefully
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="font-display text-2xl font-bold text-foreground">EduBoard</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          Verifying device license…
        </div>
        <p className="text-xs text-muted-foreground/60 max-w-xs text-center">
          Connecting to the network. This may take a few seconds…
        </p>
      </div>
    );
  }

  return <Outlet />;
}

// Home route (with layout)
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <Layout>
      <HomePage />
    </Layout>
  ),
});

// Admin route (with layout)
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: () => (
    <Layout>
      <AdminPanel />
    </Layout>
  ),
});

// Faculty route (with layout)
const facultyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faculty',
  component: () => (
    <Layout>
      <FacultyPortal />
    </Layout>
  ),
});

// Teaching view route (full screen, no layout header/footer)
const teachingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/teach/$pdfId/$facultyId',
  component: TeachingView,
});

// Developer portal route (admin only, with layout)
const devPortalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dev-portal',
  component: () => (
    <Layout>
      <DeveloperPortal />
    </Layout>
  ),
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  adminRoute,
  facultyRoute,
  teachingRoute,
  devPortalRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <PWAInstallPrompt />
    </ErrorBoundary>
  );
}
