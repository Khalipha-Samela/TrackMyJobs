import './utils/disableConsole';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './styles/index.css';
import App from './App';

// Suppress ResizeObserver loop error
const errorHandler = (error) => {
  if (error.message === 'ResizeObserver loop completed with undelivered notifications.') {
    return;
  }
  throw error;
};

window.addEventListener('error', errorHandler);
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message === 'ResizeObserver loop completed with undelivered notifications.') {
    event.preventDefault();
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "'Space Grotesk', monospace",
              borderRadius: '0',
              border: '2px solid black',
              boxShadow: '4px 4px 0px black',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);