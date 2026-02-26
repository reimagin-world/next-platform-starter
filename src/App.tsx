import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/common';
import Loader from './components/common/Loader';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AssessmentWizard = lazy(() => import('./pages/AssessmentWizard'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const MarketInsights = lazy(() => import('./pages/MarketInsights'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assessment" element={<AssessmentWizard />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/market-insights" element={<MarketInsights />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;