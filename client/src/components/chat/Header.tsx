import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setIsDark(savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const getUserInitials = (email?: string) => {
    if (!email) return 'U';
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="relative">
              <svg className="w-8 h-8 text-bio-blue dark:text-bio-teal dna-helix" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L13.5 4.5L15 2L16.5 4.5L18 2L19.5 4.5L21 2V4L19.5 6.5L18 4L16.5 6.5L15 4L13.5 6.5L12 4L10.5 6.5L9 4L7.5 6.5L6 4L4.5 6.5L3 4V2L4.5 4.5L6 2L7.5 4.5L9 2L10.5 4.5L12 2Z"/>
                <path d="M12 22L10.5 19.5L9 22L7.5 19.5L6 22L4.5 19.5L3 22V20L4.5 17.5L6 20L7.5 17.5L9 20L10.5 17.5L12 20L13.5 17.5L15 20L16.5 17.5L18 20L19.5 17.5L21 20V22L19.5 19.5L18 22L16.5 19.5L15 22L13.5 19.5L12 22Z"/>
              </svg>
              <div className="absolute -top-1 -right-1 text-bio-teal font-mono text-xs font-bold">{}</div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-bio-blue dark:text-white">biobuddy</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI-Powered Bioinformatics</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {/* User Tier Badge */}
            <div className="hidden sm:flex items-center space-x-2">
              <span className="px-2 py-1 text-xs font-medium bg-bio-teal/10 text-bio-teal rounded-full">Pro Tier</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">∞ queries today</span>
            </div>
            
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </Button>

            {/* Profile Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={logout}
              >
                <div className="w-8 h-8 bg-bio-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {getUserInitials(user?.email)}
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
