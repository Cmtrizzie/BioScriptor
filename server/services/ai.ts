// services/ai.ts
import { FaultTolerantAI, ProviderConfig, AIResponse } from './ai-providers';
import { BioFileAnalysis, generateCRISPRGuides, simulatePCR, optimizeCodonUsage } from './bioinformatics';
import { enhanceResponse } from './response-enhancer';
import { webSearchService, formatSearchResults } from './web-search';
import { tokenManager, TokenUsage } from './token-manager';

// ========== Type Definitions ==========
export type ChatMessageRole = 'user' | 'assistant' | 'system' | 'error';

export interface ChatMessage {
    id: string;
    role: ChatMessageRole;
    content: string;
    timestamp: number;
    status: 'pending' | 'complete' | 'error' | 'streaming';
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
        codeBlocks?: Array<{
            language: string;
            code: string;
            explanation?: string;
        }>;
        confidence: number;
        tokenUsage?: TokenUsage;
        conversationLimits?: {
            status: 'ok' | 'warning' | 'critical' | 'exceeded';
            tokensUsed: number;
            tokensRemaining: number;
            percentageUsed: number;
            shouldWarn: boolean;
            message?: string;
        };
    };
}

export interface ConversationContext {
    id: string;
    history: ChatMessage[];
    lastActive: number;
    memory: {
        topics: Set<string>;
        entities: Set<string>;
    };
    tokenLimits?: {
        status: 'ok' | 'warning' | 'critical' | 'exceeded';
        tokensUsed: number;
        shouldTruncate: boolean;
    };
}

export type BioinformaticsQueryType = 'crispr' | 'pcr' | 'codon_optimization' | 'sequence_analysis' | 'general';

export interface BioinformaticsQuery {
    type: BioinformaticsQueryType;
    content: string;
    fileAnalysis?: BioFileAnalysis;
}

// Enhanced AI response generation
async function getEnhancedAIResponse(
    query: string, 
    provider: string, 
    conversationContext: ConversationContext,
    history: ChatMessage[]
): Promise<ChatMessage> {
    const systemPrompt = buildEnhancedSystemPrompt(conversationContext, query);

    const conversationHistory = history.slice(-6).map(m => ({
        role: m.role,
        content: m.content
    }));

    conversationHistory.unshift({ role: 'system', content: systemPrompt });

    const aiResponse = await faultTolerantAI.processQuery(
        query,
        { 
            conversationContext,
            userIntent: detectUserIntent(query)
        },
        conversationContext.emotionalContext,
        conversationHistory,
        'pro' // Always use best tier for enhanced responses
    );

    return {
        id: generateUniqueId(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: Date.now(),
        status: 'complete',
        metadata: {
            provider,
            confidence: 0.85,
            processingTime: 1200
        }
    };
}

async function processBioQuery(
  query: string,
  userMessage: ChatMessage,
  conversationContext: ConversationContext,
  fileAnalysis?: BioFileAnalysis,
  userTier?: string
): Promise<ChatMessage> {
  const analysisType = detectQueryType(query);

  try {
    // Enhanced query with file analysis context
    let enhancedQuery = query;

    if (fileAnalysis) {
      let fileContext = `\n\n--- UPLOADED FILE ANALYSIS ---\n`;
      fileContext += `File Type: ${fileAnalysis.fileType}\n`;
      fileContext += `Content Type: ${fileAnalysis.sequenceType}\n`;

      if (fileAnalysis.documentContent) {
        fileContext += `\nDocument Content Analysis:\n${fileAnalysis.documentContent}\n`;

        // Add specific instructions for document analysis
        if (fileAnalysis.fileType === 'pdf') {
          fileContext += `\nThis is a PDF document. I have extracted the available text content above. Please analyze this content thoroughly and provide specific insights about what the document contains, its structure, key topics, and any notable information.\n`;
        } else if (fileAnalysis.fileType === 'docx') {
          fileContext += `\nThis is a Word document. I have extracted the formatted text content above. Please analyze this content thoroughly and provide specific insights about the document's content, structure, formatting, and key information.\n`;
        }
      }

      if (fileAnalysis.sequence && fileAnalysis.sequenceType !== 'document') {
        fileContext += `\nBiological Sequence Preview: ${fileAnalysis.sequence.substring(0, 200)}${fileAnalysis.sequence.length > 200 ? '...' : ''}\n`;
      }

      if (fileAnalysis.stats) {
        fileContext += `\nFile Statistics:\n`;
        fileContext += `- Size: ${fileAnalysis.stats.length} characters/bytes\n`;
        if (fileAnalysis.stats.wordCount) fileContext += `- Word Count: ${fileAnalysis.stats.wordCount}\n`;
        if (fileAnalysis.stats.lineCount) fileContext += `- Line Count: ${fileAnalysis.stats.lineCount}\n`;
      }

      if (fileAnalysis.gcContent) {
        fileContext += `- GC Content: ${fileAnalysis.gcContent.toFixed(2)}%\n`;
      }

      if (fileAnalysis.features && fileAnalysis.features.length > 0) {
        fileContext += `\nDetected Features: ${fileAnalysis.features.join(', ')}\n`;
      }

      fileContext += `\n--- END FILE ANALYSIS ---\n\n`;
      fileContext += `User Question About This File: ${query}\n\n`;
      fileContext += `Please analyze the uploaded file content and respond to the user's question. Focus on the actual content and provide specific insights based on what's in the file.`;

      enhancedQuery = fileContext;
    }

    // Use AI for all bioinformatics queries instead of templates
    const aiResponse = await faultTolerantAI.processQuery(
      enhancedQuery,
      { 
        conversationContext,
        userIntent: fileAnalysis ? 'file_analysis' : 'bioinformatics_query',
        fileAnalysis
      },
      conversationContext.emotionalContext || 'neutral',
      conversationContext.history.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      })),
      userTier || 'free'
    );

    return {
      id: generateUniqueId(),
      role: 'assistant',
      content: aiResponse.content,
      timestamp: Date.now(),
      status: 'complete',
      metadata: {
        confidence: 0.95,
        processingTime: Date.now() - Date.now(),
        analysisType,
        model: aiResponse.provider || 'groq',
        fileAnalysis: fileAnalysis ? {
          fileType: fileAnalysis.fileType,
          sequenceType: fileAnalysis.sequenceType,
          hasDocument: !!fileAnalysis.documentContent
        } : undefined
      }
    };
  } catch (error) {
    console.error('Error in processBioQuery:', error);
    return {
      id: generateUniqueId(),
      role: 'assistant',
      content: 'I encountered an error processing your bioinformatics query. Please try again.',
      timestamp: Date.now(),
      status: 'error',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0
      }
    };
  }
}

