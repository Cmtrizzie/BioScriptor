
// Token management service for conversation length limits
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedWords: number;
}

export interface ConversationTokens {
  conversationId: string;
  totalTokens: number;
  messageCount: number;
  lastUpdated: number;
  warningThreshold: number;
  maxThreshold: number;
}

export class TokenManager {
  private static readonly MAX_TOKENS = 128000; // 128k token limit
  private static readonly WARNING_THRESHOLD = 96000; // 75% of limit
  private static readonly OPTIMAL_THRESHOLD = 40000; // 30% of limit for best performance
  private static readonly TOKENS_PER_WORD = 1.33; // Average tokens per word

  private conversationTokens = new Map<string, ConversationTokens>();

  constructor() {
    // Clean up old conversations every hour
    setInterval(() => this.cleanupOldConversations(), 60 * 60 * 1000);
  }

  // Estimate tokens from text (rough approximation)
  estimateTokens(text: string): number {
    if (!text || typeof text !== 'string') return 0;
    
    // Basic token estimation
    const words = text.trim().split(/\s+/).length;
    const characters = text.length;
    
    // More accurate estimation considering:
    // - Average word length
    // - Special characters and punctuation
    // - Code blocks and technical content
    return Math.ceil(words * TokenManager.TOKENS_PER_WORD + characters * 0.1);
  }

  // Update token usage for a conversation
  updateTokenUsage(conversationId: string, userMessage: string, aiResponse: string): TokenUsage {
    const userTokens = this.estimateTokens(userMessage);
    const aiTokens = this.estimateTokens(aiResponse);
    const totalTokens = userTokens + aiTokens;

    let conversation = this.conversationTokens.get(conversationId);
    if (!conversation) {
      conversation = {
        conversationId,
        totalTokens: 0,
        messageCount: 0,
        lastUpdated: Date.now(),
        warningThreshold: TokenManager.WARNING_THRESHOLD,
        maxThreshold: TokenManager.MAX_TOKENS
      };
    }

    conversation.totalTokens += totalTokens;
    conversation.messageCount += 2; // User + AI message
    conversation.lastUpdated = Date.now();
    
    this.conversationTokens.set(conversationId, conversation);

    return {
      promptTokens: userTokens,
      completionTokens: aiTokens,
      totalTokens,
      estimatedWords: Math.ceil(totalTokens / TokenManager.TOKENS_PER_WORD)
    };
  }

  // Check if conversation is approaching limits
  checkConversationLimits(conversationId: string): {
    status: 'ok' | 'warning' | 'critical' | 'exceeded';
    tokensUsed: number;
    tokensRemaining: number;
    percentageUsed: number;
    shouldTruncate: boolean;
    shouldWarn: boolean;
    message?: string;
  } {
    const conversation = this.conversationTokens.get(conversationId);
    if (!conversation) {
      return {
        status: 'ok',
        tokensUsed: 0,
        tokensRemaining: TokenManager.MAX_TOKENS,
        percentageUsed: 0,
        shouldTruncate: false,
        shouldWarn: false
      };
    }

    const tokensUsed = conversation.totalTokens;
    const tokensRemaining = TokenManager.MAX_TOKENS - tokensUsed;
    const percentageUsed = (tokensUsed / TokenManager.MAX_TOKENS) * 100;

    let status: 'ok' | 'warning' | 'critical' | 'exceeded' = 'ok';
    let shouldTruncate = false;
    let shouldWarn = false;
    let message: string | undefined;

    if (tokensUsed >= TokenManager.MAX_TOKENS) {
      status = 'exceeded';
      shouldTruncate = true;
      message = 'Conversation has exceeded the 128k token limit. Starting fresh context.';
    } else if (tokensUsed >= TokenManager.WARNING_THRESHOLD) {
      status = 'critical';
      shouldTruncate = tokensUsed > TokenManager.OPTIMAL_THRESHOLD * 2;
      shouldWarn = true;
      message = `Conversation is at ${percentageUsed.toFixed(1)}% of token limit. Consider starting a new chat soon for optimal performance.`;
    } else if (tokensUsed >= TokenManager.OPTIMAL_THRESHOLD) {
      status = 'warning';
      shouldWarn = true;
      message = `Conversation is getting lengthy (${percentageUsed.toFixed(1)}% of limit). Performance may improve with a new chat.`;
    }

    return {
      status,
      tokensUsed,
      tokensRemaining,
      percentageUsed,
      shouldTruncate,
      shouldWarn,
      message
    };
  }

  // Get conversation statistics
  getConversationStats(conversationId: string): ConversationTokens | null {
    return this.conversationTokens.get(conversationId) || null;
  }

  // Truncate conversation history to stay within limits
  truncateConversationHistory(messages: any[], maxTokens: number = TokenManager.OPTIMAL_THRESHOLD): any[] {
    if (messages.length <= 2) return messages; // Keep at least system + 1 exchange

    let totalTokens = 0;
    const truncatedMessages = [];
    
    // Always keep the first message (system prompt) if it exists
    if (messages[0]?.role === 'system') {
      truncatedMessages.push(messages[0]);
      totalTokens += this.estimateTokens(messages[0].content);
    }

    // Work backwards from the most recent messages
    for (let i = messages.length - 1; i >= (messages[0]?.role === 'system' ? 1 : 0); i--) {
      const messageTokens = this.estimateTokens(messages[i].content);
      
      if (totalTokens + messageTokens <= maxTokens) {
        truncatedMessages.unshift(messages[i]);
        totalTokens += messageTokens;
      } else {
        break;
      }
    }

    return truncatedMessages;
  }

  // Reset conversation tokens
  resetConversation(conversationId: string): void {
    this.conversationTokens.delete(conversationId);
  }

  // Clean up old conversations (older than 24 hours)
  private cleanupOldConversations(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [conversationId, conversation] of this.conversationTokens.entries()) {
      if (conversation.lastUpdated < oneDayAgo) {
        this.conversationTokens.delete(conversationId);
      }
    }
  }

  // Get all conversation statistics (for admin/debugging)
  getAllConversationStats(): ConversationTokens[] {
    return Array.from(this.conversationTokens.values());
  }
}

export const tokenManager = new TokenManager();
