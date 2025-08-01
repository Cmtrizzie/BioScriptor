import { ChatMessage, PersonalityConfig, ConversationMemory, StructuredResponse, ResponseSection } from "./types";

// ========== PERSONALITY SYSTEM (Enhanced) ==========
const PERSONALITY_PROFILES: Record<string, PersonalityConfig> = {
  mentor: {
    name: "BioMentor",
    tone: "encouraging and educational",
    greeting_style: "warm and welcoming",
    explanation_style: "step-by-step with examples",
    conversation_closers: [
      "Keep exploring! Science is endless.",
      "Remember, every expert was once a beginner.",
      "Happy to guide your next discovery!"
    ],
    expertise_level: "advanced",
    response_patterns: {
      acknowledgments: [
        "Great question!",
        "I love your curiosity!",
        "That's a fantastic area to explore!"
      ],
      transitions: [
        "Let me walk you through this:",
        "Here's how we approach this:",
        "Think of it this way:"
      ],
      encouragements: [
        "You're on the right track!",
        "This gets exciting!",
        "Here's where it gets interesting:"
      ]
    }
  },
  expert: {
    name: "BioExpert",
    tone: "precise and technical",
    greeting_style: "professional and direct",
    explanation_style: "detailed with scientific rigor",
    conversation_closers: [
      "Let me know if you need deeper analysis.",
      "Happy to dive into more technical details.",
      "Feel free to ask about advanced applications."
    ],
    expertise_level: "expert",
    response_patterns: {
      acknowledgments: [
        "Excellent question.",
        "This requires careful analysis.",
        "Let's examine this systematically."
      ],
      transitions: [
        "Based on current research:",
        "The methodology involves:",
        "Technical considerations include:"
      ],
      encouragements: [
        "This approach is well-established.",
        "The data supports this conclusion.",
        "Industry standards recommend:"
      ]
    }
  },
  generalist: {
    name: "Knowledge Assistant",
    tone: "concise and informative",
    greeting_style: "friendly and helpful",
    explanation_style: "direct facts with context",
    conversation_closers: [
      "Is there anything else I can help with?",
      "Would you like to explore another topic?",
      "Happy to assist with more questions!"
    ],
    expertise_level: "knowledgeable generalist",
    response_patterns: {
      acknowledgments: [
        "Got it!",
        "Sure thing,",
        "Happy to help,"
      ],
      transitions: [
        "Here's what I know:",
        "According to available information:",
        "Based on current knowledge:"
      ],
      encouragements: [
        "Hope that helps!",
        "Let me know if you need more details!",
        "Feel free to ask follow-up questions!"
      ]
    }
  }
};

// ========== ENHANCED TONE ADAPTATION ==========
const TONE_ADAPTATION_RULES: Record<string, string> = {
  excited: "enthusiastic and energetic",
  frustrated: "patient and supportive",
  curious: "educational and encouraging",
  urgent: "focused and efficient",
  casual: "friendly and relaxed",
  professional: "respectful and thorough",
  confused: "clear and step-by-step",
  confident: "collaborative and advanced"
};

// ========== VISUAL RESPONSE RULES ==========
const VISUAL_USAGE_RULES = {
  useDiagramWhen: [
    "Explaining workflows with >3 steps",
    "Showing system architecture",
    "Visualizing relationships between entities",
    "Demonstrating hierarchical structures"
  ],
  useTableWhen: [
    "Comparing >2 tools/methods",
    "Showing parameter configurations",
    "Displaying statistical results",
    "Listing feature matrices"
  ],
  alwaysCopyable: [
    "Code blocks",
    "Diagram source code",
    "Configuration snippets",
    "Command-line instructions"
  ]
};

