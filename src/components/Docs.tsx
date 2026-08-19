'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, Code, Cpu } from 'lucide-react';

export const Docs: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const snippets = [
    {
      title: 'Python (OpenAI SDK)',
      language: 'python',
      code: `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="YOUR_LOREDER_API_KEY" # sk-loreder-...
)

response = client.chat.completions.create(
    model="opencode/free-model",
    messages=[
        {"role": "user", "content": "Explain quantum computing in 2 sentences."}
    ],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")`
    },
    {
      title: 'Node.js / TypeScript (OpenAI SDK)',
      language: 'typescript',
      code: `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'YOUR_LOREDER_API_KEY', // sk-loreder-...
});

async function main() {
  const stream = await openai.chat.completions.create({
    model: 'opencode/deepseek-r1-free',
    messages: [{ role: 'user', content: 'Write a quicksort in TypeScript.' }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

main();`
    },
    {
      title: 'cURL Command',
      language: 'bash',
      code: `curl -X POST http://localhost:3000/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_LOREDER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "opencode/free-model",
    "messages": [{"role": "user", "content": "Hello from OpenCode Zen!"}],
    "stream": false
  }'`
    },
    {
      title: 'Cursor / VS Code Extension Setup',
      language: 'json',
      code: `// Settings for Cursor or OpenCode Extension:
// Override Base URL: http://localhost:3000/v1
// API Key: sk-loreder-your-generated-key
// Available Models:
// - opencode/free-model
// - opencode/deepseek-r1-free
// - opencode/deepseek-v3-free
// - opencode/qwen-2.5-coder-free`
    }
  ];

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-extrabold text-white flex items-center">
          <Terminal className="w-5 h-5 mr-2 text-teal-400" />
          Developer Quickstart & SDK Docs
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Connect standard OpenAI client SDKs, AI IDE extensions, and cURL requests to your local aggregator service.
        </p>
      </div>

      <div className="space-y-6">
        {snippets.map((snip, idx) => (
          <div key={idx} className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200 flex items-center">
                <Code className="w-3.5 h-3.5 mr-2 text-teal-400" />
                {snip.title}
              </span>
              <button
                onClick={() => handleCopy(snip.code, idx)}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-teal-400 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-5 bg-slate-950/90 overflow-x-auto">
              <pre className="text-xs font-mono text-teal-300/90 leading-relaxed">
                {snip.code}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
