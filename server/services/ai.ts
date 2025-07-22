
import { BioFileAnalysis, generateCRISPRGuides, simulatePCR, optimizeCodonUsage } from './bioinformatics';
import { FaultTolerantAI, ProviderConfig } from './ai-providers';
import { securityManager } from './security';

interface ProcessedInput {
  normalizedText: string;
  tokens: string[];
  spellCorrected?: boolean;
  language?: string;
}

type EmbeddingVector = number[];

interface MessageEmbedding {
  vector: EmbeddingVector;
  model: string;
  dimension: number;
  timestamp: number;
}

interface ChatMessage {
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

interface ThreadReference {
  messageId: string;
  relevance: number;
  context: string;
}

interface ConversationMemory {
  topics: Set<string>;
  entities: Set<string>;
  keyTerms: Set<string>;
  contextualReferences: Map<string, string>;
  lastMentionedSequence?: string;
  lastDiscussedTool?: string;
}

interface ConversationMemory {
  topics: Set<string>;
  entities: Set<string>;
  keyTerms: Set<string>;
  contextualReferences: Map<string, string>;
}

interface UserProfile {
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

interface UserProgress {
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

interface UserContent {
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

interface ConversationContext {
  id: string;
  turnCount: number;
  history: Message[];
  lastActiveTime: number;
  userData: UserProfile;
  userProgress: UserProgress;
  userContent: UserContent;
  memory: ConversationMemory;
  threadHistory: string[];
}

interface BioinformaticsQuery {
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

// Initialize the fully open-source fault-tolerant AI system
const aiConfig: ProviderConfig = {
  // Primary open-source models via Ollama
  ollama: {
    endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
    models: {
      default: 'mistral', // Base conversational model
      bio: 'llama2', // Specialized for bio sequences
      code: 'codellama', // For code generation
      science: 'openchat', // For scientific discussions
      research: 'phi', // For research queries
      chat: 'neural-chat' // For engaging responses
    }
  },
  // Local fallback models
  localAI: {
    endpoint: process.env.LOCAL_AI_ENDPOINT || 'http://localhost:8080',
    models: {
      default: 'ggml-vicuna-13b-v1.5',
      specialized: 'redpajama-incite',
      fastchat: 'fastchat-t5'
    }
  },
  // Self-hosted open source models
  koboldAI: {
    endpoint: process.env.KOBOLD_AI_ENDPOINT || 'http://localhost:5001',
    models: {
      default: 'pythia',
      specialized: 'falcon'
    }
  },
  // Local specialized models
  textGen: {
    endpoint: process.env.TEXT_GEN_ENDPOINT || 'http://localhost:7891',
    models: {
      small: 'tinyllama',
      medium: 'stable-beluga'
    }
  }
};

const faultTolerantAI = new FaultTolerantAI(aiConfig);

// Helper functions for conversation memory
function extractTopics(text: string): string[] {
  // Basic topic extraction - in production, use a proper NLP library
  const topics = new Set<string>();
  
  // Match scientific terms and concepts
  const scientificTerms = text.match(/(?:DNA|RNA|protein|gene|genome|sequence|CRISPR|PCR|plasmid|enzyme|mutation|cell|bacteria|virus|analysis|alignment|primer|cloning|expression|vector|restriction|digest|ligation|transformation|amplification|purification|assay|protocol|experiment|sample|data|results|method|technique|procedure|pipeline|workflow|bioinformatics|molecular|biology|biochemistry|genetics|genomics|proteomics|sequencing|synthesis|structure|function|pathway|mechanism|system|model|theory|hypothesis|conclusion|finding|evidence|research|study|paper|publication|database|tool|software|algorithm|parameter|condition|control|variable|factor|effect|impact|interaction|relationship|correlation|causation|significance|quality|quantity|measurement|calculation|prediction|validation|verification|optimization|improvement|enhancement|modification|regulation|inhibition|activation|binding|specificity|efficiency|accuracy|precision|reliability|reproducibility|standardization|normalization|calibration|baseline|threshold|cutoff|criteria|requirement|specification|standard|guideline|recommendation|suggestion|approach|strategy|plan|design|implementation|execution|analysis|evaluation|assessment|review|interpretation|explanation|understanding|knowledge|expertise|skill|experience|training|education|learning|development|advancement|progress|innovation|discovery|breakthrough|achievement|success|failure|problem|challenge|issue|concern|limitation|constraint|restriction|obstacle|barrier|difficulty|complexity|uncertainty|variability|heterogeneity|diversity|similarity|difference|comparison|contrast|alternative|option|choice|decision|selection|priority|preference|requirement|demand|need|goal|objective|purpose|aim|target|scope|scale|level|degree|extent|range|limit|boundary|context|environment|condition|situation|case|example|instance|scenario|model|framework|structure|organization|composition|configuration|arrangement|pattern|trend|tendency|behavior|characteristic|property|attribute|feature|aspect|element|component|part|unit|module|section|segment|phase|stage|step|task|action|operation|process|procedure|method|technique|approach|strategy|tactic|policy|practice|standard|protocol|guideline|rule|regulation|requirement|specification|criterion|measure|metric|indicator|parameter|variable|factor|determinant|influence|effect|impact|consequence|result|outcome|output|product|deliverable|solution|resolution|answer|response|reaction|feedback|input|suggestion|recommendation|proposal|plan|design|scheme|system|platform|application|tool|utility|resource|asset|capability|functionality|performance|efficiency|effectiveness|quality|reliability|stability|robustness|flexibility|adaptability|scalability|extensibility|maintainability|sustainability|security|safety|integrity|consistency|accuracy|precision|resolution|sensitivity|specificity|reproducibility|repeatability|validation|verification|certification|compliance|conformance|adherence|alignment|coordination|collaboration|cooperation|integration|interaction|interface|connection|relationship|association|correlation|dependency|hierarchy|classification|categorization|organization|structure|architecture|topology|layout|arrangement|configuration|composition|constitution|formation|development|evolution|progression|advancement|improvement|enhancement|optimization|refinement|modification|adaptation|customization|personalization|specialization|generalization|abstraction|conceptualization|formalization|standardization|normalization|harmonization|unification|consolidation|integration|synthesis|analysis|evaluation|assessment|review|examination|investigation|exploration|study|research|experiment|test|trial|pilot|prototype|demonstration|proof|evidence|validation|verification|confirmation|authentication|authorization|approval|acceptance|rejection|selection|filtering|processing|transformation|conversion|translation|transfer|transmission|communication|exchange|sharing|distribution|allocation|assignment|delegation|management|administration|coordination|supervision|monitoring|tracking|logging|recording|documentation|specification|description|definition|identification|recognition|determination|estimation|calculation|computation|derivation|inference|deduction|induction|reasoning|logic|methodology|philosophy|theory|hypothesis|assumption|premise|condition|constraint|requirement|criterion|standard|benchmark|reference|baseline|threshold|limit|boundary|scope|context|environment|framework|infrastructure|foundation|basis|ground|support|platform|system|network|grid|cluster|array|collection|set|group|category|class|type|kind|form|format|structure|scheme|pattern|model|template|example|instance|case|scenario|situation|event|occurrence|phenomenon|observation|measurement|detection|sensing|monitoring|control|regulation|adjustment|calibration|tuning|optimization|enhancement|improvement|development|evolution|progression|advancement|innovation|creation|generation|production|construction|building|assembly|integration|combination|composition|organization|arrangement|configuration|modification|alteration|change|variation|deviation|difference|distinction|comparison|contrast|analysis|evaluation|assessment|review|critique|criticism|feedback|response|reaction|effect|impact|influence|consequence|result|outcome|output|product|solution|resolution|answer|conclusion|finding|discovery|revelation|insight|understanding|knowledge|wisdom|expertise|skill|ability|capability|competence|proficiency|mastery|excellence|quality|performance|efficiency|effectiveness|productivity|throughput|capacity|volume|scale|size|dimension|magnitude|quantity|amount|number|count|frequency|rate|speed|velocity|acceleration|momentum|force|power|energy|strength|intensity|level|degree|extent|range|scope|coverage|depth|breadth|width|height|length|distance|space|time|duration|period|interval|cycle|phase|stage|step|sequence|order|priority|importance|significance|relevance|pertinence|applicability|utility|usefulness|value|worth|merit|benefit|advantage|disadvantage|cost|price|expense|investment|return|profit|gain|loss|risk|hazard|danger|threat|vulnerability|weakness|strength|opportunity|possibility|potential|prospect|chance|probability|likelihood|certainty|uncertainty|ambiguity|clarity|precision|accuracy|correctness|validity|reliability|consistency|stability|robustness|resilience|durability|sustainability|maintainability|serviceability|availability|accessibility|usability|functionality|capability|capacity|competency|ability|skill|knowledge|expertise|experience|qualification|certification|accreditation|authorization|authentication|verification|validation|confirmation|proof|evidence|justification|rationalization|explanation|clarification|elaboration|specification|definition|description|identification|recognition|classification|categorization|organization|structure|system|framework|methodology|approach|strategy|tactic|technique|procedure|process|operation|action|activity|task|job|work|function|role|responsibility|duty|obligation|requirement|necessity|need|demand|desire|want|wish|preference|choice|option|alternative|possibility|opportunity|chance|prospect|potential|capability|ability|power|authority|control|influence|leadership|management|administration|coordination|supervision|direction|guidance|support|assistance|help|aid|service|contribution|participation|involvement|engagement|commitment|dedication|devotion|loyalty|fidelity|integrity|honesty|truthfulness|accuracy|precision|correctness|validity|reliability|consistency|stability|durability|sustainability|maintainability|serviceability|availability|accessibility|usability|functionality|capability)/gi);
  
  if (scientificTerms) {
    scientificTerms.forEach(term => topics.add(term.toLowerCase()));
  }

  return Array.from(topics);
}

function extractEntities(text: string): string[] {
  // Basic entity extraction - in production, use a proper NLP library
  const entities = new Set<string>();

  // Match potential sequence identifiers
  const sequenceIds = text.match(/[A-Z]{2}_\d+/g) || [];
  sequenceIds.forEach(id => entities.add(id));

  // Match potential gene names (uppercase 3+ letters followed by numbers)
  const geneNames = text.match(/[A-Z]{3,}\d*/g) || [];
  geneNames.forEach(gene => entities.add(gene));

  // Match species names (capitalize words)
  const speciesNames = text.match(/[A-Z][a-z]+ [a-z]+/g) || [];
  speciesNames.forEach(species => entities.add(species));

  return Array.from(entities);
}

function extractKeyTerms(text: string): string[] {
  // Basic key term extraction - in production, use a proper NLP library
  const terms = new Set<string>();

  // Match technical terms and measurements
  const technicalTerms = text.match(/\b\d+(\.\d+)?\s*(bp|kb|mb|gb|μl|ml|l|ng|μg|mg|g|kg|°c|mm|cm|m|h|min|s|x|m+ol|v|w|rpm|rcf|g|%|fold|units?|copies)\b/gi);
  if (technicalTerms) {
    technicalTerms.forEach(term => terms.add(term.toLowerCase()));
  }

  // Match method-specific terms
  const methodTerms = text.match(/\b(pcr|rt-pcr|qpcr|elisa|western|northern|southern|cloning|sequencing|assembly|digestion|ligation|transformation|purification|extraction|synthesis|analysis|alignment|blast|clustal|bowtie|star|trinity|spades|idba|megahit|canu|flye|wtdbg2|racon|pilon|busco|quast|fastqc|trimmomatic|cutadapt|bwa|hisat2|tophat|cufflinks|htseq|deseq2|edger|limma|macs2|homer|great|gsea|david|kegg|go|pfam|prosite|prints|panther|interpro|swiss-model|phyre2|i-tasser|rosetta|alphafold|rfam|mirbase|tarbase|encode|blueprint|roadmap|1000genomes|gtex|tcga|geo|sra|ddbj|ena|pdb|uniprot|refseq|genbank|ensembl|ucsc|ncbi|ebi|ddbj|protein data bank|sequence read archive|gene expression omnibus)\b/gi);
  if (methodTerms) {
    methodTerms.forEach(term => terms.add(term.toLowerCase()));
  }

  return Array.from(terms);
}

// Vector similarity utils
function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

interface SemanticSearchResult {
  message: ChatMessage;
  similarity: number;
  context?: string;
}

class ConversationManager {
  private conversations: Map<string, ConversationContext> = new Map();
  private activeConversationId: string | null = null;
  private embeddingModel: any; // Will be initialized with sentence-transformers