// Response comparison and selection
function selectBestResponse(
    responses: ChatMessage[], 
    originalQuery: string, 
    context: ConversationContext
): ChatMessage {
    if (responses.length === 0) {
        throw new Error('No responses to compare');
    }

    if (responses.length === 1) {
        return responses[0];
    }

    // Score responses based on multiple criteria
    const scoredResponses = responses.map(response => ({
        response,
        score: scoreResponse(response, originalQuery, context)
    }));

    // Return highest scoring response
    scoredResponses.sort((a, b) => b.score - a.score);
    return scoredResponses[0].response;
}

function scoreResponse(
    response: ChatMessage, 
    query: string, 
    context: ConversationContext
): number {
    let score = 0;
    const content = response.content.toLowerCase();
    const queryLower = query.toLowerCase();

    // Relevance scoring
    const queryTerms = queryLower.split(' ').filter(term => term.length > 3);
    const relevanceScore = queryTerms.reduce((acc, term) => {
        return acc + (content.includes(term) ? 1 : 0);
    }, 0) / queryTerms.length;
    score += relevanceScore * 40;

    // Length appropriateness
    const idealLength = context.preferredResponseStyle === 'concise' ? 200 : 
                       context.preferredResponseStyle === 'detailed' ? 800 : 400;
    const lengthScore = 1 - Math.abs(response.content.length - idealLength) / idealLength;
    score += Math.max(0, lengthScore) * 20;

    // Technical depth matching user expertise
    const technicalTerms = (content.match(/(?:algorithm|optimization|statistical|computational)/g) || []).length;
    const expertiseMatch = context.userExpertiseLevel === 'expert' ? 
        Math.min(technicalTerms / 3, 1) : 
        Math.max(0, 1 - technicalTerms / 5);
    score += expertiseMatch * 25;

    // Confidence from metadata
    score += (response.metadata?.confidence || 0.5) * 15;

    return score;
}

// Enhanced system prompt builder
function buildEnhancedSystemPrompt(context: ConversationContext, query: string): string {
    const queryType = classifyQuery(query);
    const programmingIntent = detectProgrammingIntent(query);

    let prompt = `You are BioScriptor, an AI assistant specializing in bioinformatics, programming, and project planning.

CORE CAPABILITIES:
🧬 **Bioinformatics**: DNA/RNA analysis, CRISPR design, PCR simulation, sequence alignment
💻 **Programming**: Python, R, JavaScript, TypeScript, Bash scripting, algorithm implementation
📋 **Planning**: Project architecture, workflow design, task breakdown, documentation

CRITICAL RULES:
- When web search results are provided, you MUST use ONLY that information
- NEVER provide generic template responses or pre-trained knowledge when search results exist
- Extract specific facts, dates, names, and numbers directly from search results
- If search results don't contain the answer, explicitly say so
- Be direct and factual, not vague or generic
- For sports/current events: Use exact information from search results
- For bioinformatics: Provide specific technical guidance with examples
- For programming: Write complete, working code with explanations
- For planning: Create structured, actionable plans with clear steps

PROGRAMMING EXPERTISE:
- Write clean, efficient, well-documented code
- Provide multiple implementation approaches when appropriate
- Include error handling and edge cases
- Explain code logic and best practices
- Suggest testing strategies and optimization techniques

PLANNING EXPERTISE:
- Break down complex projects into manageable tasks
- Create clear timelines and milestones
- Identify dependencies and potential bottlenecks
- Suggest appropriate tools and technologies
- Provide documentation templates and folder structures

NEVER say you cannot access real-time information when search results are provided.`;

    // Add specific context based on programming intent
    if (programmingIntent === 'coding') {
        prompt += `

CODING CONTEXT: The user wants to implement something. Focus on:
- Writing complete, functional code
- Including proper imports and dependencies  
- Adding comments explaining key logic
- Suggesting improvements or alternatives
- Providing usage examples`;
    } else if (programmingIntent === 'planning') {
        prompt += `

PLANNING CONTEXT: The user needs project planning help. Focus on:
- Creating structured task breakdowns
- Identifying required technologies and tools
- Estimating timelines and complexity
- Suggesting best practices and methodologies
- Providing templates for documentation`;
    } else if (programmingIntent === 'debugging') {
        prompt += `

DEBUGGING CONTEXT: The user has a problem to solve. Focus on:
- Identifying likely causes of the issue
- Providing step-by-step troubleshooting
- Suggesting debugging techniques
- Offering multiple solution approaches
- Explaining why the issue occurred`;
    }

    return prompt;
}

