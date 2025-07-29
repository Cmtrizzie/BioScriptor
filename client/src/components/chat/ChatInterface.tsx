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
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 min-h-0 overflow-hidden pb-24">
          <div className="pb-32">
            <MessageList 
              messages={messages} 
              isLoading={isLoading} 
              bottomRef={bottomRef} 
            />
          </div>
        </div>

        <MessageInput 
          onSendMessage={sendMessage} 
          disabled={isLoading}
        />
      </div>
    </div>
  );
}