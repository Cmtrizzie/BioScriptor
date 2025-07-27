import { ChatMessage, ProcessedInput } from './types';

/**
 * Detects if a message appears to be templated or generic.
 */
export function isTemplatedResponse(content: string): boolean {
  const templatePatterns = [
    /^I('m| am) (an AI|a bioinformatics|an assistant)/i,
    /^As an AI assistant/i,
    /^Let me help you with/i,
    /^I understand you need help with/i,
    /^I can assist you with/i
  ];
  return templatePatterns.some(pattern => pattern.test(content));
}

/**
 * Suggests a model alternative for a given model.
 */
export function getAlternateModel(currentModel: string): string {
  const modelAlternatives: Record<string, string> = {
    'default': 'chat',
    'bio': 'science',
    'code': 'research',
    'science': 'bio',
    'research': 'default',
    'chat': 'science'
  };
  return modelAlternatives[currentModel] || 'default';
}

/**
 * Chooses the best response between two candidates.
 */
export function selectBestResponse(primary: ChatMessage, alternate: ChatMessage): ChatMessage {
  const confidenceDiff = Math.abs(primary.metadata?.confidence - alternate.metadata?.confidence);

  if (confidenceDiff > 0.2) {
    return primary.metadata?.confidence > alternate.metadata?.confidence ? primary : alternate;
  }

  const primaryTemplated = isTemplatedResponse(primary.content);
  const alternateTemplated = isTemplatedResponse(alternate.content);

  if (primaryTemplated && !alternateTemplated) return alternate;
  if (!primaryTemplated && alternateTemplated) return primary;

  return primary.content.length > alternate.content.length ? primary : alternate;
}

/**
 * Detects user intent from their message
 */
export function detectUserIntent(userMessage: string): string {
  const msg = userMessage.toLowerCase().trim();
  
  // Greeting patterns (including variations and typos)
  if (/^(hello|hi|hey|greetings|good morning|good afternoon|good evening|sup|yo|hiya|howdy)\b/i.test(msg) ||
      /^(hello thy|hi thy|hey thy|greetings thy)\b/i.test(msg) ||
      /^(helo|helo thy|hai|hai thy)\b/i.test(msg)) {
    return 'greeting';
  }
  
  // Question patterns
  if (/^(what|how|where|when|why|can you|could you|would you|is it|are there)\b/i.test(msg) ||
      msg.includes('?')) {
    return 'question';
  }
  
  // Request patterns
  if (/^(please|can you help|i need|help me|assist me|show me)\b/i.test(msg)) {
    return 'request';
  }
  
  // Farewell patterns
  if (/^(bye|goodbye|see you|talk later|thanks|thank you)\b/i.test(msg)) {
    return 'farewell';
  }
  
  return 'general';
}

/**
 * Generates natural responses based on intent
 */
export function generateNaturalResponse(intent: string, originalContent: string): string {
  switch (intent) {
    case 'greeting':
      const greetingResponses = [
        "Hey there! 😊 How can I help you today?",
        "Hello! What can I assist you with?",
        "Hi! Ready to dive into some bioinformatics work?",
        "Greetings! What would you like to explore today?",
        "Hello! How can I help with your research today?"
      ];
      return greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
      
    case 'farewell':
      const farewellResponses = [
        "Goodbye! Feel free to come back anytime.",
        "See you later! Happy researching!",
        "Thanks for using BioScriptor! Have a great day!",
        "Bye! Don't hesitate to return if you need more help."
      ];
      return farewellResponses[Math.floor(Math.random() * farewellResponses.length)];
      
    default:
      return originalContent; // Keep original for questions and requests
  }
}

/**
 * Adds tone, formatting, and structure to a message.
 */
export async function enhanceResponse(
  message: ChatMessage,
  options: {
    context: {
      previousResponses: ChatMessage[];
      currentTopic?: string;
      taskType?: string;
    };
    tone?: string;
    userSkillLevel?: string;
    userMessage?: string;
  }
): Promise<ChatMessage> {
  let content = message.content;

  // Detect user intent if we have the original user message
  if (options.userMessage) {
    const intent = detectUserIntent(options.userMessage);
    
    // For greetings and farewells, use natural responses instead of explanations
    if (intent === 'greeting' || intent === 'farewell') {
      content = generateNaturalResponse(intent, content);
      return { ...message, content };
    }
  }

  // Check if this is an explanation response that should be simplified
  if (isOverExplanation(content, options.userMessage)) {
    content = simplifyResponse(content, options.userMessage);
  }

  // Casual tone adjustments
  if (options.tone === 'casual') {
    content = content
      .replace(/\b(I will|I shall)\b/g, "I'll")
      .replace(/\b(you will|you shall)\b/g, "you'll")
      .replace(/\b(that is)\b/g, "that's")
      .replace(/\b(it is)\b/g, "it's");
  }

  // Add empathy or urgency markers
  if (options.tone === 'frustrated') {
    content = `I understand this can be frustrating. ${content}`;
  }
  if (options.tone === 'urgent') {
    content = `Let's address this right away. ${content}`;
  }

  // Beginner support message
  if (options.userSkillLevel === 'beginner' && !content.includes('For example')) {
    content += '\n\nWould you like an example or a simpler explanation?';
  }

  // Apply structure & formatting only for complex responses
  if (!isSimpleResponse(content)) {
    content = applyProStructureFormatting(content, options);
  }

  return { ...message, content };
}

/**
 * Detects if the AI response is over-explaining something simple
 */
function isOverExplanation(content: string, userMessage?: string): boolean {
  if (!userMessage) return false;
  
  const userMsg = userMessage.toLowerCase();
  const responseLength = content.length;
  
  // If user said a simple greeting and response is long, it's over-explaining
  if (responseLength > 100 && /^(hello|hi|hey|greetings|sup|yo)\b/i.test(userMsg)) {
    return true;
  }
  
  // If response contains academic explanations for simple intents
  if (content.includes('archaic') || content.includes('etymology') || 
      content.includes('linguistic') || content.includes('second-person singular')) {
    return true;
  }
  
  return false;
}

/**
 * Simplifies over-complex responses
 */
function simplifyResponse(content: string, userMessage?: string): string {
  if (!userMessage) return content;
  
  const intent = detectUserIntent(userMessage);
  return generateNaturalResponse(intent, content);
}

/**
 * Checks if response should remain simple without formatting
 */
function isSimpleResponse(content: string): boolean {
  return content.length < 150 && !content.includes('\n') && !content.includes('**');
}

/**
 * Formats content to have structure: greeting, title, bullets.
 */
function applyProStructureFormatting(content: string, options: any): string {
  if (content.includes('✅') || content.includes('🔹') || content.includes('💡')) {
    return content; // Already structured
  }

  const greeting = getContextualGreeting(options);
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length <= 1) {
    return greeting && shouldUseGreeting(options)
      ? `${greeting}\n\n${content.trim()}`
      : content.trim();
  }

  if (!shouldUseStructuredFormatting(content, options)) {
    return content.trim();
  }

  let formatted = '';

  if (greeting && shouldUseGreeting(options)) {
    formatted += `${greeting}\n\n`;
  }

  const mainLine = lines[0];
  const bodyLines = lines.slice(1, 5);

  if (isDefinitiveAnswer(mainLine)) {
    formatted += `**${mainLine}**\n\n`;
  } else {
    formatted += `${mainLine}\n\n`;
  }

  if (shouldUseBulletPoints(bodyLines)) {
    formatted += `**Key points:**\n\n`;
    bodyLines.forEach(line => {
      const emojiBullet = getEmojiBullet(line);
      formatted += `${emojiBullet} ${line.trim()}\n\n`;
    });
  } else {
    bodyLines.forEach(line => {
      formatted += `${line.trim()}\n\n`;
    });
  }

  return formatted.trim();
}

