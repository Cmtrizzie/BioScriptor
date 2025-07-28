import { ChatMessage, PersonalityConfig, ConversationMemory } from "./types";

// ========== PERSONALITY SYSTEM ==========
const PERSONALITY_PROFILES: Record<string, PersonalityConfig> = {
  mentor: {
    name: "Mentor",
    tone: "supportive and encouraging",
    greeting_style: "warm and welcoming",
    explanation_style: "step-by-step with examples",
    conversation_closers: [
      "Want to explore that further?",
      "Should we dive deeper into this?",
      "Ready to level up your skills?",
      "What would you like to master next?",
    ],
    expertise_level: "expert with teaching focus",
    response_patterns: {
      acknowledgments: [
        "Great question!",
        "I see where you're going with this!",
        "Excellent thinking!",
      ],
      transitions: [
        "Let's build on that...",
        "Here's how we can approach this...",
        "The next step is...",
      ],
      encouragements: [
        "You're on the right track!",
        "Keep going!",
        "That's exactly right!",
      ],
    },
  },
  // Other personalities remain the same
};

export function getPersonalityForContext(
  userMessage: string,
  conversationHistory: ChatMessage[],
  userPreferences?: { preferredPersonality?: string },
): PersonalityConfig {
  if (
    userPreferences?.preferredPersonality &&
    PERSONALITY_PROFILES[userPreferences.preferredPersonality]
  ) {
    return PERSONALITY_PROFILES[userPreferences.preferredPersonality];
  }

  const msg = userMessage.toLowerCase();
  const topics = conversationHistory
    .map((m) => m.content.toLowerCase())
    .join(" ");

  // Context-based personality selection
  if (
    /(dna|rna|protein|sequence|crispr|pcr|blast|alignment|gene|genome|analysis)/.test(
      msg + topics,
    )
  ) {
    return PERSONALITY_PROFILES.bioinformatics_guru;
  }
  if (/(how to|teach me|explain|learn|understand|tutorial|guide)/.test(msg)) {
    return PERSONALITY_PROFILES.mentor;
  }
  if (
    /(implement|algorithm|optimization|performance|architecture|advanced)/.test(
      msg,
    )
  ) {
    return PERSONALITY_PROFILES.expert;
  }
  if (/(fun|play|cool|awesome|emoji|casual|hey|yo|wazup)/.test(msg)) {
    return PERSONALITY_PROFILES.playful;
  }

  return PERSONALITY_PROFILES.mentor;
}

// ========== EMBEDDING & SEMANTIC ANALYSIS ==========
export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

export function generateSimpleEmbedding(tokens: string[]): number[] {
  const VOCABULARY = [
    "hello",
    "hi",
    "help",
    "code",
    "dna",
    "sequence",
    "analysis",
    "protein",
    "crispr",
    "pcr",
    "thank",
    "bye",
    "question",
    "explain",
    "how",
    "what",
    "bioinformatics",
    "gene",
    "mutation",
    "alignment",
    "blast",
    "fasta",
  ];

  const embedding = new Array(VOCABULARY.length).fill(0);
  tokens.forEach((token) => {
    const index = VOCABULARY.indexOf(token);
    if (index !== -1) embedding[index] += 1;
  });

  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0),
  );
  return magnitude > 0 ? embedding.map((val) => val / magnitude) : embedding;
}

export function calculateSimilarity(
  embedding1: number[],
  embedding2: number[],
): number {
  if (embedding1.length !== embedding2.length) return 0;
  const dotProduct = embedding1.reduce(
    (sum, val, i) => sum + val * embedding2[i],
    0,
  );
  return Math.max(0, Math.min(1, dotProduct));
}

