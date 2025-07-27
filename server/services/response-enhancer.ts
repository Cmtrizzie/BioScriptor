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
        <div id="message" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; display: none;">
            <p>🎉 Great! The page is working perfectly!</p>
        </div>
    </div>

    <script>
        function showMessage() {
            const messageDiv = document.getElementById('message');
            messageDiv.style.display = messageDiv.style.display === 'none' ? 'block' : 'none';
        }
    </script>
</body>
</html>
\`\`\``;
  }

  if (msg.includes('python') || msg.includes('script')) {
    return `\`\`\`python
#!/usr/bin/env python3
"""
Ready-to-run Python script example
Save as: example_script.py
Run with: python example_script.py
"""

import os
import datetime

def main():
    """Main function demonstrating common Python operations"""
    print("🐍 Python Script Running!")
    print(f"📅 Current time: {datetime.datetime.now()}")
    print(f"📁 Current directory: {os.getcwd()}")

    # Example: File operations
    files = [f for f in os.listdir('.') if f.endswith('.py')]
    print(f"🔍 Found {len(files)} Python files in current directory")

    # Example: User interaction
    name = input("👋 What's your name? ")
    print(f"Nice to meet you, {name}! 🎉")

    return "Script completed successfully!"

if __name__ == "__main__":
    result = main()
    print(f"✅ {result}")
\`\`\``;
  }

  if (msg.includes('javascript') || msg.includes('js')) {
    return `\`\`\`javascript
// Ready-to-run JavaScript example
// Can be used in browser console or Node.js

console.log("🚀 JavaScript is running!");

// Example: Modern JavaScript features
const greetUser = (name = "Developer") => {
    return \`Hello, \${name}! Welcome to JavaScript! 🎉\`;
};

// Example: Async/await
const fetchData = async () => {
    try {
        console.log("📡 Fetching data...");
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("✅ Data fetched successfully!");
        return { message: "Data loaded", timestamp: new Date() };
    } catch (error) {
        console.error("❌ Error:", error);
    }
};

// Example: DOM manipulation (if in browser)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("🌐 DOM is ready!");
        document.body.style.background = "linear-gradient(135deg, #667eea, #764ba2)";
    });
}

// Run examples
console.log(greetUser("Coder"));
fetchData().then(data => console.log("📊 Result:", data));
\`\`\``;
  }

  // Default generic code example
  return `\`\`\`javascript
// Ready-to-use code example
console.log("🎯 Your code is ready!");

const example = {
    message: "This is a working example",
    timestamp: new Date(),
    ready: true
};

console.log("📊 Example data:", example);
\`\`\``;
}


  // Farewell patterns
  const farewellPatterns = [
    /^(bye|goodbye|see you|see ya|talk later|catch you later|peace|adios|au revoir)\b/i,
    /^(gotta go|gtg|cya|take care|until next time|farewell)\b/i
  ];

  if (farewellPatterns.some(pattern => pattern.test(msg))) {
    return 'farewell';
  }

  return 'general';
}

/**
 * Generates natural responses based on intent with enhanced personality
 */