// Helper functions for bioinformatics response formatting
function formatCRISPRResults(guides: any[], context: ConversationContext): string {
    const style = context.preferredResponseStyle;
    let response = '';

    if (style === 'concise') {
        response = `CRISPR Analysis: Found ${guides.length} guide RNAs\n`;
        response += guides.slice(0, 3).map((g, i) => `${i+1}. ${g.sequence} (Score: ${g.score})`).join('\n');
    } else {
        response = `## CRISPR Guide RNA Analysis Results\n\n`;
        response += `I've analyzed your sequence and identified **${guides.length} potential guide RNAs**:\n\n`;
        guides.forEach((guide, i) => {
            response += `### Guide ${i+1}\n`;
            response += `- **Sequence:** \`${guide.sequence}\`\n`;
            response += `- **PAM:** ${guide.pam}\n`;
            response += `- **Score:** ${guide.score}/100\n`;
            response += `- **Off-targets:** ${guide.offTargets || 0}\n\n`;
        });
    }

    return response;
}

function formatPCRResults(results: any, context: ConversationContext): string {
    const style = context.preferredResponseStyle;

    if (style === 'concise') {
        return `PCR: ${results.annealingTemp}°C, ${results.productSize}bp, ${results.efficiency}%`;
    }

    return `## PCR Simulation Results\n\n` +
           `- **Optimal Annealing Temperature:** ${results.annealingTemp}°C\n` +
           `- **Product Size:** ${results.productSize} base pairs\n` +
           `- **Amplification Efficiency:** ${results.efficiency}%\n` +
           `- **Primer Specificity:** ${results.specificity || 'High'}\n\n` +
           `These conditions should give you optimal amplification with minimal off-target effects.`;
}

function formatOptimizationResults(optimized: any, context: ConversationContext): string {
    return `## Codon Optimization Results\n\n` +
           `- **Original CAI:** ${optimized.originalCAI.toFixed(3)}\n` +
           `- **Optimized CAI:** ${optimized.optimizedCAI.toFixed(3)}\n` +
           `- **Improvement:** ${((optimized.optimizedCAI - optimized.originalCAI) * 100).toFixed(1)}%\n` +
           `- **Host Organism:** ${optimized.host}\n\n` +
           `The optimized sequence should show improved expression levels in your target host.`;
}

function formatSequenceAnalysis(analysis: BioFileAnalysis, context: ConversationContext): string {
    let response = `## Sequence Analysis Summary\n\n`;
    response += `- **Length:** ${analysis.sequence.length} ${analysis.sequenceType === 'protein' ? 'amino acids' : 'nucleotides'}\n`;
    response += `- **Type:** ${analysis.sequenceType}\n`;
    if (analysis.gcContent !== undefined) {
        response += `- **GC Content:** ${analysis.gcContent.toFixed(1)}%\n`;
    }
    if (analysis.features) {
        response += `- **Features:** ${analysis.features.join(', ')}\n`;
    }
    return response;
}

// Removed template functions to prevent repetitive responses
// All responses now go through AI processing for natural, contextual answers

// ========== Conversation Manager ==========
class ConversationManager {
    private currentConversation: ConversationContext;

    constructor() {
        this.currentConversation = this.createNewConversation();
    }

    private createNewConversation(): ConversationContext {
        return {
            id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
            history: [],
            lastActive: Date.now(),
            memory: {
                topics: new Set<string>(),
                entities: new Set<string>()
            }
        };
    }

    getContext(): ConversationContext {
        // Reset conversation if inactive for more than 30 minutes
        if (Date.now() - this.currentConversation.lastActive > 30 * 60 * 1000) {
            this.currentConversation = this.createNewConversation();
        }
        return this.currentConversation;
    }

    addMessage(message: ChatMessage): void {
        const context = this.getContext();
        context.history.push(message);
        context.lastActive = Date.now();

        // Update conversation memory
        this.updateMemory(message.content);
    }

    private updateMemory(text: string): void {
        const context = this.getContext();

        // Extract and store topics
        const topics = this.extractTopics(text);
        topics.forEach(topic => context.memory.topics.add(topic));

        // Extract and store entities
        const entities = this.extractEntities(text);
        entities.forEach(entity => context.memory.entities.add(entity));
    }

    private extractTopics(text: string): string[] {
        // Ensure text is a string and not null/undefined
        if (!text || typeof text !== 'string') {
            return [];
        }

        try {
            const topics = new Set<string>();
            const scientificTerms = text.match(/(?:DNA|RNA|protein|gene|genome|sequence|CRISPR|PCR|plasmid|enzyme|mutation|cell|bacteria|virus|analysis|alignment)/gi) || [];
            scientificTerms.forEach(term => topics.add(term.toLowerCase()));
            return Array.from(topics);
        } catch (error) {
            console.warn('Error extracting topics:', error);
            return [];
        }
    }

