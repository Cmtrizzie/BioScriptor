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
  
  // Apply professional structure formatting
  content = applyProStructureFormatting(content, options);
  
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

function applyProStructureFormatting(content: string, options: any): string {
  // Don't format if already well-structured
  if (content.includes('✅') || content.includes('🔹') || content.includes('💡')) {
    return content;
  }

  // Get appropriate greeting
  const greeting = getContextualGreeting(options);
  
  // Split content into sections
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length <= 1) {
    // Single line response - keep simple with greeting
    return greeting ? `${greeting}\n\n${content}` : content;
  }

  // Multi-line response - apply full structure
  let formattedContent = '';
  
  // Add greeting if appropriate
  if (greeting) {
    formattedContent += `${greeting}\n\n`;
  }

  // Main answer section
  const mainAnswer = lines[0];
  formattedContent += `✅ **${mainAnswer}**\n\n`;

  // Additional information as bullet points
  if (lines.length > 1) {
    formattedContent += `💡 **Here's what you need to know:**\n\n`;
    
    for (let i = 1; i < Math.min(lines.length, 4); i++) {
      const line = lines[i].trim();
      if (line) {
        formattedContent += `🔹 ${line}\n\n`;
      }
    }
  }

  // Add helpful closing
  formattedContent += `➡️ Need help with anything else? Just let me know!`;

  return formattedContent;
}

function getContextualGreeting(options: any): string | null {
  const { tone, context } = options;
  
  // Skip greeting for follow-up questions or code responses
  if (context?.taskType === 'code' || context?.previousResponses?.length > 2) {
    return null;
  }

  const greetings = {
    casual: ['Hey there! 👋', 'Hi! 🧬', 'Hello! 👨‍🔬'],
    professional: ['Hello! 👋', 'Greetings! 🧬', 'Good to see you! 👨‍🔬'],
    excited: ['Hey there! 🚀', 'Hi! ⚡', 'Hello! 🎉'],
    frustrated: ['I\'m here to help! 💪', 'Let\'s solve this! 🔧', 'I\'ve got you covered! ✨'],
    urgent: ['Right away! ⚡', 'Let\'s get this done! 🚀', 'On it! 💪']
  };

  const toneGreetings = greetings[tone as keyof typeof greetings] || greetings.professional;
  return toneGreetings[Math.floor(Math.random() * toneGreetings.length)];
}
