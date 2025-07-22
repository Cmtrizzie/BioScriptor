import { FaultTolerantAI } from './ai-providers';
import { ChatMessage } from './types';
import { getAlternateModel, selectBestResponse, enhanceResponse } from './response-enhancer';

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
  }): Promise<ChatMessage> {
    // Get primary response using default model
    const primaryResponse = await this.ai.processMessage(message, 'default');

    // Get response from alternate model for comparison
    const alternateModel = getAlternateModel('default');
    const alternateResponse = await this.ai.processMessage(message, alternateModel);

    // Select the best response
    const bestResponse = selectBestResponse(primaryResponse, alternateResponse);

    // Enhance the response with personality and context
    const enhancedResponse = await enhanceResponse(bestResponse, {
      context: {
        previousResponses: context.previousMessages,
        currentTopic: context.currentTopic,
        taskType: context.taskType
      },
      tone: context.tone,
      userSkillLevel: context.userSkillLevel
    });

    return enhancedResponse;
  }
}