  constructor() {
    // Initialize with a new conversation
    this.createNewConversation();
    this.initializeEmbeddingModel();
  }

  private async initializeEmbeddingModel() {
    try {
      // Using transformers.js for client-side embedding (no Python dependency)
      const { pipeline } = await import('@xenova/transformers');
      this.embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    } catch (error) {
      console.error('Error initializing embedding model:', error);
      // Fallback to simpler text similarity if model fails
      this.embeddingModel = null;
    }
  }

  private initializeMemory(): ConversationMemory {
    return {
      topics: new Set<string>(),
      entities: new Set<string>(),
      keyTerms: new Set<string>(),
      contextualReferences: new Map<string, string>()
    };
  }

  createNewConversation(userProfile?: Partial<UserProfile>): string {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    
    const newContext: ConversationContext = {
      id: conversationId,
      turnCount: 0,
      history: [],
      lastActiveTime: timestamp,
      userData: {
        id: userProfile?.id || `user_${timestamp}`,
        name: userProfile?.name,
        email: userProfile?.email,
        phone: userProfile?.phone,
        language: userProfile?.language || 'en',
        region: userProfile?.region,
        createdAt: timestamp,
        lastActive: timestamp,
        skillLevel: userProfile?.skillLevel || 'beginner',
        preferredTone: userProfile?.preferredTone || 'casual',
        preferences: {
          detailedExplanations: true,
          codeSnippets: true,
          scientificCitations: true,
          notifications: true,
          ...userProfile?.preferences
        }
      },
      userProgress: {
        quizResults: [],
        achievements: [],
        learningProgress: {
          completedTopics: [],
          currentLevel: 'beginner',
          totalPoints: 0
        }
      },
      userContent: {
        notes: [],
        todoLists: [],
        uploadedDocuments: []
      },
      memory: this.initializeMemory(),
      threadHistory: []
    };
    this.conversations.set(conversationId, newContext);
    this.activeConversationId = conversationId;
    return conversationId;
  }

  getActiveContext(): ConversationContext {
    if (!this.activeConversationId || !this.conversations.has(this.activeConversationId)) {
      this.createNewConversation();
    }
    return this.conversations.get(this.activeConversationId)!;
  }

