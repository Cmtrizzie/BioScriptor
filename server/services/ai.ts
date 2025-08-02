
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
    emotionalContext?: string;
    userTier?: string;
    userExpertiseLevel?: 'beginner' | 'intermediate' | 'expert';
    conversationFlow?: 'exploratory' | 'task_focused' | 'learning';
    preferredResponseStyle?: 'detailed' | 'concise' | 'visual';
}

export type BioinformaticsQueryType = 'crispr' | 'pcr' | 'codon_optimization' | 'sequence_analysis' | 'general';

export type ProgrammingIntentType = 'coding' | 'planning' | 'debugging' | 'architecture' | 'learning' | 'none';

export type QueryClassificationType = 'bioinformatics' | 'programming' | 'planning' | 'debugging' | 'general' | 'creative' | 'technical';

export type UserIntentType = 'casual_greeting' | 'greeting' | 'farewell' | 'general_trending' | 'technical_question' | 'assistance_request' | 'small_talk' | 'file_analysis' | 'general_query';

// ========== Constants and Configuration ==========
const MAX_CONVERSATION_AGE_MS = 30 * 60 * 1000; // 30 minutes
const MAX_HISTORY_LENGTH = 10;
const MAX_FILE_PREVIEW_LENGTH = 200;
const IDEAL_RESPONSE_LENGTHS = {
    concise: 200,
    balanced: 400,
    detailed: 800
};

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

// ========== Helper Functions ==========
function generateUniqueId(prefix = 'msg'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function sanitizeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message.replace(/api[_\s]?key[s]?/gi, '[API_KEY]');
    }
    return 'Unknown error occurred';
}

function createErrorMessage(message: string, error?: unknown): ChatMessage {
    return {
        id: generateUniqueId(),
        role: 'error',
        content: `${message}${error ? `\n\nError: ${sanitizeErrorMessage(error)}` : ''}`,
        timestamp: Date.now(),
        status: 'error',
        metadata: { 
            confidence: 0,
            intent: 'error'
        }
    };
}

// ========== Query Classification Functions ==========
function detectQueryType(text: string): BioinformaticsQueryType {
    if (!text || typeof text !== 'string') return 'general';

    const lowerText = text.toLowerCase();
    if (/(crispr|guide rna|grna|cas9)/.test(lowerText)) return 'crispr';
    if (/(pcr|polymerase chain reaction|primer)/.test(lowerText)) return 'pcr';
    if (/(codon optimization|codon usage|expression)/.test(lowerText)) return 'codon_optimization';
    if (/(sequence analysis|sequence alignment|blast|fasta|genbank)/.test(lowerText)) return 'sequence_analysis';
    return 'general';
}

function detectProgrammingIntent(text: string): ProgrammingIntentType {
    if (!text || typeof text !== 'string') return 'none';

    const lowerText = text.toLowerCase();
    if (/(write|create|implement|build|code|script|function|class|algorithm|program)/.test(lowerText)) return 'coding';
    if (/(plan|design|architecture|structure|organize|workflow|pipeline|strategy|roadmap|approach)/.test(lowerText)) return 'planning';
    if (/(debug|fix|error|bug|issue|problem|troubleshoot|not working)/.test(lowerText)) return 'debugging';
    if (/(architecture|system design|database schema|api design|microservices|scalability)/.test(lowerText)) return 'architecture';
    if (/(explain|how does|what is|teach me|learn|understand|tutorial)/.test(lowerText)) return 'learning';
    return 'none';
}

