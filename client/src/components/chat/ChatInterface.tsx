import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from "./Header";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useChat } from "@/hooks/use-chat";

export default function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { messages, sendMessage, isLoading, bottomRef } = useChat();
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const threshold = 100;
      setIsNearBottom(scrollHeight - scrollTop - clientHeight < threshold);
    }
  }, []);

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 flex flex-col">
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            bottomRef={bottomRef}
          />
          <MessageInput onSendMessage={sendMessage} disabled={isLoading} />
        </main>
      </div>


    </div>
  );
}