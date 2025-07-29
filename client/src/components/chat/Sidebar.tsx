import React from "react";
import { X, Plus, MessageSquare, Dna, Scissors, FlaskConical, BookOpen, ChevronDown, BarChart3, Atom, TestTube, CreditCard, Settings, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: any[];
  onNewChat: () => void;
  onSwitchSession: (session: any) => void;
  onSendMessage: (message: string) => void;
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  sessions, 
  onNewChat, 
  onSwitchSession,
  onSendMessage 
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleQuickAction = (message: string) => {
    onSendMessage(message);
    onClose();
  };

  const getUserInitials = (email?: string) => {
    if (!email) return 'U';
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/auth');
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">BioScriptor</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-200">
          <Button 
            onClick={onNewChat}
            className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white shadow-lg border border-blue-500 rounded-xl font-semibold relative overflow-hidden"
          >
            <div className="w-7 h-7 bg-white/30 rounded-full flex items-center justify-center mr-3 border border-white/20">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-semibold tracking-wide">New Chat</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b border-gray-200">
          <h3 className="text-xs font-medium text-gray-700 mb-2">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => handleQuickAction("Help me design CRISPR guide RNA sequences for a specific gene target. I need assistance with target selection, PAM site identification, and off-target analysis.")}
            >
              <Scissors className="h-3 w-3 mr-1 text-bio-green" />
              CRISPR
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => handleQuickAction("I need help with PCR simulation and primer design. Can you assist with primer optimization, melting temperature calculation, and virtual gel electrophoresis?")}
            >
              <TestTube className="h-3 w-3 mr-1 text-bio-green" />
              PCR
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => handleQuickAction("Please help me analyze biological sequences. I need assistance with DNA/RNA/protein sequence analysis, including alignment, annotation, and functional prediction.")}
            >
              <Dna className="h-3 w-3 mr-1 text-bio-green" />
              Sequence
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => handleQuickAction("I need help with research literature review and finding relevant bioinformatics papers. Can you assist with literature search and summarizing key findings?")}
            >
              <BookOpen className="h-3 w-3 mr-1 text-bio-green" />
              Research
            </Button>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium text-gray-700">Recent Sessions</h3>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2 pb-4">
              {sessions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent sessions
                </p>
              ) : (
                sessions.map((session) => (
                  <Button
                    key={session.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2 text-xs"
                    onClick={() => onSwitchSession(session)}
                  >
                    <MessageSquare className="h-3 w-3 mr-2 flex-shrink-0" />
                    <div className="truncate">
                      <div className="font-medium truncate">{session.title}</div>
                      <div className="text-gray-500 truncate">{session.timestamp}</div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Profile Section at Bottom */}
        <div className="border-t border-gray-200 p-4">
          {user && (
            <div className="space-y-3">
              {/* User Tier Badge */}
              <div className="flex items-center justify-center">
                <Badge variant={
                  user?.tier === 'enterprise' ? 'default' :
                  user?.tier === 'premium' ? 'secondary' : 'outline'
                } className="text-xs">
                  {user?.tier === 'enterprise' ? '⚡ Enterprise' :
                   user?.tier === 'premium' ? '🚀 Premium' : '⭐ Free'}
                </Badge>
              </div>

              {/* Query Usage */}
              <div className="text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.queryCount || 0} queries today
                </span>
              </div>

              {/* Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {getUserInitials(user?.email)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user?.displayName || user?.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handleNavigation('/subscription')}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Subscription</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {user?.tier}
                    </Badge>
                  </DropdownMenuItem>

                  {user?.tier === 'enterprise' && (
                    <DropdownMenuItem onClick={() => handleNavigation('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={() => handleNavigation('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {!user && (
            <Button 
              onClick={() => handleNavigation('/auth')}
              className="w-full"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </>
  );
}