export function generateNaturalResponse(intent: string, userMessage: string): string {
  switch (intent) {
    case 'greeting':
      const greetingResponses = [
        "Hello! What can I assist you with?",
        "Hi! Ready to dive into some bioinformatics work?",
        "Hey there! 👋 What's on your mind?",
        "Hi! Great to see you back! 😊",
        "Hello! 🧬 What can I help you with today?",
        "Hey! What would you like to explore?",
        "Hi there! How can I assist you?",
        "Hello! Ready to tackle some science? 🔬",
        "Hey! What's up? 😊"
      ];
      return greetingResponses[Math.floor(Math.random() * greetingResponses.length)];

    case 'code_request':
      const codeResponses = [
        "Sure! Here's a code example for you:",
        "Absolutely! Let me create that for you:",
        "Coming right up! Here's the code:",
        "Perfect! Here's what you need:",
        "Got it! Here's a working example:",
        "No problem! Here's the code you requested:"
      ];
      return codeResponses[Math.floor(Math.random() * codeResponses.length)];

    case 'capability_inquiry':
      return `I'm BioScriptor, your AI bioinformatics assistant! 🧬

**Here's what I excel at:**

🔹 **Bioinformatics Analysis** — DNA/RNA/protein sequences, BLAST searches, alignments
🔹 **Code Generation** — Python, R, HTML, CSS, JavaScript with working examples
🔹 **CRISPR Design** — Guide RNA sequences and off-target analysis
🔹 **PCR Simulation** — Primer design and virtual gel electrophoresis
🔹 **File Processing** — FASTA, FASTQ, VCF, and other bioinformatics formats

💡 **Try asking:**
• "Design CRISPR guides for my gene"
• "Give me HTML code example"
• "Analyze this protein sequence"

What interests you most?`;

    case 'thanks':
      const thanksResponses = [
        "You're welcome! 😊",
        "Happy to help! 👍",
        "No problem at all!",
        "Glad I could assist! 🙂",
        "Anytime! Feel free to ask more questions.",
        "You got it! 😊",
        "My pleasure! Let me know if you need anything else.",
        "Of course! That's what I'm here for! 🧬"
      ];
      return thanksResponses[Math.floor(Math.random() * thanksResponses.length)];

    case 'farewell':
      const farewellResponses = [
        "Goodbye! Feel free to come back anytime.",
        "See you later! Happy researching!",
        "Thanks for using BioScriptor! Have a great day!",
        "Bye! Don't hesitate to return if you need more help.",
        "Take care! 👋",
        "See you soon! Good luck with your work! 🧬",
        "Catch you later! Feel free to return anytime.",
        "Peace out! Hope your research goes well! ✨"
      ];
      return farewellResponses[Math.floor(Math.random() * farewellResponses.length)];

    case 'bioinformatics':
      return `Great! I can help with bioinformatics analysis. 🧬

**What type of analysis do you need?**

🔹 **Sequence Analysis** — DNA, RNA, or protein sequences
🔹 **CRISPR Design** — Guide RNA design and off-target checking
🔹 **PCR Simulation** — Primer design and optimization
🔹 **File Processing** — FASTA, FASTQ, VCF format handling

💡 **Quick suggestions:**
1️⃣ Upload a sequence file for analysis
2️⃣ Ask about specific tools or methods
3️⃣ Request code for data processing

What would you like to start with?`;

    default:
      return '';
  }
}