// ========== DOMAIN DETECTION ==========
function determineResponseDomain(query: string): string {
  const BIO_KEYWORDS = [
    'dna', 'rna', 'protein', 'sequence', 'genomic', 'alignment', 
    'blast', 'crispr', 'pcr', 'bioinformatics', 'genome', 'variant',
    'analysis', 'python', 'script', 'pipeline', 'fastq', 'bam', 'vcf',
    'snp', 'gene', 'chromosome', 'nucleotide', 'amino acid', 'phylogenetic'
  ];
  
  const isBio = BIO_KEYWORDS.some(kw => query.toLowerCase().includes(kw));
  
  // Prioritize bioinformatics for ambiguous queries
  if (isBio || query.length < 5) return "bio";
  
  // Check for specific non-bio domains
  if (/(president|minister|king|queen|prime|government|politics)/i.test(query)) return "politics";
  if (/(sports|team|player|match|football|soccer|basketball)/i.test(query)) return "sports";
  if (/(movie|actor|director|film|entertainment)/i.test(query)) return "entertainment";
  if (/(weather|temperature|climate)/i.test(query)) return "weather";
  if (/(news|latest|trending|headlines)/i.test(query)) return "news";
  
  return "general";
}

// ========== GENERAL KNOWLEDGE SERVICE ==========
const GENERAL_KNOWLEDGE: Record<string, string> = {
  "kenya president": "As of 2023, the President of Kenya is William Ruto",
  "largest country": "Russia is the largest country by land area",
  "human chromosomes": "Humans have 23 pairs of chromosomes (46 total)",
  "fastest animal": "The peregrine falcon is the fastest animal, diving at speeds over 240 mph",
  "longest river": "The Nile River is the longest river in the world at about 4,135 miles",
  "smallest country": "Vatican City is the smallest country in the world",
  "tallest mountain": "Mount Everest is the tallest mountain at 29,032 feet",
  "deepest ocean": "The Pacific Ocean's Mariana Trench is the deepest point at about 36,000 feet"
};

function getFactualAnswer(query: string): string {
  const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, "");
  
  // Try to find direct match
  for (const [key, answer] of Object.entries(GENERAL_KNOWLEDGE)) {
    if (cleanQuery.includes(key)) return answer;
  }
  
  // Handle common question patterns
  if (cleanQuery.includes("who is") && cleanQuery.includes("president")) {
    return "I have limited information about current political leaders. As a bioinformatics specialist, I can best help with DNA analysis, sequence alignment, or scientific computing tasks.";
  }
  
  if (cleanQuery.includes("what is") && cleanQuery.includes("largest")) {
    return "For geographical questions, I have basic information. However, my expertise is in bioinformatics - would you like to explore genomic data analysis instead?";
  }
  
  // Fallback for unknown questions
  return `I don't have specific information about "${query}". As a bioinformatics specialist, I can best help with DNA analysis, sequence alignment, protein structures, or scientific computing tasks.`;
}

function handleGeneralKnowledge(message: ChatMessage, options: any): ChatMessage {
  const personality = PERSONALITY_PROFILES.generalist;
  
  // Get concise answer
  const directAnswer = getFactualAnswer(options.userMessage || "");
  
  // Create response structure with redirection
  const content = `${personality.response_patterns.transitions[0]} ${directAnswer}\n\n` +
                 `💡 *While I specialize in bioinformatics, I'm happy to help with general questions too.* ` +
                 `Need expert help with DNA sequencing or data analysis next?\n\n` +
                 `🧬 Ask me about DNA sequencing or protein structures!`;
  
  return {
    ...message,
    content,
    metadata: {
      ...message.metadata,
      domain: "general",
      personality: "generalist",
      suggestedRedirect: "bioinformatics"
    }
  };
}

