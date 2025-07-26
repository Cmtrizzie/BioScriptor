
import React, { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Chat from "@/pages/chat";
import Auth from "@/pages/auth";
import Subscription from "@/pages/Subscription";
import AdminDashboard from "@/pages/AdminDashboard";

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-8 h-8 bg-bio-blue/20 rounded-full animate-spin">
            <svg className="w-8 h-8 text-bio-blue" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.5 4.5L15 2L16.5 4.5L18 2L19.5 4.5L21 2V4L19.5 6.5L18 4L16.5 6.5L15 4L13.5 6.5L12 4L10.5 6.5L9 4L7.5 6.5L6 4L4.5 6.5L3 4V2L4.5 4.5L6 2L7.5 4.5L9 2L10.5 4.5L12 2Z"/>
            </svg>
          </div>
          <span className="text-lg font-medium">biobuddy</span>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={user ? Chat : Auth} />
      <Route path="/auth" component={Auth} />
      <Route path="/chat" component={user ? Chat : Auth} />
      <Route path="/chat/:sessionId" component={user ? Chat : Auth} />
      <Route path="/subscription" component={user ? Subscription : Auth} />
      <Route path="/admin" component={user ? AdminDashboard : Auth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
