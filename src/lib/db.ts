import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
  keys: ApiKey[];
  logs: UsageLog[];
  providers: ProviderConfig[];
  models: ModelInfo[];
}

const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'aggregator_db.json');

const DEFAULT_MODELS: ModelInfo[] = [
  {
    "id": "opencode/claude-fable-5",
    "name": "Claude Fable 5",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: claude-fable-5"
  },
  {
    "id": "opencode/claude-opus-5",
    "name": "Claude Opus 5",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: claude-opus-5"
  },
  {
    "id": "opencode/claude-opus-4-8",
    "name": "Claude Opus 4 8",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: claude-opus-4-8"
  },
  {
    "id": "opencode/claude-opus-4-7",
    "name": "Claude Opus 4 7",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: claude-opus-4-7"
  },
  {
    "id": "opencode/claude-opus-4-6",
    "name": "Claude Opus 4 6",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: claude-opus-4-6"
  },
  {
    "id": "opencode/claude-opus-4-5",
    "name": "Claude Opus 4 5",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: claude-opus-4-5"
  },
  {
    "id": "opencode/claude-sonnet-5",
    "name": "Claude Sonnet 5",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: claude-sonnet-5"
  },
  {
    "id": "opencode/claude-sonnet-4-6",
    "name": "Claude Sonnet 4 6",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: claude-sonnet-4-6"
  },
  {
    "id": "opencode/claude-sonnet-4-5",
    "name": "Claude Sonnet 4 5",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: claude-sonnet-4-5"
  },
  {
    "id": "opencode/claude-sonnet-4",
    "name": "Claude Sonnet 4",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: claude-sonnet-4"
  },
  {
    "id": "opencode/claude-haiku-4-5",
    "name": "Claude Haiku 4 5",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: claude-haiku-4-5"
  },
  {
    "id": "opencode/gemini-3.6-flash",
    "name": "Gemini 3.6 Flash",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gemini-3.6-flash"
  },
  {
    "id": "opencode/gemini-3.7-flash",
    "name": "Gemini 3.7 Flash",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gemini-3.7-flash"
  },
  {
    "id": "opencode/gemini-3.5-flash-lite",
    "name": "Gemini 3.5 Flash Lite",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gemini-3.5-flash-lite"
  },
  {
    "id": "opencode/gemini-3.5-flash",
    "name": "Gemini 3.5 Flash",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gemini-3.5-flash"
  },
  {
    "id": "opencode/gemini-3.1-pro",
    "name": "Gemini 3.1 Pro",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gemini-3.1-pro"
  },
  {
    "id": "opencode/gemini-3-flash",
    "name": "Gemini 3 Flash",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gemini-3-flash"
  },
  {
    "id": "opencode/gpt-5.6-sol",
    "name": "Gpt 5.6 Sol",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.6-sol"
  },
  {
    "id": "opencode/gpt-5.6-terra",
    "name": "Gpt 5.6 Terra",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.6-terra"
  },
  {
    "id": "opencode/gpt-5.6-luna",
    "name": "Gpt 5.6 Luna",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.6-luna"
  },
  {
    "id": "opencode/gpt-5.5",
    "name": "Gpt 5.5",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.5"
  },
  {
    "id": "opencode/gpt-5.5-pro",
    "name": "Gpt 5.5 Pro",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.5-pro"
  },
  {
    "id": "opencode/gpt-5.4",
    "name": "Gpt 5.4",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.4"
  },
  {
    "id": "opencode/gpt-5.4-pro",
    "name": "Gpt 5.4 Pro",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.4-pro"
  },
  {
    "id": "opencode/gpt-5.4-mini",
    "name": "Gpt 5.4 Mini",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.4-mini"
  },
  {
    "id": "opencode/gpt-5.4-nano",
    "name": "Gpt 5.4 Nano",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.4-nano"
  },
  {
    "id": "opencode/gpt-5.3-codex-spark",
    "name": "Gpt 5.3 Codex Spark",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.3-codex-spark"
  },
  {
    "id": "opencode/gpt-5.3-codex",
    "name": "Gpt 5.3 Codex",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.3-codex"
  },
  {
    "id": "opencode/gpt-5.2",
    "name": "Gpt 5.2",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.2"
  },
  {
    "id": "opencode/gpt-5.2-codex",
    "name": "Gpt 5.2 Codex",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.2-codex"
  },
  {
    "id": "opencode/gpt-5.1",
    "name": "Gpt 5.1",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.1"
  },
  {
    "id": "opencode/gpt-5.1-codex-max",
    "name": "Gpt 5.1 Codex Max",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.1-codex-max"
  },
  {
    "id": "opencode/gpt-5.1-codex",
    "name": "Gpt 5.1 Codex",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.1-codex"
  },
  {
    "id": "opencode/gpt-5.1-codex-mini",
    "name": "Gpt 5.1 Codex Mini",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5.1-codex-mini"
  },
  {
    "id": "opencode/gpt-5",
    "name": "Gpt 5",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5"
  },
  {
    "id": "opencode/gpt-5-codex",
    "name": "Gpt 5 Codex",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5-codex"
  },
  {
    "id": "opencode/gpt-5-nano",
    "name": "Gpt 5 Nano",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: gpt-5-nano"
  },
  {
    "id": "opencode/grok-build-0.1",
    "name": "Grok Build 0.1",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: grok-build-0.1"
  },
  {
    "id": "opencode/grok-4.6",
    "name": "Grok 4.6",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: grok-4.6"
  },
  {
    "id": "opencode/grok-4.5",
    "name": "Grok 4.5",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: grok-4.5"
  },
  {
    "id": "opencode/muse-spark-1.2",
    "name": "Muse Spark 1.2",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: muse-spark-1.2"
  },
  {
    "id": "opencode/deepseek-v4-pro",
    "name": "Deepseek V4 Pro",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: deepseek-v4-pro"
  },
  {
    "id": "opencode/deepseek-v4-flash",
    "name": "Deepseek V4 Flash",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: deepseek-v4-flash"
  },
  {
    "id": "opencode/glm-5.2",
    "name": "Glm 5.2",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: glm-5.2"
  },
  {
    "id": "opencode/glm-5.1",
    "name": "Glm 5.1",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: glm-5.1"
  },
  {
    "id": "opencode/glm-5",
    "name": "Glm 5",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: glm-5"
  },
  {
    "id": "opencode/minimax-m3",
    "name": "Minimax M3",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: minimax-m3"
  },
  {
    "id": "opencode/minimax-m2.7",
    "name": "Minimax M2.7",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: minimax-m2.7"
  },
  {
    "id": "opencode/minimax-m2.5",
    "name": "Minimax M2.5",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: minimax-m2.5"
  },
  {
    "id": "opencode/kimi-k3",
    "name": "Kimi K3",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: kimi-k3"
  },
  {
    "id": "opencode/kimi-k2.7-code",
    "name": "Kimi K2.7 Code",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: kimi-k2.7-code"
  },
  {
    "id": "opencode/kimi-k2.6",
    "name": "Kimi K2.6",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: kimi-k2.6"
  },
  {
    "id": "opencode/kimi-k2.5",
    "name": "Kimi K2.5",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: kimi-k2.5"
  },
  {
    "id": "opencode/qwen3.6-plus",
    "name": "Qwen3.6 Plus",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: qwen3.6-plus"
  },
  {
    "id": "opencode/qwen3.5-plus",
    "name": "Qwen3.5 Plus",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: qwen3.5-plus"
  },
  {
    "id": "opencode/big-pickle",
    "name": "Big Pickle",
    "provider": "OpenCode Zen",
    "contextLength": 128000,
    "isFree": false,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: big-pickle"
  },
  {
    "id": "opencode/deepseek-v4-flash-free",
    "name": "Deepseek V4 Flash Free",
    "provider": "OpenCode Zen",
    "contextLength": 64000,
    "isFree": true,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: deepseek-v4-flash-free"
  },
  {
    "id": "opencode/mimo-v2.5-free",
    "name": "Mimo V2.5 Free",
    "provider": "OpenCode Zen",
    "contextLength": 64000,
    "isFree": true,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: mimo-v2.5-free"
  },
  {
    "id": "opencode/hy3-free",
    "name": "Hy3 Free",
    "provider": "OpenCode Zen",
    "contextLength": 64000,
    "isFree": true,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: hy3-free"
  },
  {
    "id": "opencode/nemotron-3-ultra-free",
    "name": "Nemotron 3 Ultra Free",
    "provider": "OpenCode Zen",
    "contextLength": 64000,
    "isFree": true,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: nemotron-3-ultra-free"
  },
  {
    "id": "opencode/nemotron-3.5-lightning-free",
    "name": "Nemotron 3.5 Lightning Free",
    "provider": "OpenCode Zen",
    "contextLength": 64000,
    "isFree": true,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: nemotron-3.5-lightning-free"
  },
  {
    "id": "opencode/laguna-s-2.1-free",
    "name": "Laguna S 2.1 Free",
    "provider": "OpenCode Zen",
    "contextLength": 64000,
    "isFree": true,
    "pricing": {
      "prompt": 0,
      "completion": 0
    },
    "description": "OpenCode Zen model: laguna-s-2.1-free"
  }
];

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
        keys: [initialKey],
        logs: [],
        providers: DEFAULT_PROVIDERS,
        models: DEFAULT_MODELS
      };
      
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }

    try {
      const fileData = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      return {
        keys: parsed.keys || [],
        logs: parsed.logs || [],
        providers: parsed.providers || DEFAULT_PROVIDERS,
        models: parsed.models || DEFAULT_MODELS
      };
    } catch (e) {
      console.error('Failed to parse database file, resetting to default:', e);
      return {
        keys: [],
        logs: [],
        providers: DEFAULT_PROVIDERS,
        models: DEFAULT_MODELS
      };
    }
  }

  private save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
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
    return this.data.models;
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
      activeModelsCount: this.data.models.length,
      modelStats
    };
  }
}

// Global instance helper for Next.js hot module reloads
const globalForDb = globalThis as unknown as { db: Database };
export const db = globalForDb.db || new Database();
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