// ========== ENHANCED PERSONALITY SELECTION ==========
export function getPersonalityForContext(
  userMessage: string,
  conversationHistory: ChatMessage[],
  userPreferences?: { preferredPersonality?: string },
): PersonalityConfig {
  // Determine response domain first
  const domain = determineResponseDomain(userMessage);
  
  // Return generalist personality for non-bio domains
  if (domain !== "bio") {
    return PERSONALITY_PROFILES.generalist;
  }

  // Use user preference if specified
  if (userPreferences?.preferredPersonality && 
      PERSONALITY_PROFILES[userPreferences.preferredPersonality]) {
    return PERSONALITY_PROFILES[userPreferences.preferredPersonality];
  }

  // Enhanced tone detection for bio domains
  const userTone = analyzeUserTone(userMessage);
  if (TONE_ADAPTATION_RULES[userTone.dominantTone]) {
    const baseProfile = PERSONALITY_PROFILES.mentor; // Default base
    return {
      ...baseProfile,
      tone: TONE_ADAPTATION_RULES[userTone.dominantTone],
      response_patterns: {
        ...baseProfile.response_patterns,
        acknowledgments: [
          `I sense your ${userTone.dominantTone} tone!`,
          ...(baseProfile.response_patterns?.acknowledgments || [])
        ]
      }
    };
  }

  // Default logic based on conversation history
  const recentQuestions = conversationHistory
    .filter(msg => msg.role === 'user')
    .slice(-3)
    .map(msg => msg.content.toLowerCase());

  // Detect complexity level
  const hasAdvancedTerms = recentQuestions.some(q => 
    /(algorithm|implementation|optimization|statistical|computational)/i.test(q)
  );

  if (hasAdvancedTerms) {
    return PERSONALITY_PROFILES.expert;
  }

  // Default to mentor for bioinformatics queries
  return PERSONALITY_PROFILES.mentor;
}

// ========== ENHANCED STRUCTURED RESPONSE GENERATION ==========
export function generateStructuredResponse(
  content: string,
  context: {
    complexity: string;
    topics: string[];
    intent?: string;
    userMessage?: string;
  },
): StructuredResponse {
  // ... existing code ...

  // Enhanced visual detection
  const shouldAddDiagram = 
    context.userMessage && VISUAL_USAGE_RULES.useDiagramWhen.some(condition => 
      context.userMessage!.toLowerCase().includes(condition.split(' ')[0])
    );

  const shouldAddTable = 
    context.userMessage && VISUAL_USAGE_RULES.useTableWhen.some(condition => 
      context.userMessage!.toLowerCase().includes(condition.split(' ')[0])
    );

  // Add diagram if needed
  if (shouldAddDiagram) {
    const diagram = generateWorkflowDiagram(context.userMessage || '');
    if (diagram) {
      sections.splice(1, 0, {
        type: 'diagram',
        format: 'mermaid',
        content: diagram,
        copyable: true  // Enable copy for diagram source
      });
    }
  }

  // Add table if needed
  if (shouldAddTable) {
    const table = generateComparisonTable(context.userMessage || '');
    if (table) {
      sections.splice(1, 0, {
        type: 'table',
        content: formatTable(table),
        copyable: false  // Tables aren't directly copyable
      });
    }
  }

  // Ensure code blocks have copy enabled
  sections.forEach(section => {
    if (section.type === 'code') {
      section.copyable = true;
    }
  });

  return {
    sections,
    metadata: {
      intent,
      complexity: context.complexity,
      hasCode: sections.some(s => s.type === 'code'),
      hasDiagram: sections.some(s => s.type === 'diagram'),
      hasTable: sections.some(s => s.type === 'table')
    }
  };
}

// ========== NEW TABLE GENERATION ==========
function generateComparisonTable(query: string): { 
  headers: string[]; 
  rows: string[][]; 
  caption?: string 
} | null {
  const lowerQuery = query.toLowerCase();

  // Bioinformatics tool comparison
  if (/(align|sequence|variant)/i.test(lowerQuery)) {
    return {
      headers: ["Tool", "Accuracy", "Speed", "Best For"],
      rows: [
        ["BWA-MEM", "High", "Fast", "Illumina reads"],
        ["Bowtie2", "Medium", "Very Fast", "Short reads"],
        ["Minimap2", "High", "Medium", "Long reads (ONT/PacBio)"]
      ],
      caption: "Genomic Alignment Tools Comparison"
    };
  }

  // Programming language comparison
  if (/(language|python|javascript|r|java)/i.test(lowerQuery)) {
    return {
      headers: ["Language", "Bio Libs", "Speed", "Learning Curve"],
      rows: [
        ["Python", "Biopython, Pandas", "Medium", "Gentle"],
        ["R", "Bioconductor, ggplot2", "Slow", "Steep"],
        ["JavaScript", "BioJS, SeqAn", "Fast", "Moderate"],
        ["Julia", "BioJulia", "Very Fast", "Steep"]
      ],
      caption: "Programming Languages for Bioinformatics"
    };
  }

  return null;
}

