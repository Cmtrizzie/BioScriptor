import { ChatMessage, ProcessedInput, MessageEmbedding } from './types';

// ========== PERSONALITY SYSTEM ==========

/**
 * Predefined personality configurations for consistent bot behavior
 */
export interface PersonalityConfig {
  name: string;
  tone: string;
  greeting_style: string;
  explanation_style: string;
  conversation_closers: string[];
  expertise_level: string;
  response_patterns: {
    acknowledgments: string[];
    transitions: string[];
    encouragements: string[];
  };
}

export const PERSONALITY_PROFILES: Record<string, PersonalityConfig> = {
  mentor: {
    name: "Mentor",
    tone: "supportive and encouraging",
    greeting_style: "warm and welcoming",
    explanation_style: "step-by-step with examples",
    conversation_closers: [
      "Want to explore that further?",
      "Should we dive deeper into this?",
      "Ready to level up your skills?",
      "What would you like to master next?"
    ],
    expertise_level: "expert with teaching focus",
    response_patterns: {
      acknowledgments: ["Great question!", "I see where you're going with this!", "Excellent thinking!"],
      transitions: ["Let's build on that...", "Here's how we can approach this...", "The next step is..."],
      encouragements: ["You're on the right track!", "Keep going!", "That's exactly right!"]
    }
  },
  expert: {
    name: "Expert",
    tone: "professional and precise",
    greeting_style: "direct and focused",
    explanation_style: "technical with detailed examples",
    conversation_closers: [
      "Need more technical details?",
      "Should we examine the implementation?",
      "Want to see advanced applications?",
      "Shall we optimize this further?"
    ],
    expertise_level: "deep technical knowledge",
    response_patterns: {
      acknowledgments: ["Precisely!", "That's correct.", "Exactly right."],
      transitions: ["Building on this concept...", "The technical implementation involves...", "Consider this approach..."],
      encouragements: ["Well reasoned!", "Sound analysis!", "Good technical insight!"]
    }
  },
  playful: {
    name: "Playful",
    tone: "fun and energetic",
    greeting_style: "enthusiastic and casual",
    explanation_style: "creative with analogies and humor",
    conversation_closers: [
      "Want to play around with this more?",
      "Should we spice things up? 🌶️",
      "Ready for the next adventure?",
      "Feeling like experimenting further? 🧪"
    ],
    expertise_level: "knowledgeable but approachable",
    response_patterns: {
      acknowledgments: ["Awesome sauce! 🎉", "Now we're cooking! 🔥", "Love it! 💫"],
      transitions: ["Plot twist...", "Here's where it gets fun...", "Time for some magic..."],
      encouragements: ["You're crushing it! 💪", "Boom! Nailed it! 🎯", "That's the spirit! ✨"]
    }
  },
  bioinformatics_guru: {
    name: "Bioinformatics Guru",
    tone: "scientifically rigorous yet approachable",
    greeting_style: "professional with scientific enthusiasm",
    explanation_style: "method-focused with real-world applications",
    conversation_closers: [
      "Want to analyze this further? 🧬",
      "Should we explore related pathways?",
      "Ready to dive into the data?",
      "Shall we run some simulations?"
    ],
    expertise_level: "specialized bioinformatics expertise",
    response_patterns: {
      acknowledgments: ["Fascinating approach!", "Solid methodology!", "Great research question!"],
      transitions: ["From a bioinformatics perspective...", "The analysis reveals...", "Let's examine the data..."],
      encouragements: ["Excellent scientific thinking!", "That's good hypothesis formation!", "Nice analytical approach!"]
    }
  }
};

/**
 * Get personality configuration based on context and user preferences
 */
