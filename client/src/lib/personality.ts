
// Personality configuration
export const botPersonality = {
  tone: "witty" as "witty" | "professional" | "friendly",
  style: "storytelling" as "storytelling" | "direct" | "technical",
  emoji: true,
  mood: "excited" as "excited" | "calm" | "curious",
};

// Response variations
export const greetings = [
  "Hey there! 👋 Ready to dive into some bioinformatics magic?",
  "Yo! What fascinating science shall we explore today?",
  "Hello, researcher! What shall we discover together? 🧬",
  "Back for more scientific wisdom? Let's unlock some mysteries! 💡",
  "Greetings, fellow scientist! Ready to push the boundaries? 🚀"
];

export const thinkingMessages = [
  "Hmm, let me analyze that... 🤔",
  "Consulting the bioinformatics databases... 📚",
  "Just a sec, connecting the molecular dots... 🔗",
  "Processing your brilliant query... ⚙️",
  "Scanning through genomic knowledge... 🧬",
  "Crunching some computational biology... 💻"
];

export const errorResponses = [
  "I'm a bit stumped on that one. Mind rephrasing for this AI brain?",
  "That's outside my current expertise. Ask me something else?",
  "Let's try a different angle on that scientific question.",
  "I need more context to help with this molecular puzzle.",
  "Hmm, that's beyond my current knowledge base. Try another approach?"
];

// Creative response enhancer
export const enhanceResponse = (response: string) => {
  let enhanced = response;
  
  // Add personality-based enhancements
  if (botPersonality.tone === "witty") {
    const witticisms = [
      "Funny you should mention that...", 
      "Here's a fascinating insight...", 
      "You'll love this discovery...",
      "Plot twist...",
      "Here's where it gets interesting..."
    ];
    enhanced = `${witticisms[Math.floor(Math.random() * witticisms.length)]} ${enhanced}`;
  }
  
  if (botPersonality.style === "storytelling") {
    const storyOpeners = [
      "Picture this scientific scenario...", 
      "Once upon a time in the lab...", 
      "Imagine a world where...",
      "Let me paint you a molecular picture...",
      "Here's how this biological story unfolds..."
    ];
    enhanced = `${storyOpeners[Math.floor(Math.random() * storyOpeners.length)]} ${enhanced}`;
  }
  
  // Add emojis if enabled
  if (botPersonality.emoji) {
    const emojiMap: Record<string, string[]> = {
      "?": ["🤔", "❓", "🧐", "🔬"],
      "!": ["❗", "🎉", "🔥", "⚡", "🚀"],
      ".": ["✨", "🌟", "💫", "🧬", "💡"]
    };
    
    const lastChar = enhanced.slice(-1);
    if (emojiMap[lastChar]) {
      enhanced += " " + emojiMap[lastChar][Math.floor(Math.random() * emojiMap[lastChar].length)];
    }
  }
  
  return enhanced;
};

// Creative idea generators
export const ideaGenerators = {
  bioinformatics: [
    "What if we analyzed this sequence from a phylogenetic perspective?",
    "Have you considered using machine learning for pattern recognition?",
    "This reminds me of CRISPR applications in synthetic biology...",
    "What about cross-referencing with protein structure databases?",
    "This could be perfect for a comparative genomics approach!"
  ],
  programming: [
    "We could optimize this with parallel processing!",
    "Have you thought about creating a pipeline for this?",
    "This would be perfect for a microservice architecture!",
    "What about adding real-time data visualization?",
    "We could implement this with elegant functional programming!"
  ],
  research: [
    "This opens up fascinating research questions...",
    "What if we approached this from a systems biology angle?",
    "This could lead to breakthrough discoveries!",
    "Have you considered the evolutionary implications?",
    "This might revolutionize how we understand..."
  ]
};

// Get random item from array
export const getRandom = (arr: string[]) => 
  arr[Math.floor(Math.random() * arr.length)];

// Context-aware response enhancement
export const enhanceWithContext = (response: string, context: string) => {
  if (context.includes("DNA") || context.includes("sequence")) {
    const bioEnhancers = getRandom(ideaGenerators.bioinformatics);
    return `${response}\n\n💡 **Creative insight**: ${bioEnhancers}`;
  }
  
  if (context.includes("code") || context.includes("script")) {
    const codeEnhancers = getRandom(ideaGenerators.programming);
    return `${response}\n\n🚀 **Development idea**: ${codeEnhancers}`;
  }
  
  if (context.includes("research") || context.includes("analysis")) {
    const researchEnhancers = getRandom(ideaGenerators.research);
    return `${response}\n\n🔬 **Research direction**: ${researchEnhancers}`;
  }
  
  return response;
};

// Creative suggestion prompts
export const creativeSuggestions = [
  "Design CRISPR guides for gene editing 🧬",
  "Analyze protein sequences for patterns 🔬",
  "Create a bioinformatics pipeline 🚀",
  "Simulate PCR amplification 🧪",
  "Write Python scripts for genomics 💻",
  "Explore machine learning in biology 🤖",
  "Visualize molecular structures 📊",
  "Design primers for sequencing 🔍"
];
