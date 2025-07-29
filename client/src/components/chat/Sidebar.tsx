import React, { useState } from "react";
import { X, Plus, Search, ChevronDown, CreditCard, Settings, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/theme-context";

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
  const { theme, toggleTheme, isDark } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case 'system':
        return '🖥️';
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      default:
        return '🖥️';
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'system':
        return 'System';
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredSessions = sessions.filter(session => 
    session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages?.some((msg: any) => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Sort sessions by timestamp (newest first)
  const sortedSessions = filteredSessions.sort((a, b) => 
    new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-gray-900 text-gray-100 transform transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">BioScriptor</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* New Chat Button */}
          <Button 
            onClick={onNewChat}
            className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white font-medium mb-4"
          >
            <Plus className="h-4 w-4 mr-3" />
            New chat
          </Button>
        </div>

        {/* Bioinformatics Quick Actions */}
        <div className="px-4 mb-3">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="ghost"
              className="h-8 px-2 text-xs font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
              onClick={() => handleQuickAction("Analyze this DNA sequence for potential CRISPR targets")}
            >
              CRISPR
            </Button>

            <Button
              variant="ghost"
              className="h-8 px-2 text-xs font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
              onClick={() => handleQuickAction("Design PCR primers for this sequence")}
            >
              PCR
            </Button>

            <Button
              variant="ghost"
              className="h-8 px-2 text-xs font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
              onClick={() => handleQuickAction("Optimize codon usage for E. coli expression")}
            >
              Codon
            </Button>

            <Button
              variant="ghost"
              className="h-8 px-2 text-xs font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
              onClick={() => handleQuickAction("Perform protein structure analysis")}
            >
              Protein
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-gray-600"
            />
          </div>
        </div>

        {/* Chat History - Scrollable */}
        <div className="flex-1 flex flex-col min-h-0 px-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Chats</h3>
          <ScrollArea className="flex-1">
            <div className="space-y-1 pb-4">
              {sortedSessions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  {searchQuery ? 'No matching chats found' : 'No chat history yet'}
                </p>
              ) : (
                sortedSessions.map((session) => (
                  <Button
                    key={session.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 text-sm font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
                    onClick={() => onSwitchSession(session)}
                  >
                    <div className="flex flex-col items-start w-full">
                      <div className="truncate w-full font-medium">
                        {session.title || "Untitled Chat"}
                      </div>
                      {session.timestamp && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(session.timestamp).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Fixed Profile Section at Bottom */}
        <div className="border-t border-gray-800 p-4 mt-auto">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 text-gray-100"
                >
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {getUserInitials(user?.email)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-white truncate">
                      {user?.displayName || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {user?.tier || 'free'} plan
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700">
                <DropdownMenuItem 
                  onClick={() => handleNavigation('/subscription')}
                  className="text-gray-100 hover:bg-gray-700"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Subscription</span>
                  <Badge variant="outline" className="ml-auto text-xs border-gray-600">
                    {user?.tier || 'free'}
                  </Badge>
                </DropdownMenuItem>

                {user?.tier === 'enterprise' && (
                  <DropdownMenuItem 
                    onClick={() => handleNavigation('/admin')}
                    className="text-gray-100 hover:bg-gray-700"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem 
                  onClick={() => {
                    console.log('Settings clicked, navigating to /settings');
                    handleNavigation('/settings');
                  }}
                  className="text-gray-100 hover:bg-gray-700"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-700" />
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {!user && (
            <Button 
              onClick={() => handleNavigation('/auth')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Sign In
            </Button>
          )}
        </div>

      </div>
    </>
  );
}