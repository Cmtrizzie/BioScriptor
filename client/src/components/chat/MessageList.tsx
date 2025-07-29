import React, { useState, useEffect } from "react";
import { Message } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// Typing effect component
const TypingEffect = ({
  text,
  speed = 30,
  onComplete,
}: {
  text: string;
  speed?: number;
  onComplete?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
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
      console.error("Failed to copy message:", err);
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

export default function MessageList({
  messages,
  isLoading,
  bottomRef,
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 h-full">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-bio-blue/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-bio-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Welcome to BioScriptor! 🧬
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your AI-powered bioinformatics assistant. Ask me about molecular
              biology, genomics, or start with a quick action.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white">
                  🧪 Lab Protocols
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  PCR, cloning, analysis
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white">
                  🔬 Data Analysis
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  Sequences, structures
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white">
                  🧬 CRISPR Design
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  Guide RNA optimization
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white">
                  📊 Visualization
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  3D structures, plots
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} w-full`}
            >
              <div
                className={`max-w-[85%] min-w-0 group relative break-words overflow-wrap-anywhere ${
                  message.type === "user"
                    ? "user-message ml-auto"
                    : "chatgpt-message"
                }`}
                style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
              >
                {/* Copy button - positioned absolutely in top right */}
                <div className="absolute top-2 right-2 z-10">
                  <CopyButton
                    content={
                      typeof message.content === "string"
                        ? message.content
                        : JSON.stringify(message.content)
                    }
                  />
                </div>
                {message.type === "ai" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed overflow-hidden">
                    {(() => {
                      try {
                        // Safely extract content
                        let content = "";
                        if (typeof message.content === "string") {
                          content = message.content;
                        } else if (
                          message.content &&
                          typeof message.content === "object"
                        ) {
                          if (message.content.content) {
                            content = String(message.content.content);
                          } else if (message.content.text) {
                            content = String(message.content.text);
                          } else {
                            content = JSON.stringify(message.content, null, 2);
                          }
                        } else {
                          content = String(message.content || "");
                        }

                        // Ensure content is a valid string and not empty
                        if (!content || typeof content !== "string") {
                          return (
                            <div className="text-gray-500 italic">
                              Invalid message content
                            </div>
                          );
                        }

                        // Sanitize content to prevent markdown parsing errors
                        content = content.replace(/\x00/g, "").trim();

                        // Check if content is still valid after sanitization
                        if (!content) {
                          return (
                            <div className="text-gray-500 italic">
                              Empty message content
                            </div>
                          );
                        }

                        // Render with error boundary
                        try {
                          return (
                            <div className="markdown-wrapper">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code({
                                    node,
                                    inline,
                                    className,
                                    children,
                                    ...props
                                  }) {
                                    const match = /language-(\w+)/.exec(
                                      className || "",
                                    );
                                    const language = match ? match[1] : "";
                                    const codeContent = String(
                                      children,
                                    ).replace(/\n$/, "");

                                    return !inline && match ? (
                                      <div className="relative mb-4 group max-w-full overflow-hidden">
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(
                                              codeContent,
                                            );
                                          }}
                                          className="absolute top-2 right-2 p-2 bg-gray-200 hover:bg-gray-300 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                          title="Copy code"
                                        >
                                          Copy
                                        </button>
                                        <SyntaxHighlighter
                                          style={tomorrow}
                                          language={language}
                                          PreTag="div"
                                          customStyle={{
                                            margin: 0,
                                            borderRadius: "0.375rem",
                                            fontSize: "0.875rem",
                                            maxWidth: "100%",
                                            overflow: "auto",
                                            wordBreak: "break-word",
                                            overflowWrap: "anywhere",
                                          }}
                                          wrapLongLines={true}
                                          {...props}
                                        >
                                          {codeContent}
                                        </SyntaxHighlighter>
                                      </div>
                                    ) : (
                                      <code
                                        className={`${className} bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono break-all max-w-full overflow-hidden`}
                                        style={{
                                          wordBreak: "break-all",
                                          overflowWrap: "anywhere",
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
                                        className="text-bio-blue hover:text-bio-blue/80 underline break-all"
                                        style={{
                                          wordBreak: "break-all",
                                          overflowWrap: "anywhere",
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
                                        className="mb-4 leading-relaxed break-words overflow-wrap-anywhere max-w-full text-gray-800 dark:text-gray-200"
                                        style={{
                                          wordBreak: "break-word",
                                          overflowWrap: "anywhere",
                                        }}
                                        {...props}
                                      >
                                        {children}
                                      </p>
                                    );
                                  },
                                  div({ node, children, ...props }) {
                                    return (
                                      <div
                                        className="max-w-full overflow-hidden"
                                        style={{
                                          wordBreak: "break-word",
                                          overflowWrap: "anywhere",
                                        }}
                                        {...props}
                                      >
                                        {children}
                                      </div>
                                    );
                                  },
                                  pre({ node, children, ...props }) {
                                    return (
                                      <pre
                                        className="max-w-full overflow-x-auto bg-gray-100 dark:bg-gray-800 p-4 rounded-lg"
                                        style={{
                                          wordBreak: "break-word",
                                          overflowWrap: "anywhere",
                                        }}
                                        {...props}
                                      >
                                        {children}
                                      </pre>
                                    );
                                  },
                                }}
                              >
                                {content}
                              </ReactMarkdown>
                            </div>
                          );
                        } catch (markdownError) {
                          console.error(
                            "ReactMarkdown rendering error:",
                            markdownError,
                          );
                          return (
                            <div className="fallback-content bg-gray-50 dark:bg-gray-800 p-3 rounded">
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                ⚠️ Markdown rendering failed, showing plain
                                text:
                              </div>
                              <pre className="whitespace-pre-wrap text-sm font-mono break-words overflow-wrap-anywhere">
                                {content}
                              </pre>
                            </div>
                          );
                        }
                      } catch (error) {
                        console.error(
                          "Message content processing error:",
                          error,
                        );
                        return (
                          <div className="text-red-500 bg-red-50 p-3 rounded border">
                            <p className="font-medium">
                              Error rendering message
                            </p>
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm">
                                Show raw content
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-w-full">
                                {JSON.stringify(message.content, null, 2)}
                              </pre>
                            </details>
                          </div>
                        );
                      }
                    })()}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap font-medium leading-relaxed break-words overflow-wrap-anywhere">
                    {typeof message.content === "string"
                      ? message.content
                          .split("\n\n")
                          .map((paragraph, index) => (
                            <div
                              key={index}
                              className={index > 0 ? "mt-4" : ""}
                            >
                              {paragraph.split("\n").map((line, lineIndex) => (
                                <div
                                  key={lineIndex}
                                  className={lineIndex > 0 ? "mt-2" : ""}
                                >
                                  {line}
                                </div>
                              ))}
                            </div>
                          ))
                      : JSON.stringify(message.content)}
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
                    <div
                      className="w-2 h-2 bg-bio-teal rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-bio-teal rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
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