export function generateStructuredResponse(topic: string, userMessage: string): string {
  const msg = userMessage.toLowerCase();

  // Protein sequence analysis
  if (msg.includes('protein') && (msg.includes('sequence') || msg.includes('analysis'))) {
    return `Got it! Protein sequence analysis can involve several steps depending on what you're looking for.

Here's what I can assist you with:

🔹 **Sequence Alignment** — Compare your sequence with others using tools like BLAST or Clustal Omega.
🔹 **Functional Prediction** — Identify domains, motifs, and possible biological roles.
🔹 **Structure Analysis** — Predict 3D structure or analyze existing models.
🔹 **Annotation** — Tag regions like signal peptides, binding sites, etc.

💡 Would you like to:
1️⃣ Align this sequence with known proteins?
2️⃣ Predict its function or structure?
3️⃣ Upload a sequence file for analysis?

Let me know how you'd like to proceed!`;
  }

  // DNA/RNA sequence analysis
  if ((msg.includes('dna') || msg.includes('rna')) && (msg.includes('sequence') || msg.includes('analysis'))) {
    return `Perfect! DNA/RNA sequence analysis offers many possibilities depending on your research goals.

Here's what I can help you with:

🔹 **Sequence Alignment** — BLAST search against databases or align multiple sequences.
🔹 **Gene Annotation** — Identify coding regions, promoters, and regulatory elements.
🔹 **Variant Analysis** — Find SNPs, indels, and structural variations.
🔹 **Quality Control** — Assess sequence quality and trim low-quality regions.

💡 Would you like to:
1️⃣ Run a BLAST search on your sequence?
2️⃣ Annotate genes and features?
3️⃣ Analyze sequence variants?

What type of analysis interests you most?`;
  }

  // File upload assistance
  if (msg.includes('file') || msg.includes('upload') || msg.includes('fasta') || msg.includes('fastq')) {
    return `Great! I can help you analyze various bioinformatics file formats.

Here's what I support:

🔹 **FASTA Files** — Protein/DNA/RNA sequences for alignment and analysis.
🔹 **FASTQ Files** — Raw sequencing data with quality scores.
🔹 **VCF Files** — Variant calling format for genomic variations.
🔹 **BED/GFF Files** — Genomic feature annotations.

💡 Would you like to:
1️⃣ Upload a file for immediate analysis?
2️⃣ Learn about file format requirements?
3️⃣ Get help preparing your data?

What type of file are you working with?`;
  }

  // General bioinformatics help
  if (msg.includes('bioinformatics') || msg.includes('analysis') || msg.includes('help')) {
    return `Excellent! I'm here to help with all aspects of bioinformatics analysis.

Here are my main capabilities:

🔹 **Sequence Analysis** — DNA, RNA, and protein sequence processing.
🔹 **File Processing** — Handle FASTA, FASTQ, VCF, and other formats.
🔹 **Tool Guidance** — Help with popular tools like BLAST, BWA, GATK, etc.
🔹 **Code Generation** — Create scripts for data processing pipelines.

💡 Would you like to:
1️⃣ Start with sequence analysis?
2️⃣ Get help with a specific tool?
3️⃣ Create a data processing pipeline?

What's your current project or challenge?`;
  }

  return '';
}



/**
 * Adds tone, formatting, and structure to a message with enhanced intent handling
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

    // For specific intents, use enhanced natural responses
    if (['greeting', 'farewell', 'thanks', 'capability_inquiry', 'bioinformatics'].includes(intent)) {
      // Generate engaging hook with personality and context
      const hook = generateConversationHook(intent, conversationContext, options.userMessage);

      if (intent === 'capability_inquiry' || intent === 'bioinformatics') {
        content = generateNaturalResponse(intent, options.userMessage);
      } else {
        content = hook;
      }

      // Add contextual follow-ups for non-simple intents
      if (['capability_inquiry', 'bioinformatics'].includes(intent)) {
        const followUps = generateSmartFollowUps(intent, content, conversationContext);
        if (followUps.length > 0) {
          content += `\n\nWould you like me to:\n${followUps.map(f => `- ${f}`).join('\n')}`;
        }
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
      if (!content.includes('```') && !content.includes('<pre>')) {
        // Generate code based on request type
        const codeExample = generateCodeExample(options.userMessage);
        structuredResponse += `### 🧪 Example\n${codeExample}\n\n`;
      } else {
        structuredResponse += `### 🧪 Example\n${content}\n\n`;
      }

      // Suggestions
      const followUps = generateSmartFollowUps(intent, content, conversationContext);
      structuredResponse += followUps;

      // Notes
      structuredResponse += `\n\n### 📌 Notes\n💡 This code is ready to run - just copy and save as an HTML file!\n⚠️ Remember to test in different browsers for compatibility.`;

      content = structuredResponse;

      return { 
        ...message, 
        content,
        metadata: {
          ...message.metadata,
          intent,
          conversationContext,
          personality: conversationContext.personality?.name,
          structured: true
        }
      };
    }

    // For questions and general responses, apply enhanced structure
    if (!isSimpleResponse(content)) {
      const hook = generateConversationHook(intent, conversationContext, options.userMessage);
      const extendedContext = { ...conversationContext, intent, userMessage: options.userMessage };
      const structuredContent = structureResponseContent(content, extendedContext);
      const followUps = generateSmartFollowUps(intent, content, conversationContext);

      // For structured responses, combine hook with modular content
      if (structuredContent.includes('### ✅')) {
        content = `${hook}\n\n${structuredContent}\n\n${followUps}`;
      } else {
        content = `${hook}\n\n${structuredContent}\n\n${followUps}`;
      }
    }
  }

  // Check if this is an explanation response that should be simplified
  if (isOverExplanation(content, options.userMessage)) {
    content = simplifyResponse(content, options.userMessage);
  }

  // Enhanced tone adjustments
  if (options.tone === 'casual') {
    content = content
      .replace(/\b(I will|I shall)\b/g, "I'll")
      .replace(/\b(you will|you shall)\b/g, "you'll")
      .replace(/\b(that is)\b/g, "that's")
      .replace(/\b(it is)\b/g, "it's")
      .replace(/However,/g, "But,")
      .replace(/Therefore,/g, "So,");
  }

  // Add empathy or urgency markers with better context awareness
  if (options.tone === 'frustrated') {
    content = `I understand this can be challenging. Let's work through it together! 💪\n\n${content}`;
  }
  if (options.tone === 'urgent') {
    content = `⚡ Let's get this sorted right away!\n\n${content}`;
  }

  return { 
    ...message, 
    content,
    metadata: {
      ...message.metadata,
      enhanced: true,
      enhancementTimestamp: Date.now()
    }
  };
}

/**
 * Detects if the AI response is over-explaining something simple
 */
