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

  // Get appropriate greeting (less frequent)
  const greeting = getContextualGreeting(options);
  
  // Split content into sections
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length <= 1) {
    // Single line response - keep simple, minimal greeting
    return greeting && shouldUseGreeting(options) ? `${greeting}\n\n${content}` : content;
  }

  // Check if content needs structured formatting
  if (!shouldUseStructuredFormatting(content, options)) {
    return content;
  }

  // Multi-line response - apply selective structure
  let formattedContent = '';
  
  // Add greeting only for first interactions or when helpful
  if (greeting && shouldUseGreeting(options)) {
    formattedContent += `${greeting}\n\n`;
  }

  // Main answer section - use checkmark only for definitive answers
  const mainAnswer = lines[0];
  if (isDefinitiveAnswer(mainAnswer)) {
    formattedContent += `**${mainAnswer}**\n\n`;
  } else {
    formattedContent += `${mainAnswer}\n\n`;
  }

  // Additional information - use bullets only for lists
  if (lines.length > 1) {
    const remainingLines = lines.slice(1, Math.min(lines.length, 4));
    
    if (shouldUseBulletPoints(remainingLines)) {
      formattedContent += `**Key points:**\n\n`;
      for (const line of remainingLines) {
        if (line.trim()) {
          formattedContent += `• ${line}\n\n`;
        }
      }
    } else {
      for (const line of remainingLines) {
        if (line.trim()) {
          formattedContent += `${line}\n\n`;
        }
      }
    }
  }

  return formattedContent.trim();
}

function getContextualGreeting(options: any): string | null {
  const { tone, context } = options;
  
  // Skip greeting for follow-up questions or code responses
  if (context?.taskType === 'code' || context?.previousResponses?.length > 2) {
    return null;
  }

  const greetings = {
    casual: ['Hey there!', 'Hi there!', 'Hello!'],
    professional: ['Hello!', 'Good to see you!', 'Welcome!'],
    excited: ['Great question!', 'Excellent!', 'Perfect timing!'],
    frustrated: ['I\'m here to help!', 'Let\'s solve this!', 'I\'ve got you covered!'],
    urgent: ['Right away!', 'Let\'s get this done!', 'On it!']
  };

  const toneGreetings = greetings[tone as keyof typeof greetings] || greetings.professional;
  return toneGreetings[Math.floor(Math.random() * toneGreetings.length)];
}

function shouldUseGreeting(options: any): boolean {
  const { context } = options;
  
  // Use greeting only for first message or after long gaps
  return !context?.previousResponses || context.previousResponses.length === 0;
}

function shouldUseStructuredFormatting(content: string, options: any): boolean {
  const { context } = options;
  
  // Use structured formatting for:
  // - Complex explanations (multiple paragraphs)
  // - Technical instructions
  // - Lists or step-by-step content
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) return false;
  
  // Check for technical or instructional content
  const technicalKeywords = ['install', 'configure', 'setup', 'step', 'first', 'then', 'next', 'finally'];
  const hasTechnicalContent = technicalKeywords.some(keyword => 
    content.toLowerCase().includes(keyword)
  );
  
  return hasTechnicalContent || lines.length > 3;
}

function isDefinitiveAnswer(text: string): boolean {
  // Use checkmark for clear, definitive statements
  const definitivePatterns = [
    /^(yes|no),/i,
    /^(here's|this is|that's)/i,
    /^(you can|you should|you need)/i,
    /(solution|answer|result)/i
  ];
  
  return definitivePatterns.some(pattern => pattern.test(text));
}

function shouldUseBulletPoints(lines: string[]): boolean {
  // Use bullets for actual lists or multiple distinct points
  if (lines.length < 2) return false;
  
  // Check if content looks like a list
  const listIndicators = lines.filter(line => 
    /^(step|first|second|third|next|then|also|additionally)/i.test(line.trim()) ||
    line.includes(':') ||
    line.length < 100 // Short, concise points
  );
  
  return listIndicators.length >= Math.ceil(lines.length * 0.6);
}
