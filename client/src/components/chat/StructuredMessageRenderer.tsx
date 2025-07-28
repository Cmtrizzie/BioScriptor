
import React, { useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { useState } from 'react';

interface ResponseSection {
  type: 'heading' | 'text' | 'code' | 'diagram' | 'list' | 'table';
  level?: number;
  content: string;
  language?: string;
  copyable?: boolean;
  format?: 'mermaid' | 'graphviz' | 'plantuml';
}

interface StructuredResponse {
  sections: ResponseSection[];
  metadata?: {
    intent: string;
    complexity: string;
    hasCode: boolean;
    hasDiagram: boolean;
  };
}

interface StructuredMessageRendererProps {
  content: string;
  structuredData?: StructuredResponse;
}

const CopyButton: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={`absolute top-2 right-2 h-8 w-8 p-0 opacity-70 hover:opacity-100 transition-opacity ${className}`}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
};

const MermaidDiagram: React.FC<{ code: string; id: string }> = ({ code, id }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;
      
      try {
        // Import mermaid dynamically
        const mermaid = (await import('mermaid')).default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          themeVariables: {
            primaryColor: '#3b82f6',
            primaryTextColor: '#1f2937',
            primaryBorderColor: '#e5e7eb',
            lineColor: '#6b7280',
            secondaryColor: '#f3f4f6',
            tertiaryColor: '#ffffff'
          }
        });

        const { svg } = await mermaid.render(id, code);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="p-4 border border-red-200 rounded-md bg-red-50">
              <p class="text-red-600 text-sm">Error rendering diagram</p>
              <pre class="text-xs mt-2 text-gray-600">${code}</pre>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [code, id]);

  return (
    <div className="relative my-4 p-4 bg-white border rounded-lg">
      <CopyButton text={code} />
      <div ref={containerRef} className="mermaid-container" />
    </div>
  );
};

const CodeBlock: React.FC<{ 
  code: string; 
  language: string; 
  copyable?: boolean 
}> = ({ code, language, copyable = true }) => {
  return (
    <div className="relative my-4">
      {copyable && <CopyButton text={code} />}
      <SyntaxHighlighter
        language={language}
        style={tomorrow}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
        }}
        showLineNumbers={code.split('\n').length > 5}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

const StructuredMessageRenderer: React.FC<StructuredMessageRendererProps> = ({ 
  content, 
  structuredData 
}) => {
  // If we have structured data, render it
  if (structuredData?.sections && structuredData.sections.length > 0) {
    return (
      <div className="structured-response">
        {structuredData.sections.map((section, index) => {
          const key = `section-${index}`;
          
          switch (section.type) {
            case 'heading':
              const HeadingTag = `h${section.level || 2}` as keyof JSX.IntrinsicElements;
              return (
                <HeadingTag 
                  key={key} 
                  className={`font-semibold mb-3 ${
                    section.level === 2 ? 'text-xl' : 'text-lg'
                  }`}
                >
                  {section.content}
                </HeadingTag>
              );
              
            case 'text':
              return (
                <div 
                  key={key} 
                  className="mb-4 whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: section.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
                  }}
                />
              );
              
            case 'code':
              return (
                <CodeBlock
                  key={key}
                  code={section.content}
                  language={section.language || 'text'}
                  copyable={section.copyable}
                />
              );
              
            case 'diagram':
              if (section.format === 'mermaid') {
                return (
                  <MermaidDiagram
                    key={key}
                    code={section.content}
                    id={`mermaid-${index}`}
                  />
                );
              }
              return (
                <div key={key} className="my-4 p-4 bg-gray-50 rounded-lg">
                  <pre className="text-sm">{section.content}</pre>
                </div>
              );
              
            case 'list':
              const listItems = section.content.split('\n').filter(item => item.trim());
              return (
                <ul key={key} className="mb-4 list-disc list-inside space-y-1">
                  {listItems.map((item, i) => (
                    <li key={i} className="leading-relaxed">
                      {item.replace(/^[-*]\s*/, '')}
                    </li>
                  ))}
                </ul>
              );
              
            default:
              return (
                <div key={key} className="mb-4">
                  {section.content}
                </div>
              );
          }
        })}
      </div>
    );
  }

  // Fallback to parsing markdown-style content
  const parseMarkdownContent = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code blocks
      if (line.startsWith('```')) {
        const language = line.replace('```', '').trim() || 'text';
        const codeLines: string[] = [];
        i++; // Skip opening ```

        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }

        if (language === 'mermaid') {
          elements.push(
            <MermaidDiagram
              key={elements.length}
              code={codeLines.join('\n')}
              id={`mermaid-${elements.length}`}
            />
          );
        } else {
          elements.push(
            <CodeBlock
              key={elements.length}
              code={codeLines.join('\n')}
              language={language}
              copyable={true}
            />
          );
        }
        i++; // Skip closing ```
      }
      // Headings
      else if (line.startsWith('##')) {
        const level = line.match(/^#+/)?.[0].length || 2;
        const text = line.replace(/^#+\s*/, '');
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
        
        elements.push(
          <HeadingTag 
            key={elements.length} 
            className={`font-semibold mb-3 ${level === 2 ? 'text-xl' : 'text-lg'}`}
          >
            {text}
          </HeadingTag>
        );
        i++;
      }
      // Regular text
      else if (line.trim()) {
        elements.push(
          <p 
            key={elements.length} 
            className="mb-4 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: line
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
            }}
          />
        );
        i++;
      } else {
        i++;
      }
    }

    return elements;
  };

  return (
    <div className="structured-response">
      {parseMarkdownContent(content)}
    </div>
  );
};

export default StructuredMessageRenderer;
