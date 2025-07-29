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
        {/* Header with Search */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
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

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-gray-600"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-4 space-y-2">
          {/* New Chat */}
          <Button 
            onClick={onNewChat}
            className="w-full justify-start bg-transparent hover:bg-gray-800 text-gray-100 font-normal"
            variant="ghost"
          >
            <Plus className="h-4 w-4 mr-3" />
            New chat
          </Button>

          {/* Library */}
          <Button 
            variant="ghost"
            className="w-full justify-start bg-transparent hover:bg-gray-800 text-gray-100 font-normal"
            onClick={() => handleNavigation('/library')}
          >
            <Library className="h-4 w-4 mr-3" />
            Library
          </Button>

          {/* GPTs */}
          <Button 
            variant="ghost"
            className="w-full justify-start bg-transparent hover:bg-gray-800 text-gray-100 font-normal"
            onClick={() => handleNavigation('/gpts')}
          >
            <Users className="h-4 w-4 mr-3" />
            GPTs
          </Button>

          {/* Chats */}
          <Button 
            variant="ghost"
            className="w-full justify-start bg-transparent hover:bg-gray-800 text-gray-100 font-normal"
          >
            <MessageSquare className="h-4 w-4 mr-3" />
            Chats
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="px-4 mt-6">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 text-sm font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
              onClick={() => handleQuickAction("Analyze this DNA sequence for potential CRISPR targets")}
            >
              <div className="truncate w-full">
                Improving chatbot creativity
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 text-sm font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
              onClick={() => handleQuickAction("What are the latest bioinformatics tools and techniques?")}
            >
              <div className="truncate w-full">
                Open source web search tools
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 text-sm font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
              onClick={() => handleQuickAction("Give me an overview of the latest genomics databases")}
            >
              <div className="truncate w-full">
                Neon database overview
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 text-sm font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
              onClick={() => handleQuickAction("What's new in computational biology and machine learning?")}
            >
              <div className="truncate w-full">
                Uganda computer production news
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 text-sm font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
              onClick={() => handleQuickAction("Help me optimize my Python code for better performance")}
            >
              <div className="truncate w-full">
                Code modification suggestions
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 text-sm font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
              onClick={() => handleQuickAction("Explain the differences between various color spaces and their usage")}
            >
              <div className="truncate w-full">
                Clarifying color usage
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 text-sm font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
              onClick={() => handleQuickAction("Help me improve my scientific writing and research proposals")}
            >
              <div className="truncate w-full">
                BioScriptor Enhancement Feedback
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 text-sm font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
              onClick={() => handleQuickAction("Create a comprehensive guide for building wealth through smart investments")}
            >
              <div className="truncate w-full">
                Wealth building blueprint
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 text-sm font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
              onClick={() => handleQuickAction("What's up! How are you doing today?")}
            >
              <div className="truncate w-full">
                Wassup You Good?
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 text-sm font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
              onClick={() => handleQuickAction("Help me implement a search feature for chat history")}
            >
              <div className="truncate w-full">
                Chat history search ability
              </div>
            </Button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 flex flex-col min-h-0 mt-6">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-1">
              {filteredSessions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {searchQuery ? 'No matching sessions' : 'No recent sessions'}
                </p>
              ) : (
                filteredSessions.map((session) => (
                  <Button
                    key={session.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 text-sm font-normal bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white"
                    onClick={() => onSwitchSession(session)}
                  >
                    <div className="truncate w-full">
                      {session.title}
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Profile Section at Bottom */}
        <div className="border-t border-gray-800 p-4">
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