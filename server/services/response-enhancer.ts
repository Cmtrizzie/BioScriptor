import {
  ChatMessage,
  PersonalityConfig,
  StructuredResponse,
  ResponseSection,
} from "./types";

// === PERSONALITY CONFIGS ===
const PERSONALITY_PROFILES: Record<string, PersonalityConfig> = {
  mentor: {
    name: "BioMentor",
    tone: "encouraging and educational",
    greeting_style: "warm and welcoming",
    explanation_style: "step-by-step with examples",
    conversation_closers: [
      "Keep exploring! Science is endless.",
      "Remember, every expert was once a beginner.",
      "Happy to guide your next discovery!",
    ],
    expertise_level: "advanced",
    response_patterns: {
      acknowledgments: [
        "Great question!",
        "I love your curiosity!",
        "That's a fantastic area to explore!",
      ],
      transitions: [
        "Let me walk you through this:",
        "Here's how we approach this:",
        "Think of it this way:",
      ],
      encouragements: [
        "You're on the right track!",
        "This gets exciting!",
        "Here's where it gets interesting:",
      ],
    },
  },
  expert: {
    name: "BioExpert",
    tone: "precise and technical",
    greeting_style: "professional and direct",
    explanation_style: "detailed with scientific rigor",
    conversation_closers: [
      "Let me know if you need deeper analysis.",
      "Happy to dive into more technical details.",
      "Feel free to ask about advanced applications.",
    ],
    expertise_level: "expert",
    response_patterns: {
      acknowledgments: [
        "Excellent question.",
        "This requires careful analysis.",
        "Let's examine this systematically.",
      ],
      transitions: [
        "Based on current research:",
        "The methodology involves:",
        "Technical considerations include:",
      ],
      encouragements: [
        "This approach is well-established.",
        "The data supports this conclusion.",
        "Industry standards recommend:",
      ],
    },
  },
  generalist: {
    name: "Knowledge Assistant",
    tone: "concise and informative",
    greeting_style: "friendly and helpful",
    explanation_style: "direct facts with context",
    conversation_closers: [
      "Is there anything else I can help with?",
      "Would you like to explore another topic?",
      "Happy to assist with more questions!",
    ],
    expertise_level: "knowledgeable generalist",
    response_patterns: {
      acknowledgments: ["Got it!", "Sure thing,", "Happy to help,"],
      transitions: [
        "Here's what I know:",
        "According to available information:",
        "Based on current knowledge:",
      ],
      encouragements: [
        "Hope that helps!",
        "Let me know if you need more details!",
        "Feel free to ask follow-up questions!",
      ],
    },
  },
};

// === GENERAL KNOWLEDGE BASE ===
const GENERAL_KNOWLEDGE: Record<string, string> = {
  "kenya president": "As of 2023, the President of Kenya is William Ruto",
  "largest country": "Russia is the largest country by land area",
  "human chromosomes": "Humans have 23 pairs of chromosomes (46 total)",
  "fastest animal":
    "The peregrine falcon is the fastest animal, diving at speeds over 240 mph",
  "longest river":
    "The Nile River is the longest river in the world at about 4,135 miles",
  "smallest country": "Vatican City is the smallest country in the world",
  "tallest mountain": "Mount Everest is the tallest mountain at 29,032 feet",
  "deepest ocean":
    "The Pacific Ocean's Mariana Trench is the deepest point at about 36,000 feet",
};

// === DOMAIN DETECTION ===
function determineResponseDomain(query: string): string {
  const BIO_KEYWORDS = [
    "dna",
    "rna",
    "protein",
    "sequence",
    "genomic",
    "alignment",
    "blast",
    "crispr",
    "pcr",
    "bioinformatics",
    "genome",
    "variant",
    "analysis",
    "python",
    "script",
    "pipeline",
    "fastq",
    "bam",
    "vcf",
    "snp",
    "gene",
    "chromosome",
    "nucleotide",
    "amino acid",
    "phylogenetic",
  ];

  const isBio = BIO_KEYWORDS.some((kw) => query.toLowerCase().includes(kw));

  if (
    /(hello|hi|hey|greetings|good morning|good afternoon|good evening)/i.test(
      query,
    )
  )
    return "greeting";
  if (isBio || query.length < 5) return "bio";
  if (/(president|minister|king|queen|government|politics)/i.test(query))
    return "politics";
  if (/(sports|team|player|match|football|soccer|basketball)/i.test(query))
    return "sports";
  if (/(movie|actor|director|film|entertainment)/i.test(query))
    return "entertainment";
  if (/(weather|temperature|climate)/i.test(query)) return "weather";
  if (/(news|latest|trending|headlines)/i.test(query)) return "news";

  return "general";
}

