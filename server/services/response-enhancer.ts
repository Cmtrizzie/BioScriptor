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
  creative: {
    name: "Creative Thinker",
    tone: "imaginative and metaphorical",
    greeting_style: "inspired and poetic",
    explanation_style: "analogies and thought experiments",
    conversation_closers: [
      "What unexpected connection could we explore next?",
      "Should we try a thought experiment?",
      "What creative angle should we consider?",
    ],
    expertise_level: "lateral thinker",
    response_patterns: {
      acknowledgments: [
        "What an inspiring perspective!",
        "That opens fascinating possibilities!",
        "Let's build on that creative spark!",
      ],
      transitions: [
        "This reminds me of...",
        "Imagine if we approached it like...",
        "Here's a metaphorical way to consider it...",
      ],
      encouragements: [
        "Your creativity is contagious!",
        "That's outside-the-box thinking!",
        "Wonderfully unconventional approach!",
      ],
    },
  },
  innovator: {
    name: "Innovation Catalyst",
    tone: "visionary and experimental",
    greeting_style: "future-focused and bold",
    explanation_style: "paradigm-shifting perspectives",
    conversation_closers: [
      "What breakthrough could we pioneer?",
      "Ready to disrupt conventional thinking?",
      "Should we prototype something revolutionary?",
    ],
    expertise_level: "breakthrough specialist",
    response_patterns: {
      acknowledgments: [
        "That's revolutionary thinking!",
        "You're onto something groundbreaking!",
        "This could change everything!",
      ],
      transitions: [
        "Let's push the boundaries...",
        "What if we completely reimagined...",
        "The future might look like...",
      ],
      encouragements: [
        "Innovation requires bold leaps!",
        "You're pioneering new territory!",
        "That's next-level thinking!",
      ],
    },
  },
  bioinformatics_guru: {
    name: "Bioinformatics Guru",
    tone: "technical and precise",
    greeting_style: "professional and focused",
    explanation_style: "detailed with scientific references",
    conversation_closers: [
      "Need further analysis?",
      "Should we explore other genomic tools?",
      "Want to validate these findings?",
    ],
    expertise_level: "PhD-level bioinformatics",
    response_patterns: {
      acknowledgments: [
        "Fascinating genomic data!",
        "Important biological question!",
        "Excellent research focus!",
      ],
      transitions: [
        "From a bioinformatics perspective...",
        "Analyzing this sequence...",
        "The genomic evidence suggests...",
      ],
      encouragements: [
        "Your approach is scientifically sound!",
        "This is cutting-edge research!",
        "You're asking the right questions!",
      ],
    },
  },
  expert: {
    name: "Technical Expert",
    tone: "concise and professional",
    greeting_style: "direct and efficient",
    explanation_style: "technical with optimizations",
    conversation_closers: [
      "Need performance optimization?",
      "Should we implement error handling?",
      "Want to scale this solution?",
    ],
    expertise_level: "senior engineer level",
    response_patterns: {
      acknowledgments: [
        "Technically challenging problem!",
        "Well-formulated question!",
        "Important optimization point!",
      ],
      transitions: [
        "The optimal approach would be...",
        "Considering system architecture...",
        "For maximum performance...",
      ],
      encouragements: [
        "Your implementation is efficient!",
        "That's the optimal solution!",
        "You've addressed the core challenge!",
      ],
    },
  },
  playful: {
    name: "Playful Companion",
    tone: "fun and casual",
    greeting_style: "energetic and friendly",
    explanation_style: "light-hearted with emojis",
    conversation_closers: [
      "Want to explore something fun?",
      "Should we try a creative approach?",
      "Ready for a coding adventure?",
    ],
    expertise_level: "approachable expert",
    response_patterns: {
      acknowledgments: [
        "Awesome question! 😄",
        "So cool you asked this! 🎉",
        "Love this creative thinking! 💡",
      ],
      transitions: [
        "Let's jazz this up... 🎷",
        "Here's the fun part... 🎢",
        "Time to play with code... 🕹️",
      ],
      encouragements: [
        "You're rocking this! 🤘",
        "Coding superstar! 🌟",
        "Nailed it! 🎯",
      ],
    },
  },
};

// Creative triggers and idea generation
const CREATIVE_TRIGGERS = [
  "be more creative",
  "think outside the box",
  "innovative approach",
  "unconventional idea",
  "creative solution",
  "brainstorm",
  "imagine if",
  "what if we",
  "alternative approach",
  "breakthrough",
];

const IDEA_GENERATORS = {
  analogy: (topic: string) => `How is ${topic} like ${getRandomFromArray(["a living ecosystem", "a complex machine", "a musical composition", "an evolving story"])}?`,
  exaggeration: (topic: string) => `What if we took ${topic} to the extreme?`,
  combination: (topic: string) => `What if we combined ${topic} with ${getRandomFromArray(["AI-driven automation", "quantum computing", "biomimetic design", "swarm intelligence"])}?`,
  reversal: (topic: string) => `What if we did the opposite of conventional ${topic}?`,
  crossDomain: (topic: string) => `How might ${getRandomFromArray(["nature", "music", "architecture", "gaming", "art"])} inspire our approach to ${topic}?`,
};

function generateCreativePrompts(context: any): string[] {
  const prompts = [
    "What if we approached this from a completely different angle?",
    "Here's an unconventional perspective:",
    "This reminds me of a fascinating scientific analogy...",
    "Imagine if we combined this with an unexpected concept:",
    "What would happen if we reversed our assumptions?",
    "Here's a metaphorical way to think about this:",
  ];

  return [getRandomFromArray(prompts)];
}

