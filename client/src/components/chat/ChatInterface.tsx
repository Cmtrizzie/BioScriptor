import React, { useState, useRef, useEffect } from 'react';
import Header from "./Header";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import CreativeSuggestions from "./CreativeSuggestions";
import { useChat } from "@/hooks/use-chat";
import { getRandom, greetings } from "@/lib/personality";

interface ChatInterfaceProps {
  sessionId?: string;
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const { 
    messages, 
    sessions, 
    sendMessage, 
    newChat, 
    switchToSession,
    loadSession,
    isLoading,
    isTyping,
    bottomRef 
  } = useChat();

  // Load session when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  // Show creative welcome message on first load
  useEffect(() => {
    if (!welcomeShown && messages.length === 0 && !sessionId) {
      setTimeout(() => {
        const welcomeMessage = {
          id: 'welcome-' + Date.now(),
          content: getRandom(greetings),
          role: "assistant" as const,
          timestamp: Date.now(),
          status: 'complete' as const
        };
        
        // Add welcome message without triggering API
        setWelcomeShown(true);
      }, 1000);
    }
  }, [messages.length, welcomeShown, sessionId]);

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
        <div className="flex-1 overflow-y-auto pb-40 max-w-full">
          <MessageList 
            messages={messages} 
            isLoading={isLoading}
            isTyping={isTyping}
            bottomRef={bottomRef} 
          />
        </div>
      </div>
      
      {/* Fixed MessageInput at bottom with creative suggestions */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 pt-6 pb-6 transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-full lg:translate-x-0' : 'translate-x-0'
      }`}>
        {/* Show suggestions when there are no messages or only welcome message */}
        <div className="px-4">
          <CreativeSuggestions 
            onSelect={sendMessage} 
            visible={messages.length <= 1 && !isLoading && !isTyping}
          />
        </div>
        <MessageInput 
          onSendMessage={sendMessage} 
          disabled={isLoading || isTyping}
        />
      </div>
    </div>
  );
}