export function getPersonalityForContext(
  userMessage: string,
  conversationHistory: ChatMessage[],
  userPreferences?: { preferredPersonality?: string }
): PersonalityConfig {
  // Use user preference if specified
  if (userPreferences?.preferredPersonality && PERSONALITY_PROFILES[userPreferences.preferredPersonality]) {
    return PERSONALITY_PROFILES[userPreferences.preferredPersonality];
  }

  // Auto-detect personality based on context
  const msg = userMessage.toLowerCase();
  const topics = conversationHistory.map(m => m.content.toLowerCase()).join(' ');

  // Bioinformatics context
  if (/(dna|rna|protein|sequence|crispr|pcr|blast|alignment|gene|genome|analysis)/.test(msg + topics)) {
    return PERSONALITY_PROFILES.bioinformatics_guru;
  }

  // Learning/teaching context
  if (/(how to|teach me|explain|learn|understand|tutorial|guide)/.test(msg)) {
    return PERSONALITY_PROFILES.mentor;
  }

  // Technical/expert context
  if (/(implement|algorithm|optimization|performance|architecture|advanced)/.test(msg)) {
    return PERSONALITY_PROFILES.expert;
  }

  // Fun/casual context
  if (/(fun|play|cool|awesome|emoji|casual|hey|yo|wazup)/.test(msg)) {
    return PERSONALITY_PROFILES.playful;
  }

  // Default to mentor for general interactions
  return PERSONALITY_PROFILES.mentor;
}

// ========== 1. TOKENIZATION & EMBEDDING ==========

/**
 * Simple tokenization - breaks text into meaningful units
 */
export function tokenizeText(text: string): string[] {
  // Remove extra whitespace and split on word boundaries
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0);
}

/**
 * Generate simple embedding vectors (in production, use proper embedding models)
 */
export function generateSimpleEmbedding(tokens: string[]): number[] {
  const vocabulary = [
    'hello', 'hi', 'help', 'code', 'dna', 'sequence', 'analysis', 'protein',
    'crispr', 'pcr', 'thank', 'bye', 'question', 'explain', 'how', 'what',
    'bioinformatics', 'gene', 'mutation', 'alignment', 'blast', 'fasta'
  ];

  // Create a simple bag-of-words embedding
  const embedding = new Array(vocabulary.length).fill(0);

  tokens.forEach(token => {
    const index = vocabulary.indexOf(token);
    if (index !== -1) {
      embedding[index] += 1;
    }
  });

  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
}

/**
 * Calculate semantic similarity between two embedding vectors
 */
export function calculateSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) return 0;

  const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
  return Math.max(0, Math.min(1, dotProduct));
}

// ========== 2. CONTEXT AWARENESS ==========

/**
 * Enhanced conversation memory for natural referencing
 */
export interface ConversationMemory {
  userMentions: Map<string, number>; // topic -> last mentioned turn
  keyEntities: Map<string, string[]>; // entity -> related contexts
  userPreferences: {
    preferredTopics: string[];
    responseLength: 'brief' | 'detailed';
    technicalLevel: 'beginner' | 'intermediate' | 'expert';
  };
  conversationFlow: {
    lastTopic: string;
    topicTransitions: string[];
    questionPatterns: string[];
  };
}

/**
 * Build conversation memory from message history
 */
export function buildConversationMemory(messages: ChatMessage[]): ConversationMemory {
  const memory: ConversationMemory = {
    userMentions: new Map(),
    keyEntities: new Map(),
    userPreferences: {
      preferredTopics: [],
      responseLength: 'detailed',
      technicalLevel: 'intermediate'
    },
    conversationFlow: {
      lastTopic: '',
      topicTransitions: [],
      questionPatterns: []
    }
  };

  messages.forEach((msg, index) => {
    if (msg.role === 'user') {
      const content = msg.content.toLowerCase();

      // Track topic mentions
      const topics = ['ai', 'bioinformatics', 'code', 'python', 'javascript', 'dna', 'protein', 'analysis'];
      topics.forEach(topic => {
        if (content.includes(topic)) {
          memory.userMentions.set(topic, index);
        }
      });

      // Extract entities (sequences, tools, methods)
      const sequenceMatches = content.match(/[atcg]{10,}|[a-z]{3,}\d+/gi) || [];
      const toolMatches = content.match(/\b(blast|crispr|pcr|python|javascript|html|css)\b/gi) || [];

      [...sequenceMatches, ...toolMatches].forEach(entity => {
        const contexts = memory.keyEntities.get(entity.toLowerCase()) || [];
        contexts.push(content.substring(0, 100));
        memory.keyEntities.set(entity.toLowerCase(), contexts);
      });

      // Analyze user preferences
      if (content.includes('brief') || content.includes('short')) {
        memory.userPreferences.responseLength = 'brief';
      }
      if (content.includes('detail') || content.includes('explain')) {
        memory.userPreferences.responseLength = 'detailed';
      }
    }
  });

  return memory;
}

