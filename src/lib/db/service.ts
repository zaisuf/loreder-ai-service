import { db } from './index';
import * as schema from './schema';
import { eq, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  bio: string;
  createdAt: string;
  apiKey: string;
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  totalRequests: number;
  totalTokens: number;
  status: 'active' | 'revoked';
}

export interface UsageLog {
  id: string;
  keyId: string;
  keyName: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  timestamp: string;
  status: 'success' | 'error';
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: 'opencode' | 'openrouter' | 'custom';
  baseUrl: string;
  apiKey: string;
  isEnabled: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  isFree: boolean;
  pricing: {
    prompt: number;
    completion: number;
  };
  description: string;
}

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'prov_opencode',
    name: 'OpenCode Zen',
    type: 'opencode',
    baseUrl: process.env.OPENCODE_BASE_URL || 'https://opencode.ai/zen/v1',
    apiKey: process.env.OPENCODE_API_KEY || 'sk-Q4UnEZC03k6Okr2dlJ9Jp2ax7jgwNyZYBW8IAOcGaRjxYXEeE3Dvbfh56VjhHpFx',
    isEnabled: true
  },
  {
    id: 'prov_openrouter',
    name: 'OpenRouter Aggregator',
    type: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    isEnabled: false
  }
];

class DatabaseService {
  private initialized = false;

  public async init() {
    if (this.initialized) return;
    try {
      // Seed default providers if empty
      const existingProviders = await db.select().from(schema.providers).limit(1);
      if (existingProviders.length === 0) {
        for (const p of DEFAULT_PROVIDERS) {
          await db.insert(schema.providers).values({
            id: p.id,
            name: p.name,
            type: p.type,
            baseUrl: p.baseUrl,
            apiKey: p.apiKey,
            isEnabled: p.isEnabled
          }).onConflictDoNothing();
        }
      }
      this.initialized = true;
    } catch (e) {
      console.error('Error initializing db service:', e);
    }
  }