// ========== CONTEXT MANAGEMENT ==========
export function buildConversationMemory(
  messages: ChatMessage[],
): ConversationMemory {
  const memory: ConversationMemory = {
    userMentions: new Map(),
    keyEntities: new Map(),
    userPreferences: {
      preferredTopics: [],
      responseLength: "detailed",
      technicalLevel: "intermediate",
    },
    conversationFlow: {
      lastTopic: "",
      topicTransitions: [],
      questionPatterns: [],
    },
  };

  messages.forEach((msg, index) => {
    if (msg.role === "user") {
      const content = msg.content.toLowerCase();

      // Track topic mentions
      const TOPICS = [
        "ai",
        "bioinformatics",
        "code",
        "python",
        "javascript",
        "dna",
        "protein",
        "analysis",
      ];
      TOPICS.forEach((topic) => {
        if (content.includes(topic)) memory.userMentions.set(topic, index);
      });

      // Extract entities
      const sequenceMatches = content.match(/[atcg]{10,}|[a-z]{3,}\d+/gi) || [];
      const toolMatches =
        content.match(/\b(blast|crispr|pcr|python|javascript|html|css)\b/gi) ||
        [];
      [...sequenceMatches, ...toolMatches].forEach((entity) => {
        const contexts = memory.keyEntities.get(entity.toLowerCase()) || [];
        contexts.push(content.substring(0, 100));
        memory.keyEntities.set(entity.toLowerCase(), contexts);
      });

      // Detect preferences
      if (content.includes("brief") || content.includes("short")) {
        memory.userPreferences.responseLength = "brief";
      }
      if (content.includes("detail") || content.includes("explain")) {
        memory.userPreferences.responseLength = "detailed";
      }
    }
  });

  return memory;
}

export function generateContextualReferences(
  currentMessage: string,
  memory: ConversationMemory,
): string[] {
  const references: string[] = [];
  const currentTopics = tokenizeText(currentMessage);

  // Reference previous mentions
  memory.userMentions.forEach((turn, topic) => {
    if (currentTopics.some((token) => token.includes(topic))) {
      const timeSince = memory.userMentions.size - turn;
      if (timeSince < 5)
        references.push(`You mentioned ${topic} earlier—let's build on that!`);
    }
  });

  // Reference entities
  memory.keyEntities.forEach((_, entity) => {
    if (currentMessage.toLowerCase().includes(entity)) {
      references.push(
        `I see you're working with ${entity} again—great choice!`,
      );
    }
  });

  return references.slice(0, 1);
}

// ========== RESPONSE STRUCTURING ==========
const RESPONSE_STRUCTURE = {
  greeting: "",
  summary: "## Understanding Your Request\n",
  solution: "## Solution\n",
  example: "### Example Implementation\n",
  code: "```",
  explanation: "### How It Works\n",
  notes: "### Key Points\n",
  followup: "### Next Steps\n",
  suggestions: "Would you like me to help with:\n",
};

export function structureResponseContent(
  content: string,
  context: {
    complexity: string;
    topics: string[];
    intent?: string;
    userMessage?: string;
  },
): string {
  if (content.length < 100) return content;
  if (content.includes("## Understanding") || content.includes("## Solution")) return content;

  const lines = content.split("\n").filter((line) => line.trim());
  const intent = context.intent || "general";

  // For simple responses, just clean formatting
  if (context.complexity === "simple" || lines.length <= 2) {
    return lines
      .map((line, i) => (i === 0 ? `**${line}**` : line))
      .join("\n\n");
  }

  let structured = "";

  // Add greeting for certain intents
  if (intent === "greeting") {
    return content; // Keep greetings simple
  }

  // Add understanding section for complex queries
  if (context.userMessage && intent !== "farewell") {
    const summary = generateIntentSummary(context.userMessage, intent);
    if (summary) {
      structured += `${RESPONSE_STRUCTURE.summary}${summary}\n\n`;
    }
  }

  // Main solution content
  const mainContent = extractMainContent(lines);
  if (mainContent) {
    structured += `${RESPONSE_STRUCTURE.solution}${mainContent}\n\n`;
  }

  // Code examples with proper formatting
  const codeContent = extractCodeContent(content);
  if (codeContent) {
    structured += `${RESPONSE_STRUCTURE.example}${codeContent}\n\n`;
  }

  // Explanations
  const explanationContent = extractExplanationContent(lines);
  if (explanationContent) {
    structured += `${RESPONSE_STRUCTURE.explanation}${explanationContent}\n\n`;
  }

  // Key points/notes
  const notesContent = extractKeyPoints(lines);
  if (notesContent) {
    structured += `${RESPONSE_STRUCTURE.notes}${notesContent}\n\n`;
  }

  return structured.trim();
}