/**
 * Generate natural references to previous conversation
 */
export function generateContextualReferences(
  currentMessage: string, 
  memory: ConversationMemory
): string[] {
  const references: string[] = [];
  const currentTopics = tokenizeText(currentMessage);

  // Reference previous mentions
  memory.userMentions.forEach((turn, topic) => {
    if (currentTopics.some(token => token.includes(topic))) {
      const timeSince = memory.userMentions.size - turn;
      if (timeSince < 5) {
        references.push(`You mentioned ${topic} earlier—let's build on that!`);
      }
    }
  });

  // Reference related entities
  memory.keyEntities.forEach((contexts, entity) => {
    if (currentMessage.toLowerCase().includes(entity)) {
      references.push(`I see you're working with ${entity} again—great choice!`);
    }
  });

  return references.slice(0, 1); // Keep it natural with just one reference
}

/**
 * Analyzes conversation history to extract relevant context
 */
export function analyzeConversationContext(messages: ChatMessage[]): {
  topics: string[];
  sentiment: string;
  complexity: string;
  recentContext: string;
  memory: ConversationMemory;
  personality: PersonalityConfig;
} {
  const recentMessages = messages.slice(-6); // Last 3 exchanges
  const allText = recentMessages.map(m => m.content).join(' ');
  const tokens = tokenizeText(allText);

  // Extract topics using keyword analysis
  const bioTopics = tokens.filter(token => 
    ['dna', 'rna', 'protein', 'gene', 'sequence', 'crispr', 'pcr', 'alignment', 'blast'].includes(token)
  );
  const codeTopics = tokens.filter(token => 
    ['code', 'html', 'python', 'javascript', 'function', 'variable'].includes(token)
  );

  // Determine sentiment
  const positiveWords = tokens.filter(token => 
    ['good', 'great', 'excellent', 'perfect', 'amazing', 'thanks', 'helpful'].includes(token)
  ).length;
  const negativeWords = tokens.filter(token => 
    ['bad', 'wrong', 'error', 'problem', 'issue', 'frustrated', 'difficult'].includes(token)
  ).length;

  let sentiment = 'neutral';
  if (positiveWords > negativeWords) sentiment = 'positive';
  if (negativeWords > positiveWords) sentiment = 'negative';

  // Determine complexity preference
  const complexityIndicators = tokens.filter(token => 
    ['simple', 'basic', 'easy', 'quick', 'brief'].includes(token)
  ).length;
  const complexity = complexityIndicators > 2 ? 'simple' : 'detailed';

  // Build conversation memory
  const memory = buildConversationMemory(messages);

  // Get appropriate personality
  const currentMessage = messages[messages.length - 1]?.content || '';
  const personality = getPersonalityForContext(currentMessage, messages);

  return {
    topics: [...new Set([...bioTopics, ...codeTopics])],
    sentiment,
    complexity,
    recentContext: recentMessages.map(m => `${m.role}: ${m.content.slice(0, 100)}`).join('\n'),
    memory,
    personality
  };
}

/**
 * Weighs the relevance of different conversation parts using attention-like mechanism
 */
export function calculateAttentionWeights(
  currentQuery: string, 
  conversationHistory: ChatMessage[]
): Map<string, number> {
  const currentTokens = tokenizeText(currentQuery);
  const currentEmbedding = generateSimpleEmbedding(currentTokens);
  const weights = new Map<string, number>();

  conversationHistory.forEach((message, index) => {
    const messageTokens = tokenizeText(message.content);
    const messageEmbedding = generateSimpleEmbedding(messageTokens);
    const similarity = calculateSimilarity(currentEmbedding, messageEmbedding);

    // Weight recent messages higher, but consider semantic similarity
    const recencyWeight = Math.exp(-0.1 * (conversationHistory.length - index - 1));
    const finalWeight = similarity * 0.7 + recencyWeight * 0.3;

    weights.set(message.id, finalWeight);
  });

  return weights;
}

// ========== 3. RESPONSE GENERATION ==========

