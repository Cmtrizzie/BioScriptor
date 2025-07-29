
import React from 'react';
import { creativeSuggestions, getRandom } from '@/lib/personality';

interface CreativeSuggestionsProps {
  onSelect: (message: string) => void;
  visible?: boolean;
}

export default function CreativeSuggestions({ onSelect, visible = true }: CreativeSuggestionsProps) {
  if (!visible) return null;

  // Show 4 random suggestions
  const suggestions = [...creativeSuggestions]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  return (
    <div className="max-w-3xl mx-auto mb-4 flex flex-wrap gap-2 justify-center">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-700"
          onClick={() => onSelect(suggestion.replace(/🧬|🔬|🚀|🧪|💻|🤖|📊|🔍/g, '').trim())}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