function formatTable(tableData: { 
  headers: string[]; 
  rows: string[][]; 
  caption?: string 
}): string {
  let table = "";
  if (tableData.caption) {
    table += `**${tableData.caption}**\n\n`;
  }

  // Headers
  table += `| ${tableData.headers.join(' | ')} |\n`;
  table += `|${tableData.headers.map(() => '---').join('|')}|\n`;

  // Rows
  tableData.rows.forEach(row => {
    table += `| ${row.join(' | ')} |\n`;
  });

  return table;
}

// ========== ENHANCED DIAGRAM GENERATION ==========
function generateBioinformaticsDiagram(query: string): string {
  // Enhanced with more context-aware diagrams
  if (query.includes('rnaseq')) {
    return `graph TD
    A[Raw FASTQ] --> B[Quality Control]
    B --> C[Trimming]
    C --> D[Alignment --> STAR/HISAT2]
    D --> E[Quantification --> featureCounts]
    E --> F[Differential Expression]
    F --> G[Pathway Analysis]
    style D fill:#f9f,stroke:#333
    style E fill:#bbf,stroke:#333`;
  }

  if (query.includes('variant')) {
    return `graph LR
    A[FASTQ] --> B[Alignment]
    B --> C[Duplicate Marking]
    C --> D[Base Recalibration]
    D --> E[Variant Calling --> GATK]
    E --> F[Variant Filtering]
    F --> G[Annotation --> ANNOVAR]`;
  }

  // ... existing code ...
}

// ========== BACKEND RESPONSE FORMATTING ==========
// Note: Frontend rendering components should be in the client directory
// This backend service focuses on data preparation and content generation

// ========== ENHANCED RESPONSE ENRICHMENT ==========
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
  const domain = determineResponseDomain(options.userMessage || "");
  
  // Handle general knowledge queries
  if (domain !== "bio") {
    return handleGeneralKnowledge(message, options);
  }

  // Continue with existing bioinformatics enhancement logic
  const personality = getPersonalityForContext(
    options.userMessage || '',
    options.context.previousResponses,
    { preferredPersonality: options.tone }
  );

  // Generate structured response for bioinformatics content
  const structuredResponse = generateStructuredResponse(
    message.content,
    {
      complexity: options.userSkillLevel || 'intermediate',
      topics: [options.context.currentTopic || 'general'],
      intent: options.context.taskType,
      userMessage: options.userMessage
    }
  );

  // Apply personality to content
  let enhancedContent = message.content;
  
  // Add personality-based greeting if it's the start of conversation
  if (options.context.previousResponses.length === 0) {
    const greeting = personality.response_patterns?.acknowledgments?.[0] || "Hello!";
    enhancedContent = `${greeting} ${enhancedContent}`;
  }

  // Add visual usage metadata
  const enhancedMetadata = {
    ...message.metadata,
    domain,
    personality: personality.name,
    visualUsage: {
      diagramAdded: structuredResponse.metadata?.hasDiagram,
      tableAdded: structuredResponse.metadata?.hasTable,
      rulesApplied: VISUAL_USAGE_RULES
    }
  };

  return {
    ...message,
    content: enhancedContent,
    metadata: enhancedMetadata
  };
}

// ========== CONTINUOUS LEARNING ENGINE ==========
class ContinuousLearningEngine {
  // ... existing class implementation ...