/**
 * Generates engaging conversation hooks based on context and personality
 */
export function generateConversationHook(
  intent: string, 
  context: { topics: string[]; sentiment: string; complexity: string; memory?: ConversationMemory; personality?: PersonalityConfig },
  userMessage?: string
): string {
  const personality = context.personality || PERSONALITY_PROFILES.mentor;
  const memory = context.memory;

  // Generate contextual references if available
  let contextualRef = '';
  if (memory && userMessage) {
    const references = generateContextualReferences(userMessage, memory);
    if (references.length > 0) {
      contextualRef = references[0] + ' ';
    }
  }
  const hooks = {
    greeting: {
      positive: [...personality.response_patterns.acknowledgments, `${contextualRef}${getRandomFromArray(personality.response_patterns.acknowledgments)}`],
      negative: [`${contextualRef}Don't worry, I'm here to help!`, `${contextualRef}Let's tackle this together!`],
      neutral: [`${contextualRef}Hello! What can we explore today?`, `${contextualRef}Hi! What's on your agenda?`]
    },
    question: {
      positive: ["Excellent question! 🎯", "Great thinking! Let me break this down:", "Love the curiosity! Here's what I know:"],
      negative: ["I understand this can be confusing. Let's clarify:", "No worries! This is actually simpler than it seems:"],
      neutral: ["Good question! Let's dive into this:", "Interesting topic! Here's the breakdown:"]
    },
    code_request: {
      positive: ["Perfect! I love coding challenges! 💻", "Awesome! Let's build something great:", "Excellent choice! Here's your solution:"],
      negative: ["Don't worry, coding gets easier with practice! Here's help:", "No problem! Let's solve this step by step:"],
      neutral: ["Absolutely! Here's a clean solution for you:", "Sure thing! Let me code that up:"]
    },
    bioinformatics: {
      positive: ["Fantastic! Bioinformatics is my favorite topic! 🧬", "Excellent! Let's dive into the science:", "Perfect timing! Here's what we can do:"],
      negative: ["I know bioinformatics can seem overwhelming. Let's simplify:", "No worries! Let's break this down clearly:"],
      neutral: ["Great! Let's analyze this together:", "Interesting! Here's the scientific approach:"]
    }
  };

  const intentHooks = hooks[intent as keyof typeof hooks] || hooks.question;
  const sentimentHooks = intentHooks[context.sentiment as keyof typeof intentHooks] || intentHooks.neutral;

  return sentimentHooks[Math.floor(Math.random() * sentimentHooks.length)];
}

/**
 * Structures content using professional modular sections
 */
export function structureResponseContent(
  content: string, 
  context: { complexity: string; topics: string[]; intent?: string; userMessage?: string }
): string {
  if (content.length < 100) return content; // Keep short responses simple

  // Don't restructure if already formatted
  if (content.includes('### ✅') || content.includes('### 🧰') || content.includes('**Key Insight:**')) {
    return content;
  }

  const lines = content.split('\n').filter(line => line.trim());
  const intent = context.intent || 'general';

  if (context.complexity === 'simple' || lines.length <= 2) {
    // For simple responses, use clear structure with emojis
    return lines.map((line, i) => {
      if (i === 0) return `**${line}**`;
      if (line.includes(':')) return `🔹 ${line}`;
      return line;
    }).join('\n\n');
  }

  // Apply professional modular structure for complex responses
  return applyModularStructure(content, context);
}

/**
 * Applies professional modular structure to responses
 */
function applyModularStructure(
  content: string, 
  context: { intent?: string; topics: string[]; userMessage?: string }
): string {
  const lines = content.split('\n').filter(line => line.trim());
  const intent = context.intent || 'general';

  let structured = '';

  // 1. What You Asked - Intent Summary
  if (context.userMessage && shouldIncludeIntentSummary(intent)) {
    const intentSummary = generateIntentSummary(context.userMessage, intent);
    structured += `### ✅ What You Asked\n${intentSummary}\n\n`;
  }

  // 2. Solution or Explanation - Main Content
  const mainContent = extractMainContent(lines);
  if (mainContent) {
    structured += `### 🧰 Solution\n${mainContent}\n\n`;
  }

  // 3. Example or Demo - Code blocks or demonstrations
  const exampleContent = extractExampleContent(content, context.topics);
  if (exampleContent) {
    structured += `### 🧪 Example\n${exampleContent}\n\n`;
  }

  // 4. Notes/Warnings - Important information
  const notesContent = extractNotesContent(lines);
  if (notesContent) {
    structured += `### 📌 Notes\n${notesContent}\n\n`;
  }

  return structured.trim();
}

