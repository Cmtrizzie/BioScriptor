import React, { useState, useEffect } from 'react';
import { Message } from '@/hooks/use-chat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  bottomRef: React.RefObject<HTMLDivElement>;
}

export default function MessageList({ messages, isLoading, bottomRef }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
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
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-bio-blue text-white ml-auto'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {message.type === 'ai' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={tomorrow}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
                <div className="text-xs opacity-70 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-bio-blue rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-bio-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-bio-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">BioScriptor is thinking...</span>
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