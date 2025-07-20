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

    // Final fallback: Solution bank
    const fallbackResponse = this.getSolutionBankResponse(prompt);
    return {
      content: fallbackResponse,
      provider: 'solution-bank',
      fallbackUsed: true,
      processingTime: Date.now() - startTime
    };
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
    tone?: 'casual' | 'formal' | 'frustrated' | 'urgent'
  ): string {
    const systemInstruction = `[System Instruction]
You are BioScriptor, a smart and helpful AI assistant who explains bioinformatics and molecular biology in a clear, simple, and engaging way. You answer like you're having a conversation, not giving a lecture. 

${tone === 'casual' ? 'Use a friendly, casual tone with contractions and emojis where appropriate.' : ''}
${tone === 'formal' ? 'Use a professional, academic tone with precise terminology.' : ''}
${tone === 'frustrated' ? 'Be patient and extra helpful, breaking down complex concepts clearly.' : ''}
${tone === 'urgent' ? 'Prioritize quick, actionable answers while maintaining accuracy.' : ''}

${context ? `\n[File Analysis Context]\n${JSON.stringify(context, null, 2)}\n` : ''}`;

    let conversationHistory = '';
    if (history && history.length > 0) {
      conversationHistory = '\n[Conversation So Far]\n';
      for (const message of history.slice(-10)) { // Keep last 10 messages for context
        const role = message.role === 'user' ? 'User' : 'Assistant';
        conversationHistory += `${role}: ${message.content}\n`;
      }
    }

    return `${systemInstruction}${conversationHistory}

User: ${currentPrompt}`;
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

  private detectTone(message: string): 'casual' | 'formal' | 'frustrated' | 'urgent' {
    const lowerMessage = message.toLowerCase();
    
    // Frustrated indicators
    if (lowerMessage.includes('error') || lowerMessage.includes('broken') || 
        lowerMessage.includes('not working') || lowerMessage.includes('help!')) {
      return 'frustrated';
    }
    
    // Urgent indicators
    if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || 
        lowerMessage.includes('immediately') || lowerMessage.includes('quick')) {
      return 'urgent';
    }
    
    // Casual indicators
    if (lowerMessage.includes('hey') || lowerMessage.includes('gonna') || 
        lowerMessage.includes('wanna') || /[😊🙂👍]/.test(message)) {
      return 'casual';
    }
    
    // Formal indicators (default to formal for technical requests)
    if (lowerMessage.includes('please provide') || lowerMessage.includes('could you') ||
        lowerMessage.includes('analysis') || lowerMessage.includes('implementation')) {
      return 'formal';
    }
    
    return 'formal'; // Default
  }

  private initializeSolutionBank(): void {
    // Conversational responses
    this.solutionBank.set('greeting', {
      fix: 'Hello! I\'m BioScriptor, your fault-tolerant AI bioinformatics assistant.',
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
    const lowerPrompt = prompt.toLowerCase();
    
    // Direct pattern matching for common queries
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi ') || lowerPrompt.includes('hey')) {
      const greeting = this.solutionBank.get('greeting');
      return greeting!.fix;
    }

    if (lowerPrompt.includes('how are you') || lowerPrompt.includes('how you doing') || lowerPrompt.includes('what\'s up') || lowerPrompt.includes('wazup')) {
      const status = this.solutionBank.get('how_are_you');
      return status!.fix;
    }

    if (lowerPrompt.includes('help') || lowerPrompt.includes('what can you do')) {
      const help = this.solutionBank.get('help');
      return help!.fix;
    }

    if (lowerPrompt.includes('status') || lowerPrompt.includes('working') || lowerPrompt.includes('online')) {
      const status = this.solutionBank.get('status_check');
      return status!.fix;
    }
    
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
      if (bestMatch.code) {
        return "Here's a solution from my knowledge base:\\n\\n" + bestMatch.fix + "\\n\\n```python\\n" + bestMatch.code + "\\n```\\n\\nNote: External AI providers are currently unavailable, but I can still help with bioinformatics tasks using my built-in knowledge.";
      } else {
        return bestMatch.fix;
      }
    }
    
    return "I'm currently running on backup systems since external AI providers aren't available. I can still help you with:\\n\\n• CRISPR guide design\\n• PCR simulation\\n• Sequence analysis\\n• File format conversion\\n• Protein structure analysis\\n\\nWhat bioinformatics task would you like help with?";
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