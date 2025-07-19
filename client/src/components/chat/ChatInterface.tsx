import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useChat } from "@/hooks/use-chat";

export default function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { messages, sendMessage, isLoading } = useChat();

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 flex flex-col">
          <MessageList messages={messages} isLoading={isLoading} />
          <MessageInput onSendMessage={sendMessage} disabled={isLoading} />
        </main>
      </div>
      
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 left-4 lg:hidden bg-bio-blue text-white p-3 rounded-full shadow-lg hover:bg-bio-blue/90 transition-colors z-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}