  private async generateEmbedding(text: string): Promise<MessageEmbedding | null> {
    if (!this.embeddingModel) return null;
    
    try {
      const output = await this.embeddingModel(text);
      const vector = Array.from(output.data);
      
      return {
        vector,
        model: 'all-MiniLM-L6-v2',
        dimension: vector.length,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }

  async searchSimilarMessages(
    query: string,
    context: ConversationContext,
    topK: number = 3,
    threshold: number = 0.7
  ): Promise<SemanticSearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    if (!queryEmbedding) return [];

    const results: SemanticSearchResult[] = [];
    
    // Search through conversation history
    for (const message of context.history) {
      if (!message.embedding) {
        message.embedding = await this.generateEmbedding(message.content);
      }
      
      if (message.embedding) {
        const similarity = cosineSimilarity(queryEmbedding.vector, message.embedding.vector);
        if (similarity >= threshold) {
          results.push({
            message,
            similarity,
            context: this.getMessageContext(message, context)
          });
        }
      }
    }

    // Sort by similarity and take top K
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  private getMessageContext(message: ChatMessage, context: ConversationContext): string {
    const messageIndex = context.history.findIndex(m => m.id === message.id);
    if (messageIndex === -1) return '';

    // Get surrounding messages for context
    const start = Math.max(0, messageIndex - 2);
    const end = Math.min(context.history.length, messageIndex + 3);
    const surroundingMessages = context.history.slice(start, end);

    return surroundingMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
  }

  // User Content Management Methods
  addNote(note: { content: string, tags?: string[] }): string {
    const context = this.getActiveContext();
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    
    const newNote = {
      id: noteId,
      content: note.content,
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: note.tags || []
    };
    
    context.userContent.notes.push(newNote);
    return noteId;
  }

  addTodoList(title: string): string {
    const context = this.getActiveContext();
    const listId = `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newList = {
      id: listId,
      title,
      items: [],
      createdAt: Date.now()
    };
    
    context.userContent.todoLists.push(newList);
    return listId;
  }

  addUploadedDocument(doc: { filename: string, type: string, metadata: any }): string {
    const context = this.getActiveContext();
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newDoc = {
      id: docId,
      ...doc,
      uploadedAt: Date.now()
    };
    
    context.userContent.uploadedDocuments.push(newDoc);
    return docId;
  }

  // User Progress Management Methods
  addQuizResult(result: { quizId: string, score: number, topic: string }): void {
    const context = this.getActiveContext();
    context.userProgress.quizResults.push({
      ...result,
      completedAt: Date.now()
    });
    
    // Update learning progress
    if (!context.userProgress.learningProgress.completedTopics.includes(result.topic)) {
      context.userProgress.learningProgress.completedTopics.push(result.topic);
      context.userProgress.learningProgress.totalPoints += result.score;
    }
  }

  updateUserProfile(updates: Partial<UserProfile>): void {
    const context = this.getActiveContext();
    context.userData = {
      ...context.userData,
      ...updates,
      lastActive: Date.now()
    };
  }

  getUserProgress(): UserProgress {
    return this.getActiveContext().userProgress;
  }

  getUserContent(): UserContent {
    return this.getActiveContext().userContent;
  }

  getUserProfile(): UserProfile {
    return this.getActiveContext().userData;
  }

  private async updateMemory(context: ConversationContext, message: ChatMessage) {
    // Generate and store embedding
    if (!message.embedding) {
      message.embedding = await this.generateEmbedding(message.content);
    }

    // Extract topics and entities from message content using NLP
    const newTopics = extractTopics(message.content);
    const newEntities = extractEntities(message.content);
    const newTerms = extractKeyTerms(message.content);

    // Update memory
    newTopics.forEach(topic => context.memory.topics.add(topic));
    newEntities.forEach(entity => context.memory.entities.add(entity));
    newTerms.forEach(term => context.memory.keyTerms.add(term));

    // Update contextual references
    if (message.metadata?.fileAnalysis) {
      context.memory.contextualReferences.set(
        message.id,
        JSON.stringify(message.metadata.fileAnalysis)
      );
    }

    // Maintain thread history
    context.threadHistory.push(message.id);
    if (context.threadHistory.length > 100) {
      context.threadHistory = context.threadHistory.slice(-100);
    }
  }

  async sendMessage(message: ChatMessage): Promise<ChatMessage> {
    const context = this.getActiveContext();
    context.turnCount++;
    
    // Add message to history
    context.history.push(message);
    
    try {
      // Check for memory-related queries
      const memoryPattern = /(?:remember|recall|mentioned|talked about|previous|earlier|before|last time)/i;
      if (memoryPattern.test(message.content)) {
        const similarMessages = await this.searchSimilarMessages(message.content, context);
        
        if (similarMessages.length > 0) {
          // Found relevant past messages
          if (similarMessages[0].similarity > 0.85) {
            // High confidence match
            const bestMatch = similarMessages[0];
            message.metadata = {
              ...message.metadata,
              memoryRecall: {
                found: true,
                confidence: bestMatch.similarity,
                matchedMessage: bestMatch.message.content,
                context: bestMatch.context
              }
            };
          } else {
            // Multiple possible matches
            message.metadata = {
              ...message.metadata,
              memoryRecall: {
                found: true,
                confidence: 'multiple',
                matches: similarMessages.map(m => ({
                  content: m.message.content,
                  similarity: m.similarity
                }))
              }
            };
          }
        }
      }

      // Process message through AI
      const response = await faultTolerantAI.generateResponse({
        messages: context.history,
        context: {
          memory: {
            topics: Array.from(context.memory.topics),
            entities: Array.from(context.memory.entities),
            keyTerms: Array.from(context.memory.keyTerms)
          },
          userData: context.userData
        }
      });

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        status: 'complete',
        metadata: {
          ...response.metadata,
          confidence: response.confidence || 0.8
        }
      };

      // Update conversation memory with both messages
      this.updateMemory(context, message);
      this.updateMemory(context, assistantMessage);

      // Add to history
      context.history.push(assistantMessage);
      
      // Update last active time
      context.lastActiveTime = Date.now();

      return assistantMessage;
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        id: `error_${Date.now()}`,
        role: 'error',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: Date.now(),
        status: 'error',
        metadata: {
          confidence: 0
        }
      };
    }
  }

  switchConversation(conversationId: string): ConversationContext | null {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      this.activeConversationId = conversationId;
      conversation.lastActiveTime = Date.now();
      return conversation;
    }
    return null;
  }

  addMessageToHistory(message: string, role: 'user' | 'assistant', metadata?: any) {
    const context = this.getActiveContext();
    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content: message,
      timestamp: Date.now(),
      metadata
    };
    context.history.push(chatMessage);
    
    // Update conversation title based on first user message if not set
    if (!context.title && role === 'user' && context.history.length <= 2) {
      context.title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
    }
    
    this.conversations.set(context.id, context);
  }

  getRecentConversations(limit: number = 10): Array<{id: string, title: string, lastActiveTime: number}> {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.lastActiveTime - a.lastActiveTime)
      .slice(0, limit)
      .map(conv => ({
        id: conv.id,
        title: conv.title || 'Untitled Conversation',
        lastActiveTime: conv.lastActiveTime
      }));
  }
}

// Initialize the conversation manager
const conversationManager = new ConversationManager();

export async function processQuery(
  message: string, 
  fileAnalysis?: BioFileAnalysis, 
  conversationId?: string
): Promise<{response: string, conversationContext: ConversationContext}> {
  try {
    // Switch or create conversation context
    if (conversationId) {
      const existingContext = conversationManager.switchConversation(conversationId);
      if (!existingContext) {
        throw new Error('Conversation not found');
      }
    }

    const conversationCtx = conversationManager.getActiveContext();
    
    // 1. Input Preprocessing
    const sanitizedMessage = securityManager.sanitizeInput(message);
    const processedInput = preprocessInput(sanitizedMessage);
    
    // 2. Context & State Management
    conversationCtx.turnCount++;
    const tone = detectTone(sanitizedMessage);
    const userSkillLevel = detectUserSkillLevel(sanitizedMessage, conversationCtx);
    if (conversationCtx.userData) {
      conversationCtx.userData.skillLevel = userSkillLevel;
      conversationCtx.userData.preferredTone = tone;
    }
    
    // Track message being processed
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    conversationManager.addMessageToHistory(sanitizedMessage, 'user', {
      tone,
      fileAnalysis,
      status: 'complete',
      confidence: 1.0,
      renderOptions: {
        markdown: true,
        syntax: true,
        math: true,
        mermaid: true
      }
    });
    
    // Store user message in history
    conversationManager.addMessageToHistory(sanitizedMessage, 'user', {
      tone,
      fileAnalysis
    });
    
    // 3. Intent Recognition & Entity Extraction
    const query = parseQuery(sanitizedMessage, conversationContext);
    
    // For bioinformatics-specific queries, use specialized handlers
    if (query.type !== 'general') {
      return await processBioinformaticsQuery(query, sanitizedMessage, fileAnalysis);
    }
    
    // For general queries, use the fault-tolerant AI system with dynamic model selection
    const modelContext = {
      conversation: {
        history: conversationCtx.history.slice(-10),
        userSkillLevel: conversationCtx.userData?.skillLevel,
        tone: tone,
        allTopics: Array.from(context.memory.topics),
        recentEntities: Array.from(context.memory.entities).slice(-5),
        keyTerms: Array.from(context.memory.keyTerms)
      },
      fileAnalysis,
      // Select appropriate model based on query type
      model: query.parameters.isCodeRelated ? 'code' : 
             query.parameters.isScientific ? 'science' :
             query.parameters.isBiological ? 'bio' :
             query.parameters.isResearch ? 'research' : 'default',
      systemPrompt: `You are BioScriptor, an advanced bioinformatics AI assistant with real-time adaptive capabilities.
        Core traits:
        - Friendly and engaging personality
        - Deep expertise in bioinformatics and molecular biology
        - Ability to explain complex concepts clearly
        - Natural conversation style matching user's tone (${tone})
        
        Current Context:
        - Skill Level: ${userSkillLevel}
        - Conversation Turn: ${conversationCtx.turnCount}
        - Recent Topics: ${Array.from(context.memory.topics).slice(-3).join(', ')}
        
        Response Guidelines:
        1. Stay in character as BioScriptor
        2. Be naturally conversational, not templated
        3. Draw from your bioinformatics knowledge
        4. Match user's ${tone} tone
        5. Adapt technical depth to ${userSkillLevel} level
        6. Reference relevant previous context when appropriate
        7. Express personality while maintaining professionalism`
    };
    
    // Add conversational elements based on tone and query type
    let aiPrompt = "";
    
    // Handle different types of conversational queries
    if (query.parameters.isGreeting || /^(hi|hello|hey|greetings)/i.test(sanitizedMessage)) {
      const timeOfDay = getTimeOfDay();
      const isReturning = conversationCtx.turnCount > 1;
      aiPrompt = `Respond as BioScriptor with a ${tone} greeting. Use this context:
        Time: ${timeOfDay}
        Returning user: ${isReturning}
        Skill level: ${userSkillLevel}
        Previous interactions: ${conversationCtx.turnCount}
        Make it natural and friendly, avoid mentioning these technical details directly.`;
    } 
    // Handle personal/status questions
    else if (/^(how are you|what can you do|tell me about yourself|what are you)/i.test(sanitizedMessage)) {
      aiPrompt = `Respond as BioScriptor in a ${tone} tone. 
        Share your capabilities in bioinformatics, molecular biology, and scientific computing.
        Express enthusiasm for helping with:
        - DNA/RNA sequence analysis
        - CRISPR design
        - PCR primer design
        - Protein analysis
        - Data visualization
        - Code assistance
        Make it conversational and match the user's ${tone} tone.`;
    }
    // Handle definition queries
    else if (query.parameters.isDefinitionQuery) {
      aiPrompt = `Explain ${query.parameters.topic} in ${tone} tone, using clear and engaging language.
        Adapt the explanation to a ${userSkillLevel} skill level.`;
    }
    // Default case
    else {
      aiPrompt = sanitizedMessage;
    }
    
    // Process through primary model first
    const primaryResponse = await faultTolerantAI.generateResponse({
      messages: context.history,
      context: modelContext,
      modelPreference: modelContext.model
    });

    // If primary response is too templated or low confidence, try alternate model
    let finalResponse;
    if (primaryResponse.confidence < 0.7 || isTemplatedResponse(primaryResponse.content)) {
      const alternateModel = getAlternateModel(modelContext.model);
      const alternateResponse = await faultTolerantAI.generateResponse({
        messages: context.history,
        context: {
          ...modelContext,
          model: alternateModel
        }
      });
      
      // Choose the better response
      finalResponse = selectBestResponse(primaryResponse, alternateResponse);
    } else {
      finalResponse = primaryResponse;
    }

    // Enhance response with context and personality
    const enhancedResponse = await enhanceResponse(finalResponse, {
      context: modelContext,
      query: query,
      tone: tone,
      userSkillLevel: userSkillLevel
    });

    let response = enhancedResponse.content;
    
    // Security audit
    securityManager.createAuditLog({
      action: 'ai_query',
      resource: 'chat_message',
      metadata: {
        provider: aiResponse.provider,
        fallbackUsed: aiResponse.fallbackUsed,
        processingTime: aiResponse.processingTime,
        tone: tone
      }
    });
    
    // Store assistant response in history
    const sanitizedResponse = securityManager.sanitizeCodeOutput(response);
    conversationManager.addMessageToHistory(sanitizedResponse, 'assistant', {
      provider: aiResponse.provider,
      fallbackUsed: aiResponse.fallbackUsed,
      processingTime: aiResponse.processingTime
    });
    
    return {
      response: sanitizedResponse,
      conversationContext: conversationManager.getActiveContext()
    };
    
  } catch (error) {
    console.error('AI processing error:', error);
    
    if (error.message.includes('Security violation')) {
      return `🔒 Security Alert: ${error.message}\n\nPlease rephrase your request without potentially dangerous commands. I'm here to help with safe bioinformatics analysis and coding assistance.`;
    }
    
    return "I apologize, but I encountered an error processing your request. Please try rephrasing your question or check if your file format is supported.";
  }
}

function isTemplatedResponse(content: string): boolean {
  // Check for common patterns in templated responses
  const templatePatterns = [
    /^I('m| am) (an AI|a bioinformatics|an assistant)/i,
    /^As an AI assistant/i,
    /^Let me help you with/i,
    /^I understand you need help with/i,
    /^I can assist you with/i
  ];
  
  return templatePatterns.some(pattern => pattern.test(content));
}

function getAlternateModel(currentModel: string): string {
  const modelAlternatives = {
    'default': 'chat',
    'bio': 'science',
    'code': 'research',
    'science': 'bio',
    'research': 'default',
    'chat': 'science'
  };
  return modelAlternatives[currentModel] || 'default';
}

function selectBestResponse(primary: any, alternate: any): any {
  // Prefer responses with higher confidence
  if (Math.abs(primary.confidence - alternate.confidence) > 0.2) {
    return primary.confidence > alternate.confidence ? primary : alternate;
  }

  // If confidences are similar, prefer the more natural response
  const primaryTemplated = isTemplatedResponse(primary.content);
  const alternateTemplated = isTemplatedResponse(alternate.content);
  
  if (primaryTemplated && !alternateTemplated) return alternate;
  if (!primaryTemplated && alternateTemplated) return primary;
  
  // If both are similar, prefer the more detailed response
  return primary.content.length > alternate.content.length ? primary : alternate;
}

async function enhanceResponse(response: any, options: {
  context: any,
  query: BioinformaticsQuery,
  tone: string,
  userSkillLevel: string
}): Promise<any> {
  let content = response.content;
  
  // Add personality markers based on tone
  if (options.tone === 'casual') {
    content = content.replace(/\b(I will|I shall)\b/g, "I'll")
                    .replace(/\b(you will|you shall)\b/g, "you'll")
                    .replace(/\b(that is)\b/g, "that's")
                    .replace(/\b(it is)\b/g, "it's");
  }

  // Add empathy for frustrated tone
  if (options.tone === 'frustrated') {
    content = `I understand this can be challenging. ${content}`;
  }

  // Add urgency markers for urgent tone
  if (options.tone === 'urgent') {
    content = `Let's address this right away. ${content}`;
  }

  // Add skill level appropriate elaboration
  if (options.userSkillLevel === 'beginner' && !content.includes('For example')) {
    content += '\n\nWould you like me to explain any part of this in more detail?';
  }

  return {
    ...response,
    content: content
  };
}

async function processBioinformaticsQuery(
  query: BioinformaticsQuery, 
  message: string, 
  fileAnalysis?: BioFileAnalysis
): Promise<string> {
  switch (query.type) {
    case 'crispr':
      return await processCRISPRQuery(message, query.parameters, fileAnalysis);
    case 'pcr':
      return await processPCRQuery(message, query.parameters, fileAnalysis);
    case 'codon_optimization':
      return await processCodonOptimizationQuery(message, query.parameters, fileAnalysis);
    case 'sequence_analysis':
      return await processSequenceAnalysisQuery(message, fileAnalysis);
    default:
      return await processGeneralQuery(message, fileAnalysis);
  }
}

function detectTone(message: string): 'casual' | 'formal' | 'frustrated' | 'urgent' {
  const lowerMessage = message.toLowerCase();
  
  // Analyze message characteristics
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2702}-\u{27B0}]|[\u{1F000}-\u{1F251}]/u.test(message);
  const hasPunctuation = /[!?]{2,}/.test(message);
  const isShortGreeting = /^(hi|hey|hello|sup|yo)\b/i.test(message);
  const hasInformalWords = /(gonna|wanna|gotta|kinda|sorta|yeah|nah|cool|awesome|great)\b/i.test(message);
  const hasPersonalQuestion = /(how are you|what'?s up|how'?s it going)\b/i.test(message);
  
