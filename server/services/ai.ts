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
        const topics = new Set<string>();
        const scientificTerms = text.match(/(?:DNA|RNA|protein|gene|genome|sequence|CRISPR|PCR|plasmid|enzyme|mutation|cell|bacteria|virus|analysis|alignment)/gi) || [];
        scientificTerms.forEach(term => topics.add(term.toLowerCase()));
        return Array.from(topics);
    }

    private extractEntities(text: string): string[] {
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

            const bioMessage: ChatMessage = {
                id: generateUniqueId(),
                role: 'assistant',
                content: responseContent,
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

        // Check if web search is needed
        let webSearchResults: WebSearchResponse | undefined;
        let searchContext = '';

        const shouldSearch = webSearchService.detectExplicitSearch(query) || 
                           webSearchService.detectImplicitTriggers(query);

        if (shouldSearch) {
            console.log('🔍 Performing web search for:', query);
            const searchTerms = webSearchService.extractSearchTerms(query);
            webSearchResults = await webSearchService.search(searchTerms, {
                maxResults: 5,
                bioinformatics: true
            });

            if (webSearchResults.results.length > 0) {
                searchContext = '\n\nWeb Search Context:\n' + 
                              webSearchService.formatResultsForAI(webSearchResults);
                console.log(`✅ Found ${webSearchResults.results.length} search results`);
            }
        }

        // Analyze conversation context with personality
        const contextAnalysis = analyzeConversationContext(context.history);
        const personality = contextAnalysis.personality;
        
        // Generate context-aware system prompt with personality
        const memory = context.memory;
        const systemPrompt = `You are BioScriptor, an advanced bioinformatics assistant with a ${personality.name.toLowerCase()} personality.

Current conversation topics: ${Array.from(memory.topics).join(', ') || 'none'}
Key entities: ${Array.from(memory.entities).join(', ') || 'none'}
User's tone: ${tone}

Personality Guidelines:
- Tone: ${personality.tone}
- Explanation style: ${personality.explanation_style}
- Expertise level: ${personality.expertise_level}

Conversation Guidelines:
1. Respond with a ${personality.tone} manner
2. Use ${personality.explanation_style}
3. ${fileAnalysis ? 'Incorporate file analysis results' : ''}
4. ${webSearchResults ? 'Use the provided web search results to enhance your response with current information' : ''}
5. Reference previous conversation naturally when relevant
6. End responses with engaging follow-ups
${searchContext}`;

        // Update system prompt to focus on intent recognition
        const updatedSystemPrompt = `You are BioScriptor, an advanced bioinformatics assistant.
Current conversation topics: ${Array.from(memory.topics).join(', ') || 'none'}
Key entities: ${Array.from(memory.entities).join(', ') || 'none'}
User's tone: ${tone}

Guidelines:
1. Recognize user intent (greeting, question, request, farewell)
2. For greetings: respond naturally and briefly
3. For questions: provide helpful answers
4. For requests: offer assistance
5. Avoid over-explaining simple interactions
6. ${fileAnalysis ? 'Incorporate file analysis results' : ''}
7. ${webSearchResults ? 'Use the provided web search results to enhance your response with current information' : ''}
8. Provide accurate, actionable advice
${searchContext}`;

        // Generate AI response with enhanced context
        const enhancedContext = {
            systemPrompt: updatedSystemPrompt,
            messages: [
                { role: 'system', content: updatedSystemPrompt },
                ...recentHistory
            ],
            maxTokens: 2000,
            temperature: 0.7,
            fileAnalysis,
            userMemory: {
                topics: Array.from(memory.topics),
                entities: Array.from(memory.entities)
            }
        };

        const response = await faultTolerantAI.processQuery(
            query,
            enhancedContext,
            tone as any,
            recentHistory,
            userTier
        );

        // Generate embedding for the response
        const responseTokens = query.split(/\s+/).filter(t => t.length > 0);
        const responseEmbedding = {
            vector: responseTokens.map((_, i) => Math.random() * 0.1), // Simplified for demo
            model: 'simple_tokenizer',
            dimension: responseTokens.length,
            timestamp: Date.now()
        };

        // Enhance the response with new conversational flow including personality
        const enhancedResponse = await enhanceResponse(
            {
                id: generateUniqueId(),
                role: 'assistant',
                content: response.content,
                timestamp: Date.now(),
                status: 'complete' as const,
                embedding: responseEmbedding,
                metadata: {
                    confidence: response.confidence || 0.85,
                    tokenCount: responseTokens.length,
                    semanticContext: Array.from(memory.topics).slice(0, 3),
                    personality: contextAnalysis.personality.name
                }
            },
            {
                context: {
                    previousResponses: context.history.filter(m => m.role === 'assistant'),
                    currentTopic: Array.from(memory.topics)[0],
                    taskType: queryType
                },
                tone,
                userMessage: query,
                userSkillLevel: contextAnalysis.memory.userPreferences.technicalLevel
            }
        );

        // Create assistant message
        const assistantMessage: ChatMessage = {
            ...enhancedResponse,
            id: generateUniqueId(),
            metadata: {
                ...enhancedResponse.metadata,
                confidence: response.confidence || 0.85,
                processingTime: response.processingTime,
                queryType,
                tone,
                webSearchResults
            }
        };

        // Add to conversation history
        conversationManager.addMessage(assistantMessage);

        return assistantMessage;
    } catch (error) {
        console.error('Error processing query:', error);

        // Provide a more helpful fallback response
        const fallbackAI = new FaultTolerantAI(aiConfig);
        const fallbackResponse = fallbackAI.getSolutionBankResponse(query);

        return {
            id: generateUniqueId(),
            role: 'assistant',
            content: fallbackResponse,
            timestamp: Date.now(),
            status: 'complete',
            metadata: {
                confidence: 0.7,
                provider: 'solution_bank',
                fallbackUsed: true,
                processingTime: 100,
                note: 'AI services temporarily unavailable, using knowledge base'
            }
        };
    }
};

// Optional default export
// export default processQuery;