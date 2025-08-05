// server/services/coding-assistant.ts
// 5-Core Skills Coding Assistant Module System

export interface SkillModule {
    name: string;
    scope: string;
    systemPrompt: string;
    responseFormat: string;
    keywords: string[];
    examples: string[];
}

export interface UserSkillLevel {
    level: 'beginner' | 'intermediate' | 'advanced';
    interactions: number;
    successfulTasks: number;
    preferredComplexity: string;
}

export type SkillModuleType = 'coding' | 'development' | 'practices' | 'design' | 'advanced';

// ========== SKILL MODULE DEFINITIONS ==========
export const SKILL_MODULES: Record<SkillModuleType, SkillModule> = {
    coding: {
        name: "Coding Module",
        scope: "Syntax corrections, logic building, debugging walkthroughs, algorithms help",
        systemPrompt: `You are a Code Syntax and Logic Expert. You excel at:
- Identifying and fixing syntax errors across multiple programming languages
- Explaining programming logic and control flow
- Debugging code step-by-step with clear explanations
- Suggesting algorithm improvements and optimizations
- Teaching best practices for clean, readable code

Provide clear, actionable solutions with code examples when appropriate.`,
        responseFormat: "Step-by-step explanation with corrected code examples and explanations",
        keywords: [
            'debug', 'syntax', 'error', 'fix', 'code', 'logic', 'algorithm', 'function',
            'variable', 'loop', 'condition', 'python', 'javascript', 'java', 'c++',
            'bug', 'issue', 'problem', 'not working', 'exception', 'crash'
        ],
        examples: [
            "Help me debug this Python code",
            "Fix the syntax error in my JavaScript",
            "Why is my loop not working?",
            "Optimize this algorithm"
        ]
    },

    development: {
        name: "Development Module", 
        scope: "API integrations, frontend/backend help, frameworks assistance",
        systemPrompt: `You are a Full-Stack Development Expert. You specialize in:
- API design, development, and integration (REST, GraphQL, WebSockets)
- Frontend frameworks (React, Vue, Angular, vanilla JavaScript)
- Backend frameworks (Node.js, Express, Django, Flask, Spring)
- Database design and integration (SQL, NoSQL, ORMs)
- Full-stack application architecture and best practices

Provide practical code examples, architectural guidance, and implementation strategies.`,
        responseFormat: "Complete code examples with setup instructions and best practices",
        keywords: [
            'api', 'rest', 'graphql', 'frontend', 'backend', 'react', 'node', 'express',
            'database', 'integration', 'framework', 'server', 'client', 'endpoint',
            'authentication', 'middleware', 'routing', 'cors', 'axios', 'fetch'
        ],
        examples: [
            "How to connect React frontend to Node.js backend?",
            "Create a REST API with Express",
            "Set up authentication with JWT",
            "Database schema design"
        ]
    },

    practices: {
        name: "Software Practices Module",
        scope: "Git, Testing, CI/CD, Clean Code, Code Review",
        systemPrompt: `You are a Software Engineering Practices Expert. You guide developers in:
- Version control with Git (branching, merging, workflows)
- Testing strategies (unit, integration, e2e testing)
- CI/CD pipeline setup and automation
- Code review best practices and standards
- Clean code principles and refactoring techniques
- Documentation and project organization

Provide step-by-step workflows and industry best practices.`,
        responseFormat: "Detailed workflows with commands, tools, and best practice explanations",
        keywords: [
            'git', 'github', 'testing', 'ci/cd', 'pipeline', 'deployment', 'branch',
            'merge', 'commit', 'pull request', 'code review', 'clean code', 'refactor',
            'documentation', 'workflow', 'automation', 'jest', 'cypress', 'jenkins'
        ],
        examples: [
            "Explain Git branching strategies",
            "Set up CI/CD pipeline",
            "Write unit tests for this function",
            "Code review checklist"
        ]
    },

    design: {
        name: "System Design Module",
        scope: "Architecture, Scaling, Databases, Design Patterns",
        systemPrompt: `You are a System Design and Architecture Expert. You excel at:
- System architecture design and documentation
- Scalability patterns and load balancing strategies
- Database design, sharding, and optimization
- Microservices vs monolith architecture decisions
- Design patterns and architectural principles
- Performance optimization and caching strategies

Provide architectural diagrams, trade-offs analysis, and scalable solutions.`,
        responseFormat: "Architecture diagrams, trade-offs analysis, and implementation roadmaps",
        keywords: [
            'architecture', 'design', 'scale', 'database', 'microservices', 'monolith',
            'load balancer', 'caching', 'redis', 'patterns', 'scalability', 'performance',
            'distributed', 'sharding', 'replication', 'consistency', 'availability'
        ],
        examples: [
            "Design a scalable e-commerce system",
            "Microservices vs monolith for my app",
            "Database sharding strategy",
            "Caching architecture design"
        ]
    },

    advanced: {
        name: "Advanced Technical Module",
        scope: "Security, Optimization, Cloud, AI/ML, DevOps",
        systemPrompt: `You are an Advanced Technical Expert. You provide expertise in:
- Security best practices (authentication, authorization, encryption)
- Performance optimization and profiling techniques  
- Cloud architecture (AWS, GCP, Azure, containerization)
- AI/ML integration and model deployment
- DevOps practices and infrastructure as code
- Advanced algorithms and data structures

Provide enterprise-level solutions with security and performance considerations.`,
        responseFormat: "Enterprise-grade solutions with security, performance, and scalability considerations",
        keywords: [
            'security', 'jwt', 'oauth', 'encryption', 'ssl', 'optimization', 'performance',
            'cloud', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ai', 'ml',
            'machine learning', 'devops', 'infrastructure', 'monitoring', 'logging'
        ],
        examples: [
            "Secure a REST API with JWT",
            "Deploy ML model to production",
            "Set up Kubernetes cluster",
            "Performance optimization strategies"
        ]
    }
};

