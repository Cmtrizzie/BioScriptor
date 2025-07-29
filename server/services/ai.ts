// services/ai.ts
import { FaultTolerantAI, ProviderConfig, AIResponse } from './ai-providers';
import { BioFileAnalysis, generateCRISPRGuides, simulatePCR, optimizeCodonUsage } from './bioinformatics';
import { webSearchService, WebSearchResponse } from './web-search';
import { enhanceResponse } from './response-enhancer';

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
        citations?: Array<{
            text: string;
            url?: string;
            type: 'paper' | 'database' | 'tool';
        }>;
        webSearchResults?: WebSearchResponse;
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
                topics: new Set(),
                entities: new Set()
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
        // Ensure text is a string
        if (!text || typeof text !== 'string') {
            return [];
        }

        const topics = new Set<string>();
        const scientificTerms = text.match(/(?:DNA|RNA|protein|gene|genome|sequence|CRISPR|PCR|plasmid|enzyme|mutation|cell|bacteria|virus|analysis|alignment)/gi) || [];
        scientificTerms.forEach(term => topics.add(term.toLowerCase()));
        return Array.from(topics);
    }

    private extractEntities(text: string): string[] {
        // Ensure text is a string
        if (!text || typeof text !== 'string') {
            return [];
        }

        const entities = new Set<string>();
        const sequenceIds = text.match(/[A-Z]{2}_\d+/g) || [];
        sequenceIds.forEach(id => entities.add(id));

        const geneNames = text.match(/[A-Z]{3,}\d*/g) || [];
        geneNames.forEach(gene => entities.add(gene));

        const speciesNames = text.match(/[A-Z][a-z]+ [a-z]+/g) || [];
        speciesNames.forEach(species => entities.add(species));

        return Array.from(entities);
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

// Check SearXNG configuration
console.log('Search Service Configuration:');
const searxngUrl = process.env.SEARXNG_URL || 'http://0.0.0.0:8080';
console.log(`✅ SearXNG configured: ${searxngUrl}`);
console.log('🔍 Web search powered by SearXNG (privacy-focused meta search engine)');

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

    // Greeting patterns
    if (/(^(hi|hello|hey|good morning|good afternoon|good evening))|greetings/i.test(lowerQuery)) {
        return 'greeting';
    }

    // Farewell patterns
    if (/(bye|goodbye|see you|thanks|thank you|that's all)/i.test(lowerQuery)) {
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

// Main processing function
export const processQuery = async (
    query: string,
    fileAnalysis?: BioFileAnalysis,
    userTier?: string
): Promise<ChatMessage> => {
    try {
        const context = conversationManager.getContext();
        const queryType = detectQueryType(query);
        const tone = detectTone(query);
        const userIntent = detectUserIntent(query);

        // Create user message
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
                confidence: 1.0
            }
        };

        // Add to conversation history
        conversationManager.addMessage(userMessage);

        // Handle specialized bioinformatics queries
        if (queryType !== 'general' && fileAnalysis) {
            let responseContent = '';
            let metadata: any = { confidence: 0.95, processingTime: 1200 };

            switch (queryType) {
                case 'crispr':
                    const guides = generateCRISPRGuides(fileAnalysis.sequence);
                    responseContent = `CRISPR guide RNA analysis completed. Found ${guides.length} potential targets:\n` +
                        guides.map((g, i) => `${i+1}. ${g.sequence} (PAM: ${g.pam})`).join('\n');
                    metadata.guides = guides;
                    break;

                case 'pcr':
                    const pcrResults = simulatePCR(fileAnalysis.sequence);
                    responseContent = `PCR simulation completed:\n- Optimal annealing: ${pcrResults.annealingTemp}°C\n` +
                        `- Product size: ${pcrResults.productSize}bp\n- Efficiency: ${pcrResults.efficiency}%`;
                    metadata.pcrResults = pcrResults;
                    break;

                case 'codon_optimization':
                    const optimized = optimizeCodonUsage(fileAnalysis.sequence);
                    responseContent = `Codon optimization completed:\n- Original CAI: ${optimized.originalCAI.toFixed(2)}\n` +
                        `- Optimized CAI: ${optimized.optimizedCAI.toFixed(2)}\n- Host: ${optimized.host}`;
                    metadata.optimization = optimized;
                    break;

                case 'sequence_analysis':
                    responseContent = `Sequence analysis completed:\n- Length: ${fileAnalysis.sequence.length}bp\n` +
                        `- GC Content: ${fileAnalysis.gcContent}%\n- Type: ${fileAnalysis.sequenceType}`;
                    if (fileAnalysis.features) {
                        responseContent += `\n- Features: ${fileAnalysis.features.join(', ')}`;
                    }
                    break;
            }

            // Enhance response using the enhancer service
            const enhancedResponse = await enhanceResponse(
                {
                    id: generateUniqueId(),
                    role: 'assistant',
                    content: responseContent,
                    timestamp: Date.now(),
                    status: 'complete' as const,
                    metadata: {
                        confidence: 0.85,
                        topic: metadata.intent
                    }
                },
                {
                    context: {
                        currentTopic: metadata.intent,
                        taskType: queryType
                    },
                    tone,
                    userMessage: query,
                    userSkillLevel: userTier === 'pro' ? 'advanced' : 'intermediate'
                }
            );

            const bioMessage: ChatMessage = {
                id: generateUniqueId(),
                role: 'assistant',
                content: enhancedResponse,
                timestamp: Date.now(),
                status: 'complete',
                metadata
            };

            conversationManager.addMessage(bioMessage);
            return bioMessage;
        }

        // Prepare conversation history for AI context
        const recentHistory = context.history
            .slice(-6) // Last 3 exchanges (user + assistant)
            .map(m => ({ role: m.role, content: m.content }));

        // Check if web search is needed - especially for trending/general queries
        let webSearchResults: WebSearchResponse | undefined;
        let searchContext = '';

        // Enhanced detection for sports/news queries
        const isGeneralQuery = userIntent === 'general_trending' || 
                              /(news|latest|arsenal|football|soccer|player|transfer|sport)/i.test(query);

        const shouldSearch = webSearchService.detectExplicitSearch(query) || 
                           webSearchService.detectImplicitTriggers(query) ||
                           isGeneralQuery;

        if (shouldSearch) {
            console.log('🔍 Performing web search for:', query);
            let searchTerms = webSearchService.extractSearchTerms(query);

            // For general trending queries, expand search terms
            if (isGeneralQuery) {
                searchTerms = `${searchTerms} latest news 2024`;
            }

            webSearchResults = await webSearchService.search(searchTerms, {
                maxResults: 5,
                bioinformatics: !isGeneralQuery // Don't limit to bio for general queries
            });

            if (webSearchResults.results.length > 0) {
                searchContext = '\n\nWeb Search Context:\n' + 
                              webSearchService.formatResultsForAI(webSearchResults);
                console.log(`✅ Found ${webSearchResults.results.length} search results`);
            } else {
                console.log('⚠️ No web search results found, providing general response');
            }
        }

        // Always continue with AI response, whether search succeeded or not

        // Analyze conversation context
        const conversationAnalysis = analyzeConversationContext(context.history);

        // Build enhanced system prompt based on context
        const systemPrompt = `You are BioScriptor, a specialized AI assistant for bioinformatics, data analysis, and scientific computing.

${conversationAnalysis.personality.tone && `Communication Style: ${conversationAnalysis.personality.tone}`}
${conversationAnalysis.personality.explanation_style && `Explanation Style: ${conversationAnalysis.personality.explanation_style}`}

Current Context:
- User Intent: ${userIntent}
- Query Type: ${queryType}
- Conversation Topics: ${Array.from(context.memory.topics).join(', ') || 'None'}
- Time: ${getTimeBasedGreeting()}

${searchContext}

Always provide helpful, accurate, and scientifically sound responses. When discussing bioinformatics topics, include relevant examples and cite best practices.`;

        // Prepare conversation context
        const conversationHistory = recentHistory.length > 0 ? recentHistory : [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
        ];

        if (recentHistory.length > 0) {
            conversationHistory.unshift({ role: 'system', content: systemPrompt });
        }

        // Generate AI response
        const startTime = Date.now();
        const aiResponse = await faultTolerantAI.processQuery(
            query,
            { 
                fileAnalysis,
                webSearchResults,
                conversationContext: context,
                userIntent
            },
            tone,
            conversationHistory,
            userTier
        );

        const processingTime = Date.now() - startTime;

        // Enhance the response
        let enhancedContent = aiResponse.content;

        try {
            enhancedContent = await enhanceResponse(
                {
                    id: generateUniqueId(),
                    role: 'assistant',
                    content: aiResponse.content,
                    timestamp: Date.now(),
                    status: 'complete' as const,
                    metadata: {
                        confidence: 0.85,
                        topic: userIntent
                    }
                },
                {
                    context: {
                        currentTopic: userIntent,
                        taskType: queryType
                    },
                    tone,
                    userMessage: query,
                    userSkillLevel: userTier === 'pro' ? 'advanced' : 'intermediate'
                }
            );
        } catch (enhanceError) {
            console.warn('Response enhancement failed, using original response:', enhanceError);
        }

        // Create response message
        const responseMessage: ChatMessage = {
            id: generateUniqueId(),
            role: 'assistant',
            content: enhancedContent,
            timestamp: Date.now(),
            status: 'complete',
            metadata: {
                tone,
                intent: userIntent,
                model: aiResponse.provider,
                processingTime,
                confidence: 0.85,
                webSearchResults,
                ...(aiResponse.tokens && { tokens: aiResponse.tokens })
            }
        };

        // Add to conversation history
        conversationManager.addMessage(responseMessage);

        return responseMessage;

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