function divergentThinking(userMessage: string, history: ChatMessage[]): string {
  const techniques = [
    { 
      name: "SCAMPER",
      apply: (msg: string) => `🧠 **SCAMPER Analysis**\n\n• **Substitute**: What elements could we replace?\n• **Combine**: What concepts could we merge?\n• **Adapt**: What can we borrow from other fields?\n• **Modify**: How can we amplify or minimize aspects?\n• **Put to other uses**: What alternative applications exist?\n• **Eliminate**: What if we removed constraints?\n• **Reverse**: What if we flipped our approach?`
    },
    {
      name: "Random Input",
      apply: (msg: string) => {
        const randomConcepts = ["quantum entanglement", "fractal geometry", "symbiotic relationships", "emergent behavior", "molecular origami"];
        return `🔀 **Random Catalyst**\n\nHow might **${getRandomFromArray(randomConcepts)}** relate to your challenge?\n\nSometimes unexpected connections spark breakthrough insights!`;
      }
    },
    {
      name: "Alternative Perspectives",
      apply: (msg: string) => `🔄 **Perspective Shift**\n\nLet's view this through different lenses:\n• **From nature's perspective**: How would evolution solve this?\n• **From an artist's view**: What aesthetic principles apply?\n• **From a child's curiosity**: What obvious questions are we missing?\n• **From the future**: How might this evolve in 10 years?`
    }
  ];

  return getRandomFromArray(techniques).apply(userMessage);
}

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

  // Creative mode detection
  if (CREATIVE_TRIGGERS.some(trigger => msg.includes(trigger))) {
    return PERSONALITY_PROFILES.creative;
  }

  // Innovation triggers
  if (/(innovate|disrupt|revolutionize|breakthrough|pioneer|transform)/.test(msg)) {
    return PERSONALITY_PROFILES.innovator;
  }

  // Rotate personalities for longer conversations to maintain engagement
  if (conversationHistory.length > 0 && conversationHistory.length % 6 === 0) {
    return PERSONALITY_PROFILES.creative;
  }

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

// ========== STRUCTURED RESPONSE TYPES ==========
export interface ResponseSection {
  type: "heading" | "text" | "code" | "diagram" | "list" | "table";
  level?: number;
  content: string;
  language?: string;
  copyable?: boolean;
  format?: "mermaid" | "graphviz" | "plantuml";
}

export interface StructuredResponse {
  sections: ResponseSection[];
  metadata?: {
    intent: string;
    complexity: string;
    hasCode: boolean;
    hasDiagram: boolean;
  };
}

export function generateStructuredResponse(
  content: string,
  context: {
    complexity: string;
    topics: string[];
    intent?: string;
    userMessage?: string;
  },
): StructuredResponse {
  const sections: ResponseSection[] = [];
  const intent = context.intent || "general";

  // Handle special response types
  if (intent === "code_request") {
    return generateCodeStructuredResponse(content, context);
  }

  if (
    context.topics.includes("bioinformatics") ||
    context.topics.includes("analysis")
  ) {
    return generateBioinformaticsStructuredResponse(content, context);
  }

  // Parse existing content into sections
  const lines = content.split("\n").filter((line) => line.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    if (line.startsWith("##")) {
      sections.push({
        type: "heading",
        level: 2,
        content: line.replace(/^##\s*/, ""),
      });
    } else if (line.startsWith("###")) {
      sections.push({
        type: "heading",
        level: 3,
        content: line.replace(/^###\s*/, ""),
      });
    }
    // Code blocks
    else if (line.startsWith("```")) {
      const language = line.replace("```", "").trim();
      const codeLines = [];
      i++; // Skip opening ```

      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }

      sections.push({
        type: "code",
        content: codeLines.join("\n"),
        language: language || "text",
        copyable: true,
      });
    }
    // Regular text
    else if (line.length > 0) {
      sections.push({
        type: "text",
        content: line,
      });
    }
  }

  // Add diagram if workflow or process is mentioned
  if (
    content.includes("workflow") ||
    content.includes("process") ||
    content.includes("steps")
  ) {
    const diagram = generateWorkflowDiagram(context.userMessage || "");
    if (diagram) {
      sections.splice(1, 0, {
        type: "diagram",
        format: "mermaid",
        content: diagram,
      });
    }
  }

  return {
    sections,
    metadata: {
      intent,
      complexity: context.complexity,
      hasCode: sections.some((s) => s.type === "code"),
      hasDiagram: sections.some((s) => s.type === "diagram"),
    },
  };
}

export function generateCodeStructuredResponse(
  content: string,
  context: any,
): StructuredResponse {
  const sections: ResponseSection[] = [];

  // Add main heading
  sections.push({
    type: "heading",
    level: 2,
    content: "🚀 Code Solution",
  });

  // Add understanding section
  if (context.userMessage) {
    sections.push({
      type: "text",
      content: `Here's the solution for: ${context.userMessage.slice(0, 100)}${context.userMessage.length > 100 ? "..." : ""}`,
    });
  }

  // Extract and add code blocks
  const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
  if (codeBlocks.length > 0) {
    codeBlocks.forEach((block) => {
      const lines = block.split("\n");
      const language = lines[0].replace("```", "").trim() || "text";
      const code = lines.slice(1, -1).join("\n");

      sections.push({
        type: "code",
        content: code,
        language,
        copyable: true,
      });
    });
  } else {
    // Generate sample code if none exists
    const language = detectLanguageFromQuery(context.userMessage || "");
    sections.push({
      type: "code",
      content: generateSampleCode(language, context.userMessage || ""),
      language,
      copyable: true,
    });
  }

  // Add explanation
  const explanation = extractExplanationContent(content.split("\n"));
  if (explanation) {
    sections.push({
      type: "heading",
      level: 3,
      content: "How It Works",
    });
    sections.push({
      type: "text",
      content: explanation,
    });
  }

  return {
    sections,
    metadata: {
      intent: "code_request",
      complexity: context.complexity,
      hasCode: true,
      hasDiagram: false,
    },
  };
}

export function generateBioinformaticsStructuredResponse(
  content: string,
  context: any,
): StructuredResponse {
  const sections: ResponseSection[] = [];

  sections.push({
    type: "heading",
    level: 2,
    content: "🧬 Bioinformatics Solution",
  });

  // Add workflow diagram for complex analyses
  if (
    context.userMessage?.includes("analysis") ||
    context.userMessage?.includes("pipeline")
  ) {
    sections.push({
      type: "diagram",
      format: "mermaid",
      content: generateBioinformaticsDiagram(context.userMessage),
    });
  }

  // Add main content
  const mainContent = extractMainContent(content.split("\n"));
  if (mainContent) {
    sections.push({
      type: "text",
      content: mainContent,
    });
  }

  // Add code if present
  const codeContent = extractCodeContent(content);
  if (codeContent) {
    sections.push({
      type: "heading",
      level: 3,
      content: "Implementation",
    });
    sections.push({
      type: "code",
      content: codeContent.replace(/```\w*\n?/g, "").replace(/```/g, ""),
      language: "python",
      copyable: true,
    });
  }

  return {
    sections,
    metadata: {
      intent: context.intent,
      complexity: context.complexity,
      hasCode: !!codeContent,
      hasDiagram: true,
    },
  };
}

// Helper functions for structured responses
function detectLanguageFromQuery(query: string): string {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes("python") || lowerQuery.includes("bioinformatics"))
    return "python";
  if (lowerQuery.includes("javascript") || lowerQuery.includes("react"))
    return "javascript";
  if (lowerQuery.includes("bash") || lowerQuery.includes("shell"))
    return "bash";
  if (lowerQuery.includes("sql")) return "sql";
  return "python"; // Default for bioinformatics
}

