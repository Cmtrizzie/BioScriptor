
export interface PlanLimits {
  maxQueries: number;
  maxFileSize: number; // in MB
  aiProviders: string[];
  features: {
    webSearch: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    advancedAnalysis: boolean;
    exportFormats: string[];
    fileAnalysis: boolean;
    collaborativeFeatures: boolean;
  };
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxQueries: 10,
    maxFileSize: 5,
    aiProviders: ['together', 'openrouter'], // Limited AI providers
    features: {
      webSearch: false,
      prioritySupport: false,
      apiAccess: false,
      advancedAnalysis: false,
      exportFormats: ['txt'],
      fileAnalysis: true,
      collaborativeFeatures: false,
    }
  },
  premium: {
    maxQueries: 1000,
    maxFileSize: 50,
    aiProviders: ['groq', 'together', 'openrouter', 'cohere'],
    features: {
      webSearch: true,
      prioritySupport: false,
      apiAccess: true,
      advancedAnalysis: true,
      exportFormats: ['txt', 'csv', 'json', 'pdf'],
      fileAnalysis: true,
      collaborativeFeatures: true,
    }
  },
  enterprise: {
    maxQueries: -1, // Unlimited
    maxFileSize: 500,
    aiProviders: ['groq', 'together', 'openrouter', 'cohere'],
    features: {
      webSearch: true,
      prioritySupport: true,
      apiAccess: true,
      advancedAnalysis: true,
      exportFormats: ['txt', 'csv', 'json', 'pdf', 'xml', 'docx'],
      fileAnalysis: true,
      collaborativeFeatures: true,
    }
  }
};

export class SubscriptionAccessControl {
  static getPlanLimits(tier: string): PlanLimits {
    return PLAN_LIMITS[tier] || PLAN_LIMITS.free;
  }

  static canAccessFeature(userTier: string, feature: keyof PlanLimits['features']): boolean {
    const limits = this.getPlanLimits(userTier);
    return limits.features[feature];
  }

  static canUseProvider(userTier: string, provider: string): boolean {
    const limits = this.getPlanLimits(userTier);
    return limits.aiProviders.includes(provider);
  }

  static hasQueryLimit(userTier: string, currentCount: number): boolean {
    const limits = this.getPlanLimits(userTier);
    if (limits.maxQueries === -1) return false; // Unlimited
    return currentCount >= limits.maxQueries;
  }

  static canUploadFileSize(userTier: string, fileSizeInMB: number): boolean {
    const limits = this.getPlanLimits(userTier);
    return fileSizeInMB <= limits.maxFileSize;
  }

  static getAvailableExportFormats(userTier: string): string[] {
    const limits = this.getPlanLimits(userTier);
    return limits.features.exportFormats;
  }

  static canExportAs(userTier: string, format: string): boolean {
    const availableFormats = this.getAvailableExportFormats(userTier);
    return availableFormats.includes(format.toLowerCase());
  }

  static getAccessibleProviders(userTier: string): string[] {
    const limits = this.getPlanLimits(userTier);
    return limits.aiProviders;
  }

  static generateAccessSummary(userTier: string) {
    const limits = this.getPlanLimits(userTier);
    return {
      tier: userTier,
      queryLimit: limits.maxQueries === -1 ? 'Unlimited' : limits.maxQueries,
      fileUploadLimit: `${limits.maxFileSize}MB`,
      aiProviders: limits.aiProviders.length,
      webSearchEnabled: limits.features.webSearch,
      apiAccessEnabled: limits.features.apiAccess,
      prioritySupportEnabled: limits.features.prioritySupport,
      exportFormats: limits.features.exportFormats,
      collaborativeFeaturesEnabled: limits.features.collaborativeFeatures,
    };
  }
}
