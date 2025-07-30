import React, { useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/context/theme-context";
import { queryClient } from "@/lib/queryClient";

// Pages
import Auth from "@/pages/auth";
import Chat from "@/pages/chat";
import Settings from "@/pages/Settings";
import Subscription from "@/pages/Subscription";
import AdminDashboard from "@/pages/AdminDashboard";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfUse from "@/pages/TermsOfUse";
import ServiceAgreement from "@/pages/ServiceAgreement";
import DataControls from "@/pages/DataControls";
import NotFound from "@/pages/not-found";

function AppRouter() {
  const { user, loading } = useAuth();

  // For development, don't block on loading - show the chat interface
  if (loading) {
    // Still render the chat but with a loading overlay
    return (
      <div className="relative min-h-screen">
        <Chat />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-500/20 rounded-full animate-spin border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-lg font-medium text-gray-700">Loading BioScriptor...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Chat} />
      <Route path="/auth" component={Auth} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat/:sessionId" component={Chat} />
      <Route path="/subscription" component={user ? Subscription : Auth} />
      <Route path="/admin" component={user ? AdminDashboard : Auth} />
      <Route path="/settings" component={Settings} />
      <Route path="/data-controls" component={DataControls} />
      <Route path="/service-agreement" component={ServiceAgreement} />
      <Route path="/terms-of-use" component={TermsOfUse} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log('App component rendering');

  useEffect(() => {
    // Prevent flash of unstyled content
    document.body.classList.add('no-transition');

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'system';
    const getSystemTheme = () => {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    };

    const actualTheme = savedTheme === 'system' ? getSystemTheme() : savedTheme;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(actualTheme);
    document.documentElement.setAttribute('data-theme', actualTheme);

    // Initialize font size
    const savedFontSize = localStorage.getItem('fontSize') || 'Medium';
    const root = document.documentElement;
    switch (savedFontSize) {
      case 'Small':
        root.style.fontSize = '14px';
        break;
      case 'Large':
        root.style.fontSize = '18px';
        break;
      default: // Medium
        root.style.fontSize = '16px';
        break;
    }

    // Remove no-transition class after a brief delay
    setTimeout(() => {
      document.body.classList.remove('no-transition');
    }, 100);
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;