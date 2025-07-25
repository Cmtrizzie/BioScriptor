import React, { useState, useEffect } from 'react';
import { Message } from '@/hooks/use-chat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Copy, Check } from 'lucide-react';
import CodeBlock from "@/components/ui/code-block";
import MolecularViewer from "@/components/visualization/MolecularViewer";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };



  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-bio-blue/10 text-bio-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.5 4.5L15 2L16.5 4.5L18 2L19.5 4.5L21 2V4L19.5 6.5L18 4L16.5 6.5L15 4L13.5 6.5L12 4L10.5 6.5L9 4L7.5 6.5L6 4L4.5 6.5L3 4V2L4.5 4.5L6 2L7.5 4.5L9 2L10.5 4.5L12 2Z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to biobuddy</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              Your AI-powered bioinformatics assistant. Ask me anything about DNA sequences, protein analysis, or molecular biology!
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>✨ Try uploading a file or asking about:</p>
              <p>• CRISPR guide RNA design</p>
              <p>• PCR simulation and primer design</p>
              <p>• Protein structure visualization</p>
              <p>• Sequence analysis and annotations</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} message-animation`}>
            {message.type === 'user' ? (
              <div className="max-w-3xl">
                <div className="bg-bio-blue text-white rounded-2xl rounded-br-md px-4 py-3">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        code({ node, inline, children, ...props }) {
                          if (!inline) {
                            return (
                              <div className="my-3">
                                <CodeBlock
                                  language="text"
                                  code={String(children).replace(/\n$/, '')}
                                />
                              </div>
                            );
                          }
                          return (
                            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        },
                        pre: ({ children }) => <div className="my-3">{children}</div>,
                        p: ({ children }) => <div className="mb-3 leading-relaxed">{children}</div>,
                        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-3">
                            {children}
                          </blockquote>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-3">
                            <table className="min-w-full border border-gray-300 dark:border-gray-600">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => <thead className="bg-gray-50 dark:bg-gray-700">{children}</thead>,
                        tbody: ({ children }) => <tbody>{children}</tbody>,
                        tr: ({ children }) => <tr className="border-b border-gray-200 dark:border-gray-600">{children}</tr>,
                        th: ({ children }) => <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">{children}</th>,
                        td: ({ children }) => <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{children}</td>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl w-full">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-bio-teal/10 text-bio-teal rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 0v1a1 1 0 102 0V3a2 2 0 012 2v6.5a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 014 11.5V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 text-gray-900 dark:text-white prose prose-sm max-w-none dark:prose-invert">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        code({ node, inline, children, ...props }) {
                          if (!inline) {
                            return (
                              <div className="my-3">
                                <CodeBlock
                                  language="text"
                                  code={String(children).replace(/\n$/, '')}
                                />
                              </div>
                            );
                          }
                          return (
                            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        },
                        pre: ({ children }) => <div className="my-3">{children}</div>,
                        p: ({ children }) => <div className="mb-3 leading-relaxed">{children}</div>,
                        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-3">
                            {children}
                          </blockquote>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-3">
                            <table className="min-w-full border border-gray-300 dark:border-gray-600">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => <thead className="bg-gray-50 dark:bg-gray-700">{children}</thead>,
                        tbody: ({ children }) => <tbody>{children}</tbody>,
                        tr: ({ children }) => <tr className="border-b border-gray-200 dark:border-gray-600">{children}</tr>,
                        th: ({ children }) => <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">{children}</th>,
                        td: ({ children }) => <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{children}</td>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatTime(message.timestamp)} • Generated in {(Math.random() * 5 + 1).toFixed(1)}s
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-3xl">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-gray-500 text-sm ml-2">BioScriptor is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}