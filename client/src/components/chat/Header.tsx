import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditCard, Settings, Shield, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
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
              <svg className="w-8 h-8" viewBox="0 0 512 512">
                <circle cx="256" cy="256" r="240" fill="#1F2937" stroke="#374151" strokeWidth="4"/>
                <path d="M 140 180 Q 120 180 120 200 L 120 240 Q 120 260 100 260 Q 120 260 120 280 L 120 320 Q 120 340 140 340" 
                      fill="none" stroke="white" strokeWidth="12" strokeLinecap="round"/>
                <path d="M 372 180 Q 392 180 392 200 L 392 240 Q 392 260 412 260 Q 392 260 392 280 L 392 320 Q 392 340 372 340" 
                      fill="none" stroke="white" strokeWidth="12" strokeLinecap="round"/>
                <g transform="translate(256, 260)">
                  <path d="M -60 -120 C -40 -100, -40 -80, -60 -60 C -80 -40, -80 -20, -60 0 C -40 20, -40 40, -60 60 C -80 80, -80 100, -60 120" 
                        fill="none" stroke="#10B981" strokeWidth="8" strokeLinecap="round"/>
                  <path d="M 60 -120 C 40 -100, 40 -80, 60 -60 C 80 -40, 80 -20, 60 0 C 40 20, 40 40, 60 60 C 80 80, 80 100, 60 120" 
                        fill="none" stroke="#10B981" strokeWidth="8" strokeLinecap="round"/>
                  <line x1="-60" y1="-90" x2="60" y2="-90" stroke="#3B82F6" strokeWidth="4"/>
                  <line x1="-60" y1="-30" x2="60" y2="-30" stroke="#3B82F6" strokeWidth="4"/>
                  <line x1="-60" y1="30" x2="60" y2="30" stroke="#3B82F6" strokeWidth="4"/>
                  <line x1="-60" y1="90" x2="60" y2="90" stroke="#3B82F6" strokeWidth="4"/>
                </g>
              </svg>
              <div className="absolute -top-1 -right-1 text-green-500 font-mono text-xs font-bold">🛡️</div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">BioScriptor</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Fault-Tolerant AI Partner</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {/* User Tier Badge */}
            <div className="hidden sm:flex items-center space-x-2">
              <Badge variant={
                user?.tier === 'enterprise' ? 'default' :
                user?.tier === 'premium' ? 'secondary' : 'outline'
              }>
                {user?.tier === 'enterprise' ? '⚡ Enterprise' :
                 user?.tier === 'premium' ? '🚀 Premium' : '⭐ Free'}
              </Badge>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {user?.queryCount || 0} queries today
              </span>
            </div>

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <svg className="w-5 h-5 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </Button>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {getUserInitials(user?.email)}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setLocation('/subscription')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Subscription</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {user?.tier}
                  </Badge>
                </DropdownMenuItem>

                {user?.tier === 'enterprise' && (
                  <DropdownMenuItem onClick={() => setLocation('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setLocation('/chat')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Chat Interface</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}