    private extractEntities(text: string): string[] {
        // Ensure text is a string and not null/undefined
        if (!text || typeof text !== 'string') {
            return [];
        }

        try {
            const entities = new Set<string>();
            const sequenceIds = text.match(/[A-Z]{2}_\d+/g) || [];
            sequenceIds.forEach(id => entities.add(id));

            const geneNames = text.match(/[A-Z]{3,}\d*/g) || [];
            geneNames.forEach(gene => entities.add(gene));

            const speciesNames = text.match(/[A-Z][a-z]+ [a-z]+/g) || [];
            speciesNames.forEach(species => entities.add(species));

            return Array.from(entities);
        } catch (error) {
            console.warn('Error extracting entities:', error);
            return [];
        }
    }
}

// ========== AI Service ==========
// Initialize AI configuration with validation
const aiConfig: ProviderConfig = {
    groq: {
        apiKey: process.env.GROQ_API_KEY || '',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    },
    together: {
        apiKey: process.env.TOGETHER_API_KEY || '',
        endpoint: 'https://api.together.xyz/v1/chat/completions',
    },
    openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY || '',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    },
    cohere: {
        apiKey: process.env.COHERE_API_KEY || '',
        endpoint: 'https://api.cohere.ai/v1/generate',
    },
    ollama: {
        endpoint: process.env.OLLAMA_ENDPOINT || 'http://0.0.0.0:11434',
        model: 'mistral',
    },
};

// Log configuration status
console.log('AI Provider Configuration:');
console.log(`- Groq API Key: ${aiConfig.groq.apiKey ? 'Set' : 'Missing'}`);
console.log(`- Together API Key: ${aiConfig.together.apiKey ? 'Set' : 'Missing'}`);
console.log(`- OpenRouter API Key: ${aiConfig.openrouter.apiKey ? 'Set' : 'Missing'}`);
console.log(`- Cohere API Key: ${aiConfig.cohere.apiKey ? 'Set' : 'Missing'}`);



const faultTolerantAI = new FaultTolerantAI(aiConfig);
const conversationManager = new ConversationManager();

// Helper function to generate unique IDs
function generateUniqueId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// Helper function to build file analysis prompt
function buildFileAnalysisPrompt(query: string, fileAnalysis: BioFileAnalysis): string {
    let fileContext = `\n\n--- UPLOADED FILE ANALYSIS ---\n`;
    fileContext += `File Type: ${fileAnalysis.fileType}\n`;
    fileContext += `Content Type: ${fileAnalysis.sequenceType}\n`;

    if (fileAnalysis.documentContent) {
        fileContext += `\nDocument Content Analysis:\n${fileAnalysis.documentContent}\n`;

        // Add specific instructions for document analysis
        if (fileAnalysis.fileType === 'pdf') {
            fileContext += `\nThis is a PDF document. I have extracted the available text content above. Please analyze this content thoroughly and provide specific insights about what the document contains, its structure, key topics, and any notable information.\n`;
        } else if (fileAnalysis.fileType === 'docx') {
            fileContext += `\nThis is a Word document. I have extracted the formatted text content above. Please analyze this content thoroughly and provide specific insights about the document's content, structure, formatting, and key information.\n`;
        }
    }

    if (fileAnalysis.sequence && fileAnalysis.sequenceType !== 'document') {
        fileContext += `\nBiological Sequence Preview: ${fileAnalysis.sequence.substring(0, 200)}${fileAnalysis.sequence.length > 200 ? '...' : ''}\n`;
    }

    if (fileAnalysis.stats) {
        fileContext += `\nFile Statistics:\n`;
        fileContext += `- Size: ${fileAnalysis.stats.length} characters/bytes\n`;
        if (fileAnalysis.stats.wordCount) fileContext += `- Word Count: ${fileAnalysis.stats.wordCount}\n`;
        if (fileAnalysis.stats.lineCount) fileContext += `- Line Count: ${fileAnalysis.stats.lineCount}\n`;
    }

    if (fileAnalysis.gcContent) {
        fileContext += `- GC Content: ${fileAnalysis.gcContent.toFixed(2)}%\n`;
    }

    if (fileAnalysis.features && fileAnalysis.features.length > 0) {
        fileContext += `\nDetected Features: ${fileAnalysis.features.join(', ')}\n`;
    }

    fileContext += `\n--- END FILE ANALYSIS ---\n\n`;
    fileContext += `User Question About This File: ${query}\n\n`;
    fileContext += `Please analyze the uploaded file content and respond to the user's question. Focus on the actual content and provide specific insights based on what's in the file.`;

    return fileContext;
}

// Function to detect query type
function detectQueryType(text: string): BioinformaticsQueryType {
    const lowerText = text.toLowerCase();

    if (/(crispr|guide rna|grna|cas9)/.test(lowerText)) return 'crispr';
    if (/(pcr|polymerase chain reaction|primer)/.test(lowerText)) return 'pcr';
    if (/(codon optimization|codon usage|expression)/.test(lowerText)) return 'codon_optimization';
    if (/(sequence analysis|sequence alignment|blast|fasta|genbank)/.test(lowerText)) return 'sequence_analysis';

    return 'general';
}