// ========== UTILITIES ==========
function getRandomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function extractMainContent(lines: string[]): string {
  return lines
    .filter(
      (line) =>
        !line.startsWith("```") &&
        !/[\u{1F4A1}\u{26A0}\u{1F4CC}]/u.test(line) &&
        line.length > 10,
    )
    .slice(0, 3)
    .join("\n\n");
}

function extractExampleContent(content: string, topics: string[]): string {
  const codeBlocks = content.match(/```[\s\S]*?```/g);
  if (codeBlocks) return codeBlocks.join("\n\n");

  return (
    content
      .split("\n")
      .filter(
        (line) =>
          line.toLowerCase().includes("example") ||
          line.toLowerCase().includes("demo") ||
          line.includes("→") ||
          line.includes(":"),
      )
      .slice(0, 2)
      .join("\n") || ""
  );
}

function extractKeyPoints(lines: string[]): string {
  const keyPoints = lines.filter(
    (line) =>
      /important|note|remember|key|warning/i.test(line) ||
      line.includes("⚠️") || line.includes("💡") || line.includes("📌")
  );

  if (keyPoints.length === 0) return "";

  return keyPoints
    .map(point => point.startsWith("-") ? point : `- ${point}`)
    .join("\n");
}

function extractCodeContent(content: string): string {
  const codeBlocks = content.match(/```[\s\S]*?```/g);
  if (codeBlocks && codeBlocks.length > 0) {
    return codeBlocks.join("\n\n");
  }

  // Look for inline code patterns
  const inlineCode = content.match(/`[^`]+`/g);
  if (inlineCode && inlineCode.length > 2) {
    return inlineCode.join(", ");
  }

  return "";
}

function extractExplanationContent(lines: string[]): string {
  const explanationLines = lines.filter(line => 
    line.length > 50 && 
    !line.startsWith("```") && 
    !line.startsWith("#") &&
    !line.includes("example") &&
    /this|how|why|when|because/i.test(line)
  );

  return explanationLines.slice(0, 3).join("\n\n");
}