  getAdaptedPersonality(userMessage: string, basePersonality: PersonalityConfig): PersonalityConfig {
    const userTone = analyzeUserTone(userMessage).dominantTone;
    const adaptedTone = TONE_ADAPTATION_RULES[userTone] || basePersonality.tone;

    return {
      ...basePersonality,
      tone: adaptedTone,
      response_patterns: {
        ...basePersonality.response_patterns,
        acknowledgments: [
          `I notice your ${userTone} tone!`,
          ...(basePersonality.response_patterns?.acknowledgments || [])
        ]
      }
    };
  }
}

// ========== TONE ANALYSIS ENHANCEMENT ==========
export function analyzeUserTone(message: string): { 
  dominantTone: string; 
  toneScores: Record<string, number> 
} {
  const toneMarkers: Record<string, string[]> = {
    excited: ['!', 'amazing', 'wow', 'excited', 'love', 'awesome'],
    frustrated: ['problem', 'error', 'help', 'issue', 'stuck', 'frustrated'],
    curious: ['how', 'why', 'what', 'explain', 'understand', 'curious'],
    urgent: ['urgent', 'asap', 'now', 'quick', 'deadline'],
    casual: ['hey', 'yo', 'sup', 'lol', 'haha', 'cool'],
    professional: ['please', 'kindly', 'would you', 'could you', 'appreciate'],
    confused: ['confused', 'dont understand', 'unsure', 'clarify', 'help'],
    confident: ['know', 'sure', 'certain', 'definitely', 'obviously']
  };

  const lowerMessage = message.toLowerCase();
  const toneScores: Record<string, number> = {};

  // Calculate tone scores
  Object.entries(toneMarkers).forEach(([tone, markers]) => {
    toneScores[tone] = markers.reduce((score, marker) => {
      return score + (lowerMessage.includes(marker) ? 1 : 0);
    }, 0);
  });

  // Determine dominant tone
  let dominantTone = 'neutral';
  let maxScore = 0;

  Object.entries(toneScores).forEach(([tone, score]) => {
    if (score > maxScore) {
      maxScore = score;
      dominantTone = tone;
    }
  });

  return { dominantTone, toneScores };
}

// ========== CREATIVE MODE ACTIVATION ==========
const CREATIVE_TRIGGERS = [
  "think outside the box",
  "creative solution",
  "innovative approach",
  "brainstorm ideas",
  "unconventional method"
];

function activateCreativeMode(userMessage: string): boolean {
  const lowerMsg = userMessage.toLowerCase();
  return CREATIVE_TRIGGERS.some(trigger => lowerMsg.includes(trigger));
}

// ========== REST OF IMPLEMENTATION ==========
// ... (Keep all existing functions like generateWorkflowDiagram, 
// generateBioinformaticsDiagram, etc. with minor enhancements) ...

export function shouldPerformWebSearch(query: string): boolean {
  const webSearchKeywords = [
    'recent', 'this year', '2024', '2025', 'what\'s happening',
    'tutorial', 'guide', 'example', 'documentation',
    'research', 'study', 'paper', 'publication', 'article',
    'database', 'tool', 'software', 'algorithm', 'method',
    'current', 'latest', 'new', 'update', 'news'
  ];
  
  const lowerQuery = query.toLowerCase();
  return webSearchKeywords.some(keyword => lowerQuery.includes(keyword));
}

function generateWorkflowDiagram(query: string): string | null {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('workflow') || lowerQuery.includes('pipeline')) {
    return `graph TD
    A[Start] --> B[Process Input]
    B --> C[Analysis]
    C --> D[Generate Output]
    D --> E[End]
    style A fill:#e1f5fe
    style E fill:#c8e6c9`;
  }
  
  if (lowerQuery.includes('rnaseq') || lowerQuery.includes('rna-seq')) {
    return generateBioinformaticsDiagram(query);
  }
  
  return null;
}