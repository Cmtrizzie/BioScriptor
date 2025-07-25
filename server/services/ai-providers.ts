// Free provider definitions (priority order: 1 = most preferred)
const PROVIDERS: AIProvider[] = [
  {
    name: "groq",
    priority: 1,
    maxRetries: 3,
    maxTokens: 1024,
  },
  {
    name: "together",
    priority: 2,
    maxRetries: 2,
    maxTokens: 1024,
  },
  {
    name: "openrouter",
    priority: 3,
    maxRetries: 2,
    maxTokens: 1024,
  },
  {
    name: "cohere",
    priority: 4,
    maxRetries: 2,
    maxTokens: 1024,
  },
];

export class FaultTolerantAI {
  constructor(private config: any) {}

  async processQuery(
    prompt: string,
    context?: any,
    toneDetection?: string,
    conversationHistory?: Array<{ role: string; content: string }>,
  ): Promise<AIResponse> {
    const startTime = Date.now();
    this.validateInput(prompt);
    const tone = toneDetection || this.detectTone(prompt);
    const conversationalPrompt = this.buildConversationalPrompt(
      prompt,
      conversationHistory,
      context,
      tone,
    );

    for (const provider of PROVIDERS) {
      try {
        const response = await this.tryProvider(
          provider,
          conversationalPrompt,
          conversationHistory,
        );
        if (response) {
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

  private async tryProvider(
    provider: AIProvider,
    prompt: string,
    history?: Array<{ role: string; content: string }>,
  ): Promise<string | null> {
    for (let attempt = 1; attempt <= provider.maxRetries; attempt++) {
      try {
        const result = await this.callProvider(
          provider.name,
          prompt,
          provider.maxTokens,
          history,
        );
        return result;
      } catch (error: any) {
        if (error.isBadRequest) throw error;

        console.log(
          `Attempt ${attempt} for ${provider.name} failed:`,
          error.message || error,
        );
        if (attempt < provider.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        } else {
          throw error;
        }
      }
    }
    return null;
  }

  private async callProvider(
    name: string,
    prompt: string,
    maxTokens?: number,
    history?: any,
  ): Promise<string> {
    const endpointMap: Record<string, Function> = {
      groq: this.callGroq.bind(this),
      together: this.callTogether.bind(this),
      openrouter: this.callOpenRouter.bind(this),
      cohere: this.callCohere.bind(this),
    };

    const fn = endpointMap[name];
    if (!fn) throw new Error(`Unknown provider: ${name}`);
    try {
      return await fn(prompt, maxTokens, history);
    } catch (err: any) {
      if (err.message?.match(/^.*?: 4\d{2} /)) {
        const badErr = new Error(`${name} responded with bad request: ${err.message}`);
        (badErr as any).isBadRequest = true;
        throw badErr;
      }
      throw err;
    }
  }

  // ========== PROVIDER CALL METHODS ==========

  private async callGroq(prompt: string, maxTokens?: number, history?: any): Promise<string> {
    if (!this.config.groq?.apiKey) throw new Error("Groq API key not set");

    const messages = (history ?? []).concat({ role: "user", content: prompt });

    const res = await fetch(this.config.groq.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.groq.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages,
        max_tokens: maxTokens || 1024,
      }),
    });

    if (res.status === 404) throw new Error(`Groq API endpoint not found - check model name`);
    if (res.status >= 400 && res.status < 500) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Groq API returned ${res.status}: ${errorData.error?.message || res.statusText}`);
    }
    if (!res.ok) throw new Error(`Groq API failed: ${res.statusText}`);

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  private async callTogether(prompt: string, maxTokens?: number, history?: any): Promise<string> {
    if (!this.config.together?.apiKey) throw new Error("Together API key not set");

    const messages = (history ?? []).concat({ role: "user", content: prompt });

    const res = await fetch(this.config.together.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.together.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-2-7b-chat-hf",
        messages,
        max_tokens: maxTokens || 1024,
        temperature: 0.7,
      }),
    });

    if (res.status >= 400 && res.status < 500) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Together API returned ${res.status}: ${errorData.error?.message || res.statusText}`);
    }
    if (!res.ok) throw new Error(`Together API failed: ${res.statusText}`);

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  private async callOpenRouter(prompt: string, maxTokens?: number, history?: any): Promise<string> {
    if (!this.config.openrouter?.apiKey) throw new Error("OpenRouter API key not set");

    const messages = (history ?? []).concat({ role: "user", content: prompt });

    const res = await fetch(this.config.openrouter.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.openrouter.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://replit.com",
        "X-Title": "BioScriptor",
      },
      body: JSON.stringify({
        model: "microsoft/wizardlm-2-8x22b",
        messages,
        max_tokens: maxTokens || 1024,
        temperature: 0.7,
      }),
    });

    if (res.status >= 400 && res.status < 500) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`OpenRouter API returned ${res.status}: ${errorData.error?.message || res.statusText}`);
    }
    if (!res.ok) throw new Error(`OpenRouter API failed: ${res.statusText}`);

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  private async callCohere(prompt: string, maxTokens?: number): Promise<string> {
    if (!this.config.cohere?.apiKey) throw new Error("Cohere API key not set");

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

    if (res.status >= 400 && res.status < 500) throw new Error(`Cohere API returned ${res.status}`);
    if (!res.ok) throw new Error(`Cohere API failed: ${res.statusText}`);

    const data = await res.json();
    return data.generations?.[0]?.text ?? "";
  }

  // ========== UTILITIES ==========

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private validateInput(prompt: string) {
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Invalid prompt input.");
    }
  }

  private detectTone(prompt: string): string {
    return "neutral"; // Placeholder
  }

  private buildConversationalPrompt(
    prompt: string,
    history?: Array<{ role: string; content: string }>,
    context?: any,
    tone?: string,
  ): string {
    // Simplified: use last few messages as context
    const prior = history?.map((msg) => `${msg.role}: ${msg.content}`).join("\n") ?? "";
    return `${prior}\nUser: ${prompt}`;
  }

  private getSolutionBankResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    // Basic bioinformatics responses
    if (lowerPrompt.includes('sequence')) {
      return "For sequence analysis, you can use tools like BLAST for similarity searches, or upload FASTA files for analysis. Common sequence formats include FASTA, GenBank, and EMBL.";
    }
    if (lowerPrompt.includes('crispr')) {
      return "CRISPR guide RNA design requires a target sequence and PAM site identification. Popular tools include CHOPCHOP, CRISPRscan, and Benchling for guide design.";
    }
    if (lowerPrompt.includes('pcr')) {
      return "PCR primer design considerations include: primer length (18-25 bp), melting temperature (55-65°C), GC content (40-60%), and avoiding secondary structures.";
    }
    if (lowerPrompt.includes('protein')) {
      return "Protein analysis can include structure prediction, functional annotation, and phylogenetic analysis. Tools like SWISS-MODEL, InterPro, and CLUSTAL are commonly used.";
    }
    
    return "I'm currently experiencing issues connecting to AI services. However, I can help with basic bioinformatics questions about sequences, CRISPR, PCR, proteins, and more. Please try your question again or be more specific about what you need help with.";
  }
}