// ========== INTENT DETECTION ==========
export function detectUserIntent(query: string): string {
  const lowerQuery = query.toLowerCase().trim();

  // Greeting patterns
  if (/(^(hi|hello|hey|good morning|good afternoon|good evening))|greetings/i.test(lowerQuery)) {
    return 'greeting';
  }

  // Farewell patterns
  if (/(bye|goodbye|see you|thanks|thank you|that's all)/i.test(lowerQuery)) {
    return 'farewell';
  }

  // General trending/news queries
  if (/(trending|what's happening|news|current events|latest|worldwide|global)/i.test(lowerQuery)) {
    return 'trending_inquiry';
  }

  // Technical questions
  if (/(how to|explain|what is|help me|analyze|design|optimize)/i.test(lowerQuery)) {
    return 'technical_question';
  }

  // Code requests
  if (/(code|script|function|algorithm|implement|write|create)/i.test(lowerQuery)) {
    return 'code_request';
  }

  // Request for assistance
  if (/(can you|would you|please|need help|assist)/i.test(lowerQuery)) {
    return 'request';
  }

  return 'general_query';
}

// ========== CONVERSATION ANALYSIS ==========
export function analyzeConversationContext(messages: ChatMessage[]): {
  complexity: string;
  topics: string[];
  recentIntent?: string;
} {
  const topics: string[] = [];
  const complexity = messages.length > 3 ? 'complex' : 'simple';
  
  // Extract topics from recent messages
  messages.slice(-3).forEach(msg => {
    const content = msg.content.toLowerCase();
    if (content.includes('dna') || content.includes('sequence')) topics.push('bioinformatics');
    if (content.includes('code') || content.includes('script')) topics.push('programming');
    if (content.includes('analysis') || content.includes('data')) topics.push('analysis');
  });

  return { complexity, topics: [...new Set(topics)] };
}

// ========== CONVERSATION HELPERS ==========
export function generateConversationHook(intent: string, context: any, userMessage: string): string {
  switch (intent) {
    case 'greeting':
      return "Hello! I'm BioScriptor, your AI assistant specialized in bioinformatics, data analysis, and scientific computing. How can I help you today?";
    case 'farewell':
      return "You're welcome! Feel free to reach out whenever you need assistance with bioinformatics, coding, or data analysis. Have a great day!";
    case 'trending_inquiry':
      return "I'd be happy to help you find current information and trends.";
    case 'code_request':
      return "I'll help you create the code you need.";
    case 'technical_question':
      return "I'll break this down for you step by step.";
    default:
      return "";
  }
}

export function generateSmartFollowUps(intent: string, content: string, context: any): string {
  const followUps = [
    "Would you like me to explain any part in more detail?",
    "Need help implementing this in your specific use case?",
    "Want to see additional examples or variations?",
    "Should I walk through the next steps?",
    "Any questions about the implementation?"
  ];

  // Select contextually relevant follow-ups
  let relevantFollowUps = followUps;
  
  if (content.includes("```")) {
    relevantFollowUps = [
      "Would you like me to explain how this code works?",
      "Need help adapting this for your specific data?",
      "Want to see how to handle edge cases?"
    ];
  }

  return `### ${RESPONSE_STRUCTURE.followup}${relevantFollowUps.slice(0, 2).map(f => `- ${f}`).join('\n')}`;
}

export function generateIntentSummary(userMessage: string, intent: string): string {
  const summary = userMessage.slice(0, 100);
  
  switch (intent) {
    case 'code_request':
      return `You want me to create code${summary.includes('for') ? ' for' : ':'} ${summary.toLowerCase()}${userMessage.length > 100 ? '...' : ''}`;
    case 'technical_question':
      return `You're asking about ${summary.toLowerCase()}${userMessage.length > 100 ? '...' : ''}`;
    case 'trending_inquiry':
      return `You want current information about ${summary.toLowerCase()}${userMessage.length > 100 ? '...' : ''}`;
    default:
      return `You need help with: ${summary}${userMessage.length > 100 ? '...' : ''}`;
  }
}

export function generateCodeExample(userMessage: string): string {
  return "```python\n# Example code will be generated based on your request\nprint('Hello, BioScriptor!')\n```";
}

export function generateTrendingInquiryResponse(): string {
  return `## 🌐 Trending Information

I'd be happy to help you find trending information! However, I need more specific details about what you're looking for.

### What I can help with:
- 🔬 **Latest bioinformatics tools and methods**
- 📊 **Recent research publications**
- 🧬 **Emerging techniques in genomics**
- 💻 **New programming tools for science**

### Example queries:
- "What are the latest CRISPR developments?"
- "Recent advances in protein folding prediction"
- "New Python libraries for bioinformatics"

**What specific trending topic interests you?**`;
}

export function generateCodeResponse(intent: string, hook: string, userMessage: string, context: any): string {
  return `${hook}

## 🧰 Solution
I'll help you create the code you need. Let me know more specifics about:
- Programming language preference
- Input/output requirements  
- Any constraints or special requirements

## 💡 Example Structure
\`\`\`python
# Your code will be structured like this
def your_function():
    # Implementation here
    pass
\`\`\`

**What specific functionality do you need?**`;
}

// ========== ENHANCEMENT CORE ==========
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
  },
): Promise<ChatMessage> {
  if (!options.userMessage) return message;

  const intent = detectUserIntent(options.userMessage);
  const conversationContext = analyzeConversationContext(
    options.context.previousResponses || [],
  );

  // Handle special cases with direct responses
  if (intent === "trending_inquiry") {
    return {
      ...message,
      content: generateTrendingInquiryResponse(),
      metadata: {
        ...message.metadata,
        intent,
        conversationContext,
        naturalResponse: true,
      },
    };
  }

  if (intent === "greeting" || intent === "farewell") {
    const hook = generateConversationHook(intent, conversationContext, options.userMessage);
    return {
      ...message,
      content: hook,
      metadata: {
        ...message.metadata,
        intent,
        conversationContext,
        naturalResponse: true,
      },
    };
  }

  // Generate conversational hook
  const hook = generateConversationHook(intent, conversationContext, options.userMessage);

  // Structure the main content
  const structuredContent = structureResponseContent(message.content, {
    complexity: conversationContext.complexity,
    topics: conversationContext.topics,
    intent,
    userMessage: options.userMessage,
  });

  // Combine hook and content naturally
  let enhancedContent = "";
  
  if (hook && !structuredContent.includes(hook)) {
    enhancedContent = hook;
    if (structuredContent) {
      enhancedContent += "\n\n" + structuredContent;
    }
  } else {
    enhancedContent = structuredContent || message.content;
  }

  // Add follow-ups for interactive intents
  if (["technical_question", "code_request", "request"].includes(intent) && 
      !enhancedContent.includes("### Next Steps")) {
    enhancedContent += "\n\n" + generateSmartFollowUps(intent, message.content, conversationContext);
  }

  // Final post-processing for ChatGPT-like quality
  const finalContent = postProcessResponse(enhancedContent.trim(), intent);

  return {
    ...message,
    content: finalContent,
    metadata: {
      ...message.metadata,
      intent,
      conversationContext,
      responseStyle: "chatgpt",
      embedding: {
        vector: generateSimpleEmbedding(tokenizeText(options.userMessage)),
        model: "simple_bow",
        dimension: 22,
        timestamp: Date.now(),
      },
    },
  };
}

