import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileText } from "lucide-react";

interface CodeBlockProps {
  language: string;
  code: string;
}

// Language icons mapping
const getLanguageIcon = (lang: string) => {
  const icons: Record<string, string> = {
    javascript: '🟨',
    typescript: '🔷',
    python: '🐍',
    html: '🌐',
    css: '🎨',
    java: '☕',
    cpp: '⚡',
    c: '⚡',
    shell: '🐚',
    bash: '🐚',
    sql: '🗃️',
    json: '📋',
    xml: '📄',
    markdown: '📝',
  };
  return icons[lang?.toLowerCase()] || '📄';
};

export default function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-block-language">
          <span className="mr-1">{getLanguageIcon(language)}</span>
          {language || 'Code'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="code-block-copy flex items-center gap-1 h-7 px-2"
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
      <pre className="code-block-content">
        <code>{code}</code>
      </pre>
    </div>
  );
}
