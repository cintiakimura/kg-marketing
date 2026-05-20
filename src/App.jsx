import './App.css';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import VisualEditAgent from '@/lib/VisualEditAgent';
import NavigationTracker from '@/lib/NavigationTracker';
import { pagesConfig } from './pages.config';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Landing from '@/pages/Landing';

const { Pages, Layout } = pagesConfig;

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ? (
    <Layout currentPageName={currentPageName}>{children}</Layout>
  ) : (
    children
  );

function AuthLoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-kg-black">
      <div className="w-10 h-10 border-4 border-green-500/25 border-t-kg-btn rounded-full animate-spin" />
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoadingAuth, authError } = useAuth();

  if (isLoadingAuth) {
    return <AuthLoadingScreen />;
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/leads" replace /> : <Landing />
        }
      />

      {isAuthenticated ? (
        <>
          {Object.entries(Pages).map(([path, Page]) => (
            <Route
              key={path}
              path={`/${path}`}
              element={
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              }
            />
          ))}
          {/* Legacy capitalized URLs from older builds */}
          <Route path="/Dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/Leads" element={<Navigate to="/leads" replace />} />
          <Route path="/Campaigns" element={<Navigate to="/campaigns" replace />} />
          <Route path="/Clients" element={<Navigate to="/clients" replace />} />
          <Route path="*" element={<PageNotFound />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AppRoutes />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
