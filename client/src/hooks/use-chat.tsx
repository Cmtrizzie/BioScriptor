import React, { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getRandom, thinkingMessages, enhanceResponse, enhanceWithContext, errorResponses } from "@/lib/personality";

export interface Message {
  id: string;
  role: 'user' | 'assistant';
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
  const [isTyping, setIsTyping] = useState(false);
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

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('bioscriptor-sessions') || '[]');
    setSessions(savedSessions);
  }, []);

  const sendMessage = useCallback(async (content: string, file?: File) => {
    if (isLoading) return; // Prevent multiple sends

    const activeUser = user || {
      uid: 'demo-user-123',
      email: 'demo@example.com',
      displayName: 'Demo User',
      photoURL: null
    };

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      file,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      let responseContent = 'Simulated AI response.';

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

      // Enhance response with personality and context
      let enhancedContent = enhanceResponse(responseContent);
      enhancedContent = enhanceWithContext(enhancedContent, content);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: enhancedContent,
        timestamp: new Date(),
      };

      const currentMessages = [...messages, userMessage, aiMessage];
      console.log('Updated messages:', currentMessages);

      // Generate topic-based title
      const generateTopicBasedTitle = (content: string): string => {
        const bioinformaticsKeywords = [
          'DNA', 'RNA', 'protein', 'gene', 'genome', 'sequence', 'PCR', 'CRISPR', 
          'blast', 'alignment', 'phylogenetic', 'mutation', 'expression', 'analysis',
          'bioinformatics', 'genomics', 'proteomics', 'transcriptomics'
        ];

        const programmingKeywords = [
          'python', 'javascript', 'code', 'function', 'algorithm', 'data', 'API',
          'programming', 'script', 'analysis', 'visualization', 'database'
        ];

        const lowerContent = content.toLowerCase();

        // Check for bioinformatics topics
        const bioTopics = bioinformaticsKeywords.filter(keyword => 
          lowerContent.includes(keyword.toLowerCase())
        );

        // Check for programming topics  
        const progTopics = programmingKeywords.filter(keyword => 
          lowerContent.includes(keyword.toLowerCase())
        );

        let title = '';
        if (bioTopics.length > 0) {
          title = `🧬 ${bioTopics[0].toUpperCase()}`;
          if (bioTopics.length > 1) title += ` & ${bioTopics[1]}`;
        } else if (progTopics.length > 0) {
          title = `💻 ${progTopics[0].charAt(0).toUpperCase() + progTopics[0].slice(1)}`;
          if (progTopics.length > 1) title += ` & ${progTopics[1]}`;
        } else {
          // Extract meaningful words for general topics
          const words = content.split(' ').filter(word => 
            word.length > 3 && !['what', 'how', 'can', 'you', 'help', 'with', 'about'].includes(word.toLowerCase())
          );
          if (words.length > 0) {
            title = `💡 ${words[0].charAt(0).toUpperCase() + words[0].slice(1)}`;
            if (words.length > 1) title += ` ${words[1]}`;
          } else {
            title = content.substring(0, 30);
          }
        }

        return title.length > 50 ? title.substring(0, 47) + '...' : title;
      };

      // Create or update session
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const title = generateTopicBasedTitle(content);

      const newSession: ChatSession = {
        id: sessionId,
        title,
        timestamp: new Date().toLocaleDateString(),
        messages: currentMessages,
      };

      const updatedSessions = [newSession, ...sessions.filter(s => s.id !== sessionId)];
      localStorage.setItem('bioscriptor-sessions', JSON.stringify(updatedSessions));
      setSessions(updatedSessions);
      setMessages(currentMessages);

      // Navigate to new session
      navigate(`/chat/${sessionId}`);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [messages, user, navigate, sessions, isLoading]);

  const newChat = useCallback(() => {
    console.log('Starting new chat');
    setMessages([]);
    setIsLoading(false);
    navigate('/chat');

    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [navigate]);

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
      setMessages([]);
    }
  }, []);

  return {
    messages,
    sessions,
    sendMessage,
    newChat,
    switchToSession,
    loadSession,
    isLoading,
    isTyping,
    bottomRef,
  };
}