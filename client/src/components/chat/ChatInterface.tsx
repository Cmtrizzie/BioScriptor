import React, { useState, useRef, useEffect } from 'react';
import Header from "./Header";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import CreativeSuggestions from "./CreativeSuggestions";
import TokenLimitWarning from "./TokenLimitWarning";
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
    handleFeedback,
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
      setWelcomeShown(true);
    }
  }, [messages.length, welcomeShown, sessionId]);

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        onNewChat={newChat}
        onSwitchSession={switchToSession}
        onSendMessage={sendMessage}
      />

      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Menu button for mobile - Always visible */}
        <div className="lg:hidden p-4 bg-white dark:bg-gray-800 border-b">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 overflow-hidden relative">
          <div className="h-full overflow-y-auto pb-40">
            {/* Token limit warning */}
            {messages.length > 0 && messages[messages.length - 1]?.metadata?.conversationLimits && (
              <TokenLimitWarning 
                conversationLimits={messages[messages.length - 1].metadata.conversationLimits}
                onNewChat={newChat}
              />
            )}
            
            <MessageList 
              messages={messages} 
              isLoading={isLoading}
              isTyping={isTyping}
              bottomRef={bottomRef}
              handleFeedback={handleFeedback}
            />
          </div>
        </div>
        
        {/* Fixed MessageInput at bottom - hidden when sidebar is open */}
        <div className={`absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 pt-6 pb-6 transition-opacity duration-300 ${sidebarOpen ? 'lg:opacity-100 opacity-0 pointer-events-none lg:pointer-events-auto' : 'opacity-100 pointer-events-auto'}`}>
          {/* Creative suggestions */}
          <div className="px-4 mb-4">
            <CreativeSuggestions 
              onSelect={sendMessage} 
              visible={messages.length <= 1 && !isLoading && !isTyping && !sidebarOpen}
            />
          </div>
          <MessageInput 
            onSendMessage={sendMessage} 
            disabled={isLoading || isTyping || sidebarOpen}
          />
        </div>
      </div>
    </div>
  );
}