function classifyQuery(query: string): QueryClassificationType {
    if (!query || typeof query !== 'string') return 'general';

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

function detectUserIntent(query: string): UserIntentType {
    if (!query || typeof query !== 'string') return 'general_query';

    const lowerQuery = query.toLowerCase().trim();

    // Casual greetings and small talk
    if (/(^(hi|hello|hey|yo|sup|wazup|wassup|what's up|howdy)$)|(^(hi|hello|hey|yo|sup|wazup|wassup|what's up|howdy)\s*[!.]*$)|greetings|how are you|how's it going|how are you doing|how r u|how u doing/i.test(lowerQuery)) {
        return 'casual_greeting';
    }

    // Casual conversation with variations
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

    // General trending/news queries
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

function detectTone(text: string): string {
    if (!text || typeof text !== 'string') return 'professional';

    const lowerText = text.toLowerCase();

    if (/(please|thank you|would you|kindly|appreciate)/.test(lowerText)) return 'polite';
    if (/(urgent|asap|quickly|immediately|emergency)/.test(lowerText)) return 'urgent';
    if (/(simple|brief|concise|summarize)/.test(lowerText)) return 'concise';
    if (/(😊|🙂|please|thank)/.test(lowerText)) return 'friendly';

    return 'professional';
}

// ========== System Prompt Builder ==========
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
- For file uploads: Respond directly to the user's request without explaining file analysis metadata
- Focus on delivering the requested content (extraction, summary, analysis) without verbose technical details

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

// ========== File Analysis Functions ==========
function buildFileAnalysisPrompt(query: string, fileAnalysis: BioFileAnalysis): string {
    const userIntent = detectUserIntent(query);
    const lowerQuery = query.toLowerCase();
    
    // Detect if user wants extraction, summary, or analysis
    const wantsExtraction = /(extract|get|show|display|pull|retrieve)\s+(full|complete|entire|all)?\s*(content|text|data)/i.test(lowerQuery);
    const wantsSummary = /(summar|overview|brief|outline|recap)/i.test(lowerQuery);
    const wantsAnalysis = /(analy|review|examine|evaluate|assess|check)/i.test(lowerQuery);

    let fileContext = '';

    // Add file content directly without metadata headers
    if (fileAnalysis.documentContent) {
        fileContext += `FILE CONTENT:\n${fileAnalysis.documentContent}\n\n`;
    }

    if (fileAnalysis.sequence && fileAnalysis.sequenceType !== 'document') {
        fileContext += `SEQUENCE DATA:\n${fileAnalysis.sequence.substring(0, 2000)}${fileAnalysis.sequence.length > 2000 ? '...' : ''}\n\n`;
    }

    // Add contextual instructions based on user intent
    if (wantsExtraction) {
        fileContext += `TASK: Extract and present the complete content from this ${fileAnalysis.fileType} file. Focus on delivering the actual content without metadata explanations.\n\n`;
    } else if (wantsSummary) {
        fileContext += `TASK: Provide a concise summary of this ${fileAnalysis.fileType} file's key points and main content. Be direct and focus on the essential information.\n\n`;
    } else if (wantsAnalysis) {
        fileContext += `TASK: Analyze this ${fileAnalysis.fileType} file and provide insights based on its content. Focus on what the document contains and its significance.\n\n`;
    } else {
        fileContext += `TASK: Respond to the user's request about this ${fileAnalysis.fileType} file. Focus on their specific question.\n\n`;
    }

    fileContext += `USER REQUEST: ${query}\n\n`;
    fileContext += `Respond directly to the user's request without explaining file metadata or analysis processes.`;

    return fileContext;
}

// ========== Response Processing Functions ==========
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
            enhancedQuery = buildFileAnalysisPrompt(query, fileAnalysis);
        }

        // Use AI for all bioinformatics queries
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
                processingTime: Date.now() - userMessage.timestamp,
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
        return createErrorMessage(
            'I encountered an error processing your bioinformatics query. Please try again.',
            error
        );
    }
}

// ========== Context Analysis Functions ==========
function analyzeConversation(history: ChatMessage[]): ConversationContext {
    const recentMessages = history.slice(-MAX_HISTORY_LENGTH);
    const userMessages = recentMessages.filter(m => m.role === 'user');

    return {
        id: generateUniqueId('conv'),
        history: recentMessages,
        lastActive: Date.now(),
        memory: {
            topics: new Set(extractTopicsFromHistory(recentMessages)),
            entities: new Set()
        },
        userExpertiseLevel: detectUserExpertiseLevel(userMessages),
        conversationFlow: detectConversationFlow(recentMessages),
        emotionalContext: analyzeEmotionalContext(userMessages),
        preferredResponseStyle: detectPreferredStyle(userMessages)
    };
}

function extractTopicsFromHistory(messages: ChatMessage[]): string[] {
    const topics = new Set<string>();
    messages.forEach(msg => {
        if (msg.content && typeof msg.content === 'string') {
            try {
                const bioTerms = msg.content.match(/(?:DNA|RNA|protein|gene|CRISPR|PCR|sequence|analysis)/gi) || [];
                bioTerms.forEach(term => topics.add(term.toLowerCase()));
            } catch (error) {
                console.warn('Error extracting topics:', error);
            }
        }
    });
    return Array.from(topics);
}

function detectUserExpertiseLevel(userMessages: ChatMessage[]): 'beginner' | 'intermediate' | 'expert' {
    const allText = userMessages.map(m => m.content || '').join(' ');
    const expertTerms = (allText.match(/(?:algorithm|optimization|statistical|computational|bioinformatics)/gi) || []).length;
    const basicTerms = (allText.match(/(?:help|explain|what is|how to)/gi) || []).length;

    if (expertTerms > basicTerms) return 'expert';
    if (basicTerms > 2) return 'beginner';
    return 'intermediate';
}

function detectConversationFlow(messages: ChatMessage[]): 'exploratory' | 'task_focused' | 'learning' {
    const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0];
    if (!lastUserMsg || !lastUserMsg.content) return 'exploratory';

    if (/(implement|create|generate|design)/i.test(lastUserMsg.content)) return 'task_focused';
    if (/(explain|understand|learn|teach)/i.test(lastUserMsg.content)) return 'learning';
    return 'exploratory';
}

function analyzeEmotionalContext(userMessages: ChatMessage[]): string {
    const recentText = userMessages.slice(-3).map(m => m.content || '').join(' ');

    if (/(urgent|stuck|error|problem|help)/i.test(recentText)) return 'frustrated';
    if (/(amazing|awesome|love|excited|wow)/i.test(recentText)) return 'excited';
    if (/(why|how|what|curious|interesting)/i.test(recentText)) return 'curious';
    return 'neutral';
}