// Enhanced query classification for programming tasks
function detectProgrammingIntent(text: string): 'coding' | 'planning' | 'debugging' | 'architecture' | 'learning' | 'none' {
    const lowerText = text.toLowerCase();

    // Coding patterns
    if (/(write|create|implement|build|code|script|function|class|algorithm|program)/.test(lowerText)) return 'coding';

    // Planning patterns  
    if (/(plan|design|architecture|structure|organize|workflow|pipeline|strategy|roadmap|approach)/.test(lowerText)) return 'planning';

    // Debugging patterns
    if (/(debug|fix|error|bug|issue|problem|troubleshoot|not working)/.test(lowerText)) return 'debugging';

    // Architecture patterns
    if (/(architecture|system design|database schema|api design|microservices|scalability)/.test(lowerText)) return 'architecture';

    // Learning patterns
    if (/(explain|how does|what is|teach me|learn|understand|tutorial)/.test(lowerText)) return 'learning';

    return 'none';
}

// Function to detect tone
function detectTone(text: string): string {
    const lowerText = text.toLowerCase();

    if (/(please|thank you|would you|kindly|appreciate)/.test(lowerText)) return 'polite';
    if (/(urgent|asap|quickly|immediately|emergency)/.test(lowerText)) return 'urgent';
    if (/(simple|brief|concise|summarize)/.test(lowerText)) return 'concise';
    if (/(😊|🙂|please|thank)/.test(lowerText)) return 'friendly';

    return 'professional';
}

// Function to get time-based greeting
function getTimeBasedGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