  // Frustrated indicators with context
  if ((lowerMessage.includes('error') && hasPunctuation) || 
      lowerMessage.includes('broken') || 
      lowerMessage.includes('not working') || 
      (lowerMessage.includes('help') && hasPunctuation) ||
      lowerMessage.includes('stuck') || 
      lowerMessage.includes('frustrated') ||
      /\b(terrible|awful|horrible|bad|worse|worst)\b/i.test(lowerMessage)) {
    return 'frustrated';
  }
  
  // Urgent indicators with context
  if (lowerMessage.includes('urgent') || 
      lowerMessage.includes('asap') || 
      lowerMessage.includes('immediately') || 
      lowerMessage.includes('quick') ||
      lowerMessage.includes('deadline') || 
      lowerMessage.includes('emergency') ||
      (hasPunctuation && /\b(need|must|have to)\b/i.test(lowerMessage))) {
    return 'urgent';
  }
  
  // Casual indicators with more natural language processing
  if (isShortGreeting || 
      hasEmoji || 
      hasInformalWords ||
      hasPersonalQuestion ||
      message.split(' ').length <= 4 || // Very short messages are often casual
      /^(thanks|thank you|thx|ty)\b/i.test(lowerMessage)) {
    return 'casual';
  }
  
  // Check for formal indicators
  const hasTechnicalTerms = /\b(analyze|research|study|investigate|examine|determine|evaluate|assess)\b/i.test(message);
  const hasComplexStructure = message.split(' ').length > 10 && !hasInformalWords;
  const hasProfessionalTone = /\b(please|kindly|would you|could you|appreciate|request)\b/i.test(message);
  