function isOverExplanation(content: string, userMessage?: string): boolean {
  if (!userMessage) return false;

  const userMsg = userMessage.toLowerCase();
  const responseLength = content.length;

  // If user said a simple greeting and response is long, it's over-explaining
  if (responseLength > 100 && /^(hello|hi|hey|greetings|sup|yo)\b/i.test(userMsg)) {
    return true;
  }

  // If response contains academic explanations for simple intents
  if (content.includes('archaic') || content.includes('etymology') || 
      content.includes('linguistic') || content.includes('second-person singular')) {
    return true;
  }

  return false;
}

/**
 * Simplifies over-complex responses
 */
function simplifyResponse(content: string, userMessage?: string): string {
  if (!userMessage) return content;

  const intent = detectUserIntent(userMessage);
  return generateNaturalResponse(intent, content);
}

/**
 * Checks if response should remain simple without formatting
 */
function isSimpleResponse(content: string): boolean {
  return content.length < 150 && !content.includes('\n') && !content.includes('**');
}

/**
 * Formats content to have structure: greeting, title, bullets.
 */
function applyProStructureFormatting(content: string, options: any): string {
  if (content.includes('✅') || content.includes('🔹') || content.includes('💡')) {
    return content; // Already structured
  }

  const greeting = getContextualGreeting(options);
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length <= 1) {
    return greeting && shouldUseGreeting(options)
      ? `${greeting}\n\n${content.trim()}`
      : content.trim();
  }

  if (!shouldUseStructuredFormatting(content, options)) {
    return content.trim();
  }

  let formatted = '';

  if (greeting && shouldUseGreeting(options)) {
    formatted += `${greeting}\n\n`;
  }

  const mainLine = lines[0];
  const bodyLines = lines.slice(1, 5);

  if (isDefinitiveAnswer(mainLine)) {
    formatted += `**${mainLine}**\n\n`;
  } else {
    formatted += `${mainLine}\n\n`;
  }

  if (shouldUseBulletPoints(bodyLines)) {
    formatted += `**Key points:**\n\n`;
    bodyLines.forEach(line => {
      const emojiBullet = getEmojiBullet(line);
      formatted += `${emojiBullet} ${line.trim()}\n\n`;
    });
  } else {
    bodyLines.forEach(line => {
      formatted += `${line.trim()}\n\n`;
    });
  }

  return formatted.trim();
}

/**
 * Gets a contextual greeting depending on tone and history.
 */
