import React, { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
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
  const [_, navigate] = useLocation();
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
    const activeUser = user || {
      uid: 'demo-user-123',
      email: 'demo@example.com',
      displayName: 'Demo User',
      photoURL: null
    };

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
      let responseContent = 'Simulated AI response.'; // fallback in case fetch is not used

      // Prepare fetch request
      if (file) {
        const formData = new FormData();
        formData.append('message', content);
        formData.append('file', file);

        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers: {
            'x-firebase-uid': activeUser.uid,
            'x-firebase-email': activeUser.email,
            'x-firebase-display-name': activeUser.displayName || '',
            'x-firebase-photo-url': activeUser.photoURL || '',
          },
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to send message');
        const data = await response.json();
        responseContent = data.response?.content || data.response?.response || 'AI response';
      } else {
        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-firebase-uid': activeUser.uid,
            'x-firebase-email': activeUser.email,
            'x-firebase-display-name': activeUser.displayName || '',
            'x-firebase-photo-url': activeUser.photoURL || '',
          },
          body: JSON.stringify({ message: content }),
        });

        if (!response.ok) throw new Error('Failed to send message');
        const data = await response.json();
        responseContent = data.response?.content || data.response?.response || 'AI response';
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: responseContent,
        timestamp: new Date(),
      };

      const currentMessages = [...messages, userMessage, aiMessage];
      let updatedSessions = JSON.parse(localStorage.getItem('bioscriptor-sessions') || '[]');

      let sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      let title = content.substring(0, 50) + (content.length > 50 ? '...' : '');

      const newSession: ChatSession = {
        id: sessionId,
        title,
        timestamp: new Date().toLocaleDateString(),
        messages: currentMessages,
      };

      updatedSessions = [newSession, ...updatedSessions.filter(s => s.id !== sessionId)];
      localStorage.setItem('bioscriptor-sessions', JSON.stringify(updatedSessions));
      setSessions(updatedSessions);
      setMessages(currentMessages);
      navigate(`/chat/${sessionId}`);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [messages, user, navigate]);

  const newChat = useCallback(() => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newSession: ChatSession = {
      id: sessionId,
      title: "New Chat",
      timestamp: new Date().toLocaleDateString(),
      messages: [],
    };

    const updatedSessions = [newSession, ...sessions];
    localStorage.setItem('bioscriptor-sessions', JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
    setMessages([]);
    setIsLoading(false);
    navigate(`/chat/${sessionId}`);

    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [navigate, sessions]);

  const switchToSession = useCallback((session: ChatSession) => {
    const sessionMessages = session.messages.map(msg => ({
      ...msg,
      timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
    }));

    setMessages(sessionMessages);
    const updatedSessions = [session, ...sessions.filter(s => s.id !== session.id)];
    setSessions(updatedSessions);
    localStorage.setItem('bioscriptor-sessions', JSON.stringify(updatedSessions));
    navigate(`/chat/${session.id}`);
  }, [sessions, navigate]);

  const loadSession = useCallback((sessionId: string) => {
    const savedSessions = JSON.parse(localStorage.getItem('bioscriptor-sessions') || '[]');
    const session = savedSessions.find((s: ChatSession) => s.id === sessionId);
    
    if (session) {
      const sessionMessages = session.messages.map(msg => ({
        ...msg,
        timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
      }));
      setMessages(sessionMessages);
    } else {
      // If session not found, start with empty messages
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
    loadSession,
    isLoading,
    bottomRef,
  };
}