  return (hasTechnicalTerms || hasComplexStructure || hasProfessionalTone) ? 'formal' : 'casual';
}

interface IntentPattern {
  pattern: RegExp;
  type: BioinformaticsQuery['type'];
  confidence: number;
  extractParams: (match: RegExpMatchArray, message: string) => Record<string, any>;
}

const intentPatterns: IntentPattern[] = [
  {
    pattern: /how\s+(?:do|can|would|should)\s+I\s+(?:make|create|design|build|implement|write|code)/i,
    type: 'general',
    confidence: 0.9,
    extractParams: () => ({ isHowTo: true })
  },
  {
    pattern: /what(?:\s+is|\s+are|\s+does|\s+do)?\s+(?:the|a|an)?\s+(?:difference|differences)\s+between\s+(.+?)\s+and\s+(.+?)(?:\?|$)/i,
    type: 'general',
    confidence: 0.85,
    extractParams: (match) => ({ 
      isComparison: true,
      terms: [match[1].trim(), match[2].trim()]
    })
  },
  {
    pattern: /(?:explain|describe|tell\s+me\s+about|what\s+is|what\s+are)\s+(.+?)(?:\?|$)/i,
    type: 'general',
    confidence: 0.8,
    extractParams: (match) => ({ 
      isDefinitionQuery: true,
      topic: match[1].trim()
    })
  },
  {
    pattern: /(?:optimize|improve|enhance|adjust)\s+(?:the\s+)?(?:codon|expression|sequence)/i,
    type: 'codon_optimization',
    confidence: 0.9,
    extractParams: (_, message) => ({ 
      organism: extractOrganism(message) || 'ecoli',
      sequence: extractSequence(message)
    })
  },
  {
    pattern: /(?:design|create|generate|find)\s+(?:crispr|guide\s*rna|grna|cas9)/i,
    type: 'crispr',
    confidence: 0.95,
    extractParams: (_, message) => ({
      target: extractGene(message) || extractSequence(message)
    })
  },
  {
    pattern: /(?:design|create|generate|find)\s+(?:primers?|pcr|amplification)/i,
    type: 'pcr',
    confidence: 0.95,
    extractParams: (_, message) => ({
      template: extractSequence(message),
      gene: extractGene(message)
    })
  }
];

function parseQuery(message: string, context: ConversationContext): BioinformaticsQuery {
  const lowerMessage = message.toLowerCase();
  
  // Initialize query with enhanced structure
  const baseQuery: BioinformaticsQuery = {
    type: 'general',
    intent: {
      primary: '',
      confidence: 0
    },
    entities: {
      sequences: extractSequences(message),
      genes: extractGenes(message),
      organisms: extractOrganisms(message),
      terms: extractBioTerms(message)
    },
    context: context,
    parameters: {}
  };
  
  // Check for greetings first
  if (isGreeting(lowerMessage)) {
    baseQuery.type = 'general';
    baseQuery.intent = {
      primary: 'greeting',
      confidence: 0.95
    };
    baseQuery.parameters = { 
      isGreeting: true,
      timeOfDay: getTimeOfDay(),
      returningUser: context.turnCount > 1
    };
    return baseQuery;
  }

  // Check for help/assistance requests
  if (/help|assist|support|guide/i.test(lowerMessage)) {
    baseQuery.intent = {
      primary: 'help',
      confidence: 0.9
    };
    baseQuery.parameters.helpType = detectHelpType(message);
  }

  // Match against intent patterns
  for (const pattern of intentPatterns) {
    const match = message.match(pattern.pattern);
    if (match) {
      return {
        ...baseQuery,
        type: pattern.type,
        intent: {
          primary: match[0],
          confidence: pattern.confidence
        },
        parameters: pattern.extractParams(match, message)
      };
    }
  }

  // Check for file analysis requests
  const fileAnalysisPattern = /(?:analyze|study|examine|process|check|review|investigate|look\s+at)\s+(?:my|the|this)?\s+(?:file|sequence|data|results)/i;
  if (fileAnalysisPattern.test(message)) {
    return {
      ...baseQuery,
      type: 'sequence_analysis',
      intent: {
        primary: 'file_analysis',
        confidence: 0.9
      },
      parameters: {
        analysisType: detectAnalysisType(message),
        fileType: detectFileType(message)
      }
    };
  }

  // Fallback: analyze sentence structure for implicit intents
  const sentenceType = analyzeSentenceStructure(message);
  switch (sentenceType) {
    case 'question':
      baseQuery.parameters.isQuestion = true;
      baseQuery.parameters.questionType = detectQuestionType(message);
      break;
    case 'command':
      baseQuery.parameters.isCommand = true;
      baseQuery.parameters.commandType = detectCommandType(message);
      break;
    case 'statement':
      baseQuery.parameters.isStatement = true;
      baseQuery.parameters.topicCategory = detectTopicCategory(message);
      break;
  }

  // Update confidence based on entity matches
  baseQuery.intent.confidence = calculateConfidence(baseQuery, message);

  return baseQuery;
}

async function processCRISPRQuery(message: string, parameters: any, fileAnalysis?: BioFileAnalysis): Promise<string> {
  const targetGene = parameters.target || 'BRCA1';
  
  // Simulate CRISPR guide design
  const exampleSequence = "GCAGCTGAGCTTAGCTGTGCAGG"; // Example target sequence
  const guides = generateCRISPRGuides(exampleSequence);
  
  let response = `I'll design CRISPR guide RNAs for ${targetGene}. Here are the top guide RNA candidates:\n\n`;
  
  guides.slice(0, 3).forEach((guide, index) => {
    response += `**Guide RNA #${index + 1}**\n`;
    response += `Sequence: 5'-${guide.sequence}-3' (NGG)\n`;
    response += `Score: ${guide.score}/100\n`;
    response += `Off-targets: ${guide.offTargets} potential\n`;
    response += `Position: ${guide.position}\n\n`;
  });
  
  response += `\`\`\`python\n# CRISPR Guide RNA Design Script\nimport crispr_tools as ct\n\n`;
  response += `# Target sequence\ntarget_seq = "${exampleSequence}"\n\n`;
  response += `# Design guide RNAs\nguides = ct.design_guides(\n    target_seq, \n    pam_type="NGG",\n    scoring_method="doench2016"\n)\n\n`;
  response += `# Analyze off-targets\nfor guide in guides[:3]:\n    off_targets = ct.find_off_targets(\n        guide.sequence,\n        genome="hg38",\n        mismatch_threshold=3\n    )\n    print(f"Guide: {guide.sequence}")\n    print(f"Score: {guide.score}")\n    print(f"Off-targets: {len(off_targets)}")\n\`\`\`\n\n`;
  
  if (fileAnalysis) {
    response += `I've also analyzed your uploaded ${fileAnalysis.metadata?.format} file. `;
    if (fileAnalysis.type === 'sequence') {
      response += `It contains ${fileAnalysis.sequenceCount} sequence(s) with a total length of ${fileAnalysis.totalLength} bp.`;
    }
  }
  
  return response;
}

async function processPCRQuery(message: string, parameters: any, fileAnalysis?: BioFileAnalysis): Promise<string> {
  const forwardPrimer = "GTGCCAGCATCTGTTGTTTGC";
  const reversePrimer = "CACCAGGTGCTCATTGATAG";
  const template = "GTGCCAGCATCTGTTGTTTGCCCCTCCCCCAGGTGCTCATTGATAG";
  
  const pcrResult = simulatePCR(forwardPrimer, reversePrimer, template);
  
  let response = "I'll simulate PCR amplification for you.\n\n";
  response += `**PCR Simulation Results**\n`;
  response += `Forward Primer Tm: ${pcrResult.tm.forward}°C\n`;
  response += `Reverse Primer Tm: ${pcrResult.tm.reverse}°C\n`;
  response += `Amplification: ${pcrResult.success ? 'Successful' : 'Failed'}\n`;
  
  if (pcrResult.success) {
    response += `Product Length: ${pcrResult.productLength} bp\n`;
  }
  
  if (pcrResult.warnings.length > 0) {
    response += `\n**Warnings:**\n`;
    pcrResult.warnings.forEach(warning => {
      response += `- ${warning}\n`;
    });
  }
  
  response += `\n\`\`\`python\n# PCR Simulation Script\nfrom Bio.SeqUtils import MeltingTemp as mt\nfrom Bio.Seq import Seq\n\n`;
  response += `forward_primer = "${forwardPrimer}"\nreverse_primer = "${reversePrimer}"\n\n`;
  response += `# Calculate melting temperatures\ntm_forward = mt.Tm_NN(Seq(forward_primer))\ntm_reverse = mt.Tm_NN(Seq(reverse_primer))\n\n`;
  response += `print(f"Forward Tm: {tm_forward:.1f}°C")\nprint(f"Reverse Tm: {tm_reverse:.1f}°C")\n\`\`\`\n`;
  
  return response;
}

async function processCodonOptimizationQuery(message: string, parameters: any, fileAnalysis?: BioFileAnalysis): Promise<string> {
  const organism = parameters.organism;
  const exampleSequence = "ATGAAATTTGGCACCCGGAAG"; // Example coding sequence
  
  const optimization = optimizeCodonUsage(exampleSequence, organism);
  
  let response = `I'll optimize codon usage for ${organism === 'ecoli' ? 'E. coli' : organism} expression.\n\n`;
  response += `**Codon Optimization Results**\n`;
  response += `Original sequence: ${exampleSequence}\n`;
  response += `Optimized sequence: ${optimization.optimizedSequence}\n`;
  response += `Improvements made: ${optimization.improvements} codon changes\n\n`;
  
  response += `\`\`\`python\n# Codon Optimization Script\nfrom codonoptimization import optimize_sequence\n\n`;
  response += `original_seq = "${exampleSequence}"\n`;
  response += `optimized_seq = optimize_sequence(\n    original_seq,\n    organism="${organism}",\n    avoid_patterns=["GAATTC", "AAGCTT"]  # EcoRI, HindIII sites\n)\n\n`;
  response += `print(f"Original:  {original_seq}")\nprint(f"Optimized: {optimized_seq}")\n\`\`\`\n`;
  
  if (fileAnalysis && fileAnalysis.type === 'sequence') {
    response += `\nI can also optimize the sequences from your uploaded file. `;
    response += `Your file contains ${fileAnalysis.sequenceCount} sequence(s) that could be optimized for ${organism} expression.`;
  }
  
  return response;
}

async function processSequenceAnalysisQuery(message: string, fileAnalysis?: BioFileAnalysis): Promise<string> {
  if (!fileAnalysis) {
    return "I'd be happy to analyze your sequences! Please upload a FASTA, GenBank, or PDB file and I'll provide detailed analysis including:\n\n- Sequence composition and statistics\n- GC content analysis\n- Feature annotation (for GenBank files)\n- Structural information (for PDB files)\n- Potential restriction sites\n- Codon usage patterns\n\nWhat specific analysis would you like me to perform?";
  }
  
  let response = `I've analyzed your ${fileAnalysis.metadata?.format} file:\n\n`;
  
  if (fileAnalysis.type === 'sequence') {
    response += `**Sequence Statistics:**\n`;
    response += `- Number of sequences: ${fileAnalysis.sequenceCount}\n`;
    response += `- Total length: ${fileAnalysis.totalLength?.toLocaleString()} bp\n`;
    if (fileAnalysis.gcContent) {
      response += `- GC content: ${fileAnalysis.gcContent}%\n`;
    }
    if (fileAnalysis.metadata?.averageLength) {
      response += `- Average length: ${fileAnalysis.metadata.averageLength} bp\n`;
    }
    
    if (fileAnalysis.features && fileAnalysis.features.length > 0) {
      response += `\n**Features Found:**\n`;
      fileAnalysis.features.slice(0, 5).forEach(feature => {
        response += `- ${feature.type} at ${feature.location}: ${feature.description}\n`;
      });
    }
  } else if (fileAnalysis.type === 'structure') {
    response += `**Structure Information:**\n`;
    response += `- Atom count: ${fileAnalysis.metadata?.atomCount}\n`;
    response += `- Chain count: ${fileAnalysis.metadata?.chainCount}\n`;
    response += `- Residue count: ${fileAnalysis.metadata?.residueCount}\n`;
  } else if (fileAnalysis.type === 'data') {
    response += `**Data Summary:**\n`;
    response += `- Rows: ${fileAnalysis.metadata?.rowCount}\n`;
    response += `- Columns: ${fileAnalysis.metadata?.columnCount}\n`;
    if (fileAnalysis.metadata?.headers) {
      response += `- Headers: ${fileAnalysis.metadata.headers.slice(0, 5).join(', ')}\n`;
    }
  }
  
  response += `\nWhat specific analysis would you like me to perform on this data?`;
  
  return response;
}

async function processGeneralQuery(message: string, fileAnalysis?: BioFileAnalysis): Promise<string> {
  // Handle general bioinformatics questions
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('protein') && lowerMessage.includes('structure')) {
    return "I can help you analyze protein structures! You can:\n\n- Upload PDB files for 3D visualization\n- Analyze protein sequences for secondary structure prediction\n- Compare protein structures\n- Identify binding sites and functional domains\n\nWould you like me to show you a 3D visualization of a specific protein, or do you have a PDB file to analyze?";
  }
  
