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
 * Detects user intent from their message with improved pattern matching
 */
export function detectUserIntent(userMessage: string): string {
  const msg = userMessage.toLowerCase().trim();

  // Enhanced greeting patterns (including more variations and casual forms)
  const greetingPatterns = [
    /^(hello|hi|hey|greetings|good morning|good afternoon|good evening|sup|yo|hiya|howdy|waddup|wassup)\b/i,
    /^(hello thy|hi thy|hey thy|greetings thy|hai thy|helo thy)\b/i,
    /^(helo|hai|ey|eyo|yoo|heya|heyy|hii|hiiii)\b/i,
    /^(wazup|whats up|what's up|gud morning|good mornin|gm|hello wazup)\b/i,
    /^(salutations|bonjour|hola|ciao|aloha|greetings|morning|afternoon|evening)\b/i
  ];

  if (greetingPatterns.some(pattern => pattern.test(msg))) {
    return 'greeting';
  }

  // Code request patterns
  const codePatterns = [
    /\b(give me|show me|create|write|generate|make me).*(code|html|css|javascript|python|example)\b/i,
    /\b(html|css|javascript|python|code).*(example|template|sample)\b/i,
    /^(ready to run|give me an? .* example)\b/i
  ];

  if (codePatterns.some(pattern => pattern.test(msg))) {
    return 'code_request';
  }

  // Capability inquiry patterns
  const capabilityPatterns = [
    /\b(what are you|what can you|what do you|what are you good at|what are you after|capabilities|skills)\b/i,
    /\b(help me with|assist me with|what can you help)\b/i
  ];

  if (capabilityPatterns.some(pattern => pattern.test(msg))) {
    return 'capability_inquiry';
  }

  // Thanks patterns
  const thanksPatterns = [
    /^(thanks|thank you|thx|ty|appreciate|cheers|much appreciated)\b/i,
    /\b(thanks|thank you|thx|ty|appreciate it|cheers)\b/i
  ];

  if (thanksPatterns.some(pattern => pattern.test(msg))) {
    return 'thanks';
  }

  // Question patterns
  if (/^(what|how|where|when|why|can you|could you|would you|is it|are there|do you|will you)\b/i.test(msg) ||
      msg.includes('?')) {
    return 'question';
  }

  // Request patterns
  if (/^(please|can you help|i need|help me|assist me|show me|could you|would you mind)\b/i.test(msg)) {
    return 'request';
  }

  // Bioinformatics specific patterns
  const bioPatterns = [
    /\b(sequence|dna|rna|protein|blast|alignment|crispr|pcr|analysis)\b/i,
    /\b(biological|bioinformatics|molecular|genetics|genome)\b/i
  ];

  if (bioPatterns.some(pattern => pattern.test(msg))) {
    return 'bioinformatics';
  }

  // Farewell patterns
  const farewellPatterns = [
    /^(bye|goodbye|see you|see ya|talk later|catch you later|peace|adios|au revoir)\b/i,
    /^(gotta go|gtg|cya|take care|until next time|farewell)\b/i
  ];

  if (farewellPatterns.some(pattern => pattern.test(msg))) {
    return 'farewell';
  }

  return 'general';
}

/**
 * Generates natural responses based on intent with enhanced personality
 */
export function generateNaturalResponse(intent: string, userMessage: string): string {
  switch (intent) {
    case 'greeting':
      const greetingResponses = [
        "Hello! What can I assist you with?",
        "Hi! Ready to dive into some bioinformatics work?",
        "Hey there! 👋 What's on your mind?",
        "Hi! Great to see you back! 😊",
        "Hello! 🧬 What can I help you with today?",
        "Hey! What would you like to explore?",
        "Hi there! How can I assist you?",
        "Hello! Ready to tackle some science? 🔬",
        "Hey! What's up? 😊"
      ];
      return greetingResponses[Math.floor(Math.random() * greetingResponses.length)];

    case 'code_request':
      const codeResponses = [
        "Sure! Here's a code example for you:",
        "Absolutely! Let me create that for you:",
        "Coming right up! Here's the code:",
        "Perfect! Here's what you need:",
        "Got it! Here's a working example:",
        "No problem! Here's the code you requested:"
      ];
      return codeResponses[Math.floor(Math.random() * codeResponses.length)];

    case 'capability_inquiry':
      return `I'm BioScriptor, your AI bioinformatics assistant! 🧬

**Here's what I excel at:**

🔹 **Bioinformatics Analysis** — DNA/RNA/protein sequences, BLAST searches, alignments
🔹 **Code Generation** — Python, R, HTML, CSS, JavaScript with working examples
🔹 **CRISPR Design** — Guide RNA sequences and off-target analysis
🔹 **PCR Simulation** — Primer design and virtual gel electrophoresis
🔹 **File Processing** — FASTA, FASTQ, VCF, and other bioinformatics formats

💡 **Try asking:**
• "Design CRISPR guides for my gene"
• "Give me HTML code example"
• "Analyze this protein sequence"

What interests you most?`;

    case 'thanks':
      const thanksResponses = [
        "You're welcome! 😊",
        "Happy to help! 👍",
        "No problem at all!",
        "Glad I could assist! 🙂",
        "Anytime! Feel free to ask more questions.",
        "You got it! 😊",
        "My pleasure! Let me know if you need anything else.",
        "Of course! That's what I'm here for! 🧬"
      ];
      return thanksResponses[Math.floor(Math.random() * thanksResponses.length)];

    case 'farewell':
      const farewellResponses = [
        "Goodbye! Feel free to come back anytime.",
        "See you later! Happy researching!",
        "Thanks for using BioScriptor! Have a great day!",
        "Bye! Don't hesitate to return if you need more help.",
        "Take care! 👋",
        "See you soon! Good luck with your work! 🧬",
        "Catch you later! Feel free to return anytime.",
        "Peace out! Hope your research goes well! ✨"
      ];
      return farewellResponses[Math.floor(Math.random() * farewellResponses.length)];

    case 'bioinformatics':
      return `Great! I can help with bioinformatics analysis. 🧬

**What type of analysis do you need?**

🔹 **Sequence Analysis** — DNA, RNA, or protein sequences
🔹 **CRISPR Design** — Guide RNA design and off-target checking
🔹 **PCR Simulation** — Primer design and optimization
🔹 **File Processing** — FASTA, FASTQ, VCF format handling

💡 **Quick suggestions:**
1️⃣ Upload a sequence file for analysis
2️⃣ Ask about specific tools or methods
3️⃣ Request code for data processing

What would you like to start with?`;

    default:
      return '';
  }
}

export function generateStructuredResponse(topic: string, userMessage: string): string {
  const msg = userMessage.toLowerCase();

  // Protein sequence analysis
  if (msg.includes('protein') && (msg.includes('sequence') || msg.includes('analysis'))) {
    return `Got it! Protein sequence analysis can involve several steps depending on what you're looking for.

Here's what I can assist you with:

🔹 **Sequence Alignment** — Compare your sequence with others using tools like BLAST or Clustal Omega.
🔹 **Functional Prediction** — Identify domains, motifs, and possible biological roles.
🔹 **Structure Analysis** — Predict 3D structure or analyze existing models.
🔹 **Annotation** — Tag regions like signal peptides, binding sites, etc.

💡 Would you like to:
1️⃣ Align this sequence with known proteins?
2️⃣ Predict its function or structure?
3️⃣ Upload a sequence file for analysis?

Let me know how you'd like to proceed!`;
  }

  // DNA/RNA sequence analysis
  if ((msg.includes('dna') || msg.includes('rna')) && (msg.includes('sequence') || msg.includes('analysis'))) {
    return `Perfect! DNA/RNA sequence analysis offers many possibilities depending on your research goals.

Here's what I can help you with:

🔹 **Sequence Alignment** — BLAST search against databases or align multiple sequences.
🔹 **Gene Annotation** — Identify coding regions, promoters, and regulatory elements.
🔹 **Variant Analysis** — Find SNPs, indels, and structural variations.
🔹 **Quality Control** — Assess sequence quality and trim low-quality regions.

💡 Would you like to:
1️⃣ Run a BLAST search on your sequence?
2️⃣ Annotate genes and features?
3️⃣ Analyze sequence variants?

What type of analysis interests you most?`;
  }

  // File upload assistance
  if (msg.includes('file') || msg.includes('upload') || msg.includes('fasta') || msg.includes('fastq')) {
    return `Great! I can help you analyze various bioinformatics file formats.

Here's what I support:

🔹 **FASTA Files** — Protein/DNA/RNA sequences for alignment and analysis.
🔹 **FASTQ Files** — Raw sequencing data with quality scores.
🔹 **VCF Files** — Variant calling format for genomic variations.
🔹 **BED/GFF Files** — Genomic feature annotations.

💡 Would you like to:
1️⃣ Upload a file for immediate analysis?
2️⃣ Learn about file format requirements?
3️⃣ Get help preparing your data?

What type of file are you working with?`;
  }

  // General bioinformatics help
  if (msg.includes('bioinformatics') || msg.includes('analysis') || msg.includes('help')) {
    return `Excellent! I'm here to help with all aspects of bioinformatics analysis.

Here are my main capabilities:

🔹 **Sequence Analysis** — DNA, RNA, and protein sequence processing.
🔹 **File Processing** — Handle FASTA, FASTQ, VCF, and other formats.
🔹 **Tool Guidance** — Help with popular tools like BLAST, BWA, GATK, etc.
🔹 **Code Generation** — Create scripts for data processing pipelines.

💡 Would you like to:
1️⃣ Start with sequence analysis?
2️⃣ Get help with a specific tool?
3️⃣ Create a data processing pipeline?

What's your current project or challenge?`;
  }

  return '';
}

/**
 * Generates smart follow-up suggestions based on context
 */
function generateFollowUpSuggestions(intent: string, userMessage: string, context: any): string {
  const suggestions: Record<string, string[]> = {
    'code_request': [
      "Need CSS styling for this?",
      "Want me to explain how it works?",
      "Should I add JavaScript functionality?"
    ],
    'bioinformatics': [
      "Upload a sequence file for analysis",
      "Learn about specific analysis tools",
      "Generate processing scripts"
    ],
    'question': [
      "Need a working example?",
      "Want step-by-step instructions?",
      "Should I provide more details?"
    ],
    'general': [
      "Ask about bioinformatics analysis",
      "Request code examples",
      "Upload files for processing"
    ]
  };

  const intentSuggestions = suggestions[intent] || suggestions.general;
  const randomSuggestions = intentSuggestions.slice(0, 2);
  
  if (randomSuggestions.length > 0) {
    return `\n\n💡 **Quick suggestions:**\n${randomSuggestions.map((s, i) => `${i + 1}️⃣ ${s}`).join('\n')}`;
  }
  
  return '';
}

/**
 * Adds tone, formatting, and structure to a message with enhanced intent handling
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

    // For specific intents, use natural responses instead of AI-generated content
    if (['greeting', 'farewell', 'thanks', 'capability_inquiry', 'bioinformatics'].includes(intent)) {
      content = generateNaturalResponse(intent, options.userMessage);
      return { ...message, content };
    }

    // For code requests, ensure proper formatting
    if (intent === 'code_request') {
      const naturalResponse = generateNaturalResponse(intent, options.userMessage);
      if (!content.includes('```') && !content.includes('<pre>')) {
        // If AI didn't provide code, generate a basic HTML example
        content = `${naturalResponse}\n\n\`\`\`html\n<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <p>This is a basic HTML page.</p>\n</body>\n</html>\n\`\`\``;
      } else {
        content = `${naturalResponse}\n\n${content}`;
      }
      
      // Add follow-up suggestions
      content += generateFollowUpSuggestions(intent, options.userMessage, options.context);
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

  // Add follow-up suggestions for complex responses
  if (options.userMessage && !isSimpleResponse(content)) {
    const intent = detectUserIntent(options.userMessage);
    content += generateFollowUpSuggestions(intent, options.userMessage, options.context);
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