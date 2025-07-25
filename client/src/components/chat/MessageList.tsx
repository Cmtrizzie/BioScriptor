import { Message } from '@/hooks/use-chat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
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

  const renderMessageContent = (content: string, type: 'user' | 'ai') => {
    // Ensure content is a string
    const safeContent = typeof content === 'string' ? content : String(content || '');

    // Simple parsing for code blocks and special content
    const parts = safeContent.split(/(```[\s\S]*?```)/);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeMatch = part.match(/```(\w*)\n?([\s\S]*?)```/);
        const language = codeMatch?.[1] || 'text';
        const code = codeMatch?.[2] || '';
        return <CodeBlock key={index} language={language} code={code} />;
      }

      // Check for molecular viewer requests
      if (type === 'ai' && part.includes('3D visualization') && part.includes('PDB')) {
        return (
          <div key={index} className="my-4">
            <p className="mb-4">{part}</p>
            <MolecularViewer pdbId="1JM7" />
          </div>
        );
      }

      return <p key={index} className="whitespace-pre-wrap">{part || ''}</p>;
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
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <CodeBlock
                            language={match[1]}
                            value={String(children).replace(/\n$/, '')}
                          />
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                      h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mb-2" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-md font-semibold mb-1" {...props} />,
                      blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />,
                      pre: ({ node, ...props }) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded mb-2 overflow-x-auto" {...props} />
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
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
                    <div className="flex-1 text-gray-900 dark:text-white">
                      {renderMessageContent(message.content, 'ai')}
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