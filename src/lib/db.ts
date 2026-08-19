import fs from 'fs';
import path from 'path';
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

interface DatabaseSchema {
  user: UserProfile;
  keys: ApiKey[];
  logs: UsageLog[];
  providers: ProviderConfig[];
  models: ModelInfo[];
}

const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'aggregator_db.json');

const DEFAULT_USER: UserProfile = {
  id: 'usr_zaisuf',
  name: 'Zaisuf',
  email: 'zaisuf@loreder.ai',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Zaisuf',
  role: 'Administrator & Provider Host',
  bio: 'Building Loreder AI service & OpenCode Zen gateway',
  createdAt: new Date().toISOString(),
  apiKey: 'sk-loreder-master-key-zaisuf'
};

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

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (!fs.existsSync(DB_FILE)) {
      const initialKey: ApiKey = {
        id: uuidv4(),
        key: `sk-loreder-${uuidv4().replace(/-/g, '').slice(0, 24)}`,
        name: 'Default Master Key',
        createdAt: new Date().toISOString(),
        totalRequests: 0,
        totalTokens: 0,
        status: 'active'
      };

      const initialData: DatabaseSchema = {
        user: DEFAULT_USER,
        keys: [initialKey],
        logs: [],
        providers: DEFAULT_PROVIDERS,
        models: []
      };
      
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }

    try {
      const fileData = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      return {
        user: parsed.user || DEFAULT_USER,
        keys: parsed.keys || [],
        logs: parsed.logs || [],
        providers: parsed.providers || DEFAULT_PROVIDERS,
        models: parsed.models || []
      };
    } catch (e) {
      console.error('Failed to parse database file, resetting to default:', e);
      return {
        user: DEFAULT_USER,
        keys: [],
        logs: [],
        providers: DEFAULT_PROVIDERS,
        models: []
      };
    }
  }

  private save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
  }

  // User Profile
  public getUser(): UserProfile {
    return this.data.user;
  }

  public updateUser(updates: Partial<UserProfile>): UserProfile {
    this.data.user = { ...this.data.user, ...updates };
    this.save();
    return this.data.user;
  }

  // API Key operations
  public getKeys(): ApiKey[] {
    return this.data.keys;
  }

  public validateKey(keyString: string): ApiKey | undefined {
    return this.data.keys.find(k => k.key === keyString && k.status === 'active');
  }

  public createKey(name: string): ApiKey {
    const newKey: ApiKey = {
      id: uuidv4(),
      key: `sk-loreder-${uuidv4().replace(/-/g, '').slice(0, 24)}`,
      name: name || 'API Key',
      createdAt: new Date().toISOString(),
      totalRequests: 0,
      totalTokens: 0,
      status: 'active'
    };
    this.data.keys.push(newKey);
    this.save();
    return newKey;
  }

  public revokeKey(id: string): boolean {
    const key = this.data.keys.find(k => k.id === id);
    if (key) {
      key.status = 'revoked';
      this.save();
      return true;
    }
    return false;
  }

  // Provider operations
  public getProviders(): ProviderConfig[] {
    return this.data.providers;
  }

  public updateProvider(id: string, updates: Partial<ProviderConfig>): ProviderConfig | null {
    const provider = this.data.providers.find(p => p.id === id);
    if (provider) {
      Object.assign(provider, updates);
      this.save();
      return provider;
    }
    return null;
  }

  // Model operations
  public getModels(): ModelInfo[] {
    return this.data.models.length > 0 ? this.data.models : [];
  }

  public addModel(model: ModelInfo): ModelInfo {
    this.data.models.push(model);
    this.save();
    return model;
  }

  // Usage Logging
  public logUsage(log: Omit<UsageLog, 'id' | 'timestamp'>): UsageLog {
    const entry: UsageLog = {
      ...log,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };

    const key = this.data.keys.find(k => k.id === log.keyId);
    if (key) {
      key.totalRequests += 1;
      key.totalTokens += log.totalTokens;
    }

    this.data.logs.unshift(entry);
    if (this.data.logs.length > 1000) {
      this.data.logs = this.data.logs.slice(0, 1000);
    }

    this.save();
    return entry;
  }

  public getLogs(limit = 100): UsageLog[] {
    return this.data.logs.slice(0, limit);
  }

  public getAnalytics() {
    const totalRequests = this.data.logs.length;
    const totalTokens = this.data.logs.reduce((acc, curr) => acc + curr.totalTokens, 0);
    const avgLatency = totalRequests > 0 
      ? Math.round(this.data.logs.reduce((acc, curr) => acc + curr.latencyMs, 0) / totalRequests)
      : 0;
    
    const modelStats: Record<string, number> = {};
    this.data.logs.forEach(l => {
      modelStats[l.model] = (modelStats[l.model] || 0) + 1;
    });

    return {
      totalRequests,
      totalTokens,
      avgLatency,
      activeKeysCount: this.data.keys.filter(k => k.status === 'active').length,
      activeModelsCount: this.getModels().length,
      modelStats
    };
  }
}

const globalForDb = globalThis as unknown as { db: Database };
export const db = globalForDb.db || new Database();
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
