// services/ai.ts
import { FaultTolerantAI, ProviderConfig, AIResponse } from './ai-providers';
import { BioFileAnalysis, generateCRISPRGuides, simulatePCR, optimizeCodonUsage } from './bioinformatics';
import { enhanceResponse } from './response-enhancer';
import { webSearchService, formatSearchResults } from './web-search';

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

// Enhanced bioinformatics query processing
async function processBioQuery(
    query: string,
    userMessage: ChatMessage,
    conversationContext: ConversationContext,
    fileAnalysis?: BioFileAnalysis,
    userTier?: string
): Promise<ChatMessage> {
    const analysisType = detectQueryType(query);
    let responseContent = '';
    let metadata: any = { 
        confidence: 0.95, 
        processingTime: 1200,
        analysisType 
    };

    try {
        // Run specialized bioinformatics analysis
        switch (analysisType) {
            case 'crispr':
                if (fileAnalysis && fileAnalysis.sequence) {
                    const guides = generateCRISPRGuides(fileAnalysis.sequence);
                    responseContent = formatCRISPRResults(guides, conversationContext);
                    metadata.guides = guides;
                } else {
                    responseContent = generateCRISPRGuidance(query, conversationContext);
                }
                break;

            case 'pcr':
                if (fileAnalysis && fileAnalysis.sequence) {
                    const pcrResults = simulatePCR(fileAnalysis.sequence);
                    responseContent = formatPCRResults(pcrResults, conversationContext);
                    metadata.pcrResults = pcrResults;
                } else {
                    responseContent = generatePCRGuidance(query, conversationContext);
                }
                break;

            case 'codon_optimization':
                if (fileAnalysis && fileAnalysis.sequence) {
                    const optimized = optimizeCodonUsage(fileAnalysis.sequence);
                    responseContent = formatOptimizationResults(optimized, conversationContext);
                    metadata.optimization = optimized;
                } else {
                    responseContent = generateOptimizationGuidance(query, conversationContext);
                }
                break;

            case 'sequence_analysis':
                if (fileAnalysis) {
                    responseContent = formatSequenceAnalysis(fileAnalysis, conversationContext);
                } else {
                    responseContent = generateSequenceGuidance(query, conversationContext);
                }
                break;

            default:
                // General bioinformatics guidance
                responseContent = await getGeneralBioGuidance(query, conversationContext);
                break;
        }

        // Enhance response with personality and context
        const enhancedResponse = await enhanceResponse(
            {
                id: generateUniqueId(),
                role: 'assistant',
                content: responseContent,
                timestamp: Date.now(),
                status: 'complete' as const,
                metadata: {
                    confidence: 0.95,
                    topic: analysisType
                }
            },
            {
                context: {
                    previousResponses: [],
                    currentTopic: analysisType,
                    taskType: analysisType,
                    conversationContext
                },
                tone: conversationContext.emotionalContext || 'neutral',
                userMessage: query,
                userSkillLevel: conversationContext.userExpertiseLevel || 'intermediate'
            }
        );

        return {
            id: generateUniqueId(),
            role: 'assistant',
            content: typeof enhancedResponse === 'string' ? enhancedResponse : enhancedResponse.content,
            timestamp: Date.now(),
            status: 'complete',
            metadata
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

    let prompt = `You are BioScriptor, an advanced AI assistant specialized in bioinformatics and scientific computing.

**User Context:**
- Expertise Level: ${context.userExpertiseLevel}
- Conversation Flow: ${context.conversationFlow}
- Emotional Context: ${context.emotionalContext}
- Preferred Style: ${context.preferredResponseStyle}
- Active Topics: ${context.topics.join(', ') || 'None'}

**Response Guidelines:**`;

    if (queryType === 'bioinformatics') {
        prompt += `
- Prioritize scientific accuracy and cite best practices
- Include relevant examples and code snippets when appropriate
- Suggest follow-up analyses or related techniques
- Use technical language appropriate for ${context.userExpertiseLevel} level`;
    } else if (queryType === 'technical') {
        prompt += `
- Provide clear, implementable solutions
- Include code examples with explanations
- Consider edge cases and best practices
- Optimize for ${context.preferredResponseStyle} responses`;
    } else {
        prompt += `
- Be helpful and informative while staying within your expertise
- Gently redirect to bioinformatics topics when appropriate
- Maintain a warm, professional tone
- Provide concise but complete answers`;
    }

    prompt += `

**Current Query Type:** ${queryType}
**Time:** ${getTimeBasedGreeting()}

Respond helpfully and accurately, adapting your tone and detail level to the user's context.`;

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

async function getGeneralBioGuidance(query: string, context: ConversationContext): Promise<string> {
    // This would call the AI with bioinformatics-specific prompting
    const prompt = `As a bioinformatics expert, provide guidance on: ${query}`;

    return `I'd be happy to help with your bioinformatics question about "${query}". ` +
           `Based on current best practices in the field, here's my guidance:\n\n` +
           `[This would be enhanced with actual AI response based on the query]`;
}

function generateCRISPRGuidance(query: string, context: ConversationContext): string {
    return `## CRISPR Guide Design Assistance\n\n` +
           `I can help you design CRISPR guide RNAs! For the best results, please provide:\n\n` +
           `- Target gene sequence (FASTA format)\n` +
           `- Desired cut site location\n` +
           `- PAM sequence preference (NGG for Cas9)\n\n` +
           `Would you like me to explain the guide design process or help with a specific sequence?`;
}

function generatePCRGuidance(query: string, context: ConversationContext): string {
    return `## PCR Design and Optimization\n\n` +
           `I can assist with PCR primer design and reaction optimization. I can help with:\n\n` +
           `- Primer design and validation\n` +
           `- Annealing temperature calculation\n` +
           `- Reaction condition optimization\n` +
           `- Troubleshooting amplification issues\n\n` +
           `What specific aspect of PCR would you like help with?`;
}

function generateOptimizationGuidance(query: string, context: ConversationContext): string {
    return `## Codon Optimization Services\n\n` +
           `I can help optimize your sequences for expression in various host organisms:\n\n` +
           `- **E. coli** (most common for protein production)\n` +
           `- **S. cerevisiae** (yeast expression)\n` +
           `- **Human** (mammalian cell lines)\n` +
           `- **Custom** (specify your host organism)\n\n` +
           `Please provide your protein sequence and target host for optimization.`;
}

function generateSequenceGuidance(query: string, context: ConversationContext): string {
    return `## Sequence Analysis Capabilities\n\n` +
           `I can analyze various sequence formats:\n\n` +
           `- **FASTA** (.fa, .fasta) - DNA/RNA/protein sequences\n` +
           `- **GenBank** (.gb, .gbk) - annotated sequences\n` +
           `- **PDB** (.pdb) - protein structures\n` +
           `- **CSV** - custom data formats\n\n` +
           `Upload your file or paste the sequence for detailed analysis!`;
}

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

// Function to detect query type
function detectQueryType(text: string): BioinformaticsQueryType {
    const lowerText = text.toLowerCase();

    if (/(crispr|guide rna|grna|cas9)/.test(lowerText)) return 'crispr';
    if (/(pcr|polymerase chain reaction|primer)/.test(lowerText)) return 'pcr';
    if (/(codon optimization|codon usage|expression)/.test(lowerText)) return 'codon_optimization';
    if (/(sequence analysis|sequence alignment|blast|fasta|genbank)/.test(lowerText)) return 'sequence_analysis';

    return 'general';
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

    // Casual greetings and small talk - improved detection
    if (/(^(hi|hello|hey|yo|sup|wazup|wassup|what's up|howdy)$)|(^(hi|hello|hey|yo|sup|wazup|wassup|what's up|howdy)\s*[!.]*$)|greetings|how are you|how's it going/i.test(lowerQuery)) {
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
function classifyQuery(query: string): 'bioinformatics' | 'general' | 'creative' | 'technical' {
    const BIO_KEYWORDS = [
        'dna', 'rna', 'protein', 'sequence', 'genomic', 'alignment',
        'blast', 'crispr', 'pcr', 'bioinformatics', 'genome', 'variant',
        'analysis', 'fastq', 'bam', 'vcf', 'snp', 'gene', 'chromosome'
    ];

    const TECHNICAL_KEYWORDS = ['code', 'script', 'function', 'algorithm', 'implementation'];
    const CREATIVE_KEYWORDS = ['story', 'creative', 'imagine', 'brainstorm', 'idea'];

    const lowerQuery = query.toLowerCase();

    if (BIO_KEYWORDS.some(kw => lowerQuery.includes(kw))) return 'bioinformatics';
    if (TECHNICAL_KEYWORDS.some(kw => lowerQuery.includes(kw))) return 'technical';
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
    userTier?: string,
    dataPrivacyMode?: string
): Promise<ChatMessage> => {
    try {
        const context = conversationManager.getContext();

        // 1. Enhanced context analysis
        const conversationContext = analyzeConversation(context.history);

        // 2. Enhanced query classification
        const queryType = classifyQuery(query);
        const oldQueryType = detectQueryType(query); // Keep for bio processing
        const tone = detectTone(query);
        const userIntent = detectUserIntent(query);

        // Create user message with enhanced metadata
        const userMessage: ChatMessage = {
            id: generateUniqueId(),
            role: 'user',
            content: query,
            timestamp: Date.now(),
            status: 'complete',
            metadata: {
                fileAnalysis,
                tone,
                intent: userIntent,
                confidence: 1.0,
                queryType,
                conversationContext
            }
        };

        // Add to conversation history
        conversationManager.addMessage(userMessage);

        // 3. Intelligent routing - prioritize bioinformatics
        if (queryType === 'bioinformatics' || (oldQueryType !== 'general' && fileAnalysis)) {
            // Use specialized bioinformatics processing
            return await processBioQuery(query, userMessage, conversationContext, fileAnalysis, userTier);
        }

        // 4. Check if web search is needed
        let searchResults = '';
        const needsWebSearch = webSearchService.detectExplicitSearch(query) || 
                              webSearchService.detectImplicitTriggers(query);

        if (needsWebSearch) {
            console.log('🌐 Performing web search for query...');
            try {
                const searchResponse = await webSearchService.search(query, { maxResults: 5 });
                if (searchResponse.results.length > 0) {
                    searchResults = webSearchService.formatResultsForAI(searchResponse);
                    console.log(`✅ Web search completed: ${searchResponse.results.length} results`);
                } else {
                    console.log('⚠️ Web search returned no results');
                }
            } catch (searchError) {
                console.warn('Web search failed:', searchError);
            }
        }

        // 5. AI provider selection based on query type and context
        const optimalProvider = selectOptimalProvider(query, conversationContext);

        // 6. Prepare enhanced query with search context
        let enhancedQuery = query;
        if (searchResults) {
            enhancedQuery = `User Query: ${query}\n\nWeb Search Results:\n${searchResults}\n\nPlease provide a comprehensive answer using both your knowledge and the search results above.`;
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
            context.history.slice(-6).map(m => ({
                role: m.role,
                content: m.content
            })),
            userTier || 'free'
        );

        // Create response message
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
                dataPrivacyMode: dataPrivacyMode || 'private'
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