  // Users
  public async getUser(email?: string): Promise<UserProfile> {
    await this.init();
    let userRecord = null;
    if (email) {
      const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      userRecord = u;
    }
    if (!userRecord) {
      const [u] = await db.select().from(schema.users).limit(1);
      userRecord = u;
    }

    if (!userRecord) {
      // Create default user in Neon
      const id = 'usr_codilore_' + uuidv4().slice(0, 8);
      const emailAddr = email || 'zaisuf@loreder.ai';
      const [created] = await db.insert(schema.users).values({
        id,
        name: 'Zaisuf',
        email: emailAddr,
        image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent('Zaisuf')}`,
        role: 'Administrator & Provider Host',
        bio: 'Building Codilore service & OpenCode Zen gateway',
      }).returning();
      userRecord = created;
    }

    // Get or create master API key for user
    const [key] = await db.select().from(schema.apiKeys)
      .where(eq(schema.apiKeys.userId, userRecord.id))
      .limit(1);

    let masterKey = key?.key;
    if (!masterKey) {
      const newKey = `sk-loreder-${uuidv4().replace(/-/g, '').slice(0, 24)}`;
      await db.insert(schema.apiKeys).values({
        id: uuidv4(),
        userId: userRecord.id,
        key: newKey,
        name: 'Default Master Key',
        status: 'active'
      });
      masterKey = newKey;
    }

    return {
      id: userRecord.id,
      name: userRecord.name || 'User',
      email: userRecord.email || '',
      avatar: userRecord.image || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userRecord.name || 'User')}`,
      role: userRecord.role || 'user',
      bio: userRecord.bio || '',
      createdAt: userRecord.createdAt?.toISOString() || new Date().toISOString(),
      apiKey: masterKey
    };
  }

  public async updateUser(updates: Partial<UserProfile>): Promise<UserProfile> {
    await this.init();
    const currentUser = await this.getUser();
    await db.update(schema.users).set({
      name: updates.name ?? currentUser.name,
      bio: updates.bio ?? currentUser.bio,
      role: updates.role ?? currentUser.role,
      image: updates.avatar ?? currentUser.avatar,
    }).where(eq(schema.users.id, currentUser.id));

    return this.getUser(currentUser.email);
  }

  // API Keys
  public async getKeys(userId?: string): Promise<ApiKey[]> {
    await this.init();
    const user = await this.getUser();
    const targetUserId = userId || user.id;

    const rows = await db.select().from(schema.apiKeys)
      .where(eq(schema.apiKeys.userId, targetUserId))
      .orderBy(desc(schema.apiKeys.createdAt));

    return rows.map(r => ({
      id: r.id,
      key: r.key,
      name: r.name,
      createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
      totalRequests: r.totalRequests || 0,
      totalTokens: r.totalTokens || 0,
      status: (r.status as 'active' | 'revoked') || 'active'
    }));
  }

  public async validateKey(keyString: string): Promise<ApiKey | undefined> {
    await this.init();
    const [row] = await db.select().from(schema.apiKeys)
      .where(eq(schema.apiKeys.key, keyString))
      .limit(1);

    if (!row || row.status !== 'active') return undefined;

    return {
      id: row.id,
      key: row.key,
      name: row.name,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      totalRequests: row.totalRequests || 0,
      totalTokens: row.totalTokens || 0,
      status: 'active'
    };
  }

  public async createKey(name: string, userId?: string): Promise<ApiKey> {
    await this.init();
    const user = await this.getUser();
    const targetUserId = userId || user.id;
    const newKeyString = `sk-loreder-${uuidv4().replace(/-/g, '').slice(0, 24)}`;
    const id = uuidv4();

    const [row] = await db.insert(schema.apiKeys).values({
      id,
      userId: targetUserId,
      key: newKeyString,
      name: name || 'API Key',
      status: 'active'
    }).returning();

    return {
      id: row.id,
      key: row.key,
      name: row.name,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      totalRequests: 0,
      totalTokens: 0,
      status: 'active'
    };
  }

  public async revokeKey(id: string): Promise<boolean> {
    await this.init();
    const res = await db.update(schema.apiKeys)
      .set({ status: 'revoked' })
      .where(eq(schema.apiKeys.id, id));
    return true;
  }

  // Providers
  public async getProviders(): Promise<ProviderConfig[]> {
    await this.init();
    const rows = await db.select().from(schema.providers);
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type as 'opencode' | 'openrouter' | 'custom',
      baseUrl: r.baseUrl,
      apiKey: r.apiKey,
      isEnabled: r.isEnabled ?? true
    }));
  }

  public async updateProvider(id: string, updates: Partial<ProviderConfig>): Promise<ProviderConfig | null> {
    await this.init();
    await db.update(schema.providers).set({
      name: updates.name,
      type: updates.type,
      baseUrl: updates.baseUrl,
      apiKey: updates.apiKey,
      isEnabled: updates.isEnabled
    }).where(eq(schema.providers.id, id));

    const [updated] = await db.select().from(schema.providers).where(eq(schema.providers.id, id)).limit(1);
    if (!updated) return null;
    return {
      id: updated.id,
      name: updated.name,
      type: updated.type as any,
      baseUrl: updated.baseUrl,
      apiKey: updated.apiKey,
      isEnabled: updated.isEnabled ?? true
    };
  }

  // Models
  public async getModels(): Promise<ModelInfo[]> {
    await this.init();
    const rows = await db.select().from(schema.models);
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      provider: r.provider,
      contextLength: r.contextLength || 8192,
      isFree: r.isFree || false,
      pricing: {
        prompt: r.pricingPrompt || 0,
        completion: r.pricingCompletion || 0
      },
      description: r.description || ''
    }));
  }

  public async addModel(model: ModelInfo): Promise<ModelInfo> {
    await this.init();
    await db.insert(schema.models).values({
      id: model.id,
      name: model.name,
      provider: model.provider,
      contextLength: model.contextLength,
      isFree: model.isFree,
      pricingPrompt: model.pricing?.prompt || 0,
      pricingCompletion: model.pricing?.completion || 0,
      description: model.description || ''
    }).onConflictDoNothing();
    return model;
  }

  // Usage Logging
  public async logUsage(log: Omit<UsageLog, 'id' | 'timestamp'>): Promise<UsageLog> {
    await this.init();
    const id = uuidv4();
    try {
      // Update totals on API Key
      if (log.keyId) {
        await db.update(schema.apiKeys)
          .set({
            totalRequests: sql`${schema.apiKeys.totalRequests} + 1`,
            totalTokens: sql`${schema.apiKeys.totalTokens} + ${log.totalTokens || 0}`
          })
          .where(eq(schema.apiKeys.id, log.keyId));
      }

      await db.insert(schema.usageLogs).values({
        id,
        keyId: log.keyId,
        keyName: log.keyName,
        model: log.model,
        promptTokens: log.promptTokens,
        completionTokens: log.completionTokens,
        totalTokens: log.totalTokens,
        latencyMs: log.latencyMs,
        status: log.status
      });
    } catch (e) {
      console.error('Failed to log usage:', e);
    }

    return {
      ...log,
      id,
      timestamp: new Date().toISOString()
    };
  }

  public async getLogs(limit = 100): Promise<UsageLog[]> {
    await this.init();
    const rows = await db.select().from(schema.usageLogs)
      .orderBy(desc(schema.usageLogs.timestamp))
      .limit(limit);

    return rows.map(r => ({
      id: r.id,
      keyId: r.keyId,
      keyName: r.keyName || '',
      model: r.model,
      promptTokens: r.promptTokens || 0,
      completionTokens: r.completionTokens || 0,
      totalTokens: r.totalTokens || 0,
      latencyMs: r.latencyMs || 0,
      timestamp: r.timestamp?.toISOString() || new Date().toISOString(),
      status: (r.status as 'success' | 'error') || 'success'
    }));
  }

  public async getAnalytics() {
    await this.init();
    const logs = await this.getLogs(500);
    const keys = await this.getKeys();
    const models = await this.getModels();

    const totalRequests = logs.length;
    const totalTokens = logs.reduce((acc, curr) => acc + curr.totalTokens, 0);
    const avgLatency = totalRequests > 0
      ? Math.round(logs.reduce((acc, curr) => acc + curr.latencyMs, 0) / totalRequests)
      : 0;

    const modelStats: Record<string, number> = {};
    logs.forEach(l => {
      modelStats[l.model] = (modelStats[l.model] || 0) + 1;
    });

    return {
      totalRequests,
      totalTokens,
      avgLatency,
      activeKeysCount: keys.filter(k => k.status === 'active').length,
      activeModelsCount: models.length,
      modelStats
    };
  }
}

export const dbService = new DatabaseService();
