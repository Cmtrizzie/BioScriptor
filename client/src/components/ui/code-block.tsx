import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  language: string;
  code: string;
}

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
    <div className="bg-gray-900 rounded-lg overflow-hidden mb-4">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
        <span className="text-gray-300 text-sm font-medium capitalize">
          {language || 'Code'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-gray-400 hover:text-white text-sm"
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <pre className="p-4 text-sm text-gray-100 overflow-x-auto scrollbar-hide">
        <code>{code}</code>
      </pre>
    </div>
  );
}
