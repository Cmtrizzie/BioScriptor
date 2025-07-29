
import React, { useState } from "react";
import { X, Plus, MessageSquare, Search, Library, Users, ChevronDown, CreditCard, Settings, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-gray-900 text-gray-100 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Section - Search Bar */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-gray-600 rounded-full"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-4 space-y-1">
          {/* New Chat */}
          <Button 
            onClick={onNewChat}
            className="w-full justify-start bg-transparent hover:bg-gray-800 text-gray-100 font-normal py-3 px-3 rounded-lg"
            variant="ghost"
          >
            <Plus className="h-5 w-5 mr-3" />
            New chat
          </Button>

          {/* Library */}
          <Button 
            variant="ghost"
            className="w-full justify-start bg-transparent hover:bg-gray-800 text-gray-100 font-normal py-3 px-3 rounded-lg"
            onClick={() => handleNavigation('/library')}
          >
            <Library className="h-5 w-5 mr-3" />
            Library
          </Button>

          {/* GPTs */}
          <Button 
            variant="ghost"
            className="w-full justify-start bg-transparent hover:bg-gray-800 text-gray-100 font-normal py-3 px-3 rounded-lg"
            onClick={() => handleNavigation('/gpts')}
          >
            <Users className="h-5 w-5 mr-3" />
            GPTs
          </Button>

          {/* Chats */}
          <Button 
            variant="ghost"
            className="w-full justify-start bg-transparent hover:bg-gray-800 text-gray-100 font-normal py-3 px-3 rounded-lg"
          >
            <MessageSquare className="h-5 w-5 mr-3" />
            Chats
          </Button>
        </div>

        {/* Chat History - Takes up remaining space */}
        <div className="flex-1 flex flex-col min-h-0 mt-6 px-4">
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {filteredSessions.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">
                  {searchQuery ? 'No matching sessions' : 'No recent sessions'}
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="text-sm text-gray-300 hover:text-white hover:bg-gray-800 p-3 rounded-lg cursor-pointer transition-colors"
                    onClick={() => onSwitchSession(session)}
                  >
                    <div className="truncate">
                      {session.title}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Profile Section at Bottom */}
        <div className="p-4 border-t border-gray-800">
          {user ? (
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
                      {user?.displayName || user?.email?.split('@')[0] || 'Mark comrade'}
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
                    {user?.tier}
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
                  onClick={() => handleNavigation('/settings')}
                  className="text-gray-100 hover:bg-gray-700"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-700" />

                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-gray-100 hover:bg-gray-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
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
