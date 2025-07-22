import { BioFileAnalysis } from './bioinformatics';

export type EmbeddingVector = number[];

export interface MessageEmbedding {
  vector: EmbeddingVector;
  model: string;
  dimension: number;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: number;
  status: 'pending' | 'complete' | 'error' | 'streaming';
  embedding?: MessageEmbedding;
  metadata?: {
    tone?: string;
    intent?: string;
    fileAnalysis?: BioFileAnalysis;
    model?: string;
    processingTime?: number;
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
    citations?: Array<{
      text: string;
      url?: string;
      type: 'paper' | 'database' | 'tool';
    }>;
    codeBlocks?: Array<{
      language: string;
      code: string;
      explanation?: string;
    }>;
    confidence: number;
  };
  renderOptions?: {
    markdown: boolean;
    syntax: boolean;
    math: boolean;
    mermaid: boolean;
  };
}

export interface ConversationContext {
  id: string;
  title?: string;
  turnCount: number;
  history: ChatMessage[];
  lastActiveTime: number;
  lastQuery?: BioinformaticsQuery;
  userData: UserProfile;
  userProgress: UserProgress;
  userContent: UserContent;
  memory: ConversationMemory;
  threadHistory: string[];
}

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  language: string;
  region?: string;
  createdAt: number;
  lastActive: number;
  skillLevel: string;
  preferredTone: string;
  preferences: {
    detailedExplanations: boolean;
    codeSnippets: boolean;
    scientificCitations: boolean;
    notifications?: boolean;
  };
}

export interface UserProgress {
  quizResults: Array<{
    quizId: string;
    score: number;
    completedAt: number;
    topic: string;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    unlockedAt: number;
  }>;
  learningProgress: {
    completedTopics: string[];
    currentLevel: string;
    totalPoints: number;
  };
}

export interface UserContent {
  notes: Array<{
    id: string;
    content: string;
    createdAt: number;
    updatedAt: number;
    tags: string[];
  }>;
  todoLists: Array<{
    id: string;
    title: string;
    items: Array<{
      id: string;
      text: string;
      completed: boolean;
      createdAt: number;
    }>;
  }>;
  uploadedDocuments: Array<{
    id: string;
    filename: string;
    type: string;
    uploadedAt: number;
    metadata: any;
  }>;
}

export interface ConversationMemory {
  topics: Set<string>;
  entities: Set<string>;
  keyTerms: Set<string>;
  contextualReferences: Map<string, string>;
  lastMentionedSequence?: string;
  lastDiscussedTool?: string;
}

export interface BioinformaticsQuery {
  type: 'crispr' | 'pcr' | 'codon_optimization' | 'sequence_analysis' | 'general';
  intent: {
    primary: string;
    secondary?: string;
    confidence: number;
  };
  entities: {
    sequences?: string[];
    genes?: string[];
    organisms?: string[];
    terms?: string[];
  };
  context: ConversationContext;
  parameters: Record<string, any>;
}