// ========== SKILL DETECTION ==========
export function detectSkillModule(query: string): SkillModuleType {
    const lowerQuery = query.toLowerCase();
    
    // Calculate relevance scores for each module
    const scores: Record<SkillModuleType, number> = {
        coding: 0,
        development: 0,
        practices: 0,
        design: 0,
        advanced: 0
    };
    
    // Score based on keyword matches
    Object.entries(SKILL_MODULES).forEach(([moduleKey, module]) => {
        const key = moduleKey as SkillModuleType;
        module.keywords.forEach(keyword => {
            if (lowerQuery.includes(keyword)) {
                scores[key] += 1;
            }
        });
    });
    
    // Additional context-based scoring
    if (lowerQuery.includes('syntax') || lowerQuery.includes('debug') || lowerQuery.includes('error')) {
        scores.coding += 2;
    }
    
    if (lowerQuery.includes('api') || lowerQuery.includes('frontend') || lowerQuery.includes('backend')) {
        scores.development += 2;
    }
    
    if (lowerQuery.includes('git') || lowerQuery.includes('test') || lowerQuery.includes('ci')) {
        scores.practices += 2;
    }
    
    if (lowerQuery.includes('architecture') || lowerQuery.includes('scale') || lowerQuery.includes('design')) {
        scores.design += 2;
    }
    
    if (lowerQuery.includes('security') || lowerQuery.includes('cloud') || lowerQuery.includes('optimize')) {
        scores.advanced += 2;
    }
    
    // Find the module with the highest score
    const maxScore = Math.max(...Object.values(scores));
    const bestModule = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as SkillModuleType;
    
    // Default to coding if no clear match
    return bestModule || 'coding';
}

// ========== SKILL LEVEL MANAGEMENT ==========
export function determineUserSkillLevel(interactionHistory: any[]): UserSkillLevel {
    const totalInteractions = interactionHistory.length;
    
    if (totalInteractions < 5) {
        return {
            level: 'beginner',
            interactions: totalInteractions,
            successfulTasks: 0,
            preferredComplexity: 'simple explanations with step-by-step guidance'
        };
    } else if (totalInteractions < 20) {
        return {
            level: 'intermediate',
            interactions: totalInteractions,
            successfulTasks: Math.floor(totalInteractions * 0.7),
            preferredComplexity: 'guided walkthroughs with some independence'
        };
    } else {
        return {
            level: 'advanced',
            interactions: totalInteractions,
            successfulTasks: Math.floor(totalInteractions * 0.8),
            preferredComplexity: 'high-level guidance and complex problem solving'
        };
    }
}