function detectPreferredStyle(userMessages: ChatMessage[]): 'detailed' | 'concise' | 'visual' {
    const recentText = userMessages.slice(-5).map(m => m.content || '').join(' ');

    if (/(detailed|thorough|comprehensive|in-depth)/i.test(recentText)) return 'detailed';
    if (/(quick|brief|short|simple)/i.test(recentText)) return 'concise';
    if (/(diagram|chart|visual|graph|show)/i.test(recentText)) return 'visual';
    return 'detailed';
}

// ========== Provider Selection ==========
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

// ========== Conversation Manager ==========
class ConversationManager {
    private currentConversation: ConversationContext;

    constructor() {
        this.currentConversation = this.createNewConversation();
    }

    private createNewConversation(): ConversationContext {
        return {
            id: generateUniqueId('conv'),
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
        if (Date.now() - this.currentConversation.lastActive > MAX_CONVERSATION_AGE_MS) {
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
        if (!text || typeof text !== 'string') return;

        const context = this.getContext();

        try {
            // Extract and store topics
            const topics = this.extractTopics(text);
            topics.forEach(topic => context.memory.topics.add(topic));

            // Extract and store entities
            const entities = this.extractEntities(text);
            entities.forEach(entity => context.memory.entities.add(entity));
        } catch (error) {
            console.warn('Error updating conversation memory:', error);
        }
    }

    private extractTopics(text: string): string[] {
        if (!text || typeof text !== 'string') return [];

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
        if (!text || typeof text !== 'string') return [];

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

const conversationManager = new ConversationManager();

// ========== Main Processing Function ==========
export async function processQuery(
    query: string,
    fileAnalysis?: BioFileAnalysis,
    userTier: string = 'free',
    conversationId?: string,
    conversationHistory?: any[],
    fileContext?: any[]
): Promise<ChatMessage> {
    try {
        const context = conversationManager.getContext();
        const actualConversationId = conversationId || context.id;

        // Enhanced context analysis
        const conversationContext = analyzeConversation(context.history);

        // Enhanced query classification
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
                fileAnalysis: contextualFileAnalysis
            }
        };

        // Add to conversation history
        conversationManager.addMessage(userMessage);

        // Check conversation token limits before processing
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

        // Intelligent routing - prioritize bioinformatics and file analysis
        if (queryType === 'bioinformatics' || (oldQueryType !== 'general' && fileAnalysis) || fileAnalysis) {
            // Use specialized bioinformatics processing for any file upload
            return await processBioQuery(query, userMessage, conversationContext, fileAnalysis, userTier);
        }

        // Enhanced web search with more liberal detection and better caching
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

        // AI provider selection based on query type and context
        const optimalProvider = selectOptimalProvider(query, conversationContext);

        let enhancedPrompt = query;
        let contextualInfo = '';

        // Add current file analysis to context if provided
        if (fileAnalysis) {
            contextualInfo += buildFileAnalysisPrompt(query, fileAnalysis);
        }

        // Add persistent file context from previous uploads
        if (fileContext && fileContext.length > 0) {
            contextualInfo += "\n\n--- PREVIOUSLY UPLOADED FILES IN THIS CONVERSATION ---\n";
            fileContext.forEach((file, index) => {
                contextualInfo += `\nFile ${index + 1}: ${file.filename} (${file.fileType})\n`;
                contextualInfo += `Uploaded: ${new Date(file.timestamp).toLocaleString()}\n`;
                if (file.content && file.content.length > 0) {
                    contextualInfo += `Content: ${file.content.substring(0, 1000)}${file.content.length > 1000 ? '...' : ''}\n`;
                }
                if (file.summary) {
                    contextualInfo += `Previous Analysis: ${file.summary}\n`;
                }
                contextualInfo += "---\n";
            });
            contextualInfo += "\n";
        }

        if (contextualInfo) {
            enhancedPrompt = `${contextualInfo}\nUser Question: ${query}`;
        }

        // Prepare enhanced query with search context and file analysis
        let enhancedQuery = enhancedPrompt;

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

        // Use the fault-tolerant AI system
        const aiResponse = await faultTolerantAI.processQuery(
            enhancedQuery,
            { 
                conversationContext,
                userIntent: detectUserIntent(query),
                hasWebSearchResults: !!searchResults
            },
            conversationContext.emotionalContext || 'neutral',
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
                model: optimalProvider,
                processingTime: Date.now() - userMessage.timestamp,
                confidence: 0.90,
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

        // Always add message to conversation manager
        conversationManager.addMessage(finalResponseMessage);

        return finalResponseMessage;

    } catch (error) {
        console.error('Error processing query:', error);
        const errorMessage = createErrorMessage(
            'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
            error
        );
        conversationManager.addMessage(errorMessage);
        return errorMessage;
    }
}