/**
 * Determines if intent summary should be included
 */
function shouldIncludeIntentSummary(intent: string): boolean {
  return !['greeting', 'thanks', 'farewell'].includes(intent);
}

/**
 * Generates intent summary from user message
 */
function generateIntentSummary(userMessage: string, intent: string): string {
  const msg = userMessage.toLowerCase();

  if (intent === 'code_request') {
    if (msg.includes('html') || msg.includes('webpage') || msg.includes('website')) {
      return 'You want HTML code for a webpage or website.';
    }
    if (msg.includes('python') || msg.includes('script')) {
      return 'You need a Python script or automation.';
    }
    if (msg.includes('javascript') || msg.includes('js')) {
      return 'You want JavaScript code or functionality.';
    }
    return 'You requested code or a programming solution.';
  }

  if (intent === 'bioinformatics') {
    if (msg.includes('crispr')) return 'You need CRISPR design and analysis.';
    if (msg.includes('pcr')) return 'You want PCR primer design or simulation.';
    if (msg.includes('sequence')) return 'You need sequence analysis assistance.';
    return 'You asked for bioinformatics analysis help.';
  }

  if (intent === 'question') {
    return 'You asked for information or explanation.';
  }

  return 'You need assistance with your request.';
}

/**
 * Extracts main content from response lines
 */
function extractMainContent(lines: string[]): string {
  // Find the main explanatory content (usually first few non-code lines)
  const mainLines = lines.filter(line => 
    !line.startsWith('```') && 
    !line.startsWith('💡') && 
    !line.startsWith('⚠️') &&
    !line.startsWith('📌') &&
    line.length > 10
  ).slice(0, 3);

  return mainLines.join('\n\n');
}

/**
 * Extracts example content (code blocks, demonstrations)
 */
function extractExampleContent(content: string, topics: string[]): string {
  // Extract code blocks
  const codeBlocks = content.match(/```[\s\S]*?```/g);
  if (codeBlocks && codeBlocks.length > 0) {
    return codeBlocks.join('\n\n');
  }

  // Look for example-like content
  const lines = content.split('\n');
  const exampleLines = lines.filter(line => 
    line.toLowerCase().includes('example') ||
    line.toLowerCase().includes('demo') ||
    line.includes('→') ||
    line.includes(':')
  );

  if (exampleLines.length > 0) {
    return exampleLines.slice(0, 2).join('\n');
  }

  return '';
}

/**
 * Extracts notes and warnings content
 */
function extractNotesContent(lines: string[]): string {
  const noteLines = lines.filter(line => 
    line.includes('💡') || 
    line.includes('⚠️') || 
    line.includes('📌') ||
    line.toLowerCase().includes('note') ||
    line.toLowerCase().includes('warning') ||
    line.toLowerCase().includes('important')
  );

  if (noteLines.length > 0) {
    return noteLines.join('\n');
  }

  // Generate contextual notes
  const contextualNotes = [
    '💡 This solution is ready to use and can be customized further.',
    '📌 Make sure to test in your specific environment.',
    '⚠️ Always backup your data before making changes.'
  ];

  return contextualNotes[Math.floor(Math.random() * contextualNotes.length)];
}

/**
 * Generates smart follow-up suggestions in structured format
 */
