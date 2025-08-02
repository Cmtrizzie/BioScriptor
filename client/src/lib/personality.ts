// Personality configuration - simplified
export const botPersonality = {
  tone: "professional" as "witty" | "professional" | "friendly",
  style: "direct" as "storytelling" | "direct" | "technical",
  emoji: false,
  mood: "calm" as "excited" | "calm" | "curious",
};

// Simple greetings without excessive personality
export const greetings = [
  "Hello! How can I help you today?",
  "Hi there! What can I assist you with?",  
  "Hello! What would you like to know?",
  "Hi! How can I help?",
  "Hello! What can I do for you?"
];

// Simple thinking messages
export const thinkingMessages = [
  "Processing...",
  "Analyzing...",
  "Working on it...",
  "One moment...",
  "Thinking..."
];

// Direct error responses
export const errorResponses = [
  "I'm not sure about that. Could you rephrase your question?",
  "I need more information to help with that.",
  "Could you be more specific about what you need?",
  "I don't have information on that topic."
];

// Get random item from array
export const getRandom = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)];

// Simplified response enhancement
export const enhanceResponse = (response: string, context?: { userQuery?: string; isGreeting?: boolean }) => {
  // Return response as-is without enhancement
  return response;
};

// Simple context enhancement
export const enhanceWithContext = (response: string, context: string) => {
  // Return response without additional context
  return response;
};

// Enhanced creative suggestions with programming focus
export const creativeSuggestions = [
  "Analyze DNA sequences",
  "Design PCR primers", 
  "CRISPR guide design",
  "Protein analysis",
  "Genomics pipelines",
  "Write Python scripts",
  "Build web applications",
  "Create APIs",
  "Database design",
  "Project planning",
  "Code review",
  "Algorithm optimization",
  "Debug issues",
  "System architecture"
];