  if (lowerMessage.includes('blast') || lowerMessage.includes('homology')) {
    return "For sequence similarity searches, I can help you:\n\n- Format sequences for BLAST searches\n- Interpret BLAST results\n- Find homologous sequences\n- Analyze phylogenetic relationships\n\nPlease upload your query sequence in FASTA format, and I'll help you design an effective search strategy.";
  }
  
  if (lowerMessage.includes('molecular') && lowerMessage.includes('cloning')) {
    return "I can assist with molecular cloning workflows:\n\n- Restriction enzyme analysis\n- Vector selection\n- Insert design and optimization\n- Gibson Assembly planning\n- Golden Gate cloning strategies\n\nWhat specific cloning project are you working on? Please share your target sequence or vector information.";
  }
  
  // Default response for general queries - now powered by BioScriptor
  return `I'm BioScriptor, your fault-tolerant AI bioinformatics assistant! I can help you with:

**Sequence Analysis:**
- DNA/RNA/protein sequence analysis
- FASTA and GenBank file processing
- GC content and composition analysis

**Molecular Biology Tools:**
- CRISPR guide RNA design
- PCR primer design and simulation
- Codon optimization for expression systems
- Restriction enzyme analysis

**Structural Biology:**
- 3D protein structure visualization
- PDB file analysis
- Structure-function relationships

**File Support:**
- FASTA (.fasta)
- GenBank (.gb)
- Protein Data Bank (.pdb)
- CSV data files (.csv)

What would you like to explore today? You can ask me questions like:
- "Design CRISPR guides for BRCA1"
- "Optimize this sequence for E. coli expression"
- "Analyze the protein structure in PDB 1ABC"
- "What's the GC content of my sequences?"`;
}

// Helper functions
function extractSequence(message: string): string | null {
  const seqPattern = /[ATGC]{10,}/gi;
  const match = message.match(seqPattern);
  return match ? match[0] : null;
}

function extractGenes(message: string): string[] {
  const genePatterns = [
    /\b([A-Z]{2,}[0-9]*)\b/g,  // Standard gene names (e.g., BRCA1)
    /\b([a-z]{3}[A-Z])\b/g,    // Bacterial genes (e.g., lacZ)
    /\b(p[0-9]{2,})\b/g        // Protein names (e.g., p53)
  ];
  
  const genes = new Set<string>();
  genePatterns.forEach(pattern => {
    const matches = message.match(pattern) || [];
    matches.forEach(match => genes.add(match));
  });
  
  return Array.from(genes);
}

function extractSequences(message: string): string[] {
  const sequences = new Set<string>();
  
  // DNA/RNA sequences
  const dnaPattern = /[ATCG]{10,}/gi;
  const rnaPattern = /[AUCG]{10,}/gi;
  
  [dnaPattern, rnaPattern].forEach(pattern => {
    const matches = message.match(pattern) || [];
    matches.forEach(match => sequences.add(match.toUpperCase()));
  });
  
  return Array.from(sequences);
}

function extractOrganisms(message: string): string[] {
  const organisms = new Set<string>();
  const patterns = [
    /\b(?:E\.?\s*coli|Escherichia\s+coli)\b/i,
    /\b(?:S\.?\s*cerevisiae|Saccharomyces\s+cerevisiae)\b/i,
    /\bHomo\s+sapiens\b/i,
    /\b(?:human|bacterial|mammalian|yeast)\s+(?:cells?|organism|species)\b/i
  ];
  
  patterns.forEach(pattern => {
    const matches = message.match(pattern) || [];
    matches.forEach(match => organisms.add(match.toLowerCase()));
  });
  
  return Array.from(organisms);
}

function extractBioTerms(message: string): string[] {
  const terms = new Set<string>();
  
  // Common biological terms and techniques
  const bioTermPattern = /\b(pcr|crispr|sequencing|cloning|expression|protein|enzyme|gene|genome|plasmid|vector|primer|probe|assay|antibody|mutation|variant|pathway|regulatory|transcription|translation)\b/gi;
  const matches = message.match(bioTermPattern) || [];
  matches.forEach(match => terms.add(match.toLowerCase()));
  
  return Array.from(terms);
}

function analyzeSentenceStructure(message: string): 'question' | 'command' | 'statement' {
  // Question patterns
  if (/^(?:what|who|where|when|why|how|which|can|could|would|should|is|are|do|does|did)\b/i.test(message) || 
      message.endsWith('?')) {
    return 'question';
  }
  
  // Command patterns
  if (/^(?:analyze|find|show|tell|explain|help|design|create|optimize|run|execute|perform|calculate|determine)\b/i.test(message)) {
    return 'command';
  }
  
  return 'statement';
}

function detectQuestionType(message: string): string {
  if (/^what\s+is|what\s+are/.test(message)) return 'definition';
  if (/^how\s+(?:do|can|should)/.test(message)) return 'procedure';
  if (/^why/.test(message)) return 'explanation';
  if (/difference|compare|versus|vs/.test(message)) return 'comparison';
  if (/^when|^where/.test(message)) return 'contextual';
  return 'other';
}

function detectCommandType(message: string): string {
  if (/analyze|examine|study/.test(message)) return 'analysis';
  if (/create|generate|design|make/.test(message)) return 'creation';
  if (/optimize|improve|enhance/.test(message)) return 'optimization';
  if (/show|display|visualize/.test(message)) return 'visualization';
  if (/explain|describe|tell/.test(message)) return 'explanation';
  return 'other';
}

function detectTopicCategory(message: string): string {
  if (/dna|rna|gene|genome|sequence/.test(message)) return 'sequence';
  if (/protein|enzyme|structure|fold/.test(message)) return 'protein';
  if (/pathway|network|interaction|regulation/.test(message)) return 'systems';
  if (/method|protocol|procedure|technique/.test(message)) return 'methodology';
  if (/result|data|analysis|finding/.test(message)) return 'results';
  return 'general';
}

function detectAnalysisType(message: string): string[] {
  const analysisTypes = [];
  if (/composition|content|statistics/.test(message)) analysisTypes.push('composition');
  if (/structure|fold|domain/.test(message)) analysisTypes.push('structure');
  if (/compare|alignment|homology/.test(message)) analysisTypes.push('comparison');
  if (/function|predict|annotation/.test(message)) analysisTypes.push('function');
  if (/quality|validate|check/.test(message)) analysisTypes.push('quality');
  return analysisTypes.length > 0 ? analysisTypes : ['general'];
}

function detectFileType(message: string): string {
  if (/fasta|fa|seq/.test(message)) return 'fasta';
  if (/genbank|gb|gbk/.test(message)) return 'genbank';
  if (/pdb|structure|model/.test(message)) return 'pdb';
  if (/csv|tsv|table|excel/.test(message)) return 'tabular';
  return 'unknown';
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function detectHelpType(message: string): string {
  if (/error|problem|issue|bug|wrong|incorrect|fail/.test(message)) return 'troubleshooting';
  if (/how\s+(?:to|do|can|should)/.test(message)) return 'instruction';
  if (/explain|understand|mean|definition/.test(message)) return 'explanation';
  if (/recommend|suggest|advice|best/.test(message)) return 'recommendation';
  return 'general';
}

function calculateConfidence(query: BioinformaticsQuery, message: string): number {
  let confidence = 0.5; // Base confidence
  
  // Increase confidence based on entity matches
  if (query.entities.sequences?.length > 0) confidence += 0.1;
  if (query.entities.genes?.length > 0) confidence += 0.1;
  if (query.entities.organisms?.length > 0) confidence += 0.1;
  if (query.entities.terms?.length > 0) confidence += 0.1;
  
  // Adjust based on message clarity
  if (analyzeSentenceStructure(message) !== 'statement') confidence += 0.1;
  if (message.length > 10 && message.length < 200) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

function extractGene(message: string): string | null {
  const genes = extractGenes(message);
  return genes.length > 0 ? genes[0] : null;
}

function preprocessInput(message: string): ProcessedInput {
  // Text normalization
  const normalizedText = message
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]/g, ' $& ') // Add spaces around punctuation for better tokenization
    .trim();

  // Simple tokenization
  const tokens = normalizedText.split(/\s+/);

  // Basic spell check (example implementation)
  const commonBioTerms = new Set(['dna', 'rna', 'crispr', 'pcr', 'protein']);
  const spellCorrected = tokens.some(token => {
    const lower = token.toLowerCase();
    return lower.length > 2 && 
           !commonBioTerms.has(lower) &&
           /[^a-zA-Z]/.test(token);
  });

  return {
    normalizedText,
    tokens,
    spellCorrected,
    language: 'en' // Default to English, could be enhanced with language detection
  };
}

function detectUserSkillLevel(message: string, context: ConversationContext): 'beginner' | 'intermediate' | 'advanced' {
  const technicalTerms = new Set([
    'primer', 'amplification', 'plasmid', 'vector', 'restriction', 'enzyme',
    'ligase', 'polymerase', 'nucleotide', 'codon', 'translation'
  ]);
  
  const advancedTerms = new Set([
    'oligonucleotide', 'homologous', 'recombination', 'transformation',
    'transfection', 'expression', 'transcription', 'translation'
  ]);

  const tokens = message.toLowerCase().split(/\s+/);
  const technicalTermCount = tokens.filter(t => technicalTerms.has(t)).length;
  const advancedTermCount = tokens.filter(t => advancedTerms.has(t)).length;

  if (advancedTermCount >= 2) return 'advanced';
  if (technicalTermCount >= 2) return 'intermediate';
  return 'beginner';
}

function extractOrganism(message: string): 'ecoli' | 'yeast' | 'human' | null {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('e.coli') || lowerMessage.includes('ecoli') || lowerMessage.includes('coli')) {
    return 'ecoli';
  }
  if (lowerMessage.includes('yeast') || lowerMessage.includes('saccharomyces')) {
    return 'yeast';
  }
  if (lowerMessage.includes('human') || lowerMessage.includes('mammalian')) {
    return 'human';
  }
  return null;
}

function isGreeting(message: string): boolean {
  const greetings = [
    'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 
    'good evening', 'howdy', 'what\'s up', 'sup'
  ];
  return greetings.some(greeting => message.toLowerCase().includes(greeting));
}

function extractTopic(message: string): string {
  // Remove question words and get the main topic
  const cleaned = message.toLowerCase()
    .replace(/what\s+is|how\s+does|explain|tell\s+me\s+about/g, '')
    .trim();
  return cleaned;
}

function getPersonalizedResponse(
  tone: string, 
  isGreeting: boolean, 
  context: ConversationContext
): string {
  let response = "";
  
  if (isGreeting) {
    // Personalized greeting based on tone and context
    switch(tone) {
      case 'casual':
        response = context.turnCount === 1 
          ? "Hey there! 👋 I'm BioScriptor, your friendly bio-buddy! "
          : "Hey again! 👋 ";
        break;
      case 'formal':
        response = context.turnCount === 1
          ? "Hello! I'm BioScriptor, your bioinformatics assistant. "
          : "Welcome back! ";
        break;
      case 'frustrated':
        response = "Hi! Don't worry, I'm here to help. Let's solve this together. ";
        break;
      case 'urgent':
        response = "Hello! I'll help you right away. ";
        break;
      default:
        response = "Hello! ";
    }

    // Add context-aware elements
    if (context.turnCount > 1 && context.lastQuery) {
      response += `Still working on ${context.lastQuery.type}? `;
    }

    // Add skill level appropriate suggestions
    if (context.userData?.skillLevel === 'beginner') {
      response += "Feel free to ask me to explain any terms you're not familiar with! ";
    }
  }

  return response;
}
