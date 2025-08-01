import { ChatMessage, PersonalityConfig, ConversationMemory, StructuredResponse, ResponseSection } from "./types";

// ========== PERSONALITY SYSTEM (Enhanced) ==========
const PERSONALITY_PROFILES: Record<string, PersonalityConfig> = {
  // ... existing profiles ...
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

// ========== ENHANCED PERSONALITY SELECTION ==========
export function getPersonalityForContext(
  userMessage: string,
  conversationHistory: ChatMessage[],
  userPreferences?: { preferredPersonality?: string },
): PersonalityConfig {
  // ... existing logic ...

  // Enhanced tone detection
  const userTone = analyzeUserTone(userMessage);
  if (TONE_ADAPTATION_RULES[userTone]) {
    const baseProfile = PERSONALITY_PROFILES.mentor; // Default base
    return {
      ...baseProfile,
      tone: TONE_ADAPTATION_RULES[userTone],
      response_patterns: {
        ...baseProfile.response_patterns,
        acknowledgments: [
          `I sense your ${userTone} tone!`,
          ...(baseProfile.response_patterns?.acknowledgments || [])
        ]
      }
    };
  }

  // ... rest of existing logic ...
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
  // ... existing logic ...

  // Add visual usage metadata
  const enhancedMetadata = {
    ...message.metadata,
    visualUsage: {
      diagramAdded: structuredResponse.metadata?.hasDiagram,
      tableAdded: structuredResponse.metadata?.hasTable,
      rulesApplied: VISUAL_USAGE_RULES
    }
  };

  return {
    ...message,
    content: finalContent,
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
      return score + (lowerMessage.includes(marker) ? 1 : 0;
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
  // ... existing implementation ...
}