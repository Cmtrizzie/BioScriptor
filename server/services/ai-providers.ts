const PROVIDERS: AIProvider[] = [
  { name: "groq", priority: 1, maxRetries: 2, maxTokens: 512 },
  { name: "together", priority: 2, maxRetries: 2, maxTokens: 512 },
  { name: "openrouter", priority: 3, maxRetries: 1, maxTokens: 512 },
  { name: "cohere", priority: 4, maxRetries: 1, maxTokens: 512 },
];

import { SubscriptionAccessControl } from './subscription-access';

export class FaultTolerantAI {
  private responseCache = new Map<string, { response: string; timestamp: number }>();

  constructor(private config: any) {}

  async processQuery(
    prompt: string,
    context?: any,
    toneDetection?: string,
    conversationHistory?: Array<{ role: string; content: string }>,
    userTier?: string
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

    // Filter providers based on user subscription
    const accessibleProviders = userTier ? 
      SubscriptionAccessControl.getAccessibleProviders(userTier) : 
      ['together', 'openrouter']; // Default for free users

    const availableProviders = PROVIDERS.filter(provider => 
      accessibleProviders.includes(provider.name)
    );

    if (availableProviders.length === 0) {
      return {
        content: "❌ **Subscription Required**\n\nYour current plan doesn't include access to AI providers. Please upgrade to Premium or Enterprise to access our AI assistant.",
        provider: "access_denied",
        fallbackUsed: true,
        processingTime: 0,
      };
    }

    for (const provider of availableProviders) {
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
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

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
      return `👋 **Hey there!**

Thanks for reaching out about sequence analysis. Here's what I can help with:

✅ **Available Tools:**
- 🧬 **DNA/RNA parsing** and validation
- 📊 **GC content calculation** 
- 🔄 **Reverse complement generation**
- 🔍 **ORF detection** and analysis
- 🎯 **Motif searching** and pattern recognition

💡 **Quick Example:**
\`\`\`python
def calculate_gc_content(sequence):
    gc_count = sequence.count('G') + sequence.count('C')
    return (gc_count / len(sequence)) * 100
\`\`\`

🚀 **Ready to start?** Just paste your sequence and let me know what analysis you need! 📩`;
    }

    if (lowerPrompt.includes('crispr')) {
      return `👋 **Hey researcher!**

CRISPR guide design is my specialty! Here's how I can help:

✅ **What I Do:**
- 🎯 **Target site identification**
- ✂️ **PAM sequence validation** (NGG for Cas9)
- 🔍 **Off-target analysis**
- ⭐ **Guide RNA efficiency scoring**

🧪 **Typical Workflow:**
1. **Input** your target sequence
2. **Find** optimal PAM sites
3. **Design** 20-nucleotide guides  
4. **Score** for cutting efficiency

💡 **Tip:** Share your target gene/sequence and I'll design optimal guides for you!

Ready to start? 📩 Just paste your sequence!`;
    }

    if (lowerPrompt.includes('pcr')) {
      return `## 🧪 PCR Primer Design

**PCR primer design** is something I can definitely help with:

| Parameter | Typical Range |
|-----------|---------------|
| **Length** | 18-25 nucleotides |
| **Tm** | 55-65°C |
| **GC Content** | 40-60% |
| **3' GC Clamp** | 1-2 G/C residues |

### Key Considerations:
- ✅ **Specificity** - avoid secondary structures
- ✅ **Efficiency** - balanced Tm values
- ✅ **Amplicon size** - appropriate for application

What target would you like to design primers for?`;
    }

    if (lowerPrompt.includes('protein')) {
      return `## 🧬 Protein Analysis

**Protein analysis** is one of my strengths! I can assist with:

### Structure Analysis:
- **Secondary structure prediction**
- **Hydrophobicity plots**
- **Domain identification**
- **Post-translational modification sites**

### Functional Analysis:
- **Enzyme classification**
- **Active site prediction**
- **Protein-protein interactions**

\`\`\`python
# Example: Calculate molecular weight
def calculate_mw(sequence):
    aa_weights = {'A': 89.1, 'R': 174.2, 'N': 132.1, ...}
    return sum(aa_weights.get(aa, 0) for aa in sequence)
\`\`\`

What type of protein analysis do you need?`;
    }

    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return `👋 **Hello there!**

I'm **BioScriptor**, your AI bioinformatics assistant! Great to meet you.

✅ **Here's what I can help with:**

🧬 **Sequence Analysis**
- DNA/RNA parsing and validation
- GC content & composition analysis  
- Reverse complements & translations

✂️ **CRISPR Design**
- Guide RNA optimization
- PAM site identification
- Off-target analysis

🧪 **Lab Protocols**
- PCR primer design
- Restriction enzyme mapping
- Molecular cloning workflows

📊 **Data Analysis**
- Phylogenetic trees
- Gene expression analysis
- Protein structure prediction

💡 **Tip:** Just describe what you're working on, and I'll guide you through it step by step!

What bioinformatics challenge can I help you tackle today? 🚀`;
    }

    return `## 🔬 BioScriptor Assistant

I'm here to help with **bioinformatics tasks**! Please provide more specific details about what you need.

### Common Tasks I Handle:
- 🧬 **Sequence analysis** (DNA/RNA/Protein)
- ✂️ **CRISPR design** and analysis
- 🧪 **PCR primer** design
- 📊 **Data analysis** and visualization
- 🔍 **Literature research** assistance

### Research Examples:
- "Explain CRISPR tools and methods"
- "Help with gene editing protocols"
- "Guide me through bioinformatics analysis"

*Could you please describe your specific research question or task?*`;
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