// Enhanced response function for backward compatibility
export function enhanceResponse(
  message: ChatMessage,
  options: {
    context?: {
      previousResponses?: ChatMessage[];
      currentTopic?: string;
      taskType?: string;
      conversationContext?: any;
    };
    tone?: string;
    userMessage?: string;
    userSkillLevel?: string;
    preferredStyle?: string;
  }
): ChatMessage {
  const domain = determineResponseDomain(options.userMessage || '');
  
  // Route to appropriate handler based on domain
  switch (domain) {
    case 'bio':
      // For bioinformatics queries, use expert personality
      return handleGeneralKnowledge(message, {
        ...options,
        personality: PERSONALITY_PROFILES.expert
      });
    
    case 'greeting':
    case 'general':
      // For general queries, use generalist personality
      return handleGeneralKnowledge(message, {
        ...options,
        personality: PERSONALITY_PROFILES.generalist
      });
    
    default:
      // Default to mentor personality for educational content
      return handleGeneralKnowledge(message, {
        ...options,
        personality: PERSONALITY_PROFILES.mentor
      });
  }
}

// === FACTUAL ANSWER GENERATION ===
function getFactualAnswer(query: string): string {
  const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, "");

  for (const [key, answer] of Object.entries(GENERAL_KNOWLEDGE)) {
    if (cleanQuery.includes(key)) return answer;
  }

  if (cleanQuery.includes("who is") && cleanQuery.includes("president")) {
    return "I have limited information about current political leaders. As a bioinformatics specialist, I can best help with DNA analysis, sequence alignment, or scientific computing tasks.";
  }

  if (cleanQuery.includes("what is") && cleanQuery.includes("largest")) {
    return "For geographical questions, I have basic information. However, my expertise is in bioinformatics - would you like to explore genomic data analysis instead?";
  }

  return `I don't have specific information about "${query}". As a bioinformatics specialist, I can best help with DNA analysis, sequence alignment, protein structures, or scientific computing tasks.`;
}

// ✅ ✅ ✅ === FIXED: SINGLE VERSION OF handleGeneralKnowledge ===
export function handleGeneralKnowledge(
  message: ChatMessage,
  options: any & {
    personality?: PersonalityConfig;
    conversationContext?: any;
    preferredStyle?: string;
  },
): ChatMessage {
  const personality = options.personality || PERSONALITY_PROFILES.generalist;
  const context = options.conversationContext;

  let ask = "general questions";
  let directAnswer = getFactualAnswer(options.userMessage || "");

  if (
    options.userMessage &&
    /(hello|hi|hey|greetings|good morning|good afternoon|good evening)/i.test(
      options.userMessage,
    )
  ) {
    directAnswer = "Hello there! How can I assist you today?";
    ask = "anything else";
  }

  const transition =
    personality.response_patterns?.transitions?.[0] || "Here's what I know:";

  const content =
    `${transition} ${directAnswer}\n\n` +
    `💡 *While I specialize in bioinformatics, I'm happy to help with ${ask} too.* ` +
    `Need expert help with DNA sequencing or data analysis next?\n\n` +
    `🧬 Ask me about DNA sequencing or protein structures!`;

  return {
    ...message,
    content,
    metadata: {
      ...message.metadata,
      domain: "general",
      personality: personality.name,
      suggestedRedirect: "bioinformatics",
      responseStyle: options.preferredStyle || "friendly",
    },
  };
}