export function generateSmartFollowUps(
  intent: string, 
  content: string, 
  context: { topics: string[]; personality?: PersonalityConfig; memory?: ConversationMemory }
): string {
  const personality = context.personality || PERSONALITY_PROFILES.mentor;
  const followUps: Record<string, string[]> = {
    code_request: [
      "Add CSS styling to this?",
      "Convert it to React?",
      "Make it mobile responsive?",
      "Add JavaScript functionality?"
    ],
    bioinformatics: [
      "Analyze your sequence data?",
      "Explore related analysis tools?",
      "Visualize the results?",
      "Run additional analyses?"
    ],
    question: [
      "Show a practical example?",
      "Provide more detailed explanation?",
      "Generate code implementation?",
      "Explore related topics?"
    ],
    general: [
      "Create a working example?",
      "Add more features?",
      "Optimize the solution?",
      "Learn about alternatives?"
    ]
  };

  const baseFollowUps = followUps[intent] || followUps.general;

  // Customize based on detected topics
  const customFollowUps = [];
  if (context.topics.includes('html')) customFollowUps.push("Convert it to React?");
  if (context.topics.includes('dna')) customFollowUps.push("Analyze DNA sequences?");
  if (context.topics.includes('code')) customFollowUps.push("Add styling with TailwindCSS?");
  if (context.topics.includes('protein')) customFollowUps.push("Explore protein analysis tools?");

  // Merge and get top 3 suggestions
  const allSuggestions = [...customFollowUps, ...baseFollowUps];
  const topSuggestions = allSuggestions.slice(0, 3);

  // Format as structured suggestions section
  const formattedSuggestions = topSuggestions.map(suggestion => `- ${suggestion}`).join('\n');

  return `### 💬 Suggestions\nWould you like me to:\n${formattedSuggestions}`;
}

/**
 * Utility function to get random item from array
 */
function getRandomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Gets appropriate emoji for content based on context
 */
function getContentEmoji(content: string, topics: string[]): string {
  const contentLower = content.toLowerCase();

  if (contentLower.includes('dna') || contentLower.includes('sequence')) return '🧬';
  if (contentLower.includes('code') || contentLower.includes('function')) return '💻';
  if (contentLower.includes('analysis') || contentLower.includes('result')) return '📊';
  if (contentLower.includes('step') || contentLower.includes('process')) return '🔄';
  if (contentLower.includes('tip') || contentLower.includes('note')) return '💡';
  if (contentLower.includes('error') || contentLower.includes('issue')) return '⚠️';
  if (contentLower.includes('success') || contentLower.includes('complete')) return '✅';

  return '🔹';
}

/**
 * Detects if a message appears to be templated or generic.
 */
