import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useTheme } from '@/context/theme-context';
import { Message } from '@/hooks/use-chat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/branding/Logo';

// Typing effect component
const TypingEffect = ({ 
  text, 
  speed = 30, 
  onComplete 
}: { 
  text: string; 
  speed?: number; 
  onComplete?: () => void; 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <span>{displayedText}</span>;
};

// Theme-aware copy button
const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 w-7 p-0"
      style={{
        backgroundColor: 'var(--copy-btn-bg)',
        color: 'var(--copy-btn-text)',
      }}
      title={copied ? "Copied!" : "Copy content"}
    >
      {copied ? (
        <Check size={14} className="text-green-500" />
      ) : (
        <Copy size={14} />
      )}
    </Button>
  );
};

// Theme-aware syntax highlighter
const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const { isDark } = useTheme();
  const style = isDark ? vscDarkPlus : tomorrow;

  return (
    <div className="relative mb-4 group max-w-full overflow-x-auto rounded-lg border"
      style={{ borderColor: 'var(--code-border)' }}>
      <div className="flex items-center justify-between px-3 py-2 text-xs font-medium border-b"
        style={{ 
          backgroundColor: 'var(--code-background)', 
          borderColor: 'var(--code-border)',
          color: 'var(--code-foreground)'
        }}>
        <span>{language || 'code'}</span>
        <CopyButton content={value} />
      </div>
      <SyntaxHighlighter
        style={style}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          backgroundColor: 'var(--code-background)',
          color: 'var(--code-foreground)',
          fontSize: '0.875rem',
          maxWidth: '100%',
          overflow: 'auto',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere'
        }}
        wrapLongLines={true}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

