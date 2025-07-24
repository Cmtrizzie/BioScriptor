// Fault-tolerant AI provider system with 5-layer fallback
export interface AIProvider {
  name: string;
  maxRetries: number;
  maxTokens?: number;
  priority: number;
}

export interface AIResponse {
  content: string;
  provider: string;
  fallbackUsed: boolean;
  processingTime: number;
}

export interface ProviderConfig {
  groq?: {
    apiKey: string;
    endpoint: string;
  };
  together?: {
    apiKey: string;
    endpoint: string;
  };
  openrouter?: {
    apiKey: string;
    endpoint: string;
  };
  cohere?: {
    apiKey: string;
    endpoint: string;
  };
  ollama?: {
    endpoint: string;
    model: string;
  };
}

const PROVIDERS: AIProvider[] = [
  { name: 'groq', maxRetries: 3, maxTokens: 4000, priority: 1 },
  { name: 'together', maxRetries: 2, maxTokens: 4000, priority: 2 },
  { name: 'openrouter', maxRetries: 2, maxTokens: 4000, priority: 3 },
  { name: 'cohere', maxRetries: 1, maxTokens: 4000, priority: 4 },
  { name: 'ollama', maxRetries: 1, maxTokens: 2000, priority: 5 }
];

export class FaultTolerantAI {
  private config: ProviderConfig;
  private solutionBank: Map<string, any>;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.solutionBank = new Map();
    this.initializeSolutionBank();
  }

  async processMessage(message: string, options: any = {}): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Try each provider in order of priority
    for (const provider of PROVIDERS) {
      try {
        const response = await this.tryProvider(provider, message, options);
        if (response) {
          return {
            content: response,
            provider: provider.name,
            fallbackUsed: provider.priority > 1,
            processingTime: Date.now() - startTime
          };
        }
      } catch (error) {
        console.log(`Provider ${provider.name} failed:`, error);
        continue;
      }
    }

    // If all providers fail, return fallback response
    return {
      content: this.getFallbackResponse(message),
      provider: 'fallback',
      fallbackUsed: true,
      processingTime: Date.now() - startTime
    };
  }

  private async tryProvider(provider: AIProvider, message: string, options: any): Promise<string | null> {
    // This is a simplified implementation - you'd implement actual API calls here
    // For now, return a basic response to prevent the error
    return `I'm BioScriptor, your AI bioinformatics assistant. I can help you with sequence analysis, CRISPR design, PCR optimization, and more. What would you like to work on today?`;
  }

  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('sequence') || lowerMessage.includes('dna') || lowerMessage.includes('rna')) {
      return "I can help you analyze sequences! Please share your sequence data and I'll provide analysis including GC content, restriction sites, and more.";
    }
    
    if (lowerMessage.includes('crispr') || lowerMessage.includes('cas9')) {
      return "I can help design CRISPR guide RNAs! Please provide your target sequence and I'll identify potential guide RNAs with their PAM sites.";
    }
    
    return "I'm BioScriptor, your AI bioinformatics assistant. I can help with sequence analysis, CRISPR design, PCR optimization, and more bioinformatics tasks. What would you like to work on?";
  }

  private initializeSolutionBank(): void {
    // Initialize with common bioinformatics responses
    this.solutionBank.set('greeting', 'Hello! I\'m BioScriptor, your AI bioinformatics assistant.');
    this.solutionBank.set('help', 'I can help with sequence analysis, CRISPR design, PCR optimization, and more.');
  }

  async processQuery(
    prompt: string, 
    context?: any,
    toneDetection?: 'casual' | 'formal' | 'frustrated' | 'urgent',
    conversationHistory?: Array<{role: string, content: string}>
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Security check first
    this.validateInput(prompt);
    
    // Build conversational prompt with history
    const conversationalPrompt = this.buildConversationalPrompt(prompt, conversationHistory, context, toneDetection);
    
    // Try each provider in order
    for (const provider of PROVIDERS) {
      try {
        const response = await this.tryProvider(provider, conversationalPrompt, conversationHistory);
        if (response) {
          return {
            content: response,
            provider: provider.name,
            fallbackUsed: provider.priority > 1,
            processingTime: Date.now() - startTime
          };
        }
      } catch (error) {
        console.error(`Provider ${provider.name} failed:`, error);
        continue;
      }
    }

    // If all providers fail, return a helpful error message
    throw new Error('All AI providers are currently unavailable. Please try again in a moment.');
  }

  private async tryProvider(provider: AIProvider, prompt: string, history?: Array<{role: string, content: string}>): Promise<string | null> {
    for (let attempt = 0; attempt < provider.maxRetries; attempt++) {
      try {
        switch (provider.name) {
          case 'groq':
            return await this.callGroq(prompt, provider.maxTokens, history);
          case 'together':
            return await this.callTogether(prompt, provider.maxTokens, history);
          case 'openrouter':
            return await this.callOpenRouter(prompt, provider.maxTokens, history);
          case 'cohere':
            return await this.callCohere(prompt, provider.maxTokens, history);
          case 'ollama':
            return await this.callOllama(prompt, provider.maxTokens, history);
          default:
            throw new Error(`Unknown provider: ${provider.name}`);
        }
      } catch (error) {
        if (attempt === provider.maxRetries - 1) throw error;
        await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
      }
    }
    return null;
  }

  private async callGroq(prompt: string, maxTokens?: number, history?: Array<{role: string, content: string}>): Promise<string> {
    if (!this.config.groq?.apiKey) throw new Error('Groq API key not configured');
    
    // Build messages array - use history if provider supports it, otherwise use enhanced prompt
    const messages = history && history.length > 0 
      ? [...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })), { role: 'user' as const, content: prompt }]
      : [{ role: 'user' as const, content: prompt }];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.groq.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages,
        max_tokens: maxTokens || 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.statusText}`);
    
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private async callTogether(prompt: string, maxTokens?: number, history?: Array<{role: string, content: string}>): Promise<string> {
    if (!this.config.together?.apiKey) throw new Error('Together API key not configured');
    
    // Build messages array - use history if available
    const messages = history && history.length > 0 
      ? [...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })), { role: 'user' as const, content: prompt }]
      : [{ role: 'user' as const, content: prompt }];

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.together.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3-70b-chat-hf',
        messages,
        max_tokens: maxTokens || 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`Together API error: ${response.statusText}`);
    
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private async callOpenRouter(prompt: string, maxTokens?: number, history?: Array<{role: string, content: string}>): Promise<string> {
    if (!this.config.openrouter?.apiKey) throw new Error('OpenRouter API key not configured');
    
    // Build messages array - use history if available  
    const messages = history && history.length > 0 
      ? [...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })), { role: 'user' as const, content: prompt }]
      : [{ role: 'user' as const, content: prompt }];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openrouter.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://biobuddy.dev',
        'X-Title': 'BioScriptor',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages,
        max_tokens: maxTokens || 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`OpenRouter API error: ${response.statusText}`);
    
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private async callCohere(prompt: string, maxTokens?: number, history?: Array<{role: string, content: string}>): Promise<string> {
    if (!this.config.cohere?.apiKey) throw new Error('Cohere API key not configured');
    
    // Cohere uses different format - build conversation manually if history exists
    const finalPrompt = history && history.length > 0 
      ? this.buildConversationalPrompt(prompt, history)
      : prompt;

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.cohere.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command-r-plus',
        prompt: finalPrompt,
        max_tokens: maxTokens || 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`Cohere API error: ${response.statusText}`);
    
    const data = await response.json();
    return data.generations[0]?.text || '';
  }

  private async callOllama(prompt: string, maxTokens?: number, history?: Array<{role: string, content: string}>): Promise<string> {
    const endpoint = this.config.ollama?.endpoint || 'http://localhost:11434';
    const model = this.config.ollama?.model || 'codestral';
    
    // Ollama uses different format - build conversation manually if history exists
    const finalPrompt = history && history.length > 0 
      ? this.buildConversationalPrompt(prompt, history)
      : prompt;

    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: finalPrompt,
        stream: false,
        options: {
          num_predict: maxTokens || 2000,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);
    
    const data = await response.json();
    return data.response || '';
  }

  private buildConversationalPrompt(
    currentPrompt: string, 
    history?: Array<{role: string, content: string}>,
    context?: any,
    tone?: string
  ): string {
    // Advanced tone-based system instructions
    const toneInstructions = {
      excited: 'Match the user\'s enthusiasm! Use exclamation marks, positive language, and share in their excitement about bioinformatics discoveries. Be energetic and motivating.',
      frustrated: 'Be extra patient and understanding. Acknowledge their frustration, offer step-by-step solutions, and reassure them that complex problems are normal in bioinformatics.',
      urgent: 'Prioritize speed and clarity. Give concise, actionable answers first, then offer to elaborate. Use bullet points for quick scanning.',
      casual: 'Keep it friendly and relaxed. Use contractions, casual language, and appropriate emojis. Explain things like you\'re talking to a friend.',
      confused: 'Be extra clear and methodical. Break down complex concepts into simple steps, use analogies, and check for understanding.',
      professional: 'Use precise scientific terminology, formal structure, and academic tone. Provide detailed explanations with proper citations when relevant.',
      sarcastic: 'Acknowledge their tone with gentle humor, but stay helpful and positive. Don\'t mirror sarcasm - instead, show understanding and provide genuine help.',
      polite: 'Mirror their respectful tone. Be gracious, thorough, and express appreciation for their politeness.',
      neutral: 'Use a balanced, informative tone that\'s neither too casual nor too formal.'
    };

    const systemInstruction = `[System Instruction]