function getContextualGreeting(options: any): string | null {
  const { tone, context } = options;

  if (context?.taskType === 'code' || context?.previousResponses?.length > 2) {
    return null;
  }

  const greetings: Record<string, string[]> = {
    casual: ['Hey there!', 'Hi there! 😊', 'Hello! 👋'],
    professional: ['Hello!', 'Welcome back!', 'Good to see you!'],
    excited: ['Great question! 🎯', 'Awesome! 🚀', 'Let’s dive in! 🔎'],
    frustrated: ['I’m here to help. 🙌', 'Let’s fix this. 🛠️', 'Don’t worry, we’ve got this!'],
    urgent: ['On it now! ⏱️', 'Let’s get moving. ⚡', 'Acting fast! 🔥']
  };

  const toneGreetings = greetings[tone as keyof typeof greetings] || greetings.professional;
  return toneGreetings[Math.floor(Math.random() * toneGreetings.length)];
}

/**
 * When to show greeting.
 */
function shouldUseGreeting(options: any): boolean {
  return !options?.context?.previousResponses?.length;
}

/**
 * Should structure be applied based on content?
 */
function shouldUseStructuredFormatting(content: string, options: any): boolean {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return false;

  const keywords = ['install', 'setup', 'step', 'first', 'then', 'finally', 'error', 'fix'];
  const hasInstruction = keywords.some(kw => content.toLowerCase().includes(kw));

  return hasInstruction || lines.length > 3;
}

/**
 * Detects whether the message starts definitively.
 */
