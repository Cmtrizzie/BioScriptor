import { ChatMessage, ProcessedInput } from './types';

export function isTemplatedResponse(content: string): boolean {
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

export function getAlternateModel(currentModel: string): string {
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

export function selectBestResponse(primary: ChatMessage, alternate: ChatMessage): ChatMessage {
  // Prefer responses with higher confidence
  if (Math.abs(primary.metadata?.confidence - alternate.metadata?.confidence) > 0.2) {
    return primary.metadata?.confidence > alternate.metadata?.confidence ? primary : alternate;
  }

  // If confidences are similar, prefer the more natural response
  const primaryTemplated = isTemplatedResponse(primary.content);
  const alternateTemplated = isTemplatedResponse(alternate.content);
  
  if (primaryTemplated && !alternateTemplated) return alternate;
  if (!primaryTemplated && alternateTemplated) return primary;
  
  // If both are similar, prefer the more detailed response
  return primary.content.length > alternate.content.length ? primary : alternate;
}

export async function enhanceResponse(message: ChatMessage, options: {
  context: {
    previousResponses: ChatMessage[];
    currentTopic?: string;
    taskType?: string;
  };
  tone?: string;
  userSkillLevel?: string;
}): Promise<ChatMessage> {
  let content = message.content;
  
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
    ...message,
    content: content
  };
}
