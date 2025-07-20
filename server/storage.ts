import { 
  users, 
  chatSessions, 
  bioFiles, 
  subscriptions,
  planLimits,
  adminLogs,
  type User, 
  type InsertUser,
  type ChatSession,
  type InsertChatSession,
  type BioFile,
  type InsertBioFile,
  type Subscription,
  type InsertSubscription,
  type PlanLimit,
  type InsertPlanLimit,
  type AdminLog,
  type InsertAdminLog,
  type SubscriptionTier,
  type PlanFeatures
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  resetUserDailyLimit(userId: number): Promise<User | undefined>;

  // Chat session operations
  getChatSessions(userId: number): Promise<ChatSession[]>;
  getChatSession(id: number): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession | undefined>;
  deleteChatSession(id: number): Promise<boolean>;

  // File operations
  getBioFiles(userId: number): Promise<BioFile[]>;
  createBioFile(file: InsertBioFile): Promise<BioFile>;
  getBioFile(id: number): Promise<BioFile | undefined>;

  // Subscription operations
  getActiveSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined>;
  getAllSubscriptions(): Promise<Subscription[]>;

  // Plan limits operations
  getPlanLimit(tier: SubscriptionTier): Promise<PlanLimit | undefined>;
  createPlanLimit(planLimit: InsertPlanLimit): Promise<PlanLimit>;
  updatePlanLimit(tier: SubscriptionTier, updates: Partial<PlanLimit>): Promise<PlanLimit | undefined>;
  getAllPlanLimits(): Promise<PlanLimit[]>;

  // Admin operations
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(limit?: number): Promise<AdminLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private chatSessions: Map<number, ChatSession> = new Map();
  private bioFiles: Map<number, BioFile> = new Map();
  private subscriptions: Map<number, Subscription> = new Map();
  private planLimits: Map<SubscriptionTier, PlanLimit> = new Map();
  private adminLogs: Map<number, AdminLog> = new Map();
  private currentUserId = 1;
  private currentChatSessionId = 1;
  private currentBioFileId = 1;
  private currentSubscriptionId = 1;
  private currentPlanLimitId = 1;
  private currentAdminLogId = 1;

  constructor() {
    this.initializeDefaultPlanLimits();
  }

  private initializeDefaultPlanLimits() {
    // Initialize default plan limits
    this.planLimits.set('free', {
      id: this.currentPlanLimitId++,
      tier: 'free',
      features: {
        maxQueries: 50,
        maxFileSize: 5,
        aiProviders: ['ollama'],
        advancedAnalysis: false,
        prioritySupport: false,
        exportFormats: ['txt'],
        collaborativeFeatures: false,
        apiAccess: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.planLimits.set('premium', {
      id: this.currentPlanLimitId++,
      tier: 'premium',
      features: {
        maxQueries: 500,
        maxFileSize: 50,
        aiProviders: ['groq', 'together', 'ollama'],
        advancedAnalysis: true,
        prioritySupport: false,
        exportFormats: ['txt', 'pdf', 'docx'],
        collaborativeFeatures: true,
        apiAccess: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.planLimits.set('enterprise', {
      id: this.currentPlanLimitId++,
      tier: 'enterprise',
      features: {
        maxQueries: -1, // unlimited
        maxFileSize: 200,
        aiProviders: ['groq', 'together', 'openrouter', 'cohere', 'ollama'],
        advancedAnalysis: true,
        prioritySupport: true,
        exportFormats: ['txt', 'pdf', 'docx', 'json', 'xml'],
        collaborativeFeatures: true,
        apiAccess: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.firebaseUid === firebaseUid);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      updatedAt: now,
      displayName: insertUser.displayName || null,
      photoURL: insertUser.photoURL || null,
      tier: insertUser.tier || "free",
      queryCount: insertUser.queryCount || 0
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getChatSessions(userId: number): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = this.currentChatSessionId++;
    const now = new Date();
    const session: ChatSession = { 
      ...insertSession, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession | undefined> {
    const session = this.chatSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { 
      ...session, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.chatSessions.set(id, updatedSession);
    return updatedSession;
  }

  async getBioFiles(userId: number): Promise<BioFile[]> {
    return Array.from(this.bioFiles.values())
      .filter(file => file.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createBioFile(insertFile: InsertBioFile): Promise<BioFile> {
    const id = this.currentBioFileId++;
    const file: BioFile = { 
      ...insertFile, 
      id, 
      createdAt: new Date(),
      analysis: insertFile.analysis || null
    };
    this.bioFiles.set(id, file);
    return file;
  }

  async getBioFile(id: number): Promise<BioFile | undefined> {
    return this.bioFiles.get(id);
  }

  async getActiveSubscription(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values())
      .find(sub => sub.userId === userId && sub.status === 'active');
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const subscription: Subscription = { 
      ...insertSubscription, 
      id, 
      createdAt: new Date(),
      endDate: insertSubscription.endDate || null
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;
    
    const updatedSubscription = { ...subscription, ...updates };
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async resetUserDailyLimit(userId: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      queryCount: 0, 
      updatedAt: new Date() 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }

  async deleteChatSession(id: number): Promise<boolean> {
    return this.chatSessions.delete(id);
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPlanLimit(tier: SubscriptionTier): Promise<PlanLimit | undefined> {
    return this.planLimits.get(tier);
  }

  async createPlanLimit(insertPlanLimit: InsertPlanLimit): Promise<PlanLimit> {
    const id = this.currentPlanLimitId++;
    const now = new Date();
    const planLimit: PlanLimit = { 
      ...insertPlanLimit, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.planLimits.set(insertPlanLimit.tier, planLimit);
    return planLimit;
  }

  async updatePlanLimit(tier: SubscriptionTier, updates: Partial<PlanLimit>): Promise<PlanLimit | undefined> {
    const planLimit = this.planLimits.get(tier);
    if (!planLimit) return undefined;
    
    const updatedPlanLimit = { 
      ...planLimit, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.planLimits.set(tier, updatedPlanLimit);
    return updatedPlanLimit;
  }

  async getAllPlanLimits(): Promise<PlanLimit[]> {
    return Array.from(this.planLimits.values());
  }

  async createAdminLog(insertLog: InsertAdminLog): Promise<AdminLog> {
    const id = this.currentAdminLogId++;
    const adminLog: AdminLog = { 
      ...insertLog, 
      id, 
      timestamp: new Date()
    };
    this.adminLogs.set(id, adminLog);
    return adminLog;
  }

  async getAdminLogs(limit = 100): Promise<AdminLog[]> {
    return Array.from(this.adminLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