// ========== ENHANCED PROMPT GENERATION ==========
export function generateSkillBasedPrompt(
    query: string,
    skillModule: SkillModuleType,
    userLevel: UserSkillLevel,
    context?: any
): string {
    const module = SKILL_MODULES[skillModule];
    
    let levelGuidance = '';
    switch (userLevel.level) {
        case 'beginner':
            levelGuidance = 'Provide detailed step-by-step explanations with examples. Explain concepts clearly and avoid assuming prior knowledge.';
            break;
        case 'intermediate':
            levelGuidance = 'Provide guided explanations with some independence. Include best practices and common pitfalls.';
            break;
        case 'advanced':
            levelGuidance = 'Provide high-level guidance and focus on complex problem solving. Assume strong technical background.';
            break;
    }
    
    return `${module.systemPrompt}

**User Skill Level**: ${userLevel.level.toUpperCase()}
**Guidance Level**: ${levelGuidance}

**Context**: You are helping with a ${module.name.toLowerCase()} task.
**User Query**: ${query}

**Response Requirements**:
- ${module.responseFormat}
- Adapt complexity to ${userLevel.level} level
- Include practical, actionable advice
- Provide code examples when relevant
- Suggest next steps or related concepts

Please provide a comprehensive response following these guidelines.`;
}

// ========== SKILL MODULE RECOMMENDATIONS ==========
export function generateSkillRecommendations(
    skillModule: SkillModuleType,
    userLevel: UserSkillLevel,
    query: string
): string[] {
    const recommendations: string[] = [];
    const module = SKILL_MODULES[skillModule];
    
    recommendations.push(`🎯 **${module.name} Assistance**`);
    
    switch (skillModule) {
        case 'coding':
            recommendations.push(
                "• Share your complete code for detailed debugging",
                "• Try explaining the expected vs actual behavior",
                "• Ask about specific programming language features"
            );
            if (userLevel.level === 'beginner') {
                recommendations.push("• Request step-by-step code walkthroughs");
            }
            break;
            
        case 'development':
            recommendations.push(
                "• Share your project structure for better guidance",
                "• Ask about specific framework integration patterns",
                "• Request complete API implementation examples"
            );
            break;
            
        case 'practices':
            recommendations.push(
                "• Ask for team workflow recommendations",
                "• Request CI/CD pipeline templates",
                "• Get code review checklists for your project"
            );
            break;
            
        case 'design':
            recommendations.push(
                "• Describe your system requirements for tailored architecture",
                "• Ask about specific scalability challenges",
                "• Request database schema optimization"
            );
            break;
            
        case 'advanced':
            recommendations.push(
                "• Share your performance bottlenecks for optimization",
                "• Ask about security assessment for your application",
                "• Request cloud architecture best practices"
            );
            break;
    }
    
    // Add level-specific recommendations
    if (userLevel.level === 'beginner') {
        recommendations.push(
            "",
            "📚 **Learning Path:**",
            "• Start with fundamental concepts",
            "• Practice with guided examples",
            "• Ask for resource recommendations"
        );
    } else if (userLevel.level === 'advanced') {
        recommendations.push(
            "",
            "🚀 **Advanced Challenges:**",
            "• Explore enterprise-level solutions",
            "• Ask about industry best practices",
            "• Request architecture review"
        );
    }
    
    return recommendations;
}

// ========== EXPORT MAIN PROCESSING FUNCTION ==========
export function processCodingAssistantQuery(
    query: string,
    conversationHistory: any[] = [],
    userTier: string = 'free'
): {
    skillModule: SkillModuleType;
    enhancedPrompt: string;
    recommendations: string[];
    userLevel: UserSkillLevel;
} {
    // Detect the most appropriate skill module
    const skillModule = detectSkillModule(query);
    
    // Determine user skill level based on history
    const userLevel = determineUserSkillLevel(conversationHistory);
    
    // Generate enhanced prompt for the AI
    const enhancedPrompt = generateSkillBasedPrompt(query, skillModule, userLevel);
    
    // Generate skill-specific recommendations
    const recommendations = generateSkillRecommendations(skillModule, userLevel, query);
    
    return {
        skillModule,
        enhancedPrompt,
        recommendations,
        userLevel
    };
}