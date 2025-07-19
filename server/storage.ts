import { 
  users, 
  chatSessions, 
  bioFiles, 
  subscriptions,
  type User, 
  type InsertUser,
  type ChatSession,
  type InsertChatSession,
  type BioFile,
  type InsertBioFile,
  type Subscription,
  type InsertSubscription
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Chat session operations
  getChatSessions(userId: number): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession | undefined>;

  // File operations
  getBioFiles(userId: number): Promise<BioFile[]>;
  createBioFile(file: InsertBioFile): Promise<BioFile>;
  getBioFile(id: number): Promise<BioFile | undefined>;

  // Subscription operations
  getActiveSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private chatSessions: Map<number, ChatSession> = new Map();
  private bioFiles: Map<number, BioFile> = new Map();
  private subscriptions: Map<number, Subscription> = new Map();
  private currentUserId = 1;
  private currentChatSessionId = 1;
  private currentBioFileId = 1;
  private currentSubscriptionId = 1;

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
}

export const storage = new MemStorage();