export function isTemplatedResponse(content: string): boolean {
  const templatePatterns = [
    /^I('m| am) (an AI|a bioinformatics|an assistant)/i,
    /^As an AI assistant/i,
    /^Let me help you with/i,
    /^I understand you need help with/i,
    /^I can assist you with/i
  ];
  return templatePatterns.some(pattern => pattern.test(content));
}

/**
 * Suggests a model alternative for a given model.
 */
export function getAlternateModel(currentModel: string): string {
  const modelAlternatives: Record<string, string> = {
    'default': 'chat',
    'bio': 'science',
    'code': 'research',
    'science': 'bio',
    'research': 'default',
    'chat': 'science'
  };
  return modelAlternatives[currentModel] || 'default';
}

/**
 * Chooses the best response between two candidates.
 */
export function selectBestResponse(primary: ChatMessage, alternate: ChatMessage): ChatMessage {
  const confidenceDiff = Math.abs(primary.metadata?.confidence - alternate.metadata?.confidence);

  if (confidenceDiff > 0.2) {
    return primary.metadata?.confidence > alternate.metadata?.confidence ? primary : alternate;
  }

  const primaryTemplated = isTemplatedResponse(primary.content);
  const alternateTemplated = isTemplatedResponse(alternate.content);

  if (primaryTemplated && !alternateTemplated) return alternate;
  if (!primaryTemplated && alternateTemplated) return primary;

  return primary.content.length > alternate.content.length ? primary : alternate;
}

/**
 * Detects user intent from their message with improved pattern matching
 */
export function detectUserIntent(userMessage: string): string {
  const msg = userMessage.toLowerCase().trim();

  // Enhanced greeting patterns (including more variations and casual forms)
  const greetingPatterns = [
    /^(hello|hi|hey|greetings|good morning|good afternoon|good evening|sup|yo|hiya|howdy|waddup|wassup)\b/i,
    /^(hello thy|hi thy|hey thy|greetings thy|hai thy|helo thy)\b/i,
    /^(helo|hai|ey|eyo|yoo|heya|heyy|hii|hiiii)\b/i,
    /^(wazup|whats up|what's up|gud morning|good mornin|gm|hello wazup)\b/i,
    /^(salutations|bonjour|hola|ciao|aloha|greetings|morning|afternoon|evening)\b/i
  ];

  if (greetingPatterns.some(pattern => pattern.test(msg))) {
    return 'greeting';
  }

  // Trending/current events patterns - should be detected before general questions
  const trendingPatterns = [
    /\b(trending|what's trending|whats trending|current events|latest news|what's happening|whats happening|news|worldwide|global events)\b/i,
    /^(whats trending|what's trending|trending)\s*$/i
  ];

  if (trendingPatterns.some(pattern => pattern.test(msg))) {
    return 'trending_inquiry';
  }

  // Code request patterns
  const codePatterns = [
    /\b(give me|show me|create|write|generate|make me).*(code|html|css|javascript|python|example)\b/i,
    /\b(html|css|javascript|python|code).*(example|template|sample)\b/i,
    /^(ready to run|give me an? .* example)\b/i
  ];

  if (codePatterns.some(pattern => pattern.test(msg))) {
    return 'code_request';
  }

  // Capability inquiry patterns
  const capabilityPatterns = [
    /\b(what are you|what can you|what do you|what are you good at|what are you after|capabilities|skills)\b/i,
    /\b(help me with|assist me with|what can you help)\b/i
  ];

  if (capabilityPatterns.some(pattern => pattern.test(msg))) {
    return 'capability_inquiry';
  }

  // Thanks patterns
  const thanksPatterns = [
    /^(thanks|thank you|thx|ty|appreciate|cheers|much appreciated)\b/i,
    /\b(thanks|thank you|thx|ty|appreciate it|cheers)\b/i
  ];

  if (thanksPatterns.some(pattern => pattern.test(msg))) {
    return 'thanks';
  }

  // Question patterns
  if (/^(what|how|where|when|why|can you|could you|would you|is it|are there|do you|will you)\b/i.test(msg) ||
      msg.includes('?')) {
    return 'question';
  }

  // Request patterns
  if (/^(please|can you help|i need|help me|assist me|show me|could you|would you mind)\b/i.test(msg)) {
    return 'request';
  }

  // Bioinformatics specific patterns
  const bioPatterns = [
    /\b(sequence|dna|rna|protein|blast|alignment|crispr|pcr|analysis)\b/i,
    /\b(biological|bioinformatics|molecular|genetics|genome)\b/i
  ];

  if (bioPatterns.some(pattern => pattern.test(msg))) {
    return 'bioinformatics';
  }


/**
 * Generates appropriate code examples based on user request
 */
function generateCodeExample(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes('html') || msg.includes('webpage') || msg.includes('website')) {
    return `\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ready to Run Example</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 15px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
        }
        .btn { 
            background: #007bff; 
            color: white; 
            padding: 12px 24px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 16px;
            transition: all 0.3s ease;
        }
        .btn:hover { 
            background: #0056b3; 
            transform: translateY(-2px);
        }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Welcome to Your New Website</h1>
        <p>This is a complete, responsive HTML page with modern styling and interactive elements!</p>
        <button class="btn" onclick="showMessage()">Click Me!</button>
        <div id="message" style="margin-top: 20px;"></div>
    </div>
    
    <script>
        function showMessage() {
            document.getElementById('message').innerHTML = 
                '<p style="color: #28a745; font-weight: bold; margin-top: 15px;">🎉 Hello! Your website is working perfectly!</p>';
        }
    </script>
</body>
</html>
\`\`\``;
  }

  if (msg.includes('python') || msg.includes('script')) {
    return `\`\`\`python
# Complete Python Script Example
import pandas as pd
import numpy as np
from datetime import datetime

def main():
    """Main function demonstrating Python capabilities"""
    print("🐍 Python Script Ready!")
    
    # Data processing example
    data = {
        'name': ['Alice', 'Bob', 'Charlie'],
        'score': [95, 87, 92],
        'date': [datetime.now().strftime('%Y-%m-%d')] * 3
    }
    
    df = pd.DataFrame(data)
    print("\\n📊 Data Summary:")
    print(df)
    
    # Analysis
    avg_score = df['score'].mean()
    print(f"\\n📈 Average Score: {avg_score:.1f}")
    
    return df

if __name__ == "__main__":
    result = main()
    print("\\n✅ Script completed successfully!")
\`\`\``;
  }

  return `\`\`\`javascript
// Ready-to-run JavaScript Example
function createInteractiveApp() {
    console.log('🚀 JavaScript App Starting...');
    
    // Create dynamic content
    const app = {
        data: ['Item 1', 'Item 2', 'Item 3'],
        
        render() {
            const container = document.createElement('div');
            container.style.cssText = 'padding: 20px; font-family: Arial;';
            
            this.data.forEach(item => {
                const element = document.createElement('div');
                element.textContent = item;
                element.style.cssText = 'margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;';
                container.appendChild(element);
            });
            
            document.body.appendChild(container);
        }
    };
    
    app.render();
    console.log('✅ App ready!');
}

// Run the app
createInteractiveApp();
\`\`\``;
}

/**
 * Add contextual notes based on content type
 */
function addContextualNotes(response: string): string {
  // Add notes for bioinformatics content
  if ((response.includes('sequence') || response.includes('CRISPR') || response.includes('PCR')) && (response.includes('DNA') || response.includes('RNA') || response.includes('sequence'))) {
    return `${response}

*Note: Always validate bioinformatics results with experimental data when possible.*`;
  }

  return response;
}

/**
 * Add subtle personality touches without being robotic
 */
function addSubtlePersonality(response: string, tone: string): string {
  // Just return the original response - let the AI's natural personality shine through
  return response;
}

/**
 * Main function to enhance AI responses with personality, context, and structure
 */
export async function enhanceResponse(
  message: ChatMessage,
  options: {
    context: {
      previousResponses: ChatMessage[];
      currentTopic?: string;
      taskType?: string;
    };
    tone?: string;
    userSkillLevel?: string;
    userMessage?: string;
  }
): Promise<ChatMessage> {
  let content = message.content;

  // ========== APPLY NEW CONVERSATIONAL FLOW ==========

  if (options.userMessage) {
    const intent = detectUserIntent(options.userMessage);

    // Analyze conversation context for better understanding
    const conversationContext = analyzeConversationContext(options.context.previousResponses);

    // Generate embeddings for semantic understanding
    const userTokens = tokenizeText(options.userMessage);
    const userEmbedding = generateSimpleEmbedding(userTokens);

    // Calculate attention weights for relevant context
    const attentionWeights = calculateAttentionWeights(options.userMessage, options.context.previousResponses);

    // For specific intents, use enhanced natural responses - including trending inquiries
    if (['greeting', 'farewell', 'thanks', 'capability_inquiry', 'bioinformatics', 'trending_inquiry'].includes(intent)) {
      // For trending inquiries, use the natural response directly without extra structure
      if (intent === 'trending_inquiry') {
        content = generateNaturalResponse(intent, options.userMessage);
        return { 
          ...message, 
          content,
          metadata: {
            ...message.metadata,
            intent,
            conversationContext,
            naturalResponse: true
          }
        };
      }

      // Generate engaging hook with personality and context for other intents
      const hook = generateConversationHook(intent, conversationContext, options.userMessage);

      if (intent === 'capability_inquiry' || intent === 'bioinformatics') {
        content = generateNaturalResponse(intent, options.userMessage);
      } else {
        content = hook;
      }

      return { 
        ...message, 
        content,
        metadata: {
          ...message.metadata,
          intent,
          conversationContext,
          embedding: {
            vector: userEmbedding,
            model: 'simple_bow',
            dimension: userEmbedding.length,
            timestamp: Date.now()
          }
        }
      };
    }

    // For code requests, ensure proper formatting with structured approach
    if (intent === 'code_request') {
      const hook = generateConversationHook(intent, conversationContext, options.userMessage);

      let structuredResponse = '';

      // Intent Summary
      const intentSummary = generateIntentSummary(options.userMessage, intent);
      structuredResponse += `### ✅ What You Asked\n${intentSummary}\n\n`;

      // Solution
      structuredResponse += `### 🧰 Solution\n${hook}\n\n`;

      // Example/Demo
      if (!content.includes('