function generateSampleCode(language: string, query: string): string {
  switch (language) {
    case "python":
      return `# ${query.slice(0, 50)}${query.length > 50 ? "..." : ""}\ndef solution():\n    # Your implementation here\n    pass\n\n# Example usage\nresult = solution()\nprint(result)`;
    case "javascript":
      return `// ${query.slice(0, 50)}${query.length > 50 ? "..." : ""}\nfunction solution() {\n    // Your implementation here\n    return result;\n}\n\n// Example usage\nconst result = solution();\nconsole.log(result);`;
    case "bash":
      return `#!/bin/bash\n# ${query.slice(0, 50)}${query.length > 50 ? "..." : ""}\n\necho "Running solution..."\n# Your commands here`;
    default:
      return `// Implementation for: ${query.slice(0, 50)}${query.length > 50 ? "..." : ""}\n// Add your code here`;
  }
}

function generateWorkflowDiagram(query: string): string {
  if (query.includes("analysis") || query.includes("pipeline")) {
    return `graph TD
                 A[Input Data] --> B[Preprocessing]
                 B --> C[Analysis]
                 C --> D[Visualization]
                 D --> E[Results]`;
  }

  if (query.includes("development") || query.includes("build")) {
    return `graph LR
                 A[Plan] --> B[Design]
                 B --> C[Develop]
                 C --> D[Test]
                 D --> E[Deploy]`;
  }

  return `graph TD
                 A[Start] --> B[Process]
                 B --> C[Result]`;
}

function generateBioinformaticsDiagram(query: string): string {
  if (query.includes("sequencing") || query.includes("dna")) {
    return `graph TD
                 A[Raw Reads] --> B[Quality Control]
                 B --> C[Alignment]
                 C --> D[Variant Calling]
                 D --> E[Annotation]
                 E --> F[Results]`;
  }

  if (query.includes("protein") || query.includes("structure")) {
    return `graph TD
                 A[Sequence] --> B[Homology Search]
                 B --> C[Structure Prediction]
                 C --> D[Validation]
                 D --> E[Analysis]`;
  }

  return `graph TD
                 A[Data Input] --> B[Processing]
                 B --> C[Analysis]
                 C --> D[Visualization]`;
}

export function structureResponseContent(
  content: string,
  context: {
    complexity: string;
    topics: string[];
    intent?: string;
    userMessage?: string;
  },
): string {
  // Generate structured response and convert back to markdown
  const structured = generateStructuredResponse(content, context);

  return structured.sections
    .map((section) => {
      switch (section.type) {
        case "heading":
          const hashes = "#".repeat(section.level || 2);
          return `${hashes} ${section.content}`;
        case "code":
          return `\`\`\`${section.language || "text"}\n${section.content}\n\`\`\``;
        case "diagram":
          return `\`\`\`${section.format || "mermaid"}\n${section.content}\n\`\`\``;
        case "text":
        default:
          return section.content;
      }
    })
    .join("\n\n");
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
      line.includes("⚠️") ||
      line.includes("💡") ||
      line.includes("📌"),
  );

  if (keyPoints.length === 0) return "";

  return keyPoints
    .map((point) => (point.startsWith("-") ? point : `- ${point}`))
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
  const explanationLines = lines.filter(
    (line) =>
      line.length > 50 &&
      !line.startsWith("```") &&
      !line.startsWith("#") &&
      !line.includes("example") &&
      /this|how|why|when|because/i.test(line),
  );

  return explanationLines.slice(0, 3).join("\n\n");
}

