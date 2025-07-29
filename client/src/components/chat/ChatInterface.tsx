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
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div className="flex-1 flex flex-col min-h-0 max-h-screen">
        {/* Message list container with padding for input */}
        <div className="flex-1 overflow-y-auto pb-24">
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            bottomRef={bottomRef} 
          />
        </div>
        
        {/* Fixed MessageInput at bottom - Hidden when sidebar is open on mobile */}
        <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-full lg:translate-x-0' : 'translate-x-0'
        }`}>
          <MessageInput 
            onSendMessage={sendMessage} 
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}