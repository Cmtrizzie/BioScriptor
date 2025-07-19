import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Auth() {
  const { user, login, handleRedirect } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    handleRedirect();
  }, []);

  useEffect(() => {
    if (user) {
      setLocation("/chat");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="relative">
              <svg className="w-12 h-12 text-bio-blue dark:text-bio-teal dna-helix" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L13.5 4.5L15 2L16.5 4.5L18 2L19.5 4.5L21 2V4L19.5 6.5L18 4L16.5 6.5L15 4L13.5 6.5L12 4L10.5 6.5L9 4L7.5 6.5L6 4L4.5 6.5L3 4V2L4.5 4.5L6 2L7.5 4.5L9 2L10.5 4.5L12 2Z"/>
                <path d="M12 22L10.5 19.5L9 22L7.5 19.5L6 22L4.5 19.5L3 22V20L4.5 17.5L6 20L7.5 17.5L9 20L10.5 17.5L12 20L13.5 17.5L15 20L16.5 17.5L18 20L19.5 17.5L21 20V22L19.5 19.5L18 22L16.5 19.5L15 22L13.5 19.5L12 22Z"/>
              </svg>
              <div className="absolute -top-1 -right-1 text-bio-teal font-mono text-xs font-bold">{}</div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-bio-blue dark:text-white">Welcome to biobuddy</CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your AI-powered bioinformatics assistant
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5 text-bio-teal" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Natural language bioinformatics queries</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5 text-bio-teal" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>3D molecular visualization</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5 text-bio-teal" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>CRISPR, PCR, and sequence analysis</span>
            </div>
          </div>
          
          <Button onClick={login} className="w-full bg-bio-blue hover:bg-bio-blue/90">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
          
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
