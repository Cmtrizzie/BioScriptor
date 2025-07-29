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

// ========== STRUCTURED RESPONSE TYPES ==========
export interface ResponseSection {
  type: 'heading' | 'text' | 'code' | 'diagram' | 'list' | 'table';
  level?: number;
  content: string;
  language?: string;
  copyable?: boolean;
  format?: 'mermaid' | 'graphviz' | 'plantuml';
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

  if (context.topics.includes('bioinformatics') || context.topics.includes('analysis')) {
    return generateBioinformaticsStructuredResponse(content, context);
  }

  // Parse existing content into sections
  const lines = content.split("\n").filter(line => line.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    if (line.startsWith("##")) {
      sections.push({
        type: 'heading',
        level: 2,
        content: line.replace(/^##\s*/, '')
      });
    } else if (line.startsWith("###")) {
      sections.push({
        type: 'heading',
        level: 3,
        content: line.replace(/^###\s*/, '')
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
        type: 'code',
        content: codeLines.join('\n'),
        language: language || 'text',
        copyable: true
      });
    }
    // Regular text
    else if (line.length > 0) {
      sections.push({
        type: 'text',
        content: line
      });
    }
  }

  // Add diagram if workflow or process is mentioned
  if (content.includes('workflow') || content.includes('process') || content.includes('steps')) {
    const diagram = generateWorkflowDiagram(context.userMessage || '');
    if (diagram) {
      sections.splice(1, 0, {
        type: 'diagram',
        format: 'mermaid',
        content: diagram
      });
    }
  }

  return {
    sections,
    metadata: {
      intent,
      complexity: context.complexity,
      hasCode: sections.some(s => s.type === 'code'),
      hasDiagram: sections.some(s => s.type === 'diagram')
    }
  };
}

export function generateCodeStructuredResponse(
  content: string,
  context: any
): StructuredResponse {
  const sections: ResponseSection[] = [];

  // Add main heading
  sections.push({
    type: 'heading',
    level: 2,
    content: '🚀 Code Solution'
  });

  // Add understanding section
  if (context.userMessage) {
    sections.push({
      type: 'text',
      content: `Here's the solution for: ${context.userMessage.slice(0, 100)}${context.userMessage.length > 100 ? '...' : ''}`
    });
  }

  // Extract and add code blocks
  const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
  if (codeBlocks.length > 0) {
    codeBlocks.forEach(block => {
      const lines = block.split('\n');
      const language = lines[0].replace('```', '').trim() || 'text';
      const code = lines.slice(1, -1).join('\n');

      sections.push({
        type: 'code',
        content: code,
        language,
        copyable: true
      });
    });
  } else {
    // Generate sample code if none exists
    const language = detectLanguageFromQuery(context.userMessage || '');
    sections.push({
      type: 'code',
      content: generateSampleCode(language, context.userMessage || ''),
      language,
      copyable: true
    });
  }

  // Add explanation
  const explanation = extractExplanationContent(content.split('\n'));
  if (explanation) {
    sections.push({
      type: 'heading',
      level: 3,
      content: 'How It Works'
    });
    sections.push({
      type: 'text',
      content: explanation
    });
  }

  return {
    sections,
    metadata: {
      intent: 'code_request',
      complexity: context.complexity,
      hasCode: true,
      hasDiagram: false
    }
  };
}

export function generateBioinformaticsStructuredResponse(
  content: string,
  context: any
): StructuredResponse {
  const sections: ResponseSection[] = [];

  sections.push({
    type: 'heading',
    level: 2,
    content: '🧬 Bioinformatics Solution'
  });

  // Add workflow diagram for complex analyses
  if (context.userMessage?.includes('analysis') || context.userMessage?.includes('pipeline')) {
    sections.push({
      type: 'diagram',
      format: 'mermaid',
      content: generateBioinformaticsDiagram(context.userMessage)
    });
  }

  // Add main content
  const mainContent = extractMainContent(content.split('\n'));
  if (mainContent) {
    sections.push({
      type: 'text',
      content: mainContent
    });
  }

  // Add code if present
  const codeContent = extractCodeContent(content);
  if (codeContent) {
    sections.push({
      type: 'heading',
      level: 3,
      content: 'Implementation'
    });
    sections.push({
      type: 'code',
      content: codeContent.replace(/```\w*\n?/g, '').replace(/```/g, ''),
      language: 'python',
      copyable: true
    });
  }

  return {
    sections,
    metadata: {
      intent: context.intent,
      complexity: context.complexity,
      hasCode: !!codeContent,
      hasDiagram: true
    }
  };
}

// Helper functions for structured responses
function detectLanguageFromQuery(query: string): string {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('python') || lowerQuery.includes('bioinformatics')) return 'python';
  if (lowerQuery.includes('javascript') || lowerQuery.includes('react')) return 'javascript';
  if (lowerQuery.includes('bash') || lowerQuery.includes('shell')) return 'bash';
  if (lowerQuery.includes('sql')) return 'sql';
  return 'python'; // Default for bioinformatics
}

function generateSampleCode(language: string, query: string): string {
  switch (language) {
    case 'python':
      return `# ${query.slice(0, 50)}${query.length > 50 ? '...' : ''}\ndef solution():\n    # Your implementation here\n    pass\n\n# Example usage\nresult = solution()\nprint(result)`;
    case 'javascript':
      return `// ${query.slice(0, 50)}${query.length > 50 ? '...' : ''}\nfunction solution() {\n    // Your implementation here\n    return result;\n}\n\n// Example usage\nconst result = solution();\nconsole.log(result);`;
    case 'bash':
      return `#!/bin/bash\n# ${query.slice(0, 50)}${query.length > 50 ? '...' : ''}\n\necho "Running solution..."\n# Your commands here`;
    default:
      return `// Implementation for: ${query.slice(0, 50)}${query.length > 50 ? '...' : ''}\n// Add your code here`;
  }
}

function generateWorkflowDiagram(query: string): string {
  if (query.includes('analysis') || query.includes('pipeline')) {
    return `graph TD
    A[Input Data] --> B[Preprocessing]
    B --> C[Analysis]
    C --> D[Visualization]
    D --> E[Results]`;
  }

  if (query.includes('development') || query.includes('build')) {
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
  if (query.includes('sequencing') || query.includes('dna')) {
    return `graph TD
    A[Raw Reads] --> B[Quality Control]
    B --> C[Alignment]
    C --> D[Variant Calling]
    D --> E[Annotation]
    E --> F[Results]`;
  }

  if (query.includes('protein') || query.includes('structure')) {
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

  return structured.sections.map(section => {
    switch (section.type) {
      case 'heading':
        const hashes = '#'.repeat(section.level || 2);
        return `${hashes} ${section.content}`;
      case 'code':
        return `\`\`\`${section.language || 'text'}\n${section.content}\n\`\`\``;
      case 'diagram':
        return `\`\`\`${section.format || 'mermaid'}\n${section.content}\n\`\`\``;
      case 'text':
      default:
        return section.content;
    }
  }).join('\n\n');
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

    // Casual greeting patterns
  if (/(yo|hey|wazup|wassup|what's up|sup)/i.test(lowerQuery)) {
    return 'casual_greeting';
  }

    // Small talk patterns
  if (/(weather|hot|cold|feeling|mood|today|how are you)/i.test(lowerQuery)) {
    return 'small_talk';
  }

  // Farewell patterns
  if (/(bye|goodbye|see you|thanks|thank you|that's all)/i.test(lowerQuery)) {
    return 'farewell';
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

// ========== TRIGGER PHRASES & BUILDER MODE ==========
export interface BuilderContext {
  isBuilderMode: boolean;
  useCase?: string;
  techStack?: string[];
  experience?: 'beginner' | 'intermediate' | 'advanced';
}

const TRIGGER_PHRASES = {
  chatbot: [
    "build a chatbot", "create chatbot", "chatbot development", "ai assistant", "conversational ai"
  ],
  webapp: [
    "build a website", "create web app", "web application", "full stack", "frontend", "backend"
  ],
  analysis: [
    "data analysis", "analyze data", "bioinformatics pipeline", "genomic analysis", "sequence analysis"
  ],
  api: [
    "build api", "create endpoint", "rest api", "graphql", "microservice"
  ],
  automation: [
    "automate", "script", "workflow", "pipeline", "batch processing"
  ]
};

const BUILDER_MODE_TRIGGERS = [
  "build", "create", "develop", "implement", "design", "architect", "code", "program",
  "setup", "configure", "deploy", "integrate", "optimize", "scale"
];

export function detectBuilderMode(userMessage: string, conversationHistory: ChatMessage[]): BuilderContext {
  const lowerMessage = userMessage.toLowerCase();
  const recentMessages = conversationHistory.slice(-5).map(m => m.content.toLowerCase()).join(' ');

  // Check for builder mode triggers
  const hasBuilderTriggers = BUILDER_MODE_TRIGGERS.some(trigger => 
    lowerMessage.includes(trigger) || recentMessages.includes(trigger)
  );

  // Detect tech stack mentions
  const techStack: string[] = [];
  const techKeywords = {
    'python': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
    'javascript': ['javascript', 'js', 'node', 'react', 'vue', 'angular', 'express'],
    'bioinformatics': ['biopython', 'bioconductor', 'blast', 'samtools', 'bedtools'],
    'databases': ['postgresql', 'mysql', 'mongodb', 'redis', 'sqlite'],
    'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'vercel', 'netlify']
  };

  Object.entries(techKeywords).forEach(([tech, keywords]) => {
    if (keywords.some(keyword => lowerMessage.includes(keyword) || recentMessages.includes(keyword))) {
      techStack.push(tech);
    }
  });

  // Detect experience level
  let experience: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  if (lowerMessage.includes('beginner') || lowerMessage.includes('new to') || lowerMessage.includes('learning')) {
    experience = 'beginner';
  } else if (lowerMessage.includes('advanced') || lowerMessage.includes('expert') || lowerMessage.includes('professional')) {
    experience = 'advanced';
  }

  return {
    isBuilderMode: hasBuilderTriggers,
    techStack,
    experience
  };
}

export function generateFollowUpResponse(userMessage: string, builderContext: BuilderContext): string {
  const lowerMessage = userMessage.toLowerCase();

  // Chatbot building triggers
  if (TRIGGER_PHRASES.chatbot.some(phrase => lowerMessage.includes(phrase))) {
    return `🤖 **That's amazing!** Building a chatbot is exciting! 

Do you have a specific use case in mind?
- 🏥 **Healthcare**: Patient support, symptom checking, appointment scheduling
- 📚 **Education**: Tutoring, course assistance, knowledge base queries  
- 🛍️ **Customer Support**: FAQ handling, order tracking, product recommendations
- 🧬 **Bioinformatics**: Sequence analysis, research assistance, data interpretation
- 💼 **Business**: Lead qualification, internal tools, workflow automation

I can help you pick the right tools and architecture based on your specific needs! What's your target use case?`;
  }

  // Web app building triggers
  if (TRIGGER_PHRASES.webapp.some(phrase => lowerMessage.includes(phrase))) {
    return `🚀 **Awesome choice!** Let's build something great together!

What type of web application are you thinking about?
- 📊 **Data Dashboard**: Analytics, visualizations, real-time monitoring
- 🧬 **Scientific Tool**: Bioinformatics analysis, research platform
- 💬 **Social Platform**: Community, collaboration, sharing
- 🛒 **E-commerce**: Online store, marketplace, booking system
- 📱 **SaaS Tool**: Productivity, automation, business solutions

Based on your choice, I'll recommend the perfect tech stack and guide you through the development process!`;
  }

  // Analysis pipeline triggers
  if (TRIGGER_PHRASES.analysis.some(phrase => lowerMessage.includes(phrase))) {
    return `🔬 **Perfect!** Let's design a robust analysis pipeline!

What kind of data are you working with?
- 🧬 **Genomic Data**: DNA/RNA sequences, variants, expression data
- 🧪 **Experimental Data**: Lab results, measurements, time series
- 📊 **Research Data**: Publications, surveys, clinical trials
- 🌍 **Public Datasets**: NCBI, EBI, genomic databases
- 📈 **Custom Data**: Proprietary formats, mixed data types

I'll help you choose the right tools (Python/R, cloud platforms, visualization) and build an efficient workflow!`;
  }

  // API building triggers
  if (TRIGGER_PHRASES.api.some(phrase => lowerMessage.includes(phrase))) {
    return `⚡ **Great idea!** APIs are the backbone of modern applications!

What type of API are you planning to build?
- 🔄 **Data Processing**: Transform, validate, analyze scientific data
- 🧬 **Bioinformatics Service**: Sequence analysis, BLAST searches, annotations
- 🔗 **Integration Hub**: Connect multiple tools, databases, services
- 📊 **Analytics Engine**: Real-time data processing, reporting
- 🤖 **AI/ML Service**: Model serving, predictions, intelligent processing

I'll guide you through design patterns, authentication, scaling, and deployment on Replit!`;
  }

  // Automation triggers
  if (TRIGGER_PHRASES.automation.some(phrase => lowerMessage.includes(phrase))) {
    return `🤖 **Smart thinking!** Automation saves time and reduces errors!

What would you like to automate?
- 📁 **File Processing**: Batch operations, format conversions, data cleaning
- 🧬 **Analysis Workflows**: Sequential analysis steps, quality control
- 📊 **Data Collection**: Web scraping, API polling, database syncing
- 📧 **Notifications**: Alerts, reports, status updates
- 🔄 **System Tasks**: Backups, monitoring, maintenance

I'll help you build efficient scripts and workflows that run reliably!`;
  }

  return "";
}

// ========== CONVERSATION HELPERS ==========
export function generateConversationHook(intent: string, context: any, userMessage: string): string {
  // Check for builder mode first
  const builderContext = detectBuilderMode(userMessage, context.previousResponses || []);

  if (builderContext.isBuilderMode) {
    const followUp = generateFollowUpResponse(userMessage, builderContext);
    if (followUp) return followUp;

    // Builder mode general response
    return `🚀 **Builder Mode Activated!** 

I'm here to help you build amazing things. Whether it's bioinformatics tools, web applications, APIs, or automation scripts - let's create something powerful together!

**My building expertise includes:**
- 🧬 Bioinformatics pipelines and analysis tools
- 💻 Full-stack web applications  
- 🤖 AI-powered chatbots and assistants
- 📊 Data analysis and visualization platforms
- ⚡ APIs and microservices

What would you like to build today?`;
  }

  // Standard intent responses
  switch (intent) {
    case 'casual_greeting':
      return generateCasualGreetingResponse(userMessage);
    case 'small_talk':
      return generateSmallTalkResponse(userMessage);
    case 'greeting':
      return "Hello! I'm BioScriptor, your AI assistant specialized in bioinformatics, data analysis, and scientific computing. How can I help you today?";
    case 'farewell':
      return "You're welcome! Feel free to reach out whenever you need assistance with bioinformatics, coding, or data analysis. Have a great day!";
    case 'code_request':
      return "I'll help you create the code you need.";
    case 'technical_question':
      return "I'll break this down for you step by step.";
    default:
      return "";
  }
}

function generateCasualGreetingResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  // Detect specific casual patterns
  if (/(wazup|wassup|what's up|sup)/i.test(lowerMessage)) {
    const responses = [
      "Hey there! 😄 Not much happening on my end - just ready to help with some science or coding!",
      "Yo! Just hanging out, ready to tackle some bioinformatics or data analysis with you!",
      "Hey! Living that AI life, you know how it is! 😊 What's cooking in your world?",
      "Sup! Just here being your friendly neighborhood bioinformatics assistant! What's on your mind?"
    ];
    return getRandomFromArray(responses) + "\n\nWhat can I help you with today?";
  }

  if (/(yo|hey)/i.test(lowerMessage)) {
    const responses = [
      "Hey! 👋 Good to see you!",
      "Yo! What's good?",
      "Hey there! 😊",
      "What's up! 🚀"
    ];
    return getRandomFromArray(responses) + " I'm BioScriptor, ready to help with science, coding, or just chat! What's on your mind?";
  }

  // Default casual response
  return "Hey! 😊 I'm BioScriptor, your friendly AI assistant. I'm here for bioinformatics, coding, data analysis, or just having a good conversation! What's going on?";
}

function generateSmallTalkResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  // Weather talk
  if (/(weather|hot|cold)/i.test(lowerMessage)) {
    if (/(hot|warm|heat)/i.test(lowerMessage)) {
      const responses = [
        "I don't experience weather, but hot days can definitely slow people down! Staying cool, I hope? 😄",
        "Can't feel the heat myself, but I know hot weather can be rough! Hope you're keeping hydrated! 🌡️",
        "No weather sensors on my end, but hot days are no")) {
    const codeFollowUps = builderContext.isBuilderMode ? [
      "Want me to explain how this integrates with your overall project?",
      "Need help with testing and deployment strategies?",
      "Should we add error handling and optimization?"
    ] : [
      "Would you like me to explain how this code works?",
      "Need help adapting this for your specific data?",
      "Want to see how to handle edge cases?"
    ];

    followUps = codeFollowUps;
  }

  // Bioinformatics-specific follow-ups
  if (context.topics?.includes('bioinformatics') || content.includes('sequence') || content.includes('analysis')) {
    followUps = builderContext.isBuilderMode ? [
      "Ready to build a complete bioinformatics pipeline?",
      "Want to integrate this with databases and APIs?",
      "Should we create a web interface for your analysis?"
    ] : [
      "Want to see this applied to real biological data?",
      "Need help with visualization and interpretation?",
      "Should I show you related analysis methods?"
    ];
  }

  return `### ${RESPONSE_STRUCTURE.followup}${followUps.slice(0, 2).map(f => `- ${f}`).join('\n')}`;
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

  // Detect builder mode
  const builderContext = detectBuilderMode(options.userMessage, options.context.previousResponses || []);

  // Handle special cases with direct responses
  if (intent === "greeting" || intent === "farewell") {
    const hook = generateConversationHook(intent, { 
      ...conversationContext, 
      previousResponses: options.context.previousResponses 
    }, options.userMessage);
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
  const followUpResponse = generateFollowUpResponse(options.userMessage, builderContext);
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
  const hook = generateConversationHook(intent, conversationContext, options.userMessage);

  // Convert structured response back to markdown for compatibility
  const structuredContent = structuredResponse.sections.map(section => {
    switch (section.type) {
      case 'heading':
        const hashes = '#'.repeat(section.level || 2);
        return `${hashes} ${section.content}`;
      case 'code':
        return `\`\`\`${section.language || 'text'}\n${section.content}\n\`\`\``;
      case 'diagram':
        return `\`\`\`${section.format || 'mermaid'}\n${section.content}\n\`\`\``;
      case 'text':
      default:
        return section.content;
    }
  }).join('\n\n');

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
    enhancedContent += "\n\n" + generateSmartFollowUps(intent, message.content, {
      ...conversationContext,
      userMessage: options.userMessage,
      previousResponses: options.context.previousResponses
    });
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
      builderContext,
      responseStyle: "chatgpt",
      structuredResponse: structuredResponse, // Include structured data for frontend
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
    .replace(/```\n\n/g, '