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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: any[];
  onNewChat: () => void;
  onSwitchSession: (session: any) => void;
  onSendMessage: (message: string) => void;
  onMenuClick: () => void;
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  sessions, 
  onNewChat, 
  onSwitchSession, 
  onSendMessage,
  onMenuClick
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
      </div>
    </>
  );
}