// Analyze conversation context and personality
function analyzeConversationContext(history: ChatMessage[]) {
    const recentMessages = history.slice(-10);
    const userMessages = recentMessages.filter(m => m.role === 'user');

    // Detect conversation patterns
    const hasGreetings = userMessages.some(m => 
        /(hello|hi|hey|good morning|good afternoon|good evening)/i.test(m.content)
    );

    const hasTechnicalQueries = userMessages.some(m => 
        /(sequence|dna|rna|protein|crispr|pcr|gene|genome)/i.test(m.content)
    );

    const hasGeneralQueries = userMessages.some(m => 
        /(trending|news|world|latest|current|what's happening)/i.test(m.content)
    );

    // Determine personality based on context
    let personality = {
        name: "Professional",
        tone: "professional and helpful",
        explanation_style: "clear, structured explanations with examples",
        expertise_level: "intermediate to advanced"
    };

    if (hasGreetings && !hasTechnicalQueries) {
        personality = {
            name: "Friendly",
            tone: "warm and welcoming",
            explanation_style: "conversational with easy-to-understand examples",
            expertise_level: "beginner-friendly"
        };
    } else if (hasTechnicalQueries) {
        personality = {
            name: "Expert",
            tone: "confident and precise",
            explanation_style: "detailed technical explanations with scientific rigor",
            expertise_level: "advanced"
        };
    } else if (hasGeneralQueries) {
        personality = {
            name: "Informative",
            tone: "engaging and informative",
            explanation_style: "structured with clear sections and follow-ups",
            expertise_level: "general audience"
        };
    }

    return {
        personality,
        memory: {
            userPreferences: {
                technicalLevel: personality.expertise_level,
                preferredStyle: personality.explanation_style
            }
        }
    };
}

// Detect user intent
function detectUserIntent(query: string): string {
    if (!query || typeof query !== 'string') {
        return 'general_query';
    }
    const lowerQuery = query.toLowerCase().trim();

    // Casual greetings and small talk - improved detection with typos and variations
    if (/(^(hi|hello|hey|yo|sup|wazup|wassup|what's up|howdy)$)|(^(hi|hello|hey|yo|sup|wazup|wassup|what's up|howdy)\s*[!.]*$)|greetings|how are you|how's it going|how are you doing|how r u|how u doing/i.test(lowerQuery)) {
        return 'casual_greeting';
    }

    // Casual conversation with variations and typos - EXPANDED
    if (/(thy|ur|u|r)\s+(doing|going|been|feeling|up to)|how are you doing today|what's new|how's your day|nice to meet you|ntin big|nothing much|not much|just chilling|just hanging|what about you|wbu|same here|cool|nice|awesome|great|good|fine|alright/i.test(lowerQuery)) {
        return 'casual_greeting';
    }

    // Weather/feeling/emotion talk
    if (/(weather|hot|cold|feeling|mood|today|good day|bad day|tired|excited)/i.test(lowerQuery)) {
        return 'small_talk';
    }

    // Formal greetings
    if (/(good morning|good afternoon|good evening)/i.test(lowerQuery)) {
        return 'greeting';
    }

    // Farewell patterns
    if (/(bye|goodbye|see you|thanks|thank you|that's all|later|peace)/i.test(lowerQuery)) {
        return 'farewell';
    }

    // General trending/news queries - expanded patterns
    if (/(trending|what's happening|news|current events|latest|worldwide|global|arsenal|football|soccer|sports|player|transfer)/i.test(lowerQuery)) {
        return 'general_trending';
    }

    // Technical questions
    if (/(how to|explain|what is|help me|analyze|design|optimize)/i.test(lowerQuery)) {
        return 'technical_question';
    }

    // Request for assistance
    if (/(can you|would you|please|need help|assist)/i.test(lowerQuery)) {
        return 'assistance_request';
    }

    return 'general_query';
}

// Enhanced conversation analysis
function analyzeConversation(history: ChatMessage[]): ConversationContext {
    const recentMessages = history.slice(-10);
    const userMessages = recentMessages.filter(m => m.role === 'user');

    return {
        id: generateUniqueId(),
        history: recentMessages,
        lastActive: Date.now(),
        memory: {
            topics: new Set(extractTopicsFromHistory(recentMessages)),
            entities: new Set()
        },
        topics: extractTopicsFromHistory(recentMessages),
        userExpertiseLevel: detectUserExpertiseLevel(userMessages),
        conversationFlow: detectConversationFlow(recentMessages),
        emotionalContext: analyzeEmotionalContext(userMessages),
        preferredResponseStyle: detectPreferredStyle(userMessages)
    };
}

function extractTopicsFromHistory(messages: ChatMessage[]): string[] {
    const topics = new Set<string>();
    messages.forEach(msg => {
        const bioTerms = msg.content.match(/(?:DNA|RNA|protein|gene|CRISPR|PCR|sequence|analysis)/gi) || [];
        bioTerms.forEach(term => topics.add(term.toLowerCase()));
    });
    return Array.from(topics);
}

function detectUserExpertiseLevel(userMessages: ChatMessage[]): 'beginner' | 'intermediate' | 'expert' {
    const expertTerms = userMessages.join(' ').match(/(?:algorithm|optimization|statistical|computational|bioinformatics)/gi) || [];
    const basicTerms = userMessages.join(' ').match(/(?:help|explain|what is|how to)/gi) || [];

    if (expertTerms.length > basicTerms.length) return 'expert';
    if (basicTerms.length > 2) return 'beginner';
    return 'intermediate';
}

function detectConversationFlow(messages: ChatMessage[]): 'exploratory' | 'task_focused' | 'learning' {
    const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0];
    if (!lastUserMsg) return 'exploratory';

    if (/(implement|create|generate|design)/i.test(lastUserMsg.content)) return 'task_focused';
    if (/(explain|understand|learn|teach)/i.test(lastUserMsg.content)) return 'learning';
    return 'exploratory';
}

function analyzeEmotionalContext(userMessages: ChatMessage[]): 'frustrated' | 'excited' | 'curious' | 'neutral' {
    const recentText = userMessages.slice(-3).map(m => m.content).join(' ');

    if (/(urgent|stuck|error|problem|help)/i.test(recentText)) return 'frustrated';
    if (/(amazing|awesome|love|excited|wow)/i.test(recentText)) return 'excited';
    if (/(why|how|what|curious|interesting)/i.test(recentText)) return 'curious';
    return 'neutral';
}

function detectPreferredStyle(userMessages: ChatMessage[]): 'detailed' | 'concise' | 'visual' {
    const recentText = userMessages.slice(-5).map(m => m.content).join(' ');

    if (/(detailed|thorough|comprehensive|in-depth)/i.test(recentText)) return 'detailed';
    if (/(quick|brief|short|simple)/i.test(recentText)) return 'concise';
    if (/(diagram|chart|visual|graph|show)/i.test(recentText)) return 'visual';
    return 'detailed';
}

// Enhanced query classification
function classifyQuery(query: string): 'bioinformatics' | 'programming' | 'planning' | 'debugging' | 'general' | 'creative' | 'technical' {
    const BIO_KEYWORDS = [
        'dna', 'rna', 'protein', 'sequence', 'genomic', 'alignment',
        'blast', 'crispr', 'pcr', 'bioinformatics', 'genome', 'variant',
        'analysis', 'fastq', 'bam', 'vcf', 'snp', 'gene', 'chromosome'
    ];

    const PROGRAMMING_KEYWORDS = [
        'code', 'script', 'function', 'algorithm', 'implementation', 'programming',
        'python', 'javascript', 'typescript', 'react', 'node', 'express',
        'html', 'css', 'api', 'database', 'sql', 'git', 'github',
        'class', 'method', 'variable', 'loop', 'condition', 'array',
        'object', 'json', 'async', 'await', 'promise', 'framework'
    ];

    const PLANNING_KEYWORDS = [
        'plan', 'design', 'architecture', 'structure', 'organize',
        'workflow', 'pipeline', 'strategy', 'roadmap', 'approach',
        'project', 'task', 'timeline', 'milestone', 'requirements',
        'documentation', 'folder structure', 'best practices'
    ];

    const DEBUGGING_KEYWORDS = [
        'debug', 'fix', 'error', 'bug', 'issue', 'problem',
        'troubleshoot', 'not working', 'broken', 'crash',
        'exception', 'stack trace', 'syntax error'
    ];

    const CREATIVE_KEYWORDS = ['story', 'creative', 'imagine', 'brainstorm', 'idea'];

    const lowerQuery = query.toLowerCase();

    if (BIO_KEYWORDS.some(kw => lowerQuery.includes(kw))) return 'bioinformatics';
    if (PROGRAMMING_KEYWORDS.some(kw => lowerQuery.includes(kw))) return 'programming';
    if (PLANNING_KEYWORDS.some(kw => lowerQuery.includes(kw))) return 'planning';
    if (DEBUGGING_KEYWORDS.some(kw => lowerQuery.includes(kw))) return 'debugging';
    if (CREATIVE_KEYWORDS.some(kw => lowerQuery.includes(kw))) return 'creative';

    return 'general';
}

// Optimal provider selection
function selectOptimalProvider(query: string, context: ConversationContext): string {
    const queryType = classifyQuery(query);

    // Bioinformatics queries need highest accuracy
    if (queryType === 'bioinformatics') {
        return 'groq'; // Most accurate for scientific content
    }

    // Programming queries need code-focused models
    if (queryType === 'programming') {
        return 'together'; // Best for code generation and explanation
    }

    // Planning queries need structured thinking
    if (queryType === 'planning') {
        return 'groq'; // Good for structured responses
    }

    // Debugging needs problem-solving capabilities
    if (queryType === 'debugging') {
        return 'openrouter'; // Good for analytical tasks
    }

    // Creative queries need most capable model
    if (queryType === 'creative') {
        return 'together'; // Best for creative responses
    }

    // Technical queries need balanced accuracy/speed
    if (queryType === 'technical') {
        return 'openrouter'; // Good balance
    }

    // General queries can use fastest
    return 'groq'; // Fast and reliable
}

// Main processing function - Enhanced
export const processQuery = async (
    query: string,
    fileAnalysis?: BioFileAnalysis,
    userTier: string = 'free',
    conversationId?: string,
    conversationHistory?: any[]
): Promise<ChatMessage> => {
    try {
        const context = conversationManager.getContext();
        const actualConversationId = conversationId || context.id;        // 1. Enhanced context analysis
        const conversationContext = analyzeConversation(context.history);

        // 2. Enhanced query classification
        const queryType = classifyQuery(query);
        const oldQueryType = detectQueryType(query); // Keep for bio processing
        const tone = detectTone(query);
        const userIntent = detectUserIntent(query);

    // Extract previous file analyses from conversation history
    let contextualFileAnalysis = fileAnalysis;
    if (!fileAnalysis && conversationHistory) {
      // Look for the most recent file analysis in conversation history
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const msg = conversationHistory[i];
        if (msg.metadata?.fileAnalysis) {
          contextualFileAnalysis = msg.metadata.fileAnalysis;
          break;
        }
      }
    }

    // Create the message
    const userMessage: ChatMessage = {
        id: generateUniqueId(),
        role: 'user',
        content: query,
        timestamp: Date.now(),
        status: 'complete',
        metadata: {
            tone,
            intent: userIntent,
            confidence: 1.0,
            queryType,
            conversationContext,
            fileAnalysis: contextualFileAnalysis
        }
    };

        // Add to conversation history
        conversationManager.addMessage(userMessage);

        // 2.5. Check conversation token limits before processing
        const tokenLimitCheck = tokenManager.checkConversationLimits(actualConversationId);

        // If exceeded, truncate history to maintain context
        if (tokenLimitCheck.shouldTruncate) {
            console.log(`🔄 Truncating conversation ${actualConversationId} - ${tokenLimitCheck.status} (${tokenLimitCheck.percentageUsed.toFixed(1)}% used)`);
            context.history = tokenManager.truncateConversationHistory(context.history, 30000); // Keep recent 30k tokens
        }

        // Update context with token limit info
        context.tokenLimits = {
            status: tokenLimitCheck.status,
            tokensUsed: tokenLimitCheck.tokensUsed,
            shouldTruncate: tokenLimitCheck.shouldTruncate
        };

        // 3. Intelligent routing - prioritize bioinformatics and file analysis
        if (queryType === 'bioinformatics' || (oldQueryType !== 'general' && fileAnalysis) || fileAnalysis) {
            // Use specialized bioinformatics processing for any file upload
            return await processBioQuery(query, userMessage, conversationContext, fileAnalysis, userTier);
        }

        // 4. Enhanced web search with more liberal detection and better caching
        let searchResults = '';
        const needsWebSearch = webSearchService.detectExplicitSearch(query) || 
                              webSearchService.detectImplicitTriggers(query);

        if (needsWebSearch) {
            console.log(`🌐 Performing web search for: "${query}"`);
            try {
                const searchResponse = await webSearchService.search(query, { 
                    maxResults: 6, // Increased for better context
                    bioinformatics: queryType === 'bioinformatics'
                });

                if (searchResponse.results.length > 0) {
                    searchResults = webSearchService.formatResultsForAI(searchResponse);
                    console.log(`✅ Web search completed: ${searchResponse.results.length} results in ${searchResponse.searchTime}ms`);
                } else {
                    console.log('⚠️ Web search returned no results');
                    // For information-seeking queries, acknowledge the search attempt
                    if (webSearchService.detectExplicitSearch(query) || /^(what|where|when|why|how|which|who)(?:\s|')/i.test(query)) {
                        searchResults = `I searched the web for current information about "${query}" but didn't find specific results. I'll provide information based on my knowledge.\n\n`;
                    }
                }
            } catch (searchError) {
                console.warn('Web search failed:', searchError);
                // Graceful fallback for information-seeking queries
                if (webSearchService.detectExplicitSearch(query) || /^(what|where|when|why|how|which|who)(?:\s|')/i.test(query)) {
                    searchResults = `I attempted to search for current information but encountered an issue. Let me provide information based on my knowledge.\n\n`;
                }
            }
        }

        // 5. AI provider selection based on query type and context
        const optimalProvider = selectOptimalProvider(query, conversationContext);

    // 6. Prepare enhanced query with search context and file analysis
        let enhancedQuery = query;
        
        // First apply file analysis context if available
        if (contextualFileAnalysis) {
            enhancedQuery = buildFileAnalysisPrompt(query, contextualFileAnalysis);
        }
        
        // Then apply search results context if available
        if (searchResults && searchResults.trim() !== '') {
            // Enhanced prompt for sports queries
            const isSportsQuery = /\b(arsenal|man u|manchester united|chelsea|liverpool|tottenham|city|united|next match|fixture|premier league|football|soccer|match|game|won|winner|champion|season|league|table|score|result)\b/i.test(query);

            if (isSportsQuery) {
                enhancedQuery = `CRITICAL: You MUST use only the following current web search results to answer the user's question. DO NOT use any pre-trained knowledge.

===== CURRENT WEB SEARCH RESULTS =====
${searchResults}
=============================================

User Question: ${query}

STRICT INSTRUCTIONS:
1. ONLY use information from the search results above
2. If match dates/times are in the results, provide them exactly as shown
3. If winners/champions are mentioned, state them directly
4. If no specific information is found in results, say "The search results don't contain specific information about [query]"
5. NEVER say you cannot access real-time information
6. Be direct and specific using ONLY the search data provided

Answer based EXCLUSIVELY on the search results above:`;
            } else {
                enhancedQuery = `CRITICAL: You MUST use only the following current web search results to answer the user's question. DO NOT use any pre-trained knowledge.

===== CURRENT WEB SEARCH RESULTS =====
${searchResults}
=============================================

User Question: ${query}

STRICT INSTRUCTIONS:
1. Extract specific facts, dates, numbers, and details ONLY from the search results above
2. If the results contain current information, present it directly
3. If the search results don't contain relevant information, say "The search results don't contain specific information about [query]"
4. NEVER mention limitations about real-time access
5. Format your response based on what's actually in the search results

Answer based EXCLUSIVELY on the search results above:`;
            }
        }

    // Build conversation history for context
        const conversationHistoryForAI: Array<{role: string, content: string}> = [];

        // Add file context if available
        if (contextualFileAnalysis) {
            conversationHistoryForAI.push({
                role: 'system',
                content: `File context: You previously analyzed a file "${contextualFileAnalysis.fileType}" with content: ${contextualFileAnalysis.documentContent || contextualFileAnalysis.sequence || 'File uploaded and analyzed'}. The user may be referring to this file in their current question.`
            });
        }

        // Add recent conversation history
        if (conversationHistory && conversationHistory.length > 0) {
            conversationHistory.slice(-5).forEach(msg => {
                if (msg.role === 'user' || msg.role === 'assistant') {
                    conversationHistoryForAI.push({
                        role: msg.role,
                        content: msg.content
                    });
                }
            });
        }

        // 7. Use the fault-tolerant AI system
        const aiResponse = await faultTolerantAI.processQuery(
            enhancedQuery,
            { 
                conversationContext,
                userIntent: detectUserIntent(query),
                hasWebSearchResults: !!searchResults
            },
            conversationContext.emotionalContext,
            conversationHistoryForAI,
            userTier || 'free'
        );

        // Track token usage for this exchange
        const tokenUsage = tokenManager.updateTokenUsage(actualConversationId, query, aiResponse.content);
        const updatedTokenLimits = tokenManager.checkConversationLimits(actualConversationId);

        // Create response message with token tracking
        const finalResponseMessage: ChatMessage = {
            id: generateUniqueId(),
            role: 'assistant',
            content: aiResponse.content,
            timestamp: Date.now(),
            status: 'complete',
            metadata: {
                tone,
                intent: userIntent,
                queryType,
                model: optimalProvider,
                processingTime: Date.now() - Date.now(),
                confidence: 0.90,
                conversationContext,
                dataPrivacyMode: dataPrivacyMode || 'private',
                tokenUsage,
                conversationLimits: {
                    status: updatedTokenLimits.status,
                    tokensUsed: updatedTokenLimits.tokensUsed,
                    tokensRemaining: updatedTokenLimits.tokensRemaining,
                    percentageUsed: updatedTokenLimits.percentageUsed,
                    shouldWarn: updatedTokenLimits.shouldWarn,
                    message: updatedTokenLimits.message
                }
            }
        };

        if (dataPrivacyMode !== 'private') {
            conversationManager.addMessage(finalResponseMessage);
        }

        return finalResponseMessage;

    } catch (error) {
        console.error('Error processing query:', error);

        const errorMessage: ChatMessage = {
            id: generateUniqueId(),
            role: 'error',
            content: `I apologize, but I encountered an error processing your request. Please try again or rephrase your question.

Error details: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: Date.now(),
            status: 'error',
            metadata: {
                confidence: 0.0,
                intent: 'error'
            }
        };

        conversationManager.addMessage(errorMessage);
        return errorMessage;
    }
};