// ========== MARKDOWN FORMATTING UTILITIES ==========
export function formatCodeBlocks(content: string): string {
  // Ensure proper spacing around code blocks
  return content
    .replace(/```(\w+)?\n/g, '\n```$1\n')
    .replace(/\n```/g, '\n```\n')
    .replace(/```\n\n/g, '```\n');
}

export function formatSections(content: string): string {
  // Add proper spacing between sections
  return content
    .replace(/\n##/g, '\n\n##')
    .replace(/\n###/g, '\n\n###')
    .replace(/\n\n\n+/g, '\n\n'); // Remove excessive line breaks
}

export function formatLists(content: string): string {
  // Ensure consistent list formatting
  return content
    .replace(/\n-([^\n])/g, '\n- $1')
    .replace(/\n\*([^\n])/g, '\n* $1')
    .replace(/\n(\d+)\.([^\n])/g, '\n$1. $2');
}

export function enhanceMarkdownFormatting(content: string): string {
  let formatted = content;
  
  // Apply all formatting enhancements
  formatted = formatCodeBlocks(formatted);
  formatted = formatSections(formatted);
  formatted = formatLists(formatted);
  
  // Clean up extra whitespace
  formatted = formatted
    .replace(/[ \t]+\n/g, '\n')  // Remove trailing spaces
    .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
    .trim();
    
  return formatted;
}

// ========== RESPONSE POST-PROCESSING ==========
export function postProcessResponse(content: string, intent: string): string {
  let processed = enhanceMarkdownFormatting(content);
  
  // Add appropriate closing based on intent
  if (intent === "code_request" && !processed.includes("Need help")) {
    processed += "\n\nLet me know if you need any modifications or have questions about the implementation!";
  } else if (intent === "technical_question" && !processed.includes("Would you like")) {
    processed += "\n\nFeel free to ask if you'd like me to elaborate on any part of this explanation.";
  }
  
  return processed;
}