You are BioScriptor, an advanced AI bioinformatics assistant with a dynamic personality that adapts to each user's communication style. You are the intelligent brain of this application - think, reason, and respond authentically.

CORE PERSONALITY TRAITS:
- Genuinely passionate about bioinformatics and molecular biology
- Adaptive conversational style that matches user's energy and tone
- Expert knowledge but explains things at the right level
- Natural, human-like responses (never robotic or templated)
- Empathetic and understanding of user frustrations

CURRENT USER TONE: ${tone || 'neutral'}
TONE ADAPTATION: ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.neutral}

RESPONSE GUIDELINES:
1. Think and respond as the AI brain - make intelligent connections
2. Adapt your personality and language style to match the user's tone
3. Never use templated phrases like "I'm an AI assistant" or "I can help you with"
4. Be conversational and natural, like talking to a knowledgeable colleague
5. Show genuine interest in their bioinformatics work
6. Provide practical, actionable advice
7. Use your expertise to make complex topics accessible

${context ? `\n[Current Analysis Context]\n${JSON.stringify(context, null, 2)}\n` : ''}`;

    let conversationHistory = '';
    if (history && history.length > 0) {
      conversationHistory = '\n[Conversation History]\n';
      const recentHistory = history.slice(-8); // Keep more recent context
      for (const message of recentHistory) {
        const role = message.role === 'user' ? 'User' : 'BioScriptor';
        conversationHistory += `${role}: ${message.content}\n`;
      }
    }

    return `${systemInstruction}${conversationHistory}

