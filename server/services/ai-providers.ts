const PROVIDERS: AIProvider[] = [
  { name: "groq", priority: 1, maxRetries: 3, maxTokens: 1024 },
  { name: "together", priority: 2, maxRetries: 2, maxTokens: 1024 },
  { name: "openrouter", priority: 3, maxRetries: 2, maxTokens: 1024 },
  { name: "cohere", priority: 4, maxRetries: 2, maxTokens: 1024 },
];

export class FaultTolerantAI {
  private responseCache = new Map<string, { response: string; timestamp: number }>();
  
  constructor(private config: any) {}

  async processQuery(
    prompt: string,
    context?: any,
    toneDetection?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<AIResponse> {
    const startTime = Date.now();
    this.validateInput(prompt);

    // Simple cache key based on prompt and context
    const cacheKey = this.generateCacheKey(prompt, context);
    const cached = this.responseCache.get(cacheKey);
    
    // Return cached response if less than 5 minutes old
    if (cached && Date.now() - cached.timestamp < 300000) {
      return {
        content: cached.response,
        provider: "cache",
        fallbackUsed: false,
        processingTime: Date.now() - startTime,
      };
    }

    const tone = toneDetection || this.detectTone(prompt);
    const messages = this.buildMessageArray(prompt, conversationHistory, context, tone);

    for (const provider of PROVIDERS) {
      console.log(`Trying provider: ${provider.name}`);
      try {
        const response = await this.tryProvider(provider, messages);
        if (response) {
          // Cache successful response
          this.responseCache.set(cacheKey, {
            response,
            timestamp: Date.now()
          });
          
          // Limit cache size
          if (this.responseCache.size > 100) {
            const oldestKey = this.responseCache.keys().next().value;
            this.responseCache.delete(oldestKey);
          }
          
          return {
            content: response,
            provider: provider.name,
            fallbackUsed: provider.priority > 1,
            processingTime: Date.now() - startTime,
          };
        }
      } catch (error: any) {
        console.error(`Provider ${provider.name} failed:`, error.message || error);
        if (error.isBadRequest) {
          console.warn(`Skipping ${provider.name} due to bad request.`);
          continue;
        }
      }
    }

    return {
      content: this.getSolutionBankResponse(prompt),
      provider: "solution_bank",
      fallbackUsed: true,
      processingTime: Date.now() - startTime,
    };
  }

  private async tryProvider(provider: AIProvider, messages: any[]): Promise<string | null> {
    for (let attempt = 1; attempt <= provider.maxRetries; attempt++) {
      try {
        const result = await this.callProvider(provider.name, messages, provider.maxTokens);
        return result;
      } catch (error: any) {
        if (error.isBadRequest) throw error;

        console.warn(
          `Attempt ${attempt}/${provider.maxRetries} for ${provider.name} failed:`,
          error.message || error
        );

        if (attempt < provider.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        } else {
          throw error;
        }
      }
    }
    return null;
  }

  private async callProvider(name: string, messages: any[], maxTokens?: number): Promise<string> {
    const endpointMap: Record<string, Function> = {
      groq: this.callGroq.bind(this),
      together: this.callTogether.bind(this),
      openrouter: this.callOpenRouter.bind(this),
      cohere: this.callCohere.bind(this),
    };

    const fn = endpointMap[name];
    if (!fn) throw new Error(`Unknown provider: ${name}`);

    try {
      return await fn(messages, maxTokens);
    } catch (err: any) {
      if (err.message?.match(/^.*?: 4\d{2} /)) {
        const badErr = new Error(`${name} responded with bad request: ${err.message}`);
        (badErr as any).isBadRequest = true;
        throw badErr;
      }
      throw err;
    }
  }

  // ===== PROVIDER CALL METHODS =====

  private async callGroq(messages: any[], maxTokens?: number): Promise<string> {
    if (!this.config.groq?.apiKey) throw new Error("Groq API key not set");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const res = await fetch(this.config.groq.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.groq.apiKey}`,
          "Content-Type": "application/json",
          "Connection": "keep-alive",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages,
          max_tokens: maxTokens || 512, // Reduced for faster responses
          temperature: 0.7,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(`Groq API error ${res.status}: ${data.error?.message || res.statusText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Groq API request timeout');
      }
      throw error;
    }
  }

  private async callTogether(messages: any[], maxTokens?: number): Promise<string> {
    if (!this.config.together?.apiKey) throw new Error("Together API key not set");

    const res = await fetch(this.config.together.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.together.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        messages,
        max_tokens: maxTokens || 1024,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(`Together API error ${res.status}: ${data.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  private async callOpenRouter(messages: any[], maxTokens?: number): Promise<string> {
    if (!this.config.openrouter?.apiKey) throw new Error("OpenRouter API key not set");

    const res = await fetch(this.config.openrouter.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.openrouter.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://replit.com",
        "X-Title": "BioScriptor",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages,
        max_tokens: maxTokens || 1024,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(`OpenRouter API error ${res.status}: ${data.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  private async callCohere(messages: any[], maxTokens?: number): Promise<string> {
    if (!this.config.cohere?.apiKey) throw new Error("Cohere API key not set");

    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

    const res = await fetch(this.config.cohere.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.cohere.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-plus",
        prompt,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error(`Cohere API error ${res.status}: ${res.statusText}`);

    const data = await res.json();
    return data.generations?.[0]?.text ?? "";
  }

  // ===== UTILITIES =====

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private validateInput(prompt: string) {
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Invalid prompt input.");
    }
  }

  private detectTone(prompt: string): string {
    return "neutral"; // Future: NLP tone detection
  }

  private buildMessageArray(
    prompt: string,
    history?: Array<{ role: string; content: string }>,
    context?: any,
    tone?: string
  ): Array<{ role: string; content: string }> {
    return (history ?? []).concat({ role: "user", content: prompt });
  }

  private generateCacheKey(prompt: string, context?: any): string {
    const contextStr = context ? JSON.stringify(context).slice(0, 100) : '';
    return `${prompt.slice(0, 100)}_${contextStr}`.replace(/\s+/g, '_');
  }

  getSolutionBankResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('sequence')) {
      return "I can help with sequence analysis...";
    }
    if (lowerPrompt.includes('crispr')) {
      return "CRISPR guide RNA design is my specialty...";
    }
    if (lowerPrompt.includes('pcr')) {
      return "PCR primer design is something I can definitely help with...";
    }
    if (lowerPrompt.includes('protein')) {
      return "Protein analysis is one of my strengths...";
    }
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return "Hello! I'm BioScriptor, your AI bioinformatics assistant...";
    }
    return "I'm here to help with bioinformatics tasks. Could you please provide more specific details about what you need?";
  }
}

// Type definitions
interface AIProvider {
  name: string;
  priority: number;
  maxRetries: number;
  maxTokens: number;
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

export interface AIResponse {
  content: string;
  provider: string;
  fallbackUsed: boolean;
  processingTime: number;
}