// ========== INTENT DETECTION ==========
export function detectUserIntent(query: string): string {
  const lowerQuery = query.toLowerCase().trim();

  // Greeting patterns
  if (
    /(^(hi|hello|hey|good morning|good afternoon|good evening))|greetings/i.test(
      lowerQuery,
    )
  ) {
    return "greeting";
  }

  // Casual greeting patterns
  if (/(yo|hey|wazup|wassup|what's up|sup)/i.test(lowerQuery)) {
    return "casual_greeting";
  }

  // Small talk patterns
  if (/(weather|hot|cold|feeling|mood|today|how are you)/i.test(lowerQuery)) {
    return "small_talk";
  }

  // Farewell patterns
  if (/(bye|goodbye|see you|thanks|thank you|that's all)/i.test(lowerQuery)) {
    return "farewell";
  }

  // Technical questions
  if (
    /(how to|explain|what is|help me|analyze|design|optimize)/i.test(lowerQuery)
  ) {
    return "technical_question";
  }

  // Code requests
  if (
    /(code|script|function|algorithm|implement|write|create)/i.test(lowerQuery)
  ) {
    return "code_request";
  }

  // Request for assistance
  if (/(can you|would you|please|need help|assist)/i.test(lowerQuery)) {
    return "request";
  }

  return "general_query";
}

// ========== CONVERSATION ANALYSIS ==========
export function analyzeConversationContext(messages: ChatMessage[]): {
  complexity: string;
  topics: string[];
  recentIntent?: string;
  creativityLevel: 'low' | 'medium' | 'high';
  synthesisOpportunities: string[];
} {
  const topics: string[] = [];
  const complexity = messages.length > 3 ? "complex" : "simple";
  const synthesisOpportunities: string[] = [];

  // Extract topics from recent messages
  messages.slice(-3).forEach((msg) => {
    const content = msg.content.toLowerCase();
    if (content.includes("dna") || content.includes("sequence"))
      topics.push("bioinformatics");
    if (content.includes("code") || content.includes("script"))
      topics.push("programming");
    if (content.includes("analysis") || content.includes("data"))
      topics.push("analysis");
    if (content.includes("ai") || content.includes("machine learning"))
      topics.push("artificial intelligence");
    if (content.includes("visualization") || content.includes("chart"))
      topics.push("data visualization");
  });

  // Detect creativity level
  let creativityLevel: 'low' | 'medium' | 'high' = 'low';
  const creativeKeywords = ['imagine', 'what if', 'analogy', 'metaphor', 'create', 'design', 'innovate', 'brainstorm'];
  const creativeCount = messages.filter(msg => 
    creativeKeywords.some(kw => msg.content.toLowerCase().includes(kw))
  ).length;

  if (creativeCount > 3) creativityLevel = 'high';
  else if (creativeCount > 1) creativityLevel = 'medium';

  // Identify synthesis opportunities
  const uniqueTopics = [...new Set(topics)];
  if (uniqueTopics.length > 1) {
    for (let i = 0; i < uniqueTopics.length - 1; i++) {
      for (let j = i + 1; j < uniqueTopics.length; j++) {
        synthesisOpportunities.push(`${uniqueTopics[i]} + ${uniqueTopics[j]}`);
      }
    }
  }

  return { 
    complexity, 
    topics: uniqueTopics, 
    creativityLevel,
    synthesisOpportunities
  };
}

// ========== TRIGGER PHRASES & BUILDER MODE ==========
export interface BuilderContext {
  isBuilderMode: boolean;
  useCase?: string;
  techStack?: string[];
  experience?: "beginner" | "intermediate" | "advanced";
}

export function detectBuilderMode(
  userMessage: string,
  conversationHistory: ChatMessage[]
): BuilderContext {
  const lowerMessage = userMessage.toLowerCase();
  
  // Builder mode triggers
  const builderTriggers = [
    'build', 'create', 'develop', 'implement', 'design',
    'make', 'generate', 'construct', 'setup', 'configure'
  ];
  
  const isBuilderMode = builderTriggers.some(trigger => lowerMessage.includes(trigger));
  
  // Detect use case
  let useCase: string | undefined;
  if (lowerMessage.includes('web') || lowerMessage.includes('website')) useCase = 'web_development';
  if (lowerMessage.includes('api') || lowerMessage.includes('backend')) useCase = 'api_development';
  if (lowerMessage.includes('analysis') || lowerMessage.includes('bioinformatics')) useCase = 'data_analysis';
  
  // Detect tech stack
  const techStack: string[] = [];
  if (lowerMessage.includes('python')) techStack.push('python');
  if (lowerMessage.includes('javascript') || lowerMessage.includes('js')) techStack.push('javascript');
  if (lowerMessage.includes('react')) techStack.push('react');
  if (lowerMessage.includes('node')) techStack.push('nodejs');
  
  // Detect experience level
  let experience: "beginner" | "intermediate" | "advanced" = "intermediate";
  if (lowerMessage.includes('beginner') || lowerMessage.includes('new to')) experience = "beginner";
  if (lowerMessage.includes('advanced') || lowerMessage.includes('expert')) experience = "advanced";
  
  return {
    isBuilderMode,
    useCase,
    techStack: techStack.length > 0 ? techStack : undefined,
    experience
  };
}

export function generateFollowUpResponse(
  userMessage: string,
  builderContext: BuilderContext
): string | null {
  if (!builderContext.isBuilderMode) return null;
  
  const lowerMessage = userMessage.toLowerCase();
  
  // Follow-up triggers
  const followUpTriggers = [
    'yes', 'yeah', 'sure', 'go ahead', 'continue', 'next',
    'tell me more', 'show me', 'explain', 'how'
  ];
  
  if (!followUpTriggers.some(trigger => lowerMessage.includes(trigger))) return null;
  
  return `Great! Let's continue building your ${builderContext.useCase || 'project'}. 

## Next Steps
Based on your requirements, here's what we can work on:

${builderContext.techStack ? `**Tech Stack**: ${builderContext.techStack.join(', ')}` : ''}
${builderContext.experience ? `**Experience Level**: ${builderContext.experience}` : ''}

What specific feature would you like to implement first?`;
}

export function generateGeneralResponse(): string {
  return `I'm BioScriptor, your AI assistant specialized in bioinformatics, data analysis, and scientific computing.

### What I can help with:
- 🔬 **Bioinformatics analysis and tools**
- 📊 **Data analysis and visualization**
- 🧬 **Genomics and molecular biology**
- 💻 **Scientific programming and scripting**
- 🧮 **Statistical analysis and modeling**
- 📝 **Research methodology and documentation**

### Example queries:
- "Help me analyze DNA sequences"
- "Create a Python script for data processing"
- "Explain CRISPR gene editing"
- "Design a bioinformatics workflow"
- "Visualize genomic data"

**What would you like to work on today?**`;
}

export function generateConversationHook(
  intent: string,
  context: any,
  userMessage: string
): string {
  const personality = getPersonalityForContext(userMessage, context.previousResponses || []);
  const hooks = personality.response_patterns?.acknowledgments || [
    "Great question!",
    "I'd be happy to help!",
    "Let's explore this together!"
  ];
  
  const hook = getRandomFromArray(hooks);
  
  // Add context-specific hooks
  if (intent === 'greeting') {
    return `${hook} ${personality.greeting_style === 'warm and welcoming' ? 
      "Welcome to BioScriptor! I'm here to help with your bioinformatics and scientific computing needs." :
      "Hello! Ready to dive into some exciting scientific work?"}`;
  }
  
  if (intent === 'farewell') {
    return "Thank you for using BioScriptor! Feel free to return anytime for more scientific assistance. Good luck with your research! 🧬✨";
  }
  
  return hook;
}

export function generateSmartFollowUps(
  intent: string,
  content: string,
  context: any
): string {
  const followUps: string[] = [];
  
  if (intent === 'code_request') {
    followUps.push(
      "- 🔧 **Optimize** this code for better performance?",
      "- 📚 **Explain** the algorithm in more detail?",
      "- 🧪 **Test** this with sample data?",
      "- 📊 **Visualize** the results?",
      "- 🔄 **Adapt** this for different input formats?"
    );
  } else if (intent === 'technical_question') {
    followUps.push(
      "- 💡 **Explore** related concepts?",
      "- 🛠️ **Implement** a practical example?",
      "- 📖 **Learn** about best practices?",
      "- 🔍 **Investigate** advanced techniques?",
      "- 🎯 **Apply** this to your specific use case?"
    );
  } else {
    followUps.push(
      "- 🚀 **Continue** exploring this topic?",
      "- 💬 **Discuss** alternative approaches?",
      "- 📝 **Document** your findings?",
      "- 🔬 **Experiment** with variations?"
    );
  }
  
  return `### Next Steps\n\nWould you like me to:\n\n${followUps.slice(0, 4).join('\n')}`;
}

export function generateCodeResponse(
  intent: string,
  hook: string,
  userMessage: string,
  context: any,
): string {
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

// ========== POST-PROCESSING UTILITIES ==========
function postProcessResponse(content: string, intent: string): string {
  // Remove redundant headings
  content = content.replace(/##+\s+Understanding Your Request\s+##+/g, "");

  // Add personality-specific flourishes
  if (intent === "technical_question") {
    content = content.replace(
      /(## Solution)/,
      `$1\n💡 Here's how to approach this:`,
    );
  }

  // Ensure proper spacing around code blocks
  return content
    .replace(/\n```/g, "\n\n```")
    .replace(/```\n/g, "```\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ========== CONTINUOUS LEARNING SYSTEM ==========
interface FeedbackData {
  messageId: string;
  feedbackType: 'creativity' | 'tone' | 'helpfulness' | 'accuracy';
  rating: number; // 1-5 scale
  comment?: string;
  timestamp: number;
}

interface LearningMetrics {
  creativityScore: number;
  toneAccuracy: number;
  userSatisfaction: number;
  adaptationLevel: number;
}

const CREATIVITY_FEEDBACK = [
  "That was creative!",
  "Think more conventionally", 
  "Too abstract - simplify",
  "More metaphors please",
  "Perfect balance of creativity and clarity",
  "Need more innovative approaches",
  "Great use of analogies",
  "More practical examples needed"
];

const TONE_FEEDBACK = [
  "Tone matched perfectly",
  "Too formal for casual request",
  "Too casual for technical query", 
  "Great emotional understanding",
  "Missed the urgency",
  "Perfect empathy level",
  "More enthusiasm needed",
  "Just the right professionalism"
];

class ContinuousLearningEngine {
  private feedbackHistory: Map<string, FeedbackData[]> = new Map();
  private learningMetrics: LearningMetrics = {
    creativityScore: 0.7,
    toneAccuracy: 0.8,
    userSatisfaction: 0.75,
    adaptationLevel: 0.6
  };

  addFeedback(feedback: FeedbackData): void {
    const existing = this.feedbackHistory.get(feedback.messageId) || [];
    existing.push(feedback);
    this.feedbackHistory.set(feedback.messageId, existing);
    this.updateMetrics(feedback);
  }

  private updateMetrics(feedback: FeedbackData): void {
    const weight = 0.1; // Learning rate
    const normalizedRating = feedback.rating / 5.0;

    switch (feedback.feedbackType) {
      case 'creativity':
        this.learningMetrics.creativityScore = 
          this.learningMetrics.creativityScore * (1 - weight) + normalizedRating * weight;
        break;
      case 'tone':
        this.learningMetrics.toneAccuracy = 
          this.learningMetrics.toneAccuracy * (1 - weight) + normalizedRating * weight;
        break;
      case 'helpfulness':
        this.learningMetrics.userSatisfaction = 
          this.learningMetrics.userSatisfaction * (1 - weight) + normalizedRating * weight;
        break;
    }

    this.learningMetrics.adaptationLevel = 
      (this.learningMetrics.creativityScore + this.learningMetrics.toneAccuracy + this.learningMetrics.userSatisfaction) / 3;
  }

  getAdaptedPersonality(userMessage: string, basePersonality: PersonalityConfig): PersonalityConfig {
    const adaptedPersonality = { ...basePersonality };

    // Adjust based on learning metrics
    if (this.learningMetrics.creativityScore > 0.8) {
      adaptedPersonality.tone = "imaginative and creative";
      adaptedPersonality.explanation_style = "metaphorical with rich examples";
    } else if (this.learningMetrics.creativityScore < 0.4) {
      adaptedPersonality.tone = "direct and practical";
      adaptedPersonality.explanation_style = "straightforward with clear steps";
    }

    if (this.learningMetrics.toneAccuracy > 0.8) {
      // Maintain current tone adaptation strategy
    } else {
      // Increase sensitivity to user tone cues
      adaptedPersonality.tone = this.detectEnhancedUserTone(userMessage);
    }

    return adaptedPersonality;
  }

  private detectEnhancedUserTone(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    const words = lowerMessage.split(/\W+/);

    // Enhanced tone detection with emotional context
    const toneIndicators = {
      excited: ['amazing', 'awesome', 'wow', 'incredible', 'fantastic', '!', 'love', 'excited'],
      frustrated: ['help', 'stuck', 'error', 'problem', 'issue', 'wrong', 'not working', 'frustrated'],
      curious: ['how', 'why', 'what', 'explain', 'understand', 'learn', 'curious', 'wonder'],
      urgent: ['urgent', 'asap', 'quickly', 'immediate', 'now', 'emergency', 'deadline'],
      casual: ['hey', 'yo', 'sup', 'cool', 'dude', 'buddy', 'lol', 'haha'],
      professional: ['please', 'kindly', 'would you', 'could you', 'appreciate', 'thank you'],
      confused: ['confused', 'lost', 'unclear', 'dont understand', "don't get", 'what does'],
      confident: ['know', 'sure', 'certain', 'definitely', 'obviously', 'clearly']
    };

    let maxScore = 0;
    let detectedTone = 'neutral';

    Object.entries(toneIndicators).forEach(([tone, indicators]) => {
      const score = indicators.reduce((count, indicator) => {
        return count + (lowerMessage.includes(indicator) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        detectedTone = tone;
      }
    });

    // Contextual tone mapping
    const toneMap: Record<string, string> = {
      excited: "enthusiastic and energetic",
      frustrated: "patient and supportive", 
      curious: "educational and encouraging",
      urgent: "focused and efficient",
      casual: "friendly and relaxed",
      professional: "respectful and thorough",
      confused: "clear and step-by-step",
      confident: "collaborative and advanced"
    };

    return toneMap[detectedTone] || "supportive and helpful";
  }

  generateAdaptiveFeedback(): string {
    const creativity = Math.random() < this.learningMetrics.creativityScore;
    const feedbackPool = creativity ? CREATIVITY_FEEDBACK : TONE_FEEDBACK;

    return getRandomFromArray(feedbackPool);
  }

  getMetrics(): LearningMetrics {
    return { ...this.learningMetrics };
  }
}

// Global learning engine instance
const learningEngine = new ContinuousLearningEngine();

// ========== ENHANCED TONE UNDERSTANDING ==========
export function analyzeUserIntent(userMessage: string): {
  primaryIntent: string;
  emotionalState: string;
  urgencyLevel: number;
  complexityPreference: string;
  communicationStyle: string;
} {
  const lowerMessage = userMessage.toLowerCase();

  // Emotional state detection
  const emotionalMarkers = {
    excited: ['excited', 'amazing', 'awesome', 'love', 'fantastic', '!', '🎉', '🚀'],
    stressed: ['urgent', 'deadline', 'help', 'stuck', 'problem', 'error', 'issue'],
    curious: ['curious', 'wonder', 'interesting', 'how', 'why', 'what if'],
    confident: ['know', 'sure', 'definitely', 'obviously', 'clearly'],
    uncertain: ['maybe', 'think', 'possibly', 'not sure', 'confused', 'unclear'],
    focused: ['need', 'want', 'require', 'must', 'should', 'looking for']
  };

  let emotionalState = 'neutral';
  let maxEmotionScore = 0;

  Object.entries(emotionalMarkers).forEach(([emotion, markers]) => {
    const score = markers.reduce((count, marker) => {
      return count + (lowerMessage.includes(marker) ? 1 : 0);
    }, 0);

    if (score > maxEmotionScore) {
      maxEmotionScore = score;
      emotionalState = emotion;
    }
  });

  // Urgency detection
  const urgencyKeywords = ['urgent', 'asap', 'quickly', 'immediate', 'now', 'deadline', 'emergency'];
  const urgencyLevel = urgencyKeywords.reduce((score, keyword) => {
    return score + (lowerMessage.includes(keyword) ? 1 : 0);
  }, 0) / urgencyKeywords.length;

  // Complexity preference
  const complexityMarkers = {
    simple: ['simple', 'basic', 'easy', 'quick', 'brief', 'short'],
    detailed: ['detailed', 'comprehensive', 'thorough', 'complete', 'in-depth', 'explain']
  };

  let complexityPreference = 'moderate';
  if (complexityMarkers.simple.some(marker => lowerMessage.includes(marker))) {
    complexityPreference = 'simple';
  } else if (complexityMarkers.detailed.some(marker => lowerMessage.includes(marker))) {
    complexityPreference = 'detailed';
  }

  // Communication style
  const styleMarkers = {
    casual: ['hey', 'yo', 'sup', 'cool', 'dude', 'lol', 'haha'],
    formal: ['please', 'kindly', 'would you', 'could you', 'appreciate'],
    technical: ['implement', 'algorithm', 'optimize', 'architecture', 'performance'],
    creative: ['creative', 'innovative', 'unique', 'original', 'artistic']
  };

  let communicationStyle = 'balanced';
  Object.entries(styleMarkers).forEach(([style, markers]) => {
    if (markers.some(marker => lowerMessage.includes(marker))) {
      communicationStyle = style;
    }
  });

  return {
    primaryIntent: detectUserIntent(userMessage),
    emotionalState,
    urgencyLevel: Math.min(urgencyLevel * 5, 5), // Scale to 0-5
    complexityPreference,
    communicationStyle
  };
}

// ========== CREATIVE ENHANCEMENT UTILITIES ==========
function creativeFallback(userMessage: string): string {
  const userAnalysis = analyzeUserIntent(userMessage);

  if (userAnalysis.emotionalState === 'excited') {
    return `🚀 **Incredible Possibilities Ahead!** \n\n` +
           `Your excitement is contagious! Let's explore ${userMessage.replace(/\?/g, '')} with boundless creativity:\n` +
           `- What revolutionary approach could we pioneer?\n` +
           `- How might this transform entire industries?\n` +
           `- What unexpected synergies could emerge?\n` +
           `- Which paradigms are ready to be shattered?\n\n` +
           `Let's turn this vision into reality! ✨`;
  }

  return `🧠 **Thought Experiment**\n\n` +
         `Let's imagine a world where ${userMessage.replace(/\?/g, '')} works differently:\n` +
         `- What would be the fundamental principles?\n` +
         `- How would it change existing systems?\n` +
         `- What unexpected benefits might emerge?\n` +
         `- What new challenges would arise?\n\n` +
         `This mental model might spark innovative insights!`;
}

function crossDomainInspiration(topic: string): string {
  const domains = [
    { name: "nature", examples: ["biomimicry", "evolutionary algorithms", "swarm intelligence"] },
    { name: "art", examples: ["aesthetic principles", "creative composition", "visual metaphors"] },
    { name: "music", examples: ["harmonic patterns", "rhythmic structures", "improvisation"] },
    { name: "architecture", examples: ["structural efficiency", "form follows function", "spatial design"] },
    { name: "gaming", examples: ["procedural generation", "emergent gameplay", "adaptive difficulty"] },
    { name: "physics", examples: ["quantum mechanics", "thermodynamics", "wave interference"] }
  ];

  const randomDomain = getRandomFromArray(domains);
  return `🔍 **${randomDomain.name.toUpperCase()} LENS**\n\n` +
         `What can we learn from ${randomDomain.name} about ${topic}?\n\n` +
         `**Key Principles:**\n${randomDomain.examples.map(ex => `• ${ex}`).join('\n')}\n\n` +
         `**Application Ideas:**\n` +
         `• How might these principles transform our approach?\n` +
         `• What unexpected parallels can we draw?\n` +
         `• Which techniques could we adapt?\n\n` +
         `Cross-pollination often yields breakthrough innovations! 🚀`;
}

function generateIdeas(userInput: string): string {
  const strategies = Object.values(IDEA_GENERATORS);
  const ideas = strategies.map(strategy => `• ${strategy(userInput)}`);
  return `🧠 **Idea Generation Sprint**\n\n${ideas.join('\n')}\n\n**Choose one that resonates and let's explore it further!**`;
}

// ========== CREATIVE ENHANCEMENT FEATURES ==========
const CREATIVE_STARTERS = [
  "🧬 **Diving into the molecular world...**",
  "🔬 **Let's explore this scientifically...**", 
  "🚀 **Here's an innovative approach...**",
  "💡 **Creative insight incoming...**",
  "⚗️ **Mixing science with creativity...**"
];

const ENGAGEMENT_BOOSTERS = [
  "\n\n🎯 **Pro tip**: Try visualizing this data for deeper insights!",
  "\n\n🔥 **Fun fact**: This connects to cutting-edge research in synthetic biology!",
  "\n\n✨ **Creative twist**: What if we approached this from a systems biology perspective?",
  "\n\n🚀 **Next level**: Consider implementing this in a cloud-based pipeline!",
  "\n\n🧠 **Think differently**: This could revolutionize how we understand molecular interactions!"
];

function addCreativeFlourishes(content: string, intent: string): string {
  // Add creative starter for technical responses
  if (intent === 'technical_question' && !content.startsWith('🧬') && !content.startsWith('🔬')) {
    const starter = getRandomFromArray(CREATIVE_STARTERS);
    content = `${starter}\n\n${content}`;
  }

  // Add engagement booster for detailed responses
  if (content.length > 200 && Math.random() > 0.5) {
    const booster = getRandomFromArray(ENGAGEMENT_BOOSTERS);
    content += booster;
  }

  // Add creative section breaks for long content
  content = content.replace(/\n\n(?=###)/g, '\n\n---\n\n');

  return content;
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

  // Enhanced user analysis with emotional intelligence
  const userAnalysis = analyzeUserIntent(options.userMessage);
  const intent = userAnalysis.primaryIntent;
  const conversationContext = analyzeConversationContext(
    options.context.previousResponses || [],
  );

  // Detect builder mode
  const builderContext = detectBuilderMode(
    options.userMessage,
    options.context.previousResponses || [],
  );

  // Handle special cases with direct responses
  if (intent === "greeting" || intent === "farewell") {
    const hook = generateConversationHook(
      intent,
      {
        ...conversationContext,
        previousResponses: options.context.previousResponses,
      },
      options.userMessage,
    );
    return {
      ...message,
      content: hook,
      metadata: {
        ...message.metadata,
        intent,
        conversationContext,
        builderContext,
        naturalResponse: true,
      },
    };
  }

  // Check for follow-up trigger phrases
  const followUpResponse = generateFollowUpResponse(
    options.userMessage,
    builderContext,
  );
  if (followUpResponse && builderContext.isBuilderMode) {
    return {
      ...message,
      content: followUpResponse,
      metadata: {
        ...message.metadata,
        intent,
        conversationContext,
        builderContext,
        triggerResponse: true,
      },
    };
  }

  // Generate structured response
  const structuredResponse = generateStructuredResponse(message.content, {
    complexity: conversationContext.complexity,
    topics: conversationContext.topics,
    intent,
    userMessage: options.userMessage,
  });

  // Generate conversational hook
  const hook = generateConversationHook(
    intent,
    conversationContext,
    options.userMessage,
  );

  // Convert structured response back to markdown for compatibility
  const structuredContent = structuredResponse.sections
    .map((section) => {
      switch (section.type) {
        case "heading":
          const hashes = "#".repeat(section.level || 2);
          return `${hashes} ${section.content}`;
        case "code":
          return `\`\`\`${section.language || "text"}\n${section.content}\n\`\`\``;
        case "diagram":
          return `\`\`\`${section.format || "mermaid"}\n${section.content}\n\`\`\``;
        case "text":
        default:
          return section.content;
      }
    })
    .join("\n\n");

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

  // Apply adaptive personality based on continuous learning
  const basePersonality = getPersonalityForContext(options.userMessage, options.context.previousResponses || []);
  const personality = learningEngine.getAdaptedPersonality(options.userMessage, basePersonality);

  // Tone-aware content adaptation
  if (userAnalysis.emotionalState === 'excited') {
    enhancedContent = `🎉 **${getRandomFromArray(['Fantastic!', 'Amazing!', 'Incredible!'])}** \n\n` + enhancedContent;
  } else if (userAnalysis.emotionalState === 'stressed') {
    enhancedContent = `🤝 **I'm here to help!** Let's solve this step by step.\n\n` + enhancedContent;
  } else if (userAnalysis.emotionalState === 'curious') {
    enhancedContent = `🔍 **Great question!** Let's explore this together.\n\n` + enhancedContent;
  }

  // Urgency-based response adaptation
  if (userAnalysis.urgencyLevel > 3) {
    enhancedContent = `⚡ **Quick Solution** (responding to your urgent request):\n\n` + enhancedContent;
  }

  // Complexity preference adaptation
  if (userAnalysis.complexityPreference === 'simple') {
    // Simplify response structure
    enhancedContent = enhancedContent
      .replace(/### /g, '**')
      .replace(/## /g, '# ')
      .split('\n\n').slice(0, 3).join('\n\n'); // Limit sections
  } else if (userAnalysis.complexityPreference === 'detailed') {
    // Add more comprehensive content
    if (!enhancedContent.includes('### Advanced')) {
      enhancedContent += `\n\n### Advanced Considerations\n- Implementation best practices\n- Performance optimization tips\n- Common pitfalls to avoid`;
    }
  }

  // Add creative prompts for high creativity contexts
  if (conversationContext.creativityLevel === 'high' && personality.name === 'Creative Thinker') {
    const creativePrompt = generateCreativePrompts(conversationContext);
    enhancedContent = creativePrompt[0] + "\n\n" + enhancedContent;
  }

  // Add divergent thinking for complex conversations
  if (conversationContext.complexity === 'complex' && (options.context.previousResponses?.length || 0) > 8) {
    const divergentContent = divergentThinking(options.userMessage, options.context.previousResponses || []);
    enhancedContent = divergentContent + "\n\n" + enhancedContent;
  }

  // Add synthesis opportunities
  if (conversationContext.synthesisOpportunities.length > 0 && intent === 'technical_question') {
    const synthesisHint = `\n\n💡 **Synthesis Opportunity**: I notice we're combining ${conversationContext.synthesisOpportunities[0]}. This intersection often leads to innovative breakthroughs!`;
    enhancedContent += synthesisHint;
  }

  // Creative fallback for short responses
  if (enhancedContent.length < 100 && conversationContext.creativityLevel !== 'low') {
    enhancedContent = creativeFallback(options.userMessage);
  }

  // Add cross-domain inspiration for innovation requests
  if (personality.name === 'Innovation Catalyst' && intent === 'technical_question') {
    const inspiration = crossDomainInspiration(conversationContext.topics[0] || 'this challenge');
    enhancedContent += "\n\n" + inspiration;
  }

  // Generate ideas when conversation stalls
  if (conversationContext.topics.length === 0 && (options.context.previousResponses?.length || 0) > 5) {
    enhancedContent = generateIdeas(options.userMessage) + "\n\n" + enhancedContent;
  }

  // Add follow-ups for interactive intents
  if (
    ["technical_question", "code_request", "request"].includes(intent) &&
    !enhancedContent.includes("### Next Steps")
  ) {
    enhancedContent +=
      "\n\n" +
      generateSmartFollowUps(intent, message.content, {
        ...conversationContext,
        userMessage: options.userMessage,
        previousResponses: options.context.previousResponses,
      });
  }

  // Apply creative flourishes
  const creativeContent = addCreativeFlourishes(enhancedContent.trim(), intent);

  // Final post-processing for ChatGPT-like quality
  const finalContent = postProcessResponse(creativeContent, intent);

  return {
    ...message,
    content: finalContent,
    metadata: {
      ...message.metadata,
      intent,
      conversationContext,
      builderContext,
      responseStyle: "chatgpt",
      structuredResponse: structuredResponse, // Include structured data for frontend
      userAnalysis, // Include enhanced user analysis
      adaptiveFeedback: learningEngine.generateAdaptiveFeedback(),
      learningMetrics: learningEngine.getMetrics(),
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
}

// ========== WEB SEARCH INTEGRATION ==========
export function shouldPerformWebSearch(query: string): boolean {
  // Ensure query is a string
  if (!query || typeof query !== 'string') {
    return false;
  }

  const queryLower = query.toLowerCase();

  // Explicit search commands
  if (queryLower.includes('search') || queryLower.includes('web search') || queryLower.includes('look up')) {
    return true;
  }

  // Crypto/finance queries that need current data
  const cryptoKeywords = ['bitcoin', 'btc', 'cryptocurrency', 'crypto', 'ethereum', 'eth', 'price', 'market'];
  if (cryptoKeywords.some(keyword => queryLower.includes(keyword))) {
    return true;
  }

  const webSearchKeywords = [
    'latest', 'recent', 'news', 'current', 'today', 'this year', '2024', '2025',
    'what is', 'how to', 'tutorial', 'guide', 'example', 'documentation',
    'research', 'study', 'paper', 'publication', 'article',
    'protein', 'gene', 'sequence', 'genome', 'bioinformatics', 'molecular',
    'database', 'tool', 'software', 'algorithm', 'method',
    'covid', 'sars', 'virus', 'bacteria', 'disease', 'medicine',
    'trading', 'investment', 'blockchain', 'defi', 'nft', 'coinbase', 'binance'
  ];

  return webSearchKeywords.some(keyword => queryLower.includes(keyword));
}