import React, { useState, useRef, useEffect } from 'react';
import Header from "./Header";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useChat } from "@/hooks/use-chat";

interface ChatInterfaceProps {
  sessionId?: string;
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { 
    messages, 
    sessions, 
    sendMessage, 
    newChat, 
    switchToSession,
    loadSession,
    isLoading, 
    bottomRef 
  } = useChat();

  // Load session when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        onNewChat={newChat}
        onSwitchSession={switchToSession}
        onSendMessage={sendMessage}
      />

      <div className="flex-1 flex flex-col min-h-0 max-h-screen">
        {/* Menu button for mobile */}
        <div className="lg:hidden p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Improved scrolling container with padding for fixed input */}
        <div className="flex-1 overflow-y-auto pb-32 max-w-full">
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            bottomRef={bottomRef} 
          />
        </div>
      </div>
      
      {/* Fixed MessageInput at bottom - Hidden when sidebar is open on mobile */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-700 transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-full lg:translate-x-0' : 'translate-x-0'
      }`}>
        <MessageInput 
          onSendMessage={sendMessage} 
          disabled={isLoading}
        />
      </div>
    </div>
  );
}