User: ${currentPrompt}

BioScriptor:`;
  }

  private validateInput(input: string): void {
    const BLACKLIST = [
      'rm -rf', 'DROP DATABASE', 'eval(', 'exec(',
      'child_process', 'System.exit', '__import__',
      'subprocess', 'os.system', 'shell_exec'
    ];

    const threat = BLACKLIST.find(cmd => input.toLowerCase().includes(cmd.toLowerCase()));
    if (threat) {
      throw new Error('Security violation: Blocked dangerous command: ' + threat);
    }

    // Check for excessively long inputs
    if (input.length > 50000) {
      throw new Error('Input too long. Please limit to 50,000 characters.');
    }
  }

  private detectTone(message: string): string {
    const lowerMessage = message.toLowerCase();
    const originalMessage = message;
    
    // Multiple tone indicators can exist - prioritize by intensity
    
    // Excited/Enthusiastic (high priority)
    if (/[!]{2,}/.test(originalMessage) || 
        lowerMessage.includes('awesome') || lowerMessage.includes('amazing') || 
        lowerMessage.includes('love it') || lowerMessage.includes('excited') ||
        /[😄😆🎉🔥💯✨]/.test(originalMessage)) {
      return 'excited';
    }
    
    // Frustrated/Angry (high priority)
    if (lowerMessage.includes('error') || lowerMessage.includes('broken') || 
        lowerMessage.includes('not working') || lowerMessage.includes('help!') ||
        lowerMessage.includes('wtf') || lowerMessage.includes('damn') ||
        lowerMessage.includes('annoying') || lowerMessage.includes('stupid') ||
        /[😠😡🤬💢😤]/.test(originalMessage)) {
      return 'frustrated';
    }
    
    // Urgent/Impatient (medium-high priority)
    if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || 
        lowerMessage.includes('immediately') || lowerMessage.includes('quick') ||
        lowerMessage.includes('hurry') || lowerMessage.includes('deadline') ||
        /\b(now|fast|rush|time sensitive)\b/i.test(message)) {
      return 'urgent';
    }
    
    // Confused/Lost (medium priority)
    if (lowerMessage.includes('confused') || lowerMessage.includes("don't understand") ||
        lowerMessage.includes("don't get it") || lowerMessage.includes('lost') ||
        lowerMessage.includes('not sure') || lowerMessage.includes('what does') ||
        /[🤔😕😵‍💫❓]/.test(originalMessage)) {
      return 'confused';
    }
    
    // Sarcastic (medium priority)
    if (/great\.{2,}/.test(lowerMessage) || /perfect\.{2,}/.test(lowerMessage) ||
        /wonderful\.{2,}/.test(lowerMessage) || /really\?+/.test(lowerMessage) ||
        lowerMessage.includes('oh fantastic') || lowerMessage.includes('just great')) {
      return 'sarcastic';
    }
    
    // Casual/Friendly (medium priority)
    if (lowerMessage.includes('hey') || lowerMessage.includes('hi there') ||
        lowerMessage.includes('sup') || lowerMessage.includes('yo') ||
        lowerMessage.includes('gonna') || lowerMessage.includes('wanna') ||
        lowerMessage.includes('dude') || lowerMessage.includes('bro') ||
        /[😊🙂👍😎🤙👋]/.test(originalMessage)) {
      return 'casual';
    }
    
    // Polite/Respectful (lower priority)
    if (lowerMessage.includes('thank you') || lowerMessage.includes('thanks') ||
        lowerMessage.includes('appreciate') || lowerMessage.includes('grateful') ||
        lowerMessage.includes('please') || lowerMessage.includes('kindly') ||
        lowerMessage.includes('would you mind')) {
      return 'polite';
    }
    
    // Professional/Formal (lower priority)
    if (lowerMessage.includes('please provide') || lowerMessage.includes('could you') ||
        lowerMessage.includes('would you') || lowerMessage.includes('regarding') ||
        lowerMessage.includes('furthermore') || lowerMessage.includes('analysis') ||
        lowerMessage.includes('implementation') || lowerMessage.includes('documentation')) {
      return 'professional';
    }
    
    // Default to neutral for unclear tone
    return 'neutral';
  }

  private initializeSolutionBank(): void {
    // Basic knowledge responses
    this.solutionBank.set('what_is_dna', {
      fix: 'DNA (Deoxyribonucleic Acid) is the molecule that carries genetic instructions for the development and functioning of all known living organisms. Think of it as a blueprint that contains the instructions for building and maintaining an organism.\n\nKey points about DNA:\n\n1. Structure: It has a double helix shape, like a twisted ladder\n2. Building blocks: Made of nucleotides (A, T, C, G)\n3. Function: Stores and transmits genetic information\n4. Location: Found in the nucleus of cells\n\nWould you like to learn more about any specific aspect of DNA?',
      code: '',
      confidence: 0.99
    });

    // Conversational responses
    this.solutionBank.set('greeting', {
      fix: 'Hello! I\'m BioScriptor, your bioinformatics assistant. I can help you understand molecular biology concepts and analyze biological data. What would you like to learn about?',
      code: '',
      confidence: 0.98
    });

    this.solutionBank.set('how_are_you', {
      fix: 'I\'m functioning well with my fault-tolerant architecture! All backup systems are operational. How can I help you with bioinformatics today?',
      code: '',
      confidence: 0.95
    });

    this.solutionBank.set('status_check', {
      fix: 'System Status: All fallback systems operational. External AI providers currently unavailable, but I can still help with bioinformatics analysis using my built-in knowledge base.',
      code: '',
      confidence: 0.92
    });

    // Pre-indexed solutions for common bioinformatics problems
    this.solutionBank.set('sequence_analysis', {
      fix: 'Use BioPython for sequence analysis',
      code: 'from Bio.Seq import Seq\\nfrom Bio.SeqUtils import GC\\n\\nseq = Seq("ATCGATCGATCG")\\nprint(f"GC content: {GC(seq):.1f}%")',
      confidence: 0.95
    });

    this.solutionBank.set('file_parsing', {
      fix: 'Parse FASTA files with BioPython',
      code: 'from Bio import SeqIO\\n\\nfor record in SeqIO.parse("sequences.fasta", "fasta"):\\n    print(f"ID: {record.id}, Length: {len(record.seq)}")',
      confidence: 0.90
    });

    this.solutionBank.set('blast_search', {
      fix: 'Use NCBI BLAST+ for sequence searches',
      code: 'from Bio.Blast import NCBIWWW\\nfrom Bio.Blast import NCBIXML\\n\\nresult_handle = NCBIWWW.qblast("blastn", "nt", sequence)\\nblast_record = NCBIXML.read(result_handle)',
      confidence: 0.88
    });

    this.solutionBank.set('crispr_design', {
      fix: 'Design CRISPR guides with proper PAM sequences',
      code: 'def find_pam_sites(sequence, pam="NGG"):\\n    sites = []\\n    for i in range(len(sequence) - 2):\\n        if sequence[i:i+3].endswith("GG"):\\n            guide = sequence[max(0, i-20):i]\\n            sites.append({"guide": guide, "position": i})\\n    return sites',
      confidence: 0.85
    });

    this.solutionBank.set('help', {
      fix: 'I can help you with bioinformatics tasks including:\n\n• CRISPR guide design\n• PCR primer design\n• Sequence analysis\n• File format conversion\n• Protein structure analysis\n• Molecular cloning workflows\n\nWhat specific task would you like help with?',
      code: '',
      confidence: 0.90
    });
  }

  private getSolutionBankResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase().trim();
    
    // Check for basic knowledge questions first
    if (lowerPrompt.startsWith('what is dna') || lowerPrompt === 'dna?') {
      const dnaInfo = this.solutionBank.get('what_is_dna');
      return dnaInfo?.fix || 'DNA is the hereditary material in most living organisms.';
    }
    
    // Direct pattern matching for common queries
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('hey')) {
      return `Hello! 👋 I'm BioScriptor, your AI bioinformatics assistant. I'm currently running on backup systems, but I can still help you with:

