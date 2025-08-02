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
  metadata?: {
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      estimatedWords: number;
    };
    conversationLimits?: {
      status: 'ok' | 'warning' | 'critical' | 'exceeded';
      tokensUsed: number;
      tokensRemaining: number;
      percentageUsed: number;
      shouldWarn: boolean;
      message?: string;
    };
  };
}

export interface FileContext {
  filename: string;
  content: string;
  summary: string;
  timestamp: Date;
  fileType: string;
  size: number;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
  fileContext?: FileContext[];
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [fileContext, setFileContext] = useState<FileContext[]>([]);
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

  const sendMessage = useCallback(async (content: string, files?: File[]) => {
    if (isLoading) return; // Prevent multiple sends

    try {
      const activeUser = user || {
        uid: 'demo-user-123',
        email: 'demo@example.com',
        displayName: 'Demo User',
        photoURL: null
      };

      // Create user message with proper file data
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
        file: files?.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        })) || [],
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setIsTyping(true);

      try {
        let responseContent = 'Simulated AI response.';

        if (files && files.length > 0) {
          const formData = new FormData();
          formData.append('message', content);
          formData.append('file', files[0]); // Send first file
          
          // Include existing file context
          if (fileContext.length > 0) {
            formData.append('fileContext', JSON.stringify(fileContext));
          }

          console.log('📤 Sending file:', {
            name: files[0].name,
            size: files[0].size,
            type: files[0].type
          });

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
          
          // Store file context for future reference
          if (data.fileAnalysis) {
            const newFileContext: FileContext = {
              filename: files[0].name,
              content: data.fileAnalysis.documentContent || data.fileAnalysis.sequence || '',
              summary: responseContent.substring(0, 500) + '...',
              timestamp: new Date(),
              fileType: files[0].type,
              size: files[0].size
            };
            
            setFileContext(prev => [...prev.slice(-2), newFileContext]); // Keep last 3 files
          }
        } else {
          // Build conversation history with file context
          const conversationHistory = messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          }));

          // Include file context in the request
          const requestBody = {
            message: content,
            conversationId: currentSessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            conversationHistory,
            fileContext: fileContext.length > 0 ? fileContext : undefined
          };

          const response = await fetch('/api/chat/message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-firebase-uid': activeUser.uid,
              'x-firebase-email': activeUser.email,
              'x-firebase-display-name': activeUser.displayName || '',
              'x-firebase-photo-url': activeUser.photoURL || '',
            },
            body: JSON.stringify(requestBody),
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
          fileContext: fileContext.length > 0 ? fileContext : undefined,
        };

        const updatedSessions = [newSession, ...sessions.filter(s => s.id !== sessionId)];
        localStorage.setItem('bioscriptor-sessions', JSON.stringify(updatedSessions));
        setSessions(updatedSessions);
        setMessages(currentMessages);

        // Navigate to new session
        navigate(`/chat/${sessionId}`);
      } catch (error) {
        console.error('Error sending message:', error);

        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your message. Please try again.',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setIsTyping(false);
      }
    } catch (outerError) {
      console.error('Critical error in sendMessage:', outerError);
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [messages, user, navigate, sessions, isLoading]);

  const newChat = useCallback(() => {
    console.log('Starting new chat');
    setMessages([]);
    setCurrentSessionId(null);
    setFileContext([]);
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
    setCurrentSessionId(session.id);
    setFileContext(session.fileContext || []);
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
      setCurrentSessionId(sessionId);
      setFileContext(session.fileContext || []);
    } else {
      setMessages([]);
      setCurrentSessionId(null);
      setFileContext([]);
    }
  }, []);

  const handleFeedback = useCallback((messageId: string, type: string, value: number) => {
    console.log('Feedback received:', { messageId, type, value });
    // You can implement feedback storage/processing here
  }, []);

  return {
    messages,
    sessions,
    fileContext,
    setFileContext,
    sendMessage,
    newChat,
    switchToSession,
    loadSession,
    handleFeedback,
    isLoading,
    isTyping,
    bottomRef,
  };
}