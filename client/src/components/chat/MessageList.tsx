
import React, { useState, useEffect } from 'react';
import { Message } from '@/hooks/use-chat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Typing effect component
const TypingEffect = ({ text, speed = 30, onComplete }: { text: string; speed?: number; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (onComplete && currentIndex === text.length) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <span>{displayedText}</span>;
};

// Copy button component
const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
      title={copied ? "Copied!" : "Copy message"}
    >
      {copied ? (
        <Check size={14} className="text-green-600" />
      ) : (
        <Copy size={14} className="text-gray-500" />
      )}
    </Button>
  );
};

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  bottomRef: React.RefObject<HTMLDivElement>;
}

export default function MessageList({ messages, isLoading, bottomRef }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '100%', overflowY: 'auto' }}>
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-bio-blue/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-bio-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Welcome to BioScriptor! 🧬
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your AI-powered bioinformatics assistant. Ask me about molecular biology, genomics, or start with a quick action.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white">🧪 Lab Protocols</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">PCR, cloning, analysis</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white">🔬 Data Analysis</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">Sequences, structures</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white">🧬 CRISPR Design</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">Guide RNA optimization</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white">📊 Visualization</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">3D structures, plots</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] group relative ${
                  message.type === 'user'
                    ? 'chatgpt-user-message ml-auto'
                    : 'chatgpt-message'
                }`}
              >
                {/* Copy button - positioned absolutely in top right */}
                <div className="absolute top-2 right-2 z-10">
                  <CopyButton content={typeof message.content === 'string' ? message.content : JSON.stringify(message.content)} />
                </div>
                {message.type === 'ai' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <div className="my-4 rounded-lg overflow-hidden bg-gray-900 dark:bg-gray-900">
                              <div className="px-4 py-2 bg-gray-800 text-gray-300 text-xs font-mono border-b border-gray-700">
                                {match[1]}
                              </div>
                              <SyntaxHighlighter
                                style={tomorrow}
                                language={match[1]}
                                PreTag="div"
                                className="!bg-gray-900 !p-4 !m-0 font-mono text-sm"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className={`${className} bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono`} {...props}>
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
                              className="text-bio-blue hover:text-bio-blue/80 underline"
                              {...props}
                            >
                              {children}
                            </a>
                          );
                        },
                        p({ node, children, ...props }) {
                          // Convert plain text URLs to clickable links and format whitespace
                          const processText = (text: string) => {
                            const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
                            const parts = text.split(urlRegex);

                            return parts.map((part, index) => {
                              if (urlRegex.test(part)) {
                                const url = part.startsWith('http') ? part : `https://${part}`;
                                return (
                                  <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-bio-blue hover:text-bio-blue/80 underline"
                                  >
                                    {part}
                                  </a>
                                );
                              }
                              return part;
                            });
                          };

                          const processChildren = (children: any): any => {
                            return React.Children.map(children, (child) => {
                              if (typeof child === 'string') {
                                return processText(child);
                              }
                              if (React.isValidElement(child) && child.props.children) {
                                return React.cloneElement(child, {
                                  children: processChildren(child.props.children)
                                });
                              }
                              return child;
                            });
                          };

                          return (
                            <p className="mb-4 leading-relaxed" {...props}>
                              {processChildren(children)}
                            </p>
                          );
                        },
                      }}
                    >
                      {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap font-medium leading-relaxed">
                    {typeof message.content === 'string' ? 
                      message.content.split('\n\n').map((paragraph, index) => (
                        <div key={index} className={index > 0 ? 'mt-4' : ''}>
                          {paragraph.split('\n').map((line, lineIndex) => (
                            <div key={lineIndex} className={lineIndex > 0 ? 'mt-2' : ''}>
                              {line}
                            </div>
                          ))}
                        </div>
                      )) : JSON.stringify(message.content)
                    }
                  </div>
                )}
                <div className={`text-xs mt-3 opacity-70`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="chatgpt-message max-w-[85%]">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-bio-teal rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-bio-teal rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-bio-teal rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm font-medium opacity-80">
                    <TypingEffect 
                      text="🧬 BioScriptor is analyzing your query..."
                      speed={80}
                    />
                  </span>
                </div>
                <div className="mt-2 text-xs opacity-60">
                  <TypingEffect 
                    text="Processing molecular data and generating insights..."
                    speed={50}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
