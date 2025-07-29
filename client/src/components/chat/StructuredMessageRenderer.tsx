
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  htmlLabels: true,
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true
  }
});

interface ResponseSection {
  type: 'heading' | 'text' | 'code' | 'diagram' | 'list' | 'table';
  level?: number;
  content: string;
  language?: string;
  copyable?: boolean;
  format?: 'mermaid' | 'graphviz' | 'plantuml';
  headers?: string[];
  rows?: string[][];
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

const CopyButton: React.FC<{ text: string; className?: string; label?: string }> = ({ 
  text, 
  className = "", 
  label = "Copy to clipboard" 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Analytics tracking
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.log('copied_code', { 
          type: text.startsWith('graph') || text.startsWith('flowchart') ? 'diagram' : 'code',
          length: text.length
        });
      }
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
      title={copied ? "Copied!" : label}
      aria-label={copied ? "Copied!" : label}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
};

const CodeBlock: React.FC<{ code: string; language: string; copyable?: boolean }> = ({ 
  code, 
  language, 
  copyable = true 
}) => {
  return (
    <div className="relative mb-4 group">
      {copyable && (
        <CopyButton 
          text={code} 
          label="Copy code"
        />
      )}
      <SyntaxHighlighter
        language={language}
        style={tomorrow}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.5'
        }}
        wrapLongLines={true}
        showLineNumbers={code.split('\n').length > 10}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

const MermaidDiagram: React.FC<{ code: string; copyable?: boolean }> = ({ code, copyable = true }) => {
  const [diagramId] = useState(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
  const [isRendered, setIsRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const element = document.getElementById(diagramId);
        if (element) {
          // Clear any existing content
          element.innerHTML = '';
          
          // Render the diagram
          const { svg } = await mermaid.render(`${diagramId}-svg`, code);
          element.innerHTML = svg;
          setIsRendered(true);
          setError(null);
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram');
        setIsRendered(false);
      }
    };

    renderDiagram();
  }, [code, diagramId]);

  if (error) {
    return (
      <div className="mb-4 p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600 text-sm">⚠️ {error}</p>
        <details className="mt-2">
          <summary className="text-red-500 cursor-pointer text-xs">Show diagram code</summary>
          <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
            {code}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="relative mb-4 group">
      {copyable && isRendered && (
        <CopyButton 
          text={code} 
          label="Copy diagram code"
          className="bg-white/90 border shadow-sm"
        />
      )}
      <div 
        className="diagram-container overflow-x-auto max-w-full bg-white p-4 rounded-lg border"
        style={{ minHeight: '100px' }}
      >
        <div 
          id={diagramId} 
          className="mermaid"
          aria-label="Workflow diagram"
        />
        {!isRendered && !error && (
          <div className="flex items-center justify-center h-20 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2">Rendering diagram...</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Table: React.FC<{ headers?: string[]; rows?: string[][]; content?: string }> = ({ 
  headers, 
  rows, 
  content 
}) => {
  // Parse markdown table if content is provided
  if (content && !headers && !rows) {
    const lines = content.trim().split('\n');
    const parsedHeaders = lines[0]?.split('|').map(h => h.trim()).filter(h => h);
    const parsedRows = lines.slice(2)?.map(line => 
      line.split('|').map(cell => cell.trim()).filter(cell => cell)
    );
    
    return (
      <div className="mb-4 overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 rounded-lg">
          {parsedHeaders && (
            <thead className="bg-gray-50">
              <tr>
                {parsedHeaders.map((header, index) => (
                  <th 
                    key={index} 
                    className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {parsedRows?.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {row.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex} 
                    className="border border-gray-300 px-4 py-2 text-gray-600"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Use provided headers and rows
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300 rounded-lg">
        {headers && (
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows?.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {row.map((cell, cellIndex) => (
                <td 
                  key={cellIndex} 
                  className="border border-gray-300 px-4 py-2 text-gray-600"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
                    section.level === 2 ? 'text-xl text-gray-800' : 'text-lg text-gray-700'
                  }`}
                >
                  {section.content}
                </HeadingTag>
              );
              
            case 'text':
              return (
                <div 
                  key={key} 
                  className="mb-4 whitespace-pre-wrap leading-relaxed text-gray-700 break-words overflow-wrap-anywhere max-w-full"
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  dangerouslySetInnerHTML={{ 
                    __html: section.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono break-all">$1</code>')
                      .replace(/\n/g, '<br>')
                  }}
                />
              );
              
            case 'code':
              return (
                <CodeBlock
                  key={key}
                  code={section.content}
                  language={section.language || 'text'}
                  copyable={section.copyable !== false}
                />
              );
              
            case 'diagram':
              if (section.format === 'mermaid' || section.content.startsWith('graph') || section.content.startsWith('flowchart')) {
                return (
                  <MermaidDiagram
                    key={key}
                    code={section.content}
                    copyable={section.copyable !== false}
                  />
                );
              }
              return (
                <div key={key} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <pre className="text-sm overflow-x-auto">{section.content}</pre>
                </div>
              );
              
            case 'table':
              return (
                <Table
                  key={key}
                  headers={section.headers}
                  rows={section.rows}
                  content={section.content}
                />
              );
              
            case 'list':
              const items = section.content.split('\n').filter(item => item.trim());
              return (
                <ul key={key} className="mb-4 list-disc list-inside space-y-1 text-gray-700">
                  {items.map((item, itemIndex) => (
                    <li key={itemIndex} className="leading-relaxed">
                      {item.replace(/^-\s*/, '')}
                    </li>
                  ))}
                </ul>
              );
              
            default:
              return (
                <div key={key} className="mb-4 text-gray-700">
                  {section.content}
                </div>
              );
          }
        })}
      </div>
    );
  }

  // Fallback: Parse markdown content
  const parseMarkdownContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      
      // Handle code blocks
      if (line.startsWith('```')) {
        const language = line.replace('```', '').trim() || 'text';
        const codeLines = [];
        i++;
        
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        
        const code = codeLines.join('\n');
        
        if (language === 'mermaid' || code.startsWith('graph') || code.startsWith('flowchart')) {
          elements.push(
            <MermaidDiagram
              key={`diagram-${elements.length}`}
              code={code}
              copyable={true}
            />
          );
        } else {
          elements.push(
            <CodeBlock
              key={`code-${elements.length}`}
              code={code}
              language={language}
              copyable={true}
            />
          );
        }
        i++;
        continue;
      }
      
      // Handle headings
      if (line.startsWith('##')) {
        const level = line.match(/^#+/)?.[0].length || 2;
        const text = line.replace(/^#+\s*/, '');
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
        
        elements.push(
          <HeadingTag 
            key={`heading-${elements.length}`}
            className={`font-semibold mb-3 ${
              level === 2 ? 'text-xl text-gray-800' : 'text-lg text-gray-700'
            }`}
          >
            {text}
          </HeadingTag>
        );
        i++;
        continue;
      }
      
      // Handle tables
      if (line.includes('|') && lines[i + 1]?.includes('|')) {
        const tableLines = [];
        while (i < lines.length && lines[i].includes('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        
        elements.push(
          <Table
            key={`table-${elements.length}`}
            content={tableLines.join('\n')}
          />
        );
        continue;
      }
      
      // Handle regular text
      if (line.trim()) {
        elements.push(
          <p 
            key={`text-${elements.length}`}
            className="mb-4 leading-relaxed text-gray-700"
            dangerouslySetInnerHTML={{
              __html: line
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
            }}
          />
        );
      }
      
      i++;
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
