'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, Code } from 'lucide-react';

export const Docs: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const snippets = [
    {
      title: 'Python (OpenAI SDK)',
      language: 'python',
      code: `from openai import OpenAI

client = OpenAI(
    base_url="https://www.shereflow.site/v1",
    api_key="YOUR_LOREDER_API_KEY" # sk-loreder-...
)

response = client.chat.completions.create(
    model="opencode/deepseek-v4-flash-free",
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
  baseURL: 'https://www.shereflow.site/v1',
  apiKey: 'YOUR_LOREDER_API_KEY', // sk-loreder-...
});

async function main() {
  const stream = await openai.chat.completions.create({
    model: 'opencode/deepseek-v4-flash-free',
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
      code: `curl -X POST https://www.shereflow.site/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_LOREDER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "opencode/deepseek-v4-flash-free",
    "messages": [{"role": "user", "content": "Hello from OpenCode Zen!"}],
    "stream": false
  }'`
    },
    {
      title: 'Cursor / VS Code Configuration',
      language: 'json',
      code: `// Settings for Cursor IDE or OpenCode Extension:
// Base URL: https://www.shereflow.site/v1
// API Key: sk-loreder-your-key
// Primary Model: opencode/deepseek-v4-flash-free`
    }
  ];

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-zinc-800/80 pb-4">
        <h3 className="text-base font-extrabold text-white flex items-center">
          <Terminal className="w-4 h-4 mr-2 text-teal-400" />
          Developer SDK Integration Quickstart
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Connect OpenAI client SDKs, Cursor, and cURL requests directly to your aggregator instance.
        </p>
      </div>

      <div className="space-y-4">
        {snippets.map((snip, idx) => (
          <div key={idx} className="bg-[#121215] rounded-2xl border border-zinc-800/80 overflow-hidden">
            <div className="px-4 py-3 bg-[#18181b] border-b border-zinc-800 flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-200 flex items-center">
                <Code className="w-3.5 h-3.5 mr-2 text-teal-400" />
                {snip.title}
              </span>
              <button
                onClick={() => handleCopy(snip.code, idx)}
                className="flex items-center space-x-1 text-[11px] text-zinc-400 hover:text-teal-400 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg transition-colors"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-[#09090b] overflow-x-auto">
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