/**
 * Gets a contextual greeting depending on tone and history.
 */
function getContextualGreeting(options: any): string | null {
  const { tone, context } = options;

  if (context?.taskType === 'code' || context?.previousResponses?.length > 2) {
    return null;
  }

  const greetings: Record<string, string[]> = {
    casual: ['Hey there!', 'Hi there! 😊', 'Hello! 👋'],
    professional: ['Hello!', 'Welcome back!', 'Good to see you!'],
    excited: ['Great question! 🎯', 'Awesome! 🚀', 'Let’s dive in! 🔎'],
    frustrated: ['I’m here to help. 🙌', 'Let’s fix this. 🛠️', 'Don’t worry, we’ve got this!'],
    urgent: ['On it now! ⏱️', 'Let’s get moving. ⚡', 'Acting fast! 🔥']
  };

  const toneGreetings = greetings[tone as keyof typeof greetings] || greetings.professional;
  return toneGreetings[Math.floor(Math.random() * toneGreetings.length)];
}

/**
 * When to show greeting.
 */
function shouldUseGreeting(options: any): boolean {
  return !options?.context?.previousResponses?.length;
}

/**
 * Should structure be applied based on content?
 */
function shouldUseStructuredFormatting(content: string, options: any): boolean {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return false;

  const keywords = ['install', 'setup', 'step', 'first', 'then', 'finally', 'error', 'fix'];
  const hasInstruction = keywords.some(kw => content.toLowerCase().includes(kw));

  return hasInstruction || lines.length > 3;
}

/**
 * Detects whether the message starts definitively.
 */
function isDefinitiveAnswer(text: string): boolean {
  const patterns = [
    /^(yes|no),/i,
    /^(this is|here's|you can|you should)/i,
    /(solution|answer|result|summary)/i
  ];
  return patterns.some(p => p.test(text));
}

/**
 * Decides if the lines are list-like.
 */
function shouldUseBulletPoints(lines: string[]): boolean {
  if (lines.length < 2) return false;

  const listIndicators = lines.filter(line =>
    /^(step|first|next|also|additionally|then|finally)/i.test(line) ||
    line.includes(':') || line.length < 100
  );

  return listIndicators.length >= Math.ceil(lines.length * 0.6);
}

/**
 * Adds emojis for visual bullet enhancement.
 */
function getEmojiBullet(line: string): string {
  if (/error|fix|warning|issue/i.test(line)) return '🚫';
  if (/tip|note|consider/i.test(line)) return '💡';
  if (/step|first|then|finally|also/i.test(line)) return '🔹';
  if (/success|done|solved|correct/i.test(line)) return '✅';
  return '•';
}
