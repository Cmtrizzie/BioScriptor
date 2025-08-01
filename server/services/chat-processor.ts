import { FaultTolerantAI } from './ai-providers';
import { ChatMessage } from './types';
import { enhanceResponse } from './response-enhancer';

export class ChatProcessor {
  private ai: FaultTolerantAI;
  
  constructor(ai: FaultTolerantAI) {
    this.ai = ai;
  }

  async processMessage(message: string, context: {
    previousMessages: ChatMessage[];
    currentTopic?: string;
    taskType?: string;
    tone?: string;
    userSkillLevel?: string;
    conversationContext?: any;
    preferredStyle?: string;
  }): Promise<ChatMessage> {
    // Get multiple candidate responses for comparison
    const candidates = await this.getCandidateResponses(message, context);

    // Select the best response using enhanced criteria
    const bestResponse = this.selectBestResponse(candidates, message, context);

    // Enhance the response with personality and context
    const enhancedResponse = await enhanceResponse(bestResponse, {
      context: {
        previousResponses: context.previousMessages,
        currentTopic: context.currentTopic,
        taskType: context.taskType,
        conversationContext: context.conversationContext
      },
      tone: context.tone,
      userSkillLevel: context.userSkillLevel,
      userMessage: message,
      preferredStyle: context.preferredStyle
    });

    return enhancedResponse;
  }

  private async getCandidateResponses(
    message: string, 
    context: any
  ): Promise<ChatMessage[]> {
    const providers = this.selectProvidersForQuery(message, context);
    const candidates: ChatMessage[] = [];

    // Get responses from multiple providers
    for (const provider of providers) {
      try {
        const response = await this.ai.processQuery(
          message,
          {
            conversationContext: context.conversationContext,
            userIntent: context.taskType
          },
          context.tone || 'professional',
          this.buildConversationHistory(context.previousMessages),
          context.userSkillLevel || 'intermediate'
        );

        candidates.push({
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          role: 'assistant',
          content: response.content,
          timestamp: Date.now(),
          status: 'complete',
          metadata: {
            provider: response.provider,
            confidence: 0.85,
            processingTime: 1200
          }
        });
      } catch (error) {
        console.warn(`Provider ${provider} failed:`, error);
      }
    }

    return candidates.length > 0 ? candidates : [this.getFallbackResponse(message)];
  }

  private selectProvidersForQuery(message: string, context: any): string[] {
    const queryType = this.classifyQuery(message);
    
    // Select providers based on query type and context
    switch (queryType) {
      case 'bioinformatics':
        return ['groq', 'together']; // High accuracy providers
      case 'creative':
        return ['together', 'openrouter']; // Creative capability
      case 'technical':
        return ['groq', 'openrouter']; // Technical accuracy
      default:
        return ['groq']; // General queries
    }
  }

  private classifyQuery(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (/(dna|rna|protein|crispr|pcr|sequence|genome)/i.test(lowerQuery)) {
      return 'bioinformatics';
    }
    if (/(creative|story|imagine|brainstorm)/i.test(lowerQuery)) {
      return 'creative';
    }
    if (/(code|script|function|algorithm)/i.test(lowerQuery)) {
      return 'technical';
    }
    return 'general';
  }

  private selectBestResponse(
    candidates: ChatMessage[], 
    originalQuery: string, 
    context: any
  ): ChatMessage {
    if (candidates.length === 0) {
      return this.getFallbackResponse(originalQuery);
    }
    
    if (candidates.length === 1) {
      return candidates[0];
    }

    // Score responses based on multiple criteria
    const scoredResponses = candidates.map(response => ({
      response,
      score: this.scoreResponse(response, originalQuery, context)
    }));

    // Return highest scoring response
    scoredResponses.sort((a, b) => b.score - a.score);
    return scoredResponses[0].response;
  }

  private scoreResponse(
    response: ChatMessage, 
    query: string, 
    context: any
  ): number {
    let score = 0;
    const content = response.content.toLowerCase();
    const queryLower = query.toLowerCase();

    // Relevance scoring (40 points)
    const queryTerms = queryLower.split(' ').filter(term => term.length > 3);
    const relevanceScore = queryTerms.reduce((acc, term) => {
      return acc + (content.includes(term) ? 1 : 0);
    }, 0) / queryTerms.length;
    score += relevanceScore * 40;

    // Length appropriateness (20 points)
    const preferredStyle = context.preferredStyle || 'detailed';
    const idealLength = preferredStyle === 'concise' ? 200 : 
                       preferredStyle === 'detailed' ? 800 : 400;
    const lengthScore = 1 - Math.abs(response.content.length - idealLength) / idealLength;
    score += Math.max(0, lengthScore) * 20;

    // Technical depth matching user expertise (25 points)
    const technicalTerms = (content.match(/(?:algorithm|optimization|statistical|computational)/g) || []).length;
    const userLevel = context.conversationContext?.userExpertiseLevel || 'intermediate';
    const expertiseMatch = userLevel === 'expert' ? 
      Math.min(technicalTerms / 3, 1) : 
      Math.max(0, 1 - technicalTerms / 5);
    score += expertiseMatch * 25;

    // Provider reliability and confidence (15 points)
    const providerScore = response.metadata?.provider === 'groq' ? 1 : 0.8;
    const confidenceScore = response.metadata?.confidence || 0.5;
    score += (providerScore * 0.5 + confidenceScore * 0.5) * 15;

    return score;
  }

  private buildConversationHistory(previousMessages: ChatMessage[]): Array<{role: string, content: string}> {
    return previousMessages.slice(-6).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  private getFallbackResponse(message: string): ChatMessage {
    return {
      id: `fallback_${Date.now()}`,
      role: 'assistant',
      content: `I apologize, but I'm having difficulty processing your request: "${message}". Please try rephrasing your question or ask about bioinformatics topics where I excel, such as DNA analysis, sequence alignment, or CRISPR design.`,
      timestamp: Date.now(),
      status: 'complete',
      metadata: {
        provider: 'fallback',
        confidence: 0.1,
        isFallback: true
      }
    };
  }
}
