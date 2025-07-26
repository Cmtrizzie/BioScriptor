import { useState, useCallback, useEffect, useRef } from "react";
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
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useCallback(async (content: string, file?: File) => {
    if (!user) {
      console.warn('No user authenticated, creating demo user');
      // For demo purposes, create a demo user
      const demoUser = {
        uid: 'demo-user-123',
        email: 'demo@example.com',
        displayName: 'Demo User',
        photoURL: null
      };
    }

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
      let requestData: any = { message: content };

      if (file) {
        const formData = new FormData();
        formData.append('message', content);
        formData.append('file', file);

        const activeUser = user || {
          uid: 'demo-user-123',
          email: 'demo@example.com',
          displayName: 'Demo User',
          photoURL: null
        };

        const headers: Record<string, string> = {
          'x-firebase-uid': activeUser.uid,
          'x-firebase-email': activeUser.email || '',
          'x-firebase-display-name': activeUser.displayName || '',
          'x-firebase-photo-url': activeUser.photoURL || '',
        };

        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to send message');
        requestData = await response.json();
      } else {
        const activeUser = user || {
          uid: 'demo-user-123',
          email: 'demo@example.com',
          displayName: 'Demo User',
          photoURL: null
        };

        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-firebase-uid': activeUser.uid,
            'x-firebase-email': activeUser.email || '',
            'x-firebase-display-name': activeUser.displayName || '',
            'x-firebase-photo-url': activeUser.photoURL || '',
          },
          body: JSON.stringify({ message: content }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to send message');
        }

        requestData = await response.json();
      }

      let responseContent = '';
      if (typeof requestData.response === 'string') {
        responseContent = requestData.response;
      } else if (typeof requestData.response?.content === 'string') {
        responseContent = requestData.response.content;
      } else if (typeof requestData.response?.response === 'string') {
        responseContent = requestData.response.response;
      } else {
        console.error('Unexpected response format:', requestData);
        responseContent = 'Sorry, I encountered an error processing your request.';
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save session after exchange
      try {
        const allMessages = [...messages, userMessage, aiMessage];
        const savedSessions = JSON.parse(localStorage.getItem('bioscriptor-sessions') || '[]');
        
        if (messages.length === 0) {
          // New session
          const currentSession: ChatSession = {
            id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            timestamp: new Date().toLocaleDateString(),
            messages: allMessages,
          };

          const updatedSessions = [currentSession, ...savedSessions.slice(0, 9)];
          localStorage.setItem('bioscriptor-sessions', JSON.stringify(updatedSessions));
          setSessions(updatedSessions);
        } else {
          // Update existing session
          if (savedSessions.length > 0) {
            savedSessions[0].messages = allMessages;
            savedSessions[0].timestamp = new Date().toLocaleDateString();
            localStorage.setItem('bioscriptor-sessions', JSON.stringify(savedSessions));
            setSessions(savedSessions);
          } else {
            // Create new session if none exists
            const currentSession: ChatSession = {
              id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              title: messages[0]?.content?.substring(0, 50) + (messages[0]?.content?.length > 50 ? '...' : '') || 'New Chat',
              timestamp: new Date().toLocaleDateString(),
              messages: allMessages,
            };
            
            const updatedSessions = [currentSession];
            localStorage.setItem('bioscriptor-sessions', JSON.stringify(updatedSessions));
            setSessions(updatedSessions);
          }
        }
      } catch (error) {
        console.error('Error saving session:', error);
      }

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
    try {
      const sessionMessages = Array.isArray(session.messages) 
        ? session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        : [];
      setMessages(sessionMessages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading session:', error);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('bioscriptor-sessions') || '[]');
    setSessions(savedSessions);
  }, []);

  return {
    messages,
    sessions,
    sendMessage,
    newChat,
    switchToSession,
    isLoading,
    bottomRef, // Export this for use in your ChatWindow
  };
}