// Theme-aware Mermaid diagram
const MermaidDiagram = ({ content }: { content: string }) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!diagramRef.current || !content?.trim()) {
        setIsLoading(false);
        setHasError(true);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);

        // Dynamic import of mermaid
        const mermaid = (await import('mermaid')).default;

        // Initialize mermaid with proper configuration
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          themeVariables: {
            darkMode: isDark,
            background: isDark ? '#1f2937' : '#ffffff',
            primaryColor: isDark ? '#3b82f6' : '#2563eb',
            secondaryColor: isDark ? '#374151' : '#f3f4f6',
            tertiaryColor: isDark ? '#059669' : '#10b981',
            primaryBorderColor: isDark ? '#6b7280' : '#d1d5db',
            primaryTextColor: isDark ? '#f9fafb' : '#111827',
            lineColor: isDark ? '#6b7280' : '#374151',
            textColor: isDark ? '#f9fafb' : '#111827',
          }
        });

        // Generate unique ID for this diagram
        const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(diagramId, content.trim());

        if (diagramRef.current) {
          diagramRef.current.innerHTML = svg;
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        setHasError(true);
        setIsLoading(false);

        if (diagramRef.current) {
          diagramRef.current.innerHTML = `
            <div class="text-red-600 text-sm p-4 bg-red-50 border border-red-200 rounded">
              <p><strong>⚠️ Diagram rendering failed</strong></p>
              <details class="mt-2">
                <summary class="cursor-pointer text-xs">Show diagram code</summary>
                <pre class="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">${content}</pre>
              </details>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [content]);

  return (
    <div className="mermaid-diagram my-4 p-2 sm:p-4 rounded-lg border group relative max-w-full overflow-x-auto"
      style={{
        backgroundColor: 'var(--code-background, #ffffff)',
        borderColor: 'var(--code-border, #e5e7eb)'
      }}>
      <div className="absolute top-2 right-2 z-10">
        <CopyButton content={content} />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-20 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm">Rendering diagram...</span>
        </div>
      )}

      <div 
        ref={diagramRef} 
        style={{ 
          color: 'var(--mermaid-text, #111827)',
          minHeight: hasError ? 'auto' : '50px'
        }} 
      />
    </div>
  );
};

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  bottomRef: React.RefObject<HTMLDivElement>;
}

export default function MessageList({ messages, isLoading, bottomRef }: MessageListProps) {
  const { theme } = useTheme();

  // Show welcome screen when no messages exist
  if (messages.length === 0 && !isLoading) {
    return (
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 h-full flex items-center justify-center"
        style={{
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-foreground)'
        }}
      >
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-bio-blue/10 dark:bg-bio-teal/10 rounded-2xl flex items-center justify-center">
              <Logo size="small" variant={theme === 'dark' ? 'dark' : 'light'} />
            </div>
          </div>

          {/* Greeting */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-foreground)' }}>
              Hi, I'm BioScriptor.
            </h1>
            <p style={{ color: 'var(--color-foreground)' }}>
              How can I help you today?
            </p>
          </div>

          {/* Optional: Quick action buttons */}
          {/* <div className="grid grid-cols-1 gap-3 mt-8">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer">
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Analyze DNA Sequence
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Upload FASTA files or paste sequences for analysis
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer">
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                CRISPR Guide Design
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Generate guide RNAs for your target sequences
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer">
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Protein Analysis
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Analyze protein structures and functions
              </div>
            </div>
          </div> */}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 h-full max-w-full"
      style={{
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-foreground)'
      }}
    >
      {messages.map((message) => (
        <div key={message.id} className={cn(
          "flex w-full mb-4",
          message.role === 'user' ? "justify-end" : "justify-start"
        )}>
          {/* Message Content Container */}
          <div className={cn(
            "space-y-1 overflow-hidden",
            message.role === 'user' ? "max-w-[80%] ml-auto" : "max-w-[90%] mr-auto"
          )}>
            {/* Header */}
            <div className={cn(
              "flex items-center gap-2 text-xs text-slate-500",
              message.role === 'user' ? "justify-end" : "justify-start"
            )}>
              <span className="font-medium">
                {message.role === 'user' ? 'You' : 'BioScriptor'}
              </span>
              <span>•</span>
              <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>

            {/* Message Bubble */}
            <div className={cn(
              "rounded-xl p-4 border relative group overflow-hidden",
              message.role === 'user' 
                ? "bg-blue-500 text-white border-blue-600 rounded-br-md ml-auto" 
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mr-auto"
            )}
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'anywhere'
            }}>

              {/* Copy button for entire message */}
              <div className="absolute top-2 right-2">
                <CopyButton content={message.content} />
              </div>

              {message.role === 'user' ? (
                <div className="whitespace-pre-wrap font-medium leading-relaxed break-words overflow-wrap-anywhere pr-8 max-w-full text-white">
                  {message.content}
                </div>
              ) : (
                <div className="prose prose-sm max-w-full leading-relaxed overflow-hidden pr-8 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {message.isStreaming ? (
                    <TypingEffect 
                      text={message.content} 
                      speed={30}
                      onComplete={() => {
                        // Handle typing completion if needed
                      }}
                    />
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : '';
                          const codeContent = String(children).replace(/\n$/, '');

                          if (language === 'mermaid') {
                            return <MermaidDiagram content={codeContent} />;
                          }

                          return !inline && match ? (
                            <CodeBlock language={language} value={codeContent} />
                          ) : (
                            <code 
                              className={`${className} px-1.5 py-0.5 rounded text-sm font-mono break-all max-w-full overflow-hidden`}
                              style={{ 
                                backgroundColor: 'var(--code-background)',
                                color: 'var(--code-foreground)',
                                border: '1px solid var(--code-border)'
                              }}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        a({ node, href, children, ...props }) {
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline break-all hover:opacity-80"
                              style={{ 
                                color: 'var(--color-primary)',
                                wordBreak: 'break-all',
                                overflowWrap: 'anywhere'
                              }}
                              {...props}
                            >
                              {children}
                            </a>
                          );
                        },
                        p({ node, children, ...props }) {
                          return (
                            <p 
                              className="mb-4 leading-relaxed break-words overflow-wrap-anywhere max-w-full" 
                              style={{ 
                                wordBreak: 'break-word', 
                                overflowWrap: 'anywhere',
                                color: 'var(--color-foreground)'
                              }}
                              {...props}
                            >
                              {children}
                            </p>
                          );
                        },
                        h1: ({ children, ...props }) => (
                          <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--color-foreground)' }} {...props}>
                            {children}
                          </h1>
                        ),
                        h2: ({ children, ...props }) => (
                          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-foreground)' }} {...props}>
                            {children}
                          </h2>
                        ),
                        h3: ({ children, ...props }) => (
                          <h3 className="text-base font-medium mb-2" style={{ color: 'var(--color-foreground)' }} {...props}>
                            {children}
                          </h3>
                        ),
                        ul: ({ children, ...props }) => (
                          <ul className="list-disc list-inside mb-4 space-y-1" {...props}>
                            {children}
                          </ul>
                        ),
                        ol: ({ children, ...props }) => (
                          <ol className="list-decimal list-inside mb-4 space-y-1" {...props}>
                            {children}
                          </ol>
                        ),
                        li: ({ children, ...props }) => (
                          <li style={{ color: 'var(--color-foreground)' }} {...props}>
                            {children}
                          </li>
                        ),
                        table: ({ children, ...props }) => (
                          <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border-collapse border" 
                              style={{ borderColor: 'var(--code-border)' }} {...props}>
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children, ...props }) => (
                          <th className="border px-3 py-2 font-semibold text-left" 
                            style={{ 
                              borderColor: 'var(--code-border)',
                              backgroundColor: 'var(--code-background)',
                              color: 'var(--code-foreground)'
                            }} {...props}>
                            {children}
                          </th>
                        ),
                        td: ({ children, ...props }) => (
                          <td className="border px-3 py-2" 
                            style={{ 
                              borderColor: 'var(--code-border)',
                              color: 'var(--color-foreground)'
                            }} {...props}>
                            {children}
                          </td>
                        ),
                        blockquote: ({ children, ...props }) => (
                          <blockquote className="border-l-4 pl-4 my-4 italic" 
                            style={{ 
                              borderColor: 'var(--color-primary)',
                              color: 'var(--color-secondary)'
                            }} {...props}>
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-3 justify-start">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="text-xs">
              <Logo size="small" variant={theme === 'dark' ? 'dark' : 'light'} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium">BioScriptor</span>
              <span>•</span>
              <span>thinking...</span>
            </div>
            <div className="rounded-xl p-4 border"
              style={{
                backgroundColor: 'var(--message-ai-bg)',
                borderColor: 'var(--message-ai-border)'
              }}>
              <div className="flex items-center space-x-2">
                <div className="animate-pulse flex space-x-1">
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-slate-500">Processing your request...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}