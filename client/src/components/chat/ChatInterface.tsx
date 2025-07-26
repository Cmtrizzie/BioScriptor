
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
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <div className="flex-1 overflow-hidden">
          <MessageList 
            messages={messages} 
            isLoading={isLoading}
            bottomRef={bottomRef}
          />
        </div>
        
        <MessageInput 
          onSendMessage={sendMessage} 
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
