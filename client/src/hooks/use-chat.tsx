import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  file?: File;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const sendMessage = useCallback(async (content: string, file?: File) => {
    if (!user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      file,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare form data if file is included
      let requestData: any = { message: content };

      if (file) {
        const formData = new FormData();
        formData.append('message', content);
        formData.append('file', file);

        // Add Firebase auth headers for file uploads
        const headers: Record<string, string> = {};
        if (user) {
          headers['x-firebase-uid'] = user.uid;
          headers['x-firebase-email'] = user.email || '';
          headers['x-firebase-display-name'] = user.displayName || '';
          headers['x-firebase-photo-url'] = user.photoURL || '';
        }

        // For file uploads, we need to send FormData
        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        requestData = await response.json();
      } else {
        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-firebase-uid': user.uid,
            'x-firebase-email': user.email || '',
            'x-firebase-display-name': user.displayName || '',
            'x-firebase-photo-url': user.photoURL || '',
          },
          body: JSON.stringify({ message: content }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to send message');
        }

        requestData = await response.json();
      }

      // Ensure we always have a string response
      let responseContent = '';
      if (typeof requestData.response === 'string') {
        responseContent = requestData.response;
      } else if (requestData.response && typeof requestData.response.response === 'string') {
        responseContent = requestData.response.response;
      } else {
        responseContent = 'Sorry, I encountered an error processing your request.';
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save session to localStorage
      const currentSession: ChatSession = {
        id: Date.now().toString(),
        title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        timestamp: new Date().toLocaleDateString(),
        messages: [...messages, userMessage, aiMessage],
      };

      const savedSessions = JSON.parse(localStorage.getItem('bioscriptor-sessions') || '[]');
      // Remove any existing session with same messages to avoid duplicates
      const filteredSessions = savedSessions.filter((session: ChatSession) => 
        session.messages.length !== currentSession.messages.length || 
        session.title !== currentSession.title
      );
      const updatedSessions = [currentSession, ...filteredSessions.slice(0, 9)]; // Keep last 10 sessions
      localStorage.setItem('bioscriptor-sessions', JSON.stringify(updatedSessions));
      setSessions(updatedSessions);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [user, messages]);

  const newChat = useCallback(() => {
    setMessages([]);
  }, []);

  const switchToSession = useCallback((session: ChatSession) => {
    setMessages(session.messages);
  }, []);

  // Load sessions from localStorage on mount
  useState(() => {
    const savedSessions = JSON.parse(localStorage.getItem('bioscriptor-sessions') || '[]');
    setSessions(savedSessions);
  });

  return {
    messages,
    sessions,
    sendMessage,
    newChat,
    switchToSession,
    isLoading,
  };
}