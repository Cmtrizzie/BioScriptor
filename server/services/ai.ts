Enhanced the tone detection and user skill level detection functions to better adapt to user's conversational style.
```

``` javascript
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

// Initialize the fault-tolerant AI system with proper API keys
const aiConfig: ProviderConfig = {
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },
  together: {
    apiKey: process.env.TOGETHER_API_KEY || '',
    endpoint: 'https://api.together.xyz/v1/chat/completions'
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions'
  },
  cohere: {
    apiKey: process.env.COHERE_API_KEY || '',
    endpoint: 'https://api.cohere.ai/v1/generate'
  },
  ollama: {
    endpoint: process.env.OLLAMA_ENDPOINT || 'http://0.0.0.0:11434',
    model: 'mistral'
  }
};

const faultTolerantAI = new FaultTolerantAI(aiConfig);

// Helper functions for conversation memory
function extractTopics(text: string): string[] {
  // Basic topic extraction - in production, use a proper NLP library
  const topics = new Set<string>();

  // Match scientific terms and concepts
  const scientificTerms = text.match(/(?:DNA|RNA|protein|gene|genome|sequence|CRISPR|PCR|plasmid|enzyme|mutation|cell|bacteria|virus|analysis|alignment|primer|cloning|expression|vector|restriction|digest|ligation|transformation|amplification|purification|assay|protocol|experiment|sample|data|results|method|technique|procedure|pipeline|workflow|bioinformatics|molecular|biology|biochemistry|genetics|genomics|proteomics|sequencing|synthesis|structure|function|pathway|mechanism|system|model|theory|hypothesis|conclusion|finding|evidence|research|study|paper|publication|database|tool|software|algorithm|parameter|condition|control|variable|factor|effect|impact|interaction|relationship|correlation|causation|significance|quality|quantity|measurement|calculation|prediction|validation|verification|optimization|improvement|enhancement|modification|regulation|inhibition|activation|binding|specificity|efficiency|accuracy|precision|reliability|reproducibility|standardization|normalization|calibration|baseline|threshold|cutoff|criteria|requirement|specification|standard|guideline|recommendation|suggestion|approach|strategy|plan|design|implementation|execution|analysis|evaluation|assessment|review|interpretation|explanation|understanding|knowledge|expertise|skill|experience|training|education|learning|development|advancement|progress|innovation|discovery|breakthrough|achievement|success|failure|problem|challenge|issue|concern|limitation|constraint|restriction|obstacle|barrier|difficulty|complexity|uncertainty|variability|heterogeneity|diversity|similarity|difference|comparison|contrast|alternative|option|choice|decision|selection|priority|preference|requirement|demand|need|goal|objective|purpose|aim|target|scope|scale|level|degree|extent|range|limit|boundary|context|environment|condition|situation|case|example|instance|scenario|model|framework|structure|organization|composition|configuration|arrangement|pattern|trend|tendency|behavior|characteristic|property|attribute|feature|aspect|element|component|part|unit|module|section|segment|phase|stage|step|task|action|operation|process|procedure|method|technique|approach|strategy|tactic|policy|practice|standard|protocol|guideline|rule|regulation|requirement|specification|criterion|measure|metric|indicator|parameter|variable|factor|determinant|influence|effect|impact|consequence|result|outcome|output|product|deliverable|solution|resolution|answer|response|reaction|feedback|input|suggestion|recommendation|proposal|plan|design|scheme|system|platform|application|tool|utility|resource|asset|capability|functionality|performance|efficiency|effectiveness|quality|reliability|stability|robustness|flexibility|adaptability|scalability|extensibility|maintainability|sustainability|security|safety|integrity|consistency|accuracy|precision|resolution|sensitivity|specificity|reproducibility|repeatability|validation|verification|certification|compliance|conformance|adherence|alignment|coordination|collaboration|cooperation|integration|interaction|interface|connection|relationship|association|correlation|dependency|hierarchy|classification|categorization|organization|structure|architecture|topology|layout|arrangement|configuration|composition|constitution|formation|development|evolution|progression|advancement|improvement|enhancement|optimization|refinement|modification|adaptation|customization|personalization|specialization|generalization|abstraction|conceptualization|formalization|standardization|normalization|harmonization|unification|consolidation|integration|synthesis|analysis|evaluation|assessment|review|examination|investigation|exploration|study|research|experiment|test|trial|pilot|prototype|demonstration|proof|evidence|validation|verification|confirmation|authentication|authorization|approval|acceptance|rejection|selection|filtering|processing|transformation|conversion|translation|transfer|transmission|communication|exchange|sharing|distribution|allocation|assignment|delegation|management|administration|coordination|supervision|monitoring|tracking|logging|recording|documentation|specification|description|definition|identification|recognition|determination|estimation|calculation|computation|derivation|inference|deduction|induction|reasoning|logic|methodology|philosophy|theory|hypothesis|assumption|premise|condition|constraint|requirement|criterion|standard|benchmark|reference|baseline|threshold|limit|boundary|scope|context|environment|framework|infrastructure|foundation|basis|ground|support|platform|system|network|grid|cluster|array|collection|set|group|category|class|type|kind|form|format|structure|scheme|pattern|model|template|example|instance|case|scenario|situation|event|occurrence|phenomenon|observation|measurement|detection|sensing|monitoring|control|regulation|adjustment|calibration|tuning|optimization|enhancement|improvement|development|evolution|progression|advancement|innovation|creation|generation|production|construction|building|assembly|integration|combination|composition|organization|arrangement|configuration|modification|alteration|change|variation|deviation|difference|distinction|comparison|contrast|analysis|evaluation|assessment|review|critique|criticism|feedback|response|reaction|effect|impact|influence|consequence|result|outcome|output|product|solution|resolution|answer|conclusion|finding|discovery|revelation|insight|understanding|knowledge|wisdom|expertise|skill|ability|capability|competence|proficiency|mastery|excellence|quality|performance|efficiency|effectiveness|productivity|throughput|capacity|volume|scale|size|dimension|magnitude|quantity|amount|number|count|frequency|rate|speed|velocity|acceleration|momentum|force|power|energy|strength|intensity|level|degree|extent|range|scope|coverage|depth|breadth|width|height|length|distance|space|time|duration|period|interval|cycle|phase|stage|step|sequence|order|priority|importance|significance|relevance|pertinence|applicability|utility|usefulness|value|worth|merit|benefit|advantage|disadvantage|cost|price|expense|investment|return|profit|gain|loss|risk|hazard|danger|threat|vulnerability|weakness|strength|opportunity|possibility|potential|prospect|chance|probability|likelihood|certainty|uncertainty|ambiguity|clarity|precision|accuracy|correctness|validity|reliability|consistency|stability|robustness|resilience|durability|sustainability|maintainability|serviceability|availability|accessibility|usability|functionality|capability)/gi);

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
): Promise<string> {
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
    const query = parseQuery(sanitizedMessage, conversationCtx);

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
        allTopics: Array.from(conversationCtx.memory.topics),
        recentEntities: Array.from(conversationCtx.memory.entities).slice(-5),
        keyTerms: Array.from(conversationCtx.memory.keyTerms)
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
        - Recent Topics: ${Array.from(conversationCtx.memory.topics).slice(-3).join(', ')}

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