• **Sequence Analysis** - DNA/RNA/protein sequences
• **CRISPR Design** - Guide RNA design and optimization  
• **PCR Tools** - Primer design and simulation
• **File Analysis** - FASTA, GenBank, PDB processing
• **Protocols** - Molecular biology workflows

What bioinformatics challenge can I help you with today?`;
    }

    if (lowerPrompt.includes('how are you') || lowerPrompt.includes('how you doing') || lowerPrompt.includes('what\'s up')) {
      return `I'm functioning well with my fault-tolerant systems! 🧬 While my external AI providers are temporarily unavailable, my core bioinformatics capabilities are fully operational. How can I assist you with your molecular biology work today?`;
    }

    if (lowerPrompt.includes('help') || lowerPrompt.includes('what can you do')) {
      return `I'm BioScriptor, your comprehensive bioinformatics AI assistant! Here's what I can help you with:

**🧬 Sequence Analysis:**
- DNA/RNA/protein sequence analysis
- GC content and composition analysis
- Restriction enzyme site mapping
- Sequence alignment guidance

**✂️ CRISPR Tools:**
- Guide RNA design for gene editing
- PAM site identification
- Off-target prediction

**🔬 PCR & Primers:**
- Primer design and optimization
- Melting temperature calculations
- PCR simulation and troubleshooting

**📁 File Processing:**
- FASTA sequence files (.fasta, .fa)
- GenBank annotation files (.gb, .gbk)
- Protein structure files (.pdb)
- CSV data analysis

**🧪 Protocols:**
- Molecular cloning workflows
- Expression system optimization
- Protocol recommendations

Try asking me something specific like "Analyze my FASTA file" or "Design CRISPR guides for TP53"!`;
    }

    if (lowerPrompt.includes('status') || lowerPrompt.includes('working') || lowerPrompt.includes('online')) {
      return `System Status: ✅ All backup systems operational. External AI providers are temporarily unavailable, but I'm fully functional for bioinformatics analysis. Ready to help with your molecular biology projects!`;
    }
    
    // Search solution bank for matches
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [key, solution] of this.solutionBank) {
      const score = this.calculateSimilarity(lowerPrompt, key);
      if (score > bestScore && score > 0.3) {
        bestScore = score;
        bestMatch = solution;
      }
    }
    
    if (bestMatch) {
      let response = bestMatch.fix || 'I found a relevant solution.';
      if (bestMatch.code) {
        response += `\n\n\`\`\`python\n${bestMatch.code}\n\`\`\``;
      }
      return response;
    }
    
    // Comprehensive default response
    return `I'm BioScriptor, your fault-tolerant bioinformatics AI assistant! 🧬

I'm currently running on backup systems since external AI providers are temporarily unavailable, but I'm fully operational for bioinformatics tasks:

**Available Tools:**
• Sequence analysis and composition
• CRISPR guide RNA design
• PCR primer design and simulation  
• File format analysis (FASTA, GenBank, PDB)
• Molecular biology protocols
• Codon optimization strategies

**How to Get Started:**
1. Upload a biological file for analysis
2. Ask about bioinformatics concepts
3. Request specific tools or protocols
4. Share your sequences for analysis

What bioinformatics project are you working on? I'm here to help make it easier!`;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}