function isDefinitiveAnswer(text: string): boolean {
  const patterns = [
    /^(yes|no),/i,
    /^(this is|here's|you can|you should)/i,
    /(solution|answer|result|summary)/i
  ];
  return patterns.some(p => p.test(text));
}

/**
 * Decides if the lines are list-like.
 */
function shouldUseBulletPoints(lines: string[]): boolean {
  if (lines.length < 2) return false;

  const listIndicators = lines.filter(line =>
    /^(step|first|next|also|additionally|then|finally)/i.test(line) ||
    line.includes(':') || line.length < 100
  );

  return listIndicators.length >= Math.ceil(lines.length * 0.6);
}

/**
 * Adds emojis for visual bullet enhancement.
 */
function getEmojiBullet(line: string): string {
  if (/error|fix|warning|issue/i.test(line)) return '🚫';
  if (/tip|note|consider/i.test(line)) return '💡';
  if (/step|first|then|finally|also/i.test(line)) return '🔹';
  if (/success|done|solved|correct/i.test(line)) return '✅';
  return '•';
}

/**
 * Main function to enhance AI responses with personality, context, and structure
 */
export async function enhanceResponse(
  originalResponse: string,
  context: {
    previousResponses?: ChatMessage[];
    currentTopic?: string;
    taskType?: string;
    userSkillLevel?: string;
    tone?: string;
    userIntent?: string;
    userQuery?: string;
  } = {}
): Promise<string> {
  const { tone = 'professional', userSkillLevel = 'intermediate', userIntent, userQuery } = context;

  // If this is a trending/general query, provide structured trending information
  if (userIntent === 'general_trending' || (userQuery && /(trending|what's happening|news|current events|latest|worldwide|global)/i.test(userQuery))) {
    return generateTrendingResponse(userQuery || '');
  }

  // Analyze the response to understand its content
  const responseAnalysis = analyzeResponseContent(originalResponse);

  // Apply structured formatting based on training documents
  let enhancedResponse = applyStructuredFormat(originalResponse, responseAnalysis, userIntent, userQuery);

  // Add personality touches
  enhancedResponse = addPersonalityToResponse(enhancedResponse, tone);

  // Add contextual suggestions with proper format
  enhancedResponse = addStructuredSuggestions(enhancedResponse, context);

  return enhancedResponse;
}

/**
 * Analyze response content to determine its characteristics
 */
function analyzeResponseContent(response: string): any {
  const hasBioKeywords = /(dna|rna|protein|sequence|gene|bioinformatics)/i.test(response);
  const hasCodeKeywords = /(code|script|function|algorithm)/i.test(response);

  return {
    hasBioKeywords,
    hasCodeKeywords
  };
}

/**
 * Add personality to the response based on tone
 */
function addPersonalityToResponse(response: string, tone: string): string {
  if (tone === 'casual') {
    response = response.replace(/\b(?:I am|I'm)\b/g, 'I\'m just');
  }
  return response;
}

/**
 * Generate structured trending response based on training documents
 */
function generateTrendingResponse(userQuery: string): string {
  return `### ✅ What You Asked
You're curious about current global trends and what's happening worldwide.

### 🌍 Trending Topics (Global Snapshot)

**🧠 AI & Technology:**
- ChatGPT, Claude, and Gemini driving AI adoption across industries
- AI coding assistants revolutionizing software development
- Open-source AI models gaining enterprise traction

**🧬 Bioinformatics & Science:**
- CRISPR 3.0 advancing toward complex genetic therapies
- AI-driven drug discovery accelerating pharmaceutical research
- Personalized medicine using genomic sequencing

**💰 Finance & Markets:**
- Cryptocurrency market showing renewed institutional interest
- AI startups securing record funding rounds
- Green energy investments reaching new heights

**🌐 Global Events:**
- Climate technology innovations addressing sustainability goals
- Space exploration missions advancing lunar and Mars programs
- International cooperation on pandemic preparedness

### 💬 Suggestions
Would you like me to:
- Dive deeper into any specific trending topic?
- Search for the latest research in bioinformatics?
- Explore current AI developments in your field?`;
}

/**
 * Apply structured formatting based on training documents
 */
function applyStructuredFormat(response: string, analysis: any, userIntent?: string, userQuery?: string): string {
  // If response already has structure, enhance it
  if (response.includes('###') || response.includes('##')) {
    return response;
  }

  // Apply standard structure for bioinformatics responses
  if (userIntent === 'technical_question' || analysis.hasBioKeywords) {
    return `### ✅ What You Asked
${getIntentSummary(userQuery || '', userIntent || '')}

### 🧰 Solution
${response}

### 📌 Notes
⚠️ Always validate results with experimental data when possible.`;
  }

  // For general queries, provide helpful structure
  return `### ✅ What You Asked
${getIntentSummary(userQuery || '', userIntent || '')}

### 🧰 Response
${response}`;
}

/**
 * Generate intent summary for structured responses
 */
function getIntentSummary(userQuery: string, userIntent: string): string {
  if (userIntent === 'greeting') {
    return "You're saying hello and looking to get started with something.";
  }
  if (userIntent === 'technical_question') {
    return "You need help with a technical bioinformatics or coding task.";
  }
  if (userIntent === 'general_trending') {
    return "You're curious about current global trends and what's happening worldwide.";
  }

  // Extract key intent from query
  const lowerQuery = userQuery.toLowerCase();
  if (lowerQuery.includes('sequence')) {
    return "You need assistance with sequence analysis or manipulation.";
  }
  if (lowerQuery.includes('crispr')) {
    return "You're working on CRISPR design or analysis.";
  }
  if (lowerQuery.includes('code') || lowerQuery.includes('script')) {
    return "You need help writing or debugging code.";
  }

  return "You need assistance with your request.";
}

/**
 * Add structured suggestions based on training format
 */
function addStructuredSuggestions(response: string, context: any): string {
  // Don't add suggestions if they already exist
  if (response.includes('Would you like me to:')) {
    return response;
  }

  const { currentTopic, taskType, userIntent } = context;
  let suggestions: string[] = [];

  // Context-specific suggestions based on training documents
  if (userIntent === 'technical_question' || taskType === 'bioinformatics') {
    suggestions = [
      "Convert it to a different format?",
      "Add visualization features?",
      "Optimize for performance?"
    ];
  } else if (currentTopic?.includes('code') || currentTopic?.includes('script')) {
    suggestions = [
      "Add error handling?",
      "Create unit tests?",
      "Optimize the algorithm?"
    ];
  } else {
    suggestions = [
      "Explore this topic further?",
      "Get specific examples?",
      "Learn about related concepts?"
    ];
  }

  const suggestionText = suggestions.slice(0, 3).map(s => `- ${s}`).join('\n');

  return `${response}

### 💬 Suggestions
Would you like me